# Data storage policy

## Plain-English summary

**Database content (anything that represents school data) lives in Supabase. The git repo only holds code, schema, IP templates, design assets, and small build artefacts.**

This split exists because:
1. Git is for things many people read and few people change (code, design)
2. Databases are for things many people change and few people read in bulk (records, transactions)
3. Mixing the two — putting database content in git — means every minor data update is a code commit, every schema migration risks corrupting historical data, and the repo bloats with binary blobs that should be in object storage

---

## The map

| What | Lives in | Why |
|---|---|---|
| Source code (Python, SQL, JS, HTML, CSS) | git | Versioned, diff-able, reviewable |
| Database schema (`schema/*.sql`) | git | The shape of the DB is code |
| Manhaj IP templates (`templates/*.md`) | git | Our IP, versioned alongside code |
| Architecture & spec docs (`docs/*.md`) | git | Long-lived knowledge |
| Static design / mockup assets | git | Versioned design |
| Handover xlsx (`handover/*.xlsx`) | git | Outbound deliverable to the school |
| **Raw school uploads** (their xlsx, csv, doc files) | **Supabase Storage** | School data, can be re-downloaded, scales to many schools |
| **Structured school data** (teachers, students, sections, grades) | **Supabase Postgres** | Live records, queried by the app, RLS-protected |
| **AI prompt history, generated reports, message logs** | **Supabase Postgres + Storage** | High-volume, sensitive, indexed |
| Demo dataset (Tier 0 only) | git, **transitional** | Powers the static demo; replaced by Supabase build-time export at Tier 1 |

---

## What was in the repo and got moved

| Path | Previous home | New home | Status |
|---|---|---|---|
| `data/source/24-25 provisional_18-8-2024.xlsx` (9.1MB) | git tracked | Local only + Supabase Storage at T1 | **Untracked 2026-05-25**; still on local disk for ETL re-runs |
| `data/source/Course Selection Circular_G{9..12}_AY 2026-2027.doc` (4 files) | git tracked | Local only + Supabase Storage at T1 | **Untracked 2026-05-25**; still on local disk |
| `data/processed/*.json` (7 files) | git tracked | Build artefact (T1: regenerated from Supabase Postgres at deploy time) | **Still tracked** during Tier 0 because the static demo needs them |
| `demo/data/processed/*.json` (mirror of above) | git tracked | Same | **Still tracked** during Tier 0 |

The `data/source/` folder is in `.gitignore` going forward. New school uploads should be placed there locally and never committed.

---

## Tier 1 cutover plan (the moment Supabase is provisioned)

1. **Create Supabase Storage bucket** `raw-uploads/`. Folder structure per school: `raw-uploads/{school_id}/{YYYY-MM-DD-HHMM}-{filename}`.
2. **Upload existing ISO files** from local `data/source/` to `raw-uploads/{iso_school_id}/2024-08-18-1500-timetable.xlsx` etc. Record an `source_imports` row pointing at the storage path.
3. **Refactor `etl/parse_workbook.py`** to take a Supabase Storage path as input (download → process → upload to Postgres) instead of a local filesystem path. Local-file mode kept as `--local` flag for dev.
4. **Run ETL** to populate Postgres tables for ISO.
5. **Add a build-time export script** that reads from Postgres and writes `demo/data/processed/*.json` at deploy time. This file lives in CI, not in git.
6. **Remove `data/processed/*.json` + `demo/data/processed/*.json` from git tracking.** Add to `.gitignore`.
7. **Update `demo/*.html`** to either:
   - (a) keep reading the build-output JSON files (simplest, demo stays static), OR
   - (b) call Supabase server-side via Next.js (cleaner, removes the duplicate JSON copy)

Option (b) is the right answer at Tier 1 when we're already in Next.js; option (a) is the bridge if Tier 0.5 needs a deploy before Next.js is up.

---

## What this means going forward

- **No school's xlsx, csv, doc, or PDF ever gets committed to git.** If a school sends a file, it goes into `~/dev/manhaj/data/source/` for local processing (won't be tracked), then into Supabase Storage when we run the ETL.
- **Once Supabase is live**, the local `data/source/` folder becomes optional — fresh clones download what they need from Supabase Storage on demand.
- **Demo data is provisional**. The current setup (JSON files in git) is a Tier 0 convenience. Treat any change to those files as a "rebuild from Supabase at the next opportunity" reminder.

See also: `docs/universal_mapper_spec.md` for how arbitrary-format school files become canonical Postgres rows.
