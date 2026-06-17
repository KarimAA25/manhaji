#!/usr/bin/env python3
"""
Seed messages_threads + thread_messages with the demo fixtures.

WHAT THIS DOES (plain English):
  Reads etl/data/messages_seed.json (12 threads, mirror of apps/web/lib/
  mock-messages.ts), connects to Supabase Postgres, truncates the existing
  message tables, and inserts the demo threads + messages.

  After this runs, /parent/messages shows the same 12 threads that the
  2.4a mock fixture showed — but now they're persisted in Postgres.

  Re-runnable. Truncates first, so always lands in the same end state.

SETUP (one-time, ~2 min):
  cd ~/dev/manhaj
  source .venv/bin/activate    # or: python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt   # if not done already

  # Env (set once in ~/.env or via direnv):
  #   SUPABASE_DB_HOST=...
  #   SUPABASE_DB_USER=...
  #   SUPABASE_DB_PASSWORD=...
  #   SUPABASE_DB_NAME=postgres

  python etl/seed_messages.py
"""

import json
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor

ROOT = Path(__file__).resolve().parent.parent
SEED_PATH = ROOT / "etl" / "data" / "messages_seed.json"

SCHOOL_NAME      = os.getenv("MANHAJ_SCHOOL_NAME", "International School of Oman")
DEMO_PARENT_EMAIL = "mahmoud.al-habsi@example.com"

REQUIRED_ENV = ["SUPABASE_DB_HOST", "SUPABASE_DB_USER", "SUPABASE_DB_PASSWORD"]

def env_or_die(key: str) -> str:
    v = os.getenv(key)
    if not v:
        sys.exit(f"Missing required env var: {key}. See script header for setup.")
    return v

def connect():
    return psycopg2.connect(
        host     = env_or_die("SUPABASE_DB_HOST"),
        user     = env_or_die("SUPABASE_DB_USER"),
        password = env_or_die("SUPABASE_DB_PASSWORD"),
        dbname   = os.getenv("SUPABASE_DB_NAME", "postgres"),
        port     = int(os.getenv("SUPABASE_DB_PORT", "5432")),
        sslmode  = "require",
    )

def load_seed() -> list[dict]:
    if not SEED_PATH.exists():
        sys.exit(f"Seed file not found at {SEED_PATH}")
    with SEED_PATH.open() as f:
        return json.load(f)

def main():
    threads = load_seed()
    print(f"Loaded {len(threads)} threads from {SEED_PATH}")

    with connect() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # School + student id lookup
            cur.execute("select id from schools where name = %s", (SCHOOL_NAME,))
            row = cur.fetchone()
            if not row:
                sys.exit(f"Unknown school: {SCHOOL_NAME}")
            school_id = row["id"]

            cur.execute(
                "select id, full_name from students where school_id = %s and full_name = any(%s)",
                (school_id, ["Layla Al-Habsi", "Omar Al-Habsi", "Yasmin Al-Habsi"]),
            )
            students = {r["full_name"]: r["id"] for r in cur.fetchall()}
            for name in ["Layla Al-Habsi", "Omar Al-Habsi", "Yasmin Al-Habsi"]:
                if name not in students:
                    print(f"WARN: student '{name}' not seeded in DB — household-only fallback OK, single-child threads will skip.")

            # Truncate existing rows (re-runnable)
            print("Truncating messages tables...")
            cur.execute("truncate messages_threads, thread_messages, messages_audit_log cascade;")

            inserted_threads = 0
            inserted_messages = 0

            for t in threads:
                student_name = t.get("student_name")
                student_id = students.get(student_name) if student_name and student_name != "household" else None

                # If the seed expects a student but the student doesn't exist in DB, skip the thread
                if student_name and student_name != "household" and student_id is None:
                    print(f"  SKIP thread '{t['subject']}' (no student row for {student_name})")
                    continue

                cur.execute(
                    """
                    insert into messages_threads
                      (school_id, parent_email, student_id, subject, category, from_label,
                       unread, last_activity_at)
                    values (%s, %s, %s, %s, %s, %s, %s, %s)
                    returning id
                    """,
                    (
                        school_id, DEMO_PARENT_EMAIL, student_id,
                        t["subject"], t["category"], t["from_label"],
                        t.get("unread", False),
                        t["messages"][-1]["ts"],   # set last_activity_at to the most recent message
                    ),
                )
                thread_id = cur.fetchone()["id"]
                inserted_threads += 1

                for m in t["messages"]:
                    cur.execute(
                        """
                        insert into thread_messages
                          (thread_id, ts, role, from_name, from_label, body, opened_at)
                        values (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            thread_id, m["ts"], m["role"],
                            m["from_name"], m["from_label"], m["body"],
                            m.get("opened_at"),
                        ),
                    )
                    inserted_messages += 1

        conn.commit()

    print(f"Seeded {inserted_threads} threads, {inserted_messages} messages.")

if __name__ == "__main__":
    main()
