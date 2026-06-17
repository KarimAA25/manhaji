# Manhaj — school ops platform

Pilot school: **International School of Oman** (Al Athaiba, Muscat).
Working dir: `~/dev/manhaj/` · GitHub: <https://github.com/Emouawad2/manhaj> · Private.

## Folder map

```
manhaj/
├── data/
│   ├── source/                  School's raw files (xlsx, .doc, csv).
│   │                            *** NOT IN GIT *** — gitignored per
│   │                            docs/data_storage_policy.md. Local only +
│   │                            Supabase Storage at Tier 1. Place files here
│   │                            locally to run the ETL.
│   └── processed/               ETL output as JSON. Tracked in git ONLY for
│                                Tier 0 static demo; will move to Supabase
│                                Postgres at Tier 1.
├── etl/
│   └── parse_workbook.py        Re-runnable parser (ISO-specific for now;
│                                becomes generic config-driven runner per
│                                docs/universal_mapper_spec.md at Tier 2).
├── schema/
│   ├── 001_init.sql             Tenancy + people + curriculum + load-matrix
│   ├── 002_rls.sql              RLS policies + tenant_id() + set_tenant_search_path()
│   ├── 003_spine.sql            Rooms, attendance, rubrics, comms, audit, AI ledger
│   └── 004_seed_manhaj_ip.sql   Inserts Manhaj IP (rubric framework + 17 templates)
├── templates/                   Manhaj IP — shipped to every school
│   ├── rubric_framework.md           6 universal axes, 1.0–5.0
│   ├── report_card_template.md       Term report (A4, bilingual)
│   ├── monthly_parent_report_template.md
│   └── communication_templates.md    17 parent-comm templates + worked EN/AR example
├── handover/
│   ├── Manhaj_Data_Handover_Template.xlsx   What we send to schools
│   └── build_handover_xlsx.py               Source of the template above
├── demo/                        Tier 0 static demo (Cloudflare Pages target)
│   ├── index.html               Landing / role picker
│   ├── admin/dashboard.html     Principal load-balance dashboard
│   ├── parent/select-courses.html  Bilingual course-selection form
│   ├── parent/report.html       Monthly report (Manhaj rubric IP)
│   ├── data/processed/          Demo data (transitional, see policy)
│   ├── assets/styles.css
│   ├── assets/gate.js           SHA-256-hashed password gate
│   └── healthz.json
└── docs/
    ├── data_storage_policy.md          What lives in git vs Supabase
    ├── universal_mapper_spec.md        Per-school file → canonical schema (Tier 2)
    ├── golive_architecture_review.md   3-tier go-live plan
    ├── migration_single_to_hybrid.md   Schema migration cost + plain-English summary
    ├── constraint_dsl_spec.md          AI → CP-SAT safety belt
    ├── prompt_caching_spec.md          ~85% AI cost saving via 3-layer cache
    ├── tier0_deploy.md                 Cloudflare Pages walkthrough
    ├── github_migration_workflow.md    Moving other projects off OneDrive
    ├── data_inventory.md
    ├── demo_scope.md
    └── module_inputs.md
```

## Storage policy (TL;DR)

**Database content lives in Supabase. Only code, schema, IP, and docs live in git.**
See [`docs/data_storage_policy.md`](docs/data_storage_policy.md) for the full breakdown.

## Run the demo locally

```bash
cd ~/dev/manhaj
python3 -m http.server 8080 --directory demo
# open http://localhost:8080/
```

The password gate skips on localhost. If you want to also re-run the ETL, drop the source
files into `data/source/` first (gitignored — see policy).

## What's real vs stubbed in the demo

| Surface | Source |
|---|---|
| Teacher list + cap + load (admin dashboard) | Real — parsed from `26-27A` sheet |
| Section list + subject heatmap | Real — parsed from `26-27A` sheet |
| Course-selection bundles (parent form) | Real — hand-coded from G9–G12 circular .doc files |
| Subject labels EN + AR | Real — manual catalog informed by circulars |
| Sample monthly report data | Stubbed — illustrative student "Layla Al-Habsi" |
| Attendance / at-risk students | Stubbed — needs roster + attendance from school |

## What Manhaj does NOT ask the school for

- Rubric framework, scoring scale, axis definitions
- Report-card layout, voice/tone rules
- Communication template wording
- University-fit scoring logic

These are Manhaj IP. Schools tune descriptors / school crest / brand colours / signoff style — that's it.
