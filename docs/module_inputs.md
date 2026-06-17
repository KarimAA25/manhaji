# What we need to unlock the remaining modules

Today we have only the load matrix + course-selection circulars. That gets us Demos A + B from `demo_scope.md`. Everything else in the architecture brief needs more inputs.

For each module below: **Bare minimum** = what's required to ship a credible V1 demo. **Nice to have** = what makes it actually good in production. Each input lists *what* it is, *who/where* it comes from, and *cadence* (one-time / per-term / continuous).

---

## 1. Admin Module — beyond Demos A + B

### Bare minimum
| Input | Source | Cadence | Schema target |
|---|---|---|---|
| Student roster (G1–G12 to start) — name, DOB, gender, nationality, home section, parent links | School CSV export (manual or from existing SIS) | One-time + termly refresh | `students`, `student_enrollments`, `parents`, `student_parents` |
| Bell schedule — period count per day, period start/end times, days of week, term calendar | School operations manual + admin interview | One-time per AY | New: `bell_schedule`, `terms` |
| Room inventory — room codes, capacities, equipment flags (lab, gym, music room) | Walk the building once + maintenance team | One-time + when buildings change | New: `rooms` |
| Initial period × day timetable (best-effort hand-off of August allocation) | Either school provides last year's grid or our solver bootstraps from load matrix | One-time per AY then patch-mode | New: `timetable_slots` (teacher × room × period × section × subject) |
| Daily attendance capture — at minimum AM register per section | Teacher PWA, or imported from existing tool | Continuous | New: `attendance_marks` |
| Teacher absences (planned + same-day) | Teacher self-serve form + HR | Continuous | New: `teacher_absences` |
| Substitute pool — who can sub, what subjects, availability days | HR list + Faculty sheet (cross-ref slack capacity) | One-time + monthly refresh | New: `substitute_pool` |
| Auth/identity — staff SSO (Google Workspace or Microsoft 365 typical for K-12) | School IT | One-time | Supabase Auth + IdP connector |

### Nice to have
- Room booking system feed (ad-hoc events occupying rooms)
- Co-curricular schedule (clubs, sports, music) for full conflict detection
- Bus routes / parent pickup windows (affects last-period scheduling)
- Multi-day field-trip calendar
- Behaviour incident log (feeds workload categorisation: which teachers absorb the most disruption)
- Sick-leave norms by month (for forecasting sub demand)

### Consent / policy artifacts
- Parent communication consent (so we can WhatsApp them about absences)

---

## 2. Classroom Module

### Bare minimum
| Input | Source | Cadence | Schema target |
|---|---|---|---|
| Lesson plans — at least subject + learning objectives per period | Teacher PWA (paste or upload), or LMS import | Weekly | New: `lessons`, `lesson_objectives` |
| Smart-board content capture — text/image export per lesson | Brand-dependent: Promethean ActivPanel, SMART, ViewSonic, generic HDMI capture. **Discovery needed before V1.** | Per lesson | New: `lesson_artifacts` |
| 30-second teacher voice memo per lesson (what was actually covered, what to revisit) | Teacher PWA in-app recorder | Per lesson | New: `lesson_voice_memos` |
| Assessment data — quiz/test scores per student per subject per term, with max marks and weighting | Either teacher PWA entry or LMS import | Per assessment | New: `assessments`, `assessment_results` |
| Rubric definitions per subject — competency areas + descriptors (so "strengths/weaknesses" has axes) | Curriculum coordinator + ministry frameworks | One-time + yearly refresh | New: `rubrics`, `rubric_criteria` |
| Per-student rubric scores per term | Teacher entry on PWA | Termly | New: `rubric_scores` |
| Behaviour / engagement observations (lightweight: "participated well", "off-task today") | Teacher quick-tap on PWA | Per lesson (optional) | New: `behaviour_notes` |
| Parent contact channels — phone (E164), WhatsApp opt-in, preferred language, email | Already in `parents` table; needs school to populate | One-time + on-change | `parents` |
| Lecture recording consent matrix — per student per year (parent + student over 13) | Digital consent form via parent PWA | Per AY | New: `recording_consent` |

### Nice to have
- Homework submissions (PDF/image uploads from students) — drives feedback-loop demo
- Past report cards (3+ years of historical narratives) — gives Claude few-shot examples for narrative generation, big quality bump
- Exam-board grade thresholds (CIE/Edexcel/OxfordAQA) — for IGCSE/AS/A2 grade prediction
- Alumni placement history — university accepted, programme, year, SAT/IELTS scores if shared. **Required for university-fit signal.**
- Public university admission stats — CommonApp aggregates (US), UCAS open data (UK), OECD/UNESCO datasets, Saudi/UAE national university dashboards (regionally relevant for ISO)
- Reading-level inventory (Lexile / equivalent) per student
- Standardised test history (MAP, CAT4) — gives a neutral cross-cohort benchmark
- Smart-board recording streams (full lesson video, not just board capture) — gated by consent
- Library borrowing data — supplementary engagement signal

### Consent / policy artifacts
- Lecture recording consent (parent + student) with retention duration the school chooses (default 90 days per arch brief)
- Data-processing notice covering AI-generated parent reports (regional: PDPL Oman / Saudi PDPL / UAE DPL apply for our region)
- Teacher opt-in for AI-drafted communications (so they know their voice memo is being summarised)

---

## 3. Teacher Productivity (sub-module of Classroom)

