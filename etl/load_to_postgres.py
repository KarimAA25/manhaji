#!/usr/bin/env python3
"""
Load the school workbook into Supabase Postgres.

WHAT THIS DOES (plain English):
  Reads the school's xlsx file from disk, parses it (using the same logic as
  parse_workbook.py), and inserts/updates rows in the Postgres tables on
  Supabase. After it runs, the canonical school data lives in the database
  instead of in JSON files.

  This is RE-RUNNABLE — safe to run multiple times. Stable rows (teachers,
  subjects, sections) are upserted; the volatile teacher×section×subject load
  matrix is fully reloaded per academic year (so re-running picks up changes
  to the workbook without orphaning old rows).

SETUP (one time, ~2 minutes):
  cd ~/dev/manhaj
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

  # Then copy .env.example to .env and fill in DATABASE_URL
  cp .env.example .env
  # Open .env in a text editor, paste your Supabase pooler URL into DATABASE_URL.
  # Get it from: Supabase Dashboard → Project Settings → Database →
  #              "Connection string" → "Transaction pooler" → URI mode

RUN:
  source .venv/bin/activate
  python etl/load_to_postgres.py

What you'll see on success:
  → Connecting to Postgres...
  → Looking up school 'International School of Oman'...
  → Parsing workbook...
    parsed 69 teachers, 41 sections, 482 load rows
  → Upserting subjects... (32 rows)
  → Upserting teachers... (69 rows)
  → Upserting teacher contracts...
  → Upserting sections... (41 rows)
  → Reloading load matrix... (482 rows)
  → Recording source import...

  ✓ ETL complete. Committed.
    subjects: 32, teachers: 69, sections: 41, load_rows: 482
"""

from __future__ import annotations
import os, sys, hashlib
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlparse, unquote

# Project root + import the existing parser
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "etl"))

import openpyxl
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv


def parse_db_url(url: str) -> dict:
    """Fallback: parse a postgresql:// URL into psycopg2.connect() kwargs.

    Only used if separate env vars (SUPABASE_*) aren't provided. URL parsing is
    fragile when the password contains characters with URL-syntactic meaning
    (':' '@' '/' '#' '?'). Supabase auto-generated passwords often hit these.
    The preferred path is to set SUPABASE_PROJECT_REF + SUPABASE_REGION +
    SUPABASE_DB_PASSWORD as separate vars and skip URL parsing entirely.
    """
    parsed = urlparse(url)
    if not parsed.hostname:
        sys.exit(f"ERROR: DATABASE_URL doesn't parse as a Postgres URL: {url[:60]}...")
    try:
        port = parsed.port or 5432
    except ValueError:
        sys.exit(
            "ERROR: DATABASE_URL parsing got confused by special characters in your password.\n"
            "       Switch to the separate-env-vars approach in .env (preferred):\n"
            "         SUPABASE_PROJECT_REF=dxrkbjftkfhlddqefmaq\n"
            "         SUPABASE_REGION=<your-region>\n"
            "         SUPABASE_DB_PASSWORD=<your-password-as-is-no-encoding>"
        )
    return {
        "host":     parsed.hostname,
        "port":     port,
        "user":     unquote(parsed.username) if parsed.username else None,
        "password": unquote(parsed.password) if parsed.password else None,
        "dbname":   parsed.path.lstrip("/") or "postgres",
        "sslmode":  "require",
    }


