#!/usr/bin/env python3
"""
Upload the school's source files (xlsx, doc, csv) to Supabase Storage.

WHAT THIS DOES (plain English):
  Takes the files in data/source/ and uploads them to a private Supabase
  Storage bucket called 'raw-uploads'. Path pattern is
  raw-uploads/{school_id}/{YYYY-MM-DD-HHMM}-{filename}. After running, the
  files live in Supabase (encrypted, ACL-protected by service role) and
  the local copies can be deleted if you want — though keeping them is
  fine since data/source/ is gitignored anyway.

  Closes the data-storage-policy loop documented in
  docs/data_storage_policy.md: code in git, data in Supabase.

  Re-runnable. Each run uploads with a new timestamp prefix so older
  versions of the same file are preserved (Supabase versions files by
  full path; same name + different timestamp = different object).

REQUIRES:
  In .env:
    SUPABASE_PROJECT_REF=dxrkbjftkfhlddqefmaq
    SUPABASE_SERVICE_ROLE_KEY=<paste from Supabase Dashboard → Settings → API → service_role>

  WARNING: the service_role key bypasses RLS and can do anything in the
  database. Never commit it; never paste it in chat; keep it only in .env
  on your laptop + later on the Vercel/Cloudflare environment-variables
  panel as an encrypted secret.

SETUP:
  pip install -r requirements.txt   (re-runs to pick up the new 'requests' dep)

RUN:
  source .venv/bin/activate
  python etl/upload_source_to_supabase.py
"""

from __future__ import annotations
import os, sys, hashlib
from pathlib import Path
from datetime import datetime, timezone

import requests
import psycopg2
from dotenv import load_dotenv

# Reuse connection logic from the loader
sys.path.insert(0, str(Path(__file__).parent))
from load_to_postgres import get_connection_kwargs

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "data" / "source"
BUCKET = "raw-uploads"
SCHOOL_NAME = "International School of Oman"


def env(name, required=False, default=None):
    v = os.environ.get(name, default)
    if required and not v:
        sys.exit(f"ERROR: env var {name} is required. See header of this file.")
    return v


def sb_request(method, path, *, headers=None, **kwargs):
    """Helper around requests with the Supabase Storage base URL pre-filled."""
    url = f"https://{PROJECT_REF}.supabase.co/storage/v1{path}"
    h = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY}
    if headers:
        h.update(headers)
    return requests.request(method, url, headers=h, **kwargs)


def ensure_bucket(name):
    """Create the bucket if it doesn't exist. Idempotent."""
    r = sb_request("GET", f"/bucket/{name}")
    if r.status_code == 200:
        print(f"  ✓ bucket '{name}' exists")
        return
    if r.status_code == 404:
        print(f"  → creating bucket '{name}' (private)...")
        r2 = sb_request("POST", "/bucket", json={
            "id": name,
            "name": name,
            "public": False,
            "file_size_limit": 100 * 1024 * 1024,  # 100 MB
            "allowed_mime_types": None,
        })
        r2.raise_for_status()
        print(f"  ✓ bucket '{name}' created")
        return
    r.raise_for_status()


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def upload_one(local_path, storage_path):
    """Upload a single file. Returns response info."""
    with open(local_path, "rb") as f:
        # Supabase Storage POST: x-upsert=true allows overwrite if path collides
        r = sb_request(
            "POST",
            f"/object/{BUCKET}/{storage_path}",
            data=f.read(),
            headers={
                "Content-Type": "application/octet-stream",
                "x-upsert": "false",  # we use unique timestamp paths, no overwrite needed
                "Cache-Control": "3600",
            },
        )
    if r.status_code in (200, 201):
        return {"ok": True, "path": storage_path}
    return {"ok": False, "path": storage_path, "status": r.status_code, "body": r.text[:300]}


def main():
    global PROJECT_REF, SERVICE_KEY

    load_dotenv(ROOT / ".env")

    PROJECT_REF = env("SUPABASE_PROJECT_REF", required=True)
    SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY", required=True)

    if not SOURCE_DIR.exists():
        sys.exit(f"ERROR: source directory {SOURCE_DIR} doesn't exist.")
    files = sorted([p for p in SOURCE_DIR.iterdir() if p.is_file() and not p.name.startswith('.')])
    if not files:
        sys.exit(f"ERROR: no files in {SOURCE_DIR}.")

    # Look up school_id from Postgres
    print("→ Connecting to Postgres to look up school_id...")
    conn_kwargs = get_connection_kwargs()
    with psycopg2.connect(**conn_kwargs) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM schools WHERE name = %s", (SCHOOL_NAME,))
            row = cur.fetchone()
            if not row:
                sys.exit(f"ERROR: school '{SCHOOL_NAME}' not found. Run schema/005_seed_iso_pilot.sql first.")
            school_id = row[0]
    print(f"  school_id = {school_id}")

    print(f"→ Ensuring Storage bucket '{BUCKET}' exists...")
    ensure_bucket(BUCKET)

    print(f"→ Uploading {len(files)} file(s) from {SOURCE_DIR}...")
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    results = []
    for f in files:
        sha = file_sha256(f)
        storage_path = f"{school_id}/{ts}-{f.name}"
        print(f"  ↑ {f.name} ({f.stat().st_size / 1024:.1f} KB · sha {sha[:8]})")
        result = upload_one(f, storage_path)
        result["sha256"] = sha
        result["bytes"] = f.stat().st_size
        result["local_name"] = f.name
        results.append(result)
        if not result["ok"]:
            print(f"    ✗ FAILED status={result['status']}: {result['body']}")
        else:
            print(f"    ✓ uploaded → {BUCKET}/{result['path']}")

    print()
    n_ok = sum(1 for r in results if r["ok"])
    print(f"✓ {n_ok} / {len(results)} uploaded")

    # Record uploads in source_imports
    if n_ok:
        print(f"→ Recording uploads in source_imports table...")
        with psycopg2.connect(**conn_kwargs) as conn:
            with conn.cursor() as cur:
                for r in results:
                    if not r["ok"]:
                        continue
                    cur.execute("""
                        INSERT INTO source_imports
                            (school_id, filename, file_sha256, notes)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        school_id,
                        r["local_name"],
                        r["sha256"],
                        f"storage_path: {BUCKET}/{r['path']} · {r['bytes']} bytes",
                    ))
            conn.commit()
        print(f"  ✓ {n_ok} source_imports row(s) added")

    print()
    print("Storage URL pattern for retrieval (server-side only, requires service_role):")
    print(f"  https://{PROJECT_REF}.supabase.co/storage/v1/object/{BUCKET}/{{path}}")
    if results and results[0]["ok"]:
        print(f"  Example: {results[0]['path']}")


if __name__ == "__main__":
    main()