### Bare minimum
| Input | Source | Cadence | Schema target |
|---|---|---|---|
| Communication templates per use case (absent today, assignment overdue, behaviour concern, well done) | School comms policy + 5–10 historical samples per type | One-time | New: `comm_templates` |
| Historical parent comms (de-identified) — so AI matches the school's house voice | Email/WhatsApp export, last 12 months | One-time bulk | New: `comm_history` (training corpus, not surfaced) |
| Teacher's preferred sign-off / signature block per teacher | Profile settings | One-time | `teachers.signature_md` |
| Report card template format (sections, length, allowed phrasing) | Curriculum coordinator | One-time per year | New: `report_card_templates` |

### Nice to have
- IEP (Individual Education Plan) history per SEN-flagged student
- SEN flags + accommodations registry
- Translation glossary (school-specific terms in EN + AR consistent translations)
- Past IEP review meeting notes — gives the IEP-draft AI prior context

---

## 4. Finance Module

### Bare minimum
| Input | Source | Cadence | Schema target |
|---|---|---|---|
| Chart of accounts | Bursar / accounting system export | One-time + on-change | New: `gl_accounts` |
| Monthly budget per account (current AY + prior 2 years if available) | Bursar | Monthly close + once at AY start | New: `budgets` |
| Monthly actuals per account (current AY + prior 2 years) | Accounting system (Xero/QuickBooks/Sage/Tally — common in MENA), CSV export acceptable | Monthly close | New: `gl_actuals` |
| Fee schedule per grade per AY — tuition, books, transport, exam fees | Finance team | Yearly | New: `fee_schedule` |
| Enrolment counts per grade per AY (current + 2 prior years) | Can derive from `students` once roster loaded; backfill manually for prior years | Yearly | derived |
| Payroll snapshot — gross monthly cost per teacher (or per band) | HR / bursar; can be aggregate at department level if individual is sensitive | Monthly | New: `payroll_snapshots` |
| Vendor list with category tags (utilities, catering, maintenance, curriculum materials) | Bursar | One-time + on-change | New: `vendors` |

### Nice to have
- Per-invoice line items (gives variance narration much more precision)
- Capex schedule (multi-year projects: building, IT refresh)
- FX rate stream (OMR is pegged to USD but invoices may be in AED/EUR/GBP for IGCSE exam fees, textbooks, etc.)
- Fee collection / aging report — turns into a parent-arrears workflow (out of scope per brief, but useful to bursar)
- Staff retention rate + recruitment cost — feeds scenario engine ("what if we lose 2 teachers next year")
- Class-size targets per grade — drives the cross-module scenario "is opening section 11C profitable?"
- Insurance + compliance fee calendar
- Multi-campus consolidation feed (ISO is single-campus, irrelevant for the pilot — but the schema should support it)

### Consent / policy artifacts
- Data handling for financial info (typically only the bursar + principal see this) — RLS becomes mandatory the moment finance loads

---

## 5. Cross-cutting infrastructure (needed by all modules at some point)

### Bare minimum
- Supabase project (Postgres + Auth + Storage) provisioned for the pilot
- Background-job runner (Trigger.dev or Inngest) for nightly ETL, batch report generation
- WhatsApp Business API account (360dialog or Twilio) with the school's number provisioned
- Claude API key with usage budget caps wired (per arch brief: hard cap on background jobs, fail-open on interactive)
- Domain + TLS cert for the parent PWA (e.g. `iso.school-ops.app`)
- Backup + restore procedure (Supabase PITR enabled)

### Nice to have
- Observability — Sentry for FE, Supabase logs piped to a central store, AI spend dashboard
- Status page for parents (during peak comms periods like report-card release)
- Feature-flag service so we can stage the modules per role (admin sees A first, teachers next term, finance third)
- Tenant-isolated S3-compatible storage bucket per school for recordings (per arch brief: on-device processing only for V1, but recordings if school opts in later go here)
- Audit log table — who saw which student's report when (regional regulators ask)

---

## Asks-of-school checklist (cut & paste for the pilot meeting)

1. Student roster CSV (G1–G12): student_id, full name EN, full name AR, DOB, gender, nationality, current section, parent name(s) + phone + email.
2. Parent consent — WhatsApp + AI-generated reports.
3. Bell schedule + room list.
4. Confirmation of section-code suffixes: `AL` / `AS` / `A2`.
5. Existing period×day timetable for AY 26-27 (if one exists outside the load matrix).
6. Last 12 months of parent comms (de-identified bulk export, optional — improves AI tone).
7. Chart of accounts + last 24 months of monthly actuals + AY 26-27 budget.
8. Rubric / report-card template currently in use (per grade band).
9. Smart-board brand(s) in classrooms — Promethean / SMART / ViewSonic / other.
10. Alumni placement spreadsheet (last 5 years) — university accepted, programme, country. **Critical for university-fit feature.**
11. SEN student list + IEP files (under strict access control).
12. Existing SSO provider (Google Workspace / Microsoft 365).

---

## Build sequencing implication

Architecture brief had:

> W5–12 Admin V1 → W13–20 Classroom V1 → W21–26 Classroom V2 (uni-fit) → W27–34 Finance V1 → W35–40 Finance V2

That sequencing only holds if the school can deliver the bare-minimum inputs in roughly the same order. The two **blockers most likely to slip the timeline**:

- **Smart-board capture discovery** (W13 dependency) — must happen in W1–4 alongside foundation.
- **Alumni placement data** (W21 dependency) — schools rarely keep this clean; start asking on day 1 so they have time to compile.

Everything else (roster, bell schedule, rooms, CoA, budget) is straightforward CSV/Excel hand-off the school can produce in a week.