def get_connection_kwargs() -> dict:
    """Return psycopg2.connect() kwargs.

    Preferred: separate env vars (no URL parsing). Falls back to DATABASE_URL.
    """
    ref      = os.environ.get("SUPABASE_PROJECT_REF")
    region   = os.environ.get("SUPABASE_REGION")
    password = os.environ.get("SUPABASE_DB_PASSWORD")
    # Optional explicit host override (use when you want to pin the exact pooler
    # hostname copied from Supabase's "Connect" modal — handles aws-0 vs aws-1
    # shard ambiguity without guessing).
    pooler_host = os.environ.get("SUPABASE_POOLER_HOST")

    if ref and password and (pooler_host or region):
        host = pooler_host or f"aws-0-{region}.pooler.supabase.com"
        return {
            "host":     host,
            "port":     6543,
            "user":     f"postgres.{ref}",
            "password": password,
            "dbname":   "postgres",
            "sslmode":  "require",
        }

    database_url = os.environ.get("DATABASE_URL")
    if database_url and "REPLACE_WITH" not in database_url:
        return parse_db_url(database_url)

    sys.exit(
        "ERROR: no Postgres connection info found. In your .env, set EITHER:\n"
        "  (a) SUPABASE_PROJECT_REF=dxrkbjftkfhlddqefmaq\n"
        "      SUPABASE_POOLER_HOST=aws-X-REGION.pooler.supabase.com  (copy from Supabase Connect modal)\n"
        "      SUPABASE_DB_PASSWORD=<your-database-password>\n"
        "    — OR (legacy, region-only): SUPABASE_REGION=eu-central-1\n"
        "  (b) DATABASE_URL=postgresql://...   (only works if password has no special chars)"
    )

from parse_workbook import (
    parse_26_27a,
    course_offerings,
    SUBJECT_CATALOG,
    parse_section_code,
    file_sha256,
)


def env(name: str, default: str | None = None, required: bool = False) -> str:
    val = os.environ.get(name, default)
    if required and not val:
        sys.exit(f"ERROR: env var {name} is required. See .env.example.")
    return val  # type: ignore


