# Sprint 1.5 — Elias's Phase-1 review feedback: triage + work plan

**Date:** 2026-07-19 · **Branch:** `sprint-1.5` → PR #12 · **Source:** Elias's full app-by-app review.
**Dispositions:** `BUILD` (this sprint) · `SCHEMA` (needs migration 020 first) · `DATA` (needs school data — covered by the ISO data request) · `RESEARCH` (researcher agent) · `P2/P3` (deferred, logged) · `ANSWERED` (PM recommendation below, needs Elias's nod).

---

## ADMIN

### Faculty
| Item | Disposition | Notes |
|---|---|---|
| Roster: filter on columns, show top 5/10, expand | **BUILD** | FE quick-win |
| Contracts: no real contracts; check DB tables; pop-up viewer + download | **SCHEMA + DATA** | `teacher_contracts` exists (69 rows, no documents). Need a contract-document store (Supabase Storage bucket + `contract_url`). **Real contracts must come from ISO — being ADDED to the data request.** Build the pop-up viewer now with demo-OR pattern. |
| Hiring pipeline: real data; add-candidate pop-up (write); clickable stages → list → edit pop-up, status auto-reflects | **SCHEMA + BUILD** | `job_postings` exists but empty; needs a `teacher_applicants` shape (mig 020). Pop-up + stage lists buildable now; real pipeline = DATA (added to request). |
| Performance composite: school's real %-grades, drill-down section→teacher, YoY | **DATA + P2** | Depends on grades (in data request). Redesign to %-based drill-down spec'd now; wiring lands when grades arrive. |

### Sections
| Item | Disposition | Notes |
|---|---|---|
| Remove entirely from admin (managed at implementation) | **BUILD** | Remove nav entry + dashboard links; page stays reachable by direct URL for implementation use. |

### Students
| Item | Disposition | Notes |
|---|---|---|
| Leave as is; Export list → real XLSX of the filtered view | **BUILD** | Client-side XLSX (SheetJS or CSV→xlsx) of current filter state. |

### Admissions
| Item | Disposition | Notes |
|---|---|---|
| Re-enrollment source is static → add `re_enrolled_on` + `final_enrollment_date` (+ leaver reason/comment) to `students`; null = pending | **SCHEMA** | Migration 020. Then wire the funnel to compute from these. |
| Re-enrollment buttons → keep ONLY: Retention summary (pop-up, downloadable) + Schedule retention call (email draft w/ parent contact) | **BUILD** | Retention summary = data-plug (attendance/risk/fee flags), no AI. Email = `mailto:` draft — ⚠️ parent contacts are empty until ISO sends them; falls back gracefully. Remove nudge/barrier/open-all. |
| Confirmed leaving: red "Confirm No Re-enrollment" btn + are-you-sure pop-up → writes final date + admin comment | **SCHEMA + BUILD** | Uses the new columns. |
| "Needs you this week" reposition (below summary cards, or bottom) | **BUILD** | Below summary/cards. |
| All applicants: Add-applicant pop-up (writes DB, auto-refresh) + working CSV export; **parent = searchable dropdown from DB, or create-new-parent inline** | **SCHEMA + BUILD** | Student `applicants` table needs checking/creating (mig 020). Parent select-or-create writes `parents` + link. |
| New-applicants pipeline from real applicants data | **SCHEMA + BUILD** | Reads the same table. |

### Reports
| Item | Disposition | Notes |
|---|---|---|
| Remove regulator sub-tabs (Oman only) | **BUILD** | |
| Review-draft / Generate & submit: real MoE-required reports, data-plug generated (no AI) | **RESEARCH → BUILD** | Researcher confirms Oman MoE catalogue + formats (methodology reusable for other countries). Then templated data-plug drafts. Research dispatched now; generation lands next wave. |
| Non-ministry reports → visual format | **BUILD** (after research defines the split) | |
| Recent submissions: write path for submitted-by/status; Download works; demo-OR; move "view full history" | **BUILD** | `report_submissions` exists (3 rows) — wire status writes + OR-fallback. |

## TEACHER
| Item | Disposition | Notes |
|---|---|---|
| Dashboard top: real DB read or OR-fallback | **BUILD** | Audit + wire. |
| My Week tabs: per-teacher, only same-dept/substitutable teachers | **BUILD** | Dept data now real (post-018/019). |
| Remove attendance graph → "My student insights" moves up | **BUILD** | |
| My students "open" btn → notes + missing homework + recent grades; submissions tracking | **BUILD (btn) + P3 (submissions)** | No student-submission portal exists — deferred to P3 as Elias noted; button shows notes/homework/grades with demo-OR. |
| One-tap attendance → writes DB | **VERIFY** | Write path (`saveAttendanceMark`) already exists in code — verify it fires end-to-end on the target DB. |
| Rubric: section dropdown, students follow, writes DB | **BUILD** | |
| Class hub: class selector; add-follow-up pop-up → pending tasks; remove parent-summary; last/this-week working + **Next Week page** (absorbs the Input page: summary of next class + pre-class checklists); keep Generate-homework unlinked + add "Upload homework" | **SCHEMA + BUILD** | `lesson_followups`/tasks table in mig 020. Biggest teacher item — the Input page merges into Class hub. |
| Substitute sheet sources (plans/checklists/recognitions) from Class hub | **BUILD** | Wiring note — data comes from the class-hub writes above. |
| Substitute's own dashboard shows covered classes, distinct colour | **BUILD** | Reads `substitutions` into My Week. |

## PARENT
| Item | Disposition | Notes |
|---|---|---|
| Dashboard: sub-tabs, Sign now, View invoice, Reply, Full report, Open in app | **BUILD** | Sign now → permission slip; View invoice → invoices; Reply → writes `thread_messages` (tables exist since 010); Full report → report page; sub-tabs wire. |
| Permission slip: Save draft + Sign & submit → real writes | **BUILD** | `permission_slips`/`consent_records` — verify tables, wire writes (or OR-demo). |
| Invoices: Pay on ISO portal (external link), Download PDF | **BUILD** | Pay = link out; PDF = server-rendered invoice. |
| Sibling comparison: Open form, Confirm pickup, Attention-all | **BUILD** | Wire or hide per feasibility — nothing silently dead. |
| Calendar: Add to Google/Apple (real URL w/ data), Copy ICS | **BUILD** | Real `webcal`/Google-render URLs from event data. |

## STUDENT
| Item | Disposition | Notes |
|---|---|---|
| Dashboard AI summary linking | **P2** | Logged. |
| Daily schedule ≠ approved visualization; no back button; homework ← teacher-assigned | **BUILD** | Align to the mockup visualization (incl. per-class "what to bring / due"), add back-nav, link homework to `lessons`. |
| My Goals: Add-goal pop-up (write), history, next months, suggested-goals actually add, reflections save | **SCHEMA + BUILD** | `student_goals` exists; `goal_checkins`/`goal_reflections` in mig 020. "Get better at multi-step problems" stays visible, unlinked (P3 AI module). |
| Study planner: verify wrap-up-task tables exist | **SCHEMA CHECK** | `study_blocks` planned — confirm/create in 020. |
| App tracker: Add-university pop-up from a pre-existing university list | **SCHEMA + BUILD** | `universities` reference table (mig 020, seeded with a starter list). |
| University entrance-criteria research DB | **RESEARCH (P2/P3)** | Large; logged for Phase 2/3 — needed before final go-live, not the pilot. |
| Master docs: student can't access; advisor input surface missing | **SCHEMA + P2** | Storage + `master_docs` table in 020; advisor-side surface = P2 (no advisor UI exists yet). Student read view now. |
| Test scores: student inputs grades → status refresh | **BUILD** | Write + recompute. |
| Counselor 1:1 booking — how? | **ANSWERED** | Recommendation: pilot = request-based booking (student picks a slot from counselor-defined availability → writes a `booking_requests` row → counselor confirms). Real calendar integration (M365/Google free-busy) = Phase 2. Avoids calendar-auth complexity now. |
| My Growth: % grades not letters; remove improvement-plan buttons | **BUILD** | Display change now; real grades = DATA. Buttons removed. |

## GLOBAL (all apps)
| Item | Disposition |
|---|---|
| Navbar name = **"Manhaji"** everywhere | **BUILD** |
| All coded seed data → DB, with **"OR" fallback** (DB-first, demo only when empty) | **BUILD** — repo-wide sweep, the standing pattern |

---

## Execution waves
- **Wave 1 (dispatched):** researcher (Oman MoE reports) · database-engineer (schema gap analysis → draft migration 020 covering every SCHEMA item above) · frontend (UI quick-wins bundle: Manhaji naming, Sections removal, roster filter/top-N, XLSX export, section repositions/removals, % display).
- **Wave 2 (after 020 approved + applied):** admissions re-enrollment + applicant pop-ups · teacher class-hub restructure + rubric/attendance writes · parent button wiring · student goals/tracker/schedule fixes · seed-data→OR sweep.
- **Wave 3:** reports data-plug generation (post-research) · Cover-planner Vercel tracing fix · integration, verification, **Karim handover doc**, PR #12 ready.

## Data request addendum (to send ISO)
Add to the existing request: **teacher contracts** (PDFs/scans + terms) and the **live hiring pipeline** (candidates + stages). I'll have the secretary issue an addendum page.

## Deferred log (agreed P2/P3)
Student submission portal (P3) · AI summaries/goal-suggestions linking (P2/P3) · university entrance-criteria research DB (P2/P3, pre-go-live) · advisor master-docs surface (P2) · performance-composite live wiring (on grades arrival) · calendar-integrated counselor booking (P2).
