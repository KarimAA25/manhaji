# What we can credibly build & demo from these files alone

Only these source files exist today. **No student roster, no attendance, no grades, no parent contacts.** That eliminates roughly 70% of the architecture brief from V1 demoability. What remains is real, narrow, and lines up exactly with the **Admin Module wedge** (which was always sequenced first).

## Demo A — "Load matrix import + Principal load-balance dashboard" ⭐

**The cleanest demo. Real data, real value, no fake content.**

ETL parses `Faculty` + `26-27A` sheets → populates `teachers`, `subjects`, `sections`, `section_subjects`, `teacher_contracts`, `teacher_section_subject`.

Dashboard surfaces:
- **Teacher load bars**: assigned vs `max # of lessons` cap, sorted by slack. Red < 0, amber = full, green = slack > 4. Picks out over-/under-loaded teachers instantly — currently a manual eyeballing exercise in Excel.
- **Subject coverage heatmap**: rows = sections, cols = subjects, cell = weekly periods. Empty cells in subjects the section *should* have (per `course_catalog`) flagged as **gaps**.
- **Department workload split**: total periods per department, % of cap utilised.
- **"Find me a teacher who can take Chemistry G10"**: filter teachers who have the subject in `Faculty` AND have slack > N.

Why it works as a demo: the principal already has all this data in the .xlsx; they just can't query it. We turn 158 columns into 4 readable views. The wedge framing ("we don't replace your workflow, we make the workbook you already maintain queryable") is the easy sell.

**Build time**: 2–3 days. ETL + dashboard pages + seed pilot data.

## Demo B — "Digital course-selection form (Jan deadline replacement)" ⭐

**Replaces the four .doc circulars with one mobile-friendly bilingual web form.**

Flow:
1. Parent gets WhatsApp link → opens PWA in browser → enters student name / OTP.
2. Form shows the compulsory subjects (read-only) + the elective bundles per grade with the exact bundle structure from `elective_bundles`.
3. Parent picks 5 (G9/G10) or 3 (G11/G12), signs digitally, submits.
4. Admin sees a single dashboard with `v_elective_demand`: how many G10 students picked Physics vs Biology, etc.

Why it works: this is a recurring January pain. The .doc files we have today are static; school admin has to chase parents on WhatsApp and manually tabulate. Demand rollup directly drives next-year section planning ("we need 2 Physics G11 sections, not 1") which feeds Demo A.

**Caveat**: needs even a stub student roster (~30 fake names for the demo). Trivial to mock.

**Build time**: 2–3 days. Form is mostly bundle-driven UI off the `elective_bundles`/`elective_options` tables.

## Demo C — "NL-to-constraint timetable patch" (the wedge demo)

This is the architecture brief's flagship. With the load matrix loaded (Demo A), we can demo:

Principal types in chat: *"Mr. Gericke should keep Tuesday afternoons free for English department coordination."*

Backend:
1. Claude Sonnet 4.6 extracts a structured constraint: `{ teacher: 'Ferdinand Gericke', forbid_periods: ['TUE_P5', 'TUE_P6', 'TUE_P7'] }`.
2. CP-SAT runs a *partial* solve over Mr. Gericke's existing assignments only.
3. UI shows: 3 periods moved, all constraints satisfied, here's the diff.

Caveat: **we don't have the period × day grid in the source files** — only weekly counts. To make this demo runnable, we'd seed a synthetic period grid (5 days × 8 periods = 40 slots) and use CP-SAT to do the *initial* assignment from the load matrix as part of the import. That's defensible: the school's current process is exactly this — they take the load matrix and hand-allocate periods every August. Our import generates a baseline they edit, instead of starting blank.

**Build time**: 4–6 days. The CP-SAT model and NL→constraint extraction are the load-bearing pieces; UI is straightforward.

## Demo D (skip for now) — Classroom / Finance modules

The classroom module needs **lesson recordings, attendance, grades, parent reports** — none of which exist in the source files. Finance needs the chart of accounts and historical actuals — also absent. These are V2/V3 in the build sequence anyway. **Do not promise these in the pilot demo.**

## Recommended demo cut for the pilot pitch

Show A + B together — they're both wedge-clean, both grounded in real source data, and together they cover ~6 days of build. Demo C can be a "here's what's next" teaser slide (or you build it if pitch is >2 weeks out). Defer everything else to post-pilot phases.

## Concrete next steps if you greenlight this scope

1. **Ask school for**: (a) student roster CSV — even just G9–G12 since they're the form audience, (b) confirmation of `AL`/`AS`/`A2` section-code meanings, (c) the chart of accounts later (irrelevant for V1 demo).
2. **Build the ETL** (`etl/import_26_27a.py`) that reads the xlsx and writes to the schema. Already designed: each cell has a known (teacher_row, section_col_group, subject_subcol) → fact row mapping.
3. **Stub the missing roster** with ~30 plausible names per grade for the form-side demo.
4. **Pick Postgres host**: Supabase project, RLS off until tenant story is needed.