def main() -> None:
    load_dotenv(ROOT / ".env")

    XLSX_PATH           = env("XLSX_PATH", str(ROOT / "data/source/24-25 provisional_18-8-2024.xlsx"))
    SCHOOL_NAME         = env("SCHOOL_NAME", "International School of Oman")
    ACADEMIC_YEAR_LABEL = env("ACADEMIC_YEAR_LABEL", "2026-2027")

    if not Path(XLSX_PATH).exists():
        sys.exit(f"ERROR: workbook not found at {XLSX_PATH}. Place it locally (gitignored) or set XLSX_PATH.")

    print("→ Connecting to Postgres...")
    conn_kwargs = get_connection_kwargs()
    conn = psycopg2.connect(**conn_kwargs)
    conn.autocommit = False
    cur = conn.cursor()
    print(f"  connected to {conn_kwargs['host']}:{conn_kwargs['port']} as {conn_kwargs['user']}")

    print(f"→ Looking up school '{SCHOOL_NAME}'...")
    cur.execute("SELECT id FROM schools WHERE name = %s", (SCHOOL_NAME,))
    row = cur.fetchone()
    if not row:
        sys.exit(f"ERROR: School '{SCHOOL_NAME}' not in schools table. Run schema/005_seed_iso_pilot.sql first.")
    school_id = row[0]
    print(f"  school_id = {school_id}")

    print(f"→ Looking up academic year '{ACADEMIC_YEAR_LABEL}'...")
    cur.execute(
        "SELECT id FROM academic_years WHERE school_id = %s AND label = %s",
        (school_id, ACADEMIC_YEAR_LABEL),
    )
    row = cur.fetchone()
    if not row:
        sys.exit(f"ERROR: Academic year '{ACADEMIC_YEAR_LABEL}' not seeded for this school.")
    academic_year_id = row[0]
    print(f"  academic_year_id = {academic_year_id}")

    print(f"→ Parsing workbook: {XLSX_PATH}")
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    teachers, sections, load = parse_26_27a(wb)
    print(f"  parsed {len(teachers)} teachers, {len(sections)} sections, {len(load)} load rows")

    # Compute weekly_period_cap defaults if missing
    for t in teachers:
        if not t.get("cap"):
            t["cap"] = 30  # school default

    # =============================================================
    # 1. UPSERT SUBJECTS
    # Union of (codes seen in load matrix) + (canonical catalog)
    # =============================================================
    print(f"→ Upserting subjects...")
    seen_codes = {r["subject_code"] for r in load if r["subject_code"] != "?"}
    all_codes = seen_codes | set(SUBJECT_CATALOG.keys())
    subj_rows = []
    for code in sorted(all_codes):
        info = SUBJECT_CATALOG.get(code, {"name_en": code, "name_ar": "", "department": "Unknown"})
        subj_rows.append((
            school_id, code,
            info["name_en"], info.get("name_ar", ""),
            info["department"],
            info.get("is_ap", False),
            info.get("is_self_study", False),
        ))
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO subjects (school_id, code, name_en, name_ar, department, is_ap, is_self_study)
        VALUES %s
        ON CONFLICT (school_id, code) DO UPDATE SET
            name_en       = EXCLUDED.name_en,
            name_ar       = EXCLUDED.name_ar,
            department    = EXCLUDED.department,
            is_ap         = EXCLUDED.is_ap,
            is_self_study = EXCLUDED.is_self_study
        """,
        subj_rows,
    )
    print(f"  {len(subj_rows)} subjects upserted")

    # =============================================================
    # 2. UPSERT TEACHERS
    # =============================================================
    print(f"→ Upserting teachers...")
    teacher_rows = [
        (school_id, t["name"], t.get("primary_subject", ""))
        for t in teachers
    ]
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO teachers (school_id, full_name, primary_subject_text)
        VALUES %s
        ON CONFLICT (school_id, full_name) DO UPDATE SET
            primary_subject_text = EXCLUDED.primary_subject_text
        """,
        teacher_rows,
    )
    print(f"  {len(teacher_rows)} teachers upserted")

    # =============================================================
    # 3. UPSERT TEACHER CONTRACTS (weekly_period_cap)
    # =============================================================
    print(f"→ Upserting teacher contracts...")
    # Map names → ids
    cur.execute(
        "SELECT id, full_name FROM teachers WHERE school_id = %s",
        (school_id,),
    )
    teacher_id_by_name = {name: tid for tid, name in cur.fetchall()}
    contract_rows = [
        (teacher_id_by_name[t["name"]], academic_year_id, int(t["cap"]))
        for t in teachers
        if t["name"] in teacher_id_by_name
    ]
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO teacher_contracts (teacher_id, academic_year_id, weekly_period_cap)
        VALUES %s
        ON CONFLICT (teacher_id) DO UPDATE SET
            academic_year_id  = EXCLUDED.academic_year_id,
            weekly_period_cap = EXCLUDED.weekly_period_cap
        """,
        contract_rows,
    )
    print(f"  {len(contract_rows)} contracts upserted")

    # =============================================================
    # 4. UPSERT SECTIONS
    # Insert ONLY the code — grade_level/label/stream are left NULL for the
    # human mapping flow (demo/admin/section-mapping.html). Existing rows
    # already mapped (is_mapped = true) are left untouched.
    # =============================================================
    print(f"→ Upserting sections (codes only — mapping is a human step)...")
    section_rows = [(school_id, academic_year_id, s["code"]) for s in sections]
    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO sections (school_id, academic_year_id, code)
        VALUES %s
        ON CONFLICT (school_id, academic_year_id, code) DO NOTHING
        """,
        section_rows,
    )
    print(f"  {len(section_rows)} section codes upserted (no auto-mapping)")

    # =============================================================
    # 5. RELOAD TEACHER × SECTION × SUBJECT load matrix
    # Full delete + insert for this AY (volatile data)
    # =============================================================
    print(f"→ Reloading load matrix...")
    cur.execute(
        """
        DELETE FROM teacher_section_subject
        WHERE section_id IN (
            SELECT id FROM sections WHERE academic_year_id = %s
        )
        """,
        (academic_year_id,),
    )
    print(f"  deleted {cur.rowcount} stale rows")

    # Resolve id maps
    cur.execute("SELECT id, code FROM subjects WHERE school_id = %s", (school_id,))
    subject_id_by_code = {code: sid for sid, code in cur.fetchall()}
    cur.execute(
        "SELECT id, code FROM sections WHERE academic_year_id = %s",
        (academic_year_id,),
    )
    section_id_by_code = {code: sid for sid, code in cur.fetchall()}

    # parse_workbook emits load rows keyed by a synthetic 'T001'-style teacher_id.
    # Build a map from that synthetic id → Postgres uuid via the teacher's name.
    synthetic_to_db = {}
    for t in teachers:
        db_id = teacher_id_by_name.get(t["name"])
        if db_id:
            synthetic_to_db[t["id"]] = db_id

    # Aggregate duplicates BEFORE inserting. The parser emits one row per cell;
    # the same (teacher, section, subject) can legitimately appear twice when
    # (a) the workbook has two cells contributing to the same logical assignment
    # (e.g. teacher splits the subject across two columns), or
    # (b) two distinct sheet short-codes normalise to the same canonical subject
    # (e.g. 'AD' and 'rt' both map to canonical 'rt' Art).
    # Postgres rejects ON CONFLICT DO UPDATE for rows colliding within the same
    # batch (CardinalityViolation), so we sum weekly_periods upstream and join
    # the source_cell strings to preserve provenance for both cells.
    agg = defaultdict(lambda: {"weekly_periods": 0, "source_cells": []})
    for r in load:
        key = (r["teacher_id"], r["section_code"], r["subject_code"])
        agg[key]["weekly_periods"] += int(r["weekly_periods"])
        agg[key]["source_cells"].append(r.get("source_cell", ""))
    n_dupes = len(load) - len(agg)
    if n_dupes:
        print(f"  aggregated {len(load)} cells → {len(agg)} unique (teacher,section,subject) tuples (collapsed {n_dupes} duplicates)")

    load_rows = []
    skipped = 0
    for key, v in agg.items():
        synthetic_tid, section_code, subject_code = key
        t_db = synthetic_to_db.get(synthetic_tid)
        s_db = section_id_by_code.get(section_code)
        sub_db = subject_id_by_code.get(subject_code)
        # Synthesise a fake parsed-row shape so the existing append/skip logic works
        r = {
            "weekly_periods": v["weekly_periods"],
            "source_cell": ",".join(v["source_cells"])[:255],  # cap length for the text column
        }
        if not (t_db and s_db and sub_db):
            skipped += 1
            continue
        load_rows.append((
            t_db, s_db, sub_db,
            int(r["weekly_periods"]),
            r.get("source_cell", ""),
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO teacher_section_subject
            (teacher_id, section_id, subject_id, weekly_periods, source_cell)
        VALUES %s
        ON CONFLICT (teacher_id, section_id, subject_id) DO UPDATE SET
            weekly_periods = EXCLUDED.weekly_periods,
            source_cell    = EXCLUDED.source_cell
        """,
        load_rows,
    )
    print(f"  inserted {len(load_rows)} load rows (skipped {skipped} unresolvable)")

    # =============================================================
    # 6. RECORD SOURCE IMPORT
    # =============================================================
    print(f"→ Recording source import...")
    sha = file_sha256(XLSX_PATH)
    cur.execute(
        """
        INSERT INTO source_imports
            (school_id, filename, sheet_name, file_sha256, row_count, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            school_id,
            Path(XLSX_PATH).name,
            "26-27A",
            sha,
            len(load_rows),
            f"ETL via load_to_postgres.py ({len(teacher_rows)} teachers, "
            f"{len(section_rows)} sections, {len(load_rows)} load rows)",
        ),
    )

    conn.commit()
    print("\n✓ ETL complete. Committed.\n")

    # Final counts query
    cur.execute(
        """
        SELECT
          (SELECT count(*) FROM subjects WHERE school_id = %s) AS subjects,
          (SELECT count(*) FROM teachers WHERE school_id = %s) AS teachers,
          (SELECT count(*) FROM sections WHERE school_id = %s) AS sections,
          (SELECT count(*) FROM teacher_section_subject
            WHERE teacher_id IN (SELECT id FROM teachers WHERE school_id = %s)) AS load_rows,
          (SELECT count(*) FROM source_imports WHERE school_id = %s) AS import_history
        """,
        (school_id, school_id, school_id, school_id, school_id),
    )
    counts = cur.fetchone()
    print(f"  subjects:        {counts[0]}")
    print(f"  teachers:        {counts[1]}")
    print(f"  sections:        {counts[2]}")
    print(f"  load_rows:       {counts[3]}")
    print(f"  import_history:  {counts[4]}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
