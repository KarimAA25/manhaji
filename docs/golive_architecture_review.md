# Manhaj — go-live architecture review

**Date:** 2026-05-24 · **Audience:** founder/operator (you) · **Status:** opinionated; act on it
**Pilot:** International School of Oman (Muscat) · **Working dir:** `~/OneDrive-Personal/school-ops/`
**Note on path:** the real `school-ops/` directory is OneDrive-locked at write time; this file is being written to the synced mirror `school-ops 2/docs/`. Move it back into `school-ops/docs/` once OneDrive resolves.

---

## 1. Current-state assessment

### What is real, today
- **Schema** is real and grounded in the school's actual workbook: `schema/001_init.sql` defines 17 tables / 2 views covering tenancy, people, curriculum, sections, the load-matrix fact table, course selection, and `source_imports` for provenance. Every column has source-file lineage in a SQL comment. This is unusually disciplined for a pre-deployment artifact.
- **ETL is real and re-runnable**: `etl/parse_workbook.py` reads the 40-sheet xlsx, parses the `26-27A` load matrix + `Faculty` crosstab, normalises 32 subject codes, emits 7 JSON files into `data/processed/`. Output verified: 69 teachers, 41 sections, 32 subjects, 482 load rows, sha-stamped (`manifest.json:source_sha256`).
- **Demo is real but static**: three pages — `demo/index.html` (role picker reading `manifest.json`), `demo/admin/dashboard.html` (load distribution + heatmap + summary tiles, all driven by parsed JSON), `demo/parent/select-courses.html` (4-step bilingual EN/AR form from `course_offerings.json`), `demo/parent/report.html` (rubric radar + university-fit bands — stubbed sample student). Brand tokens (#0B2545 navy, #3D5A80 accent) match the four `Downloads/school-ai-mockups/*.html` files exactly. Design language is locked.
- **Manhaj IP** is written down and shippable: `templates/rubric_framework.md` (6 universal axes, 1.0-5.0 decimal scale, 5 subject lenses, composite signals), report-card / monthly-report / 17-template communication catalog. This is the differentiator the briefs lean on — and it exists as plaintext today, ready to be embedded in system prompts or content tables.
- **Handover artifact**: `handover/Manhaj_Data_Handover_Template.xlsx` (rebuildable via `build_handover_xlsx.py`) — 9-sheet workbook with READMEs, dropdowns, sample rows. This is the school-facing collection mechanism for everything that's not in the source workbook.

### What is **not** real
- Zero backend. No Supabase project, no Postgres database, no deployed app, no auth, no domain.
- Schema has never been executed. The DDL in `001_init.sql` has no migration runner; it has never created a row anywhere.
- `students`, `parents`, `student_enrollments`, `attendance`, `assessment_*`, `transaction` — the spine the architecture brief calls "12 canonical tables" — are mostly stubs without data.
- Parent monthly report (`demo/parent/report.html`) uses a hand-coded student "Layla Al-Habsi"; the radar values are illustrative, not computed.
- No WhatsApp, no Claude calls, no CP-SAT solver, no Trigger.dev jobs, no RLS, no SSO. Every architectural decision in the deep-dive doc is **paper-only**.
- The 12-table spine in the architecture brief (page 14) is also paper-only in another sense: the names in the SQL don't all map cleanly to the brief. e.g. brief calls them `subject_offering`, schema has `section_subjects` + `teacher_section_subject` + `course_catalog`. The SQL is more granular and arguably better — but the brief's 12-table mental model is no longer the source of truth.

### Architectural verdict

**The foundation is sound for production. The demo distribution path is throwaway.**

What carries forward without rework:
- The schema. With the addition of `school_id` RLS policies and a few missing tables (rooms, bell_schedule, attendance_marks, transactions, GL accounts), this is your production DDL. Nothing to throw away.
- The ETL pattern. `parse_workbook.py` is well-structured (provenance via `source_cell`, sha256, re-runnable). The same pattern works for the handover xlsx that other schools will fill out.
- The IP templates. These become system prompts + content rows. Plaintext today, code-loadable tomorrow.
- Brand tokens + CSS variables in `demo/assets/styles.css`. They map 1:1 onto a Tailwind config.
- The mockups in `~/Downloads/school-ai-mockups/`. They are the visual spec for the Next.js app.

What is throwaway:
- The static HTML demo as a *delivery vehicle*. The moment the dashboard needs auth, persistence, or a second user, it falls over. The HTML files themselves are reference-able as visual layouts when rebuilding in Next.js, but `python3 -m http.server` is not how you show this to anyone outside the room.
- The `fetch('../../data/processed/...json')` data-loading pattern. Throwaway. Replace with Supabase queries.
- The hardcoded sample student in `report.html`. Replace with real records.

### The tension to flag
The briefs commit hard to **Next.js 15 + Supabase + RLS-at-DB-layer + multi-tenant from day one** (architecture brief sec 9 + 10 + decisions log 2026-05-17). The current build is static HTML served by a Python one-liner. The longer you stay on the static-HTML path, the more you build that won't survive the cut-over. **The static demo is a 1-week asset, not a 4-week asset.** Stand it up for the pilot conversation, then cut to Tier 1 the moment the school says yes.

---

## 2. Go-live tiers

### Tier 0 — Shareable static URL (≤ 1 day, ~$0/month)

**Unlocks:** "Send the principal a link before the Friday meeting." Read-only. Anyone with the URL can click around the three demo pages and see real ISO data.

**Stack:** Cloudflare Pages or Vercel (free tier) pointed at a Git repo containing only the contents of `school-ops/demo/` plus the `data/processed/*.json` files copied alongside. No backend, no auth, no DB.

**Setup steps:**
1. `git init` the `school-ops/` directory; commit current contents.
2. Push to a private GitHub repo (e.g. `manhaj-pilot-demo`).
3. Sign up for Cloudflare Pages (free); connect the repo.
4. Set build output dir to `demo/`; relative JSON fetches need `data/processed/` copied into `demo/` OR change the fetch paths to relative-from-deployed-root.
5. Add a custom subdomain (e.g. `iso-demo.manhaj.app`) once a domain is bought, or use the Pages default URL.
6. Add an `index.html` password-prompt via Cloudflare Access (free tier) so it's not public.
7. Add a meta robots noindex + a small "DEMO — not production data flow" footer ribbon (already in design, just enable).

**Cost:** $0/mo (Cloudflare Pages free) + ~$10/yr for a domain if you don't already own one.
**Time:** half a day, including fixing the JSON fetch paths.
**Carries forward:** the brand, the visual layouts (reference for Next.js port), the CSS tokens.

### Tier 1 — Live pilot demo with auth-light + persistence (1.5-2 weeks, ~$25-50/month)

**Unlocks:** "The principal logs in, types into the chat box, gets a real CP-SAT-backed answer, sees their own data persist across sessions." The parent course-selection form submits to a real DB and produces a real demand rollup. You can also seat 1-2 ISO admins in this and gather usage signal during pilot conversation.

**Stack:**
- **Next.js 15 + Tailwind** on Vercel Hobby (free) or Cloudflare Pages.
- **Supabase free tier** (Postgres + Auth + Storage): run `schema/001_init.sql` plus the missing tables (see §3 below).
- **Supabase Auth** with magic-link only (skip SSO till Tier 2).
- **RLS enabled from day 1** with a single `school_id = auth.jwt() -> 'school_id'` policy — even with one tenant.
- **Claude API** behind a Next.js route handler with prompt caching enabled (Sonnet for chat, no Haiku background jobs yet).
- **CP-SAT solver** deployed as a small FastAPI service on Fly.io or Railway ($5/mo), called from a Next.js server action.
- **Trigger.dev free tier** for the one or two scheduled jobs you'll need (nightly re-ingest from a Supabase Storage upload of the xlsx).
- **No WhatsApp yet.** Email links via Resend ($0 to start).

**Setup steps:**
1. `npx create-next-app@latest manhaj` with Tailwind + App Router.
2. Port `demo/assets/styles.css` tokens into `tailwind.config.ts`; reuse the four mockup HTMLs as page-level layouts.
3. Create Supabase project; run `schema/001_init.sql`; add `rooms`, `bell_schedule`, `attendance_marks`, `behavior_notes`, `transactions`, `gl_accounts`, `audit_log` migrations.
4. Write `school_id` RLS policy on every table; seed ISO as a single tenant row.
5. Adapt `etl/parse_workbook.py` to write directly into Postgres (replace JSON writes with `psycopg`/`supabase-py` upserts; keep `source_imports` row writing).
6. Port the principal dashboard from static HTML to a Next.js server component reading from Postgres via Supabase RPC views (`v_teacher_load` already exists).
7. Port course-selection form to a server action that writes `course_selection_forms` + `course_selection_picks`.
8. Wire Claude Sonnet 4.6 with prompt caching to a `/api/chat` route + a constraint DSL extractor (returns typed JSON only; never raw to solver).
9. Stand up the OR-Tools CP-SAT FastAPI service on Fly.io; add a single `/solve_patch` endpoint that takes a constraint DSL and returns a diff.
10. Buy `manhaj.app` (or chosen brand); point at Vercel; magic-link auth with one principal account + your own.

**Cost:** Vercel Hobby $0, Supabase Free $0 (500MB DB + 1GB storage + 50k MAUs — fine for pilot), Fly.io $5 (CP-SAT service), Claude API ~$10-20 if usage stays low, Resend $0, Trigger.dev free. **Total ~$15-25/mo** + ~$10/yr domain.
**Time:** 8-12 engineer-days for one engineer.
**Carries forward:** **all of it.** Next.js app, Supabase project, schema, RLS policies, Claude integration, solver service — none of this is thrown away at Tier 2. This is the cut-over point and the only one where carry-forward matters.

### Tier 2 — Production pilot at ISO with WhatsApp + monthly jobs (4-8 weeks from Tier 1, ~$200-400/month)

**Unlocks:** "ISO is using this for AY 26-27 planning, parents are submitting the course-selection form for real, substitute-teacher WhatsApp flow runs every morning, monthly parent reports go out the last week of every month." Real product. This is the architecture brief's "Foundation + Admin V1" output.

**Stack delta from Tier 1:**
- **Supabase Pro** ($25/mo) — production tier with PITR backups, custom domain on the DB, longer log retention. Mandatory before real student data goes in.
- **WhatsApp Business API via 360dialog** (~$50/mo + per-message). Twilio is the alternative; 360dialog is the regional default for MENA and pricing is friendlier at low volume. **Pick 360dialog.**
- **Claude Haiku 4.5** for nightly monthly-report generation; **prompt caching aggressive at term boundary** (architecture brief §8). Budget cap enforced server-side per tenant via a `ai_usage_ledger` table you check before each Haiku call.
- **Trigger.dev Pro** ($20/mo) for the durable jobs: nightly recap pipeline, monthly report run, daily attendance reconciliation.
- **Sentry** ($26/mo team plan) for FE + Next.js server errors. AI usage dashboard inside the app (a simple Supabase view over `ai_usage_ledger`).
- **Supabase Storage** for generated parent-report PDFs + (later, opt-in) audio summaries. S3-compatible from day 1, no migration needed if volumes grow.
- **Cloudflare** in front of Vercel for DDoS + custom WAF rules around the parent PWA.
- **Google Workspace SSO** for ISO staff (architecture brief §9). Add once Tier 1 is stable.

**Setup steps (≈ 7 buckets, each ~3-5 days):**
1. **Spine completion**: add the remaining tables (`assessment_*`, `attendance_marks`, `behavior_notes`, `transactions`, `gl_accounts`, `consent_records`, `ai_usage_ledger`, `audit_log`). Migrate.
2. **WhatsApp**: 360dialog account + template approvals (lead time: 5-10 business days). Build send/receive webhook handler. Template inventory from `templates/communication_templates.md`.
3. **Substitute engine**: takes a teacher-out WhatsApp message → CP-SAT patch solve → notify substitute + parents. End-to-end.
4. **Roster ingest**: school uploads CSV per the handover xlsx; Manhaj imports into `students`, `parents`, `student_parents`, `student_enrollments`.
5. **Monthly report job**: Trigger.dev cron, last week of month. For every enrolled student: assemble rubric scores → Claude Haiku draft → PDF render → WhatsApp delivery to parent. Idempotent. Budget-capped.
6. **RLS + audit**: every read of a sensitive student record logs to `audit_log`. Surface in principal-only "who saw my students' data" dashboard.
7. **SSO + production cutover**: Google Workspace OIDC, custom domain on Supabase, Cloudflare WAF, status page (`status.manhaj.app`).

**Cost:** Vercel Pro $20, Supabase Pro $25, Fly.io $10-20, 360dialog $50 + per-msg, Claude $100-300 depending on Haiku volume, Trigger.dev $20, Sentry $26, Cloudflare $0-20, domain + email $5. **Total $250-450/mo** at pilot scale (one school, ~500 students).
**Time:** 25-40 engineer-days for one engineer; faster with two.
**Carries forward:** the entire stack scales to multi-tenant Tier 3 with config changes only. No rewrite.

---

## 3. What can be done NOW (zero blockers)

| # | Item | Files | Hours |
|---|---|---|---|
| 1 | Add `school_id` to every table that's missing it; add a `_rls.sql` migration with the policies (even before Supabase exists — write them now) | `schema/002_rls.sql` (new) | 2 |
| 2 | Add the missing-spine migrations to bring the schema in line with the 12-table brief: `rooms`, `bell_schedule`, `terms`, `timetable_slots`, `attendance_marks`, `assessments`, `assessment_results`, `rubrics`, `rubric_criteria`, `rubric_scores`, `behavior_notes`, `lessons`, `lesson_objectives`, `lesson_artifacts`, `comm_templates`, `consent_records`, `gl_accounts`, `budgets`, `gl_actuals`, `transactions`, `vendors`, `ai_usage_ledger`, `audit_log` | `schema/003_spine.sql` (new) | 6 |
| 3 | Refactor `etl/parse_workbook.py` so the JSON-writing step is replaceable: extract a `persist()` interface; current impl writes JSON, future impl writes Postgres | `etl/parse_workbook.py`, new `etl/persist_pg.py` stub | 3 |
| 4 | Fix the dashboard fetch path so the demo works when served from `demo/` as the root (Cloudflare Pages will serve from `demo/` not the repo root) | `demo/admin/dashboard.html`, `demo/index.html`, `demo/parent/*.html`, plus copy `data/processed/*.json` into `demo/data/` | 1 |
| 5 | Write Tailwind config from `demo/assets/styles.css` CSS variables (`--primary: #0B2545`, etc.). Pre-builds the Tier 1 design system. | `tailwind.config.ts` (new, in a fresh repo) | 1.5 |
| 6 | Replace the hardcoded sample student in `demo/parent/report.html` with a JSON file (`demo/data/sample_report.json`) so the page can be re-skinned with real data later by swapping the JSON only | `demo/parent/report.html`, new `demo/data/sample_report.json` | 2 |
| 7 | Add a `/healthz` static JSON file with build sha + manifest sha to `demo/` so deployed-vs-local is checkable in the browser | `demo/healthz.json`, `demo/index.html` | 0.5 |
| 8 | Write the typed CP-SAT constraint DSL spec (the interface between LLM extraction and the solver). Architecture brief §8 calls this out explicitly: "never raw LLM output passed to the solver directly". Spec it now even before the solver service exists. | `docs/constraint_dsl_spec.md` (new) | 3 |
| 9 | Write the prompt-cache scope spec: what goes in the per-term system prompt (subjects, sections, policies, teacher list) vs what is delta-loaded per request. Architecture brief §8 says "cache hit > 90%". Define what 'cache hit' means here before building. | `docs/prompt_caching_spec.md` (new) | 2 |
| 10 | Embed `templates/rubric_framework.md` + `templates/communication_templates.md` into a `seed_manhaj_ip.sql` so on every fresh DB, the IP rows are inserted into `rubrics`/`rubric_criteria`/`comm_templates`. Makes the IP code-shipped, not human-typed. | `schema/004_seed_manhaj_ip.sql` (new) | 3 |
| 11 | Add a `LICENSE` + `NOTICE` to `school-ops/` (the IP templates need legal cover before this repo gets pushed to GitHub) | `LICENSE`, `NOTICE` (new) | 0.5 |
| 12 | Make the static demo password-prompt (a tiny JS gate using `crypto.subtle` against a hashed password) so even the Cloudflare Pages default URL isn't world-readable until the school has seen it | `demo/index.html`, all demo pages | 1 |

**Total: ~26 hours of zero-blocker work.** None requires school input, money, or a decision from you. Do these first; they make every Tier 1+ task cheaper.

---

## 4. What requires intervention

### 4a. User decisions (you, the founder)

| Decision | Recommendation | Why |
|---|---|---|
| Brand name lock-in | **Manhaj.** Already on every artifact, domain searchable, Arabic resonance. Stop comparing to "Madrasa OS". | Switching cost increases every day. |
| Domain | Buy `manhaj.app` + `manhaj.ai` (whichever is available; .app preferred for PWA framing) | $10-20/yr. Get it before Tier 0. |
| Git hosting | **GitHub Private** — pushes the IP repo somewhere durable (OneDrive is not a code host) | Free private repos. |
| Tier 0 host | **Cloudflare Pages** over Vercel — Cloudflare Access free tier gives email-based gating with zero code | Critical for "don't publish this publicly yet" |
| Tier 1+ host | **Vercel** for Next.js — best DX for App Router + Server Actions. Cloudflare in front later. | Standard call; no contrarian play |
| Auth provider for Tier 1 | **Supabase Auth** (magic-link only first) | Already in the stack. Adding Clerk = extra surface for nothing. |
| WhatsApp BSP | **360dialog**, not Twilio | Regional default in MENA, friendlier per-message pricing at pilot volume, template approval reportedly faster. Vendor-lock acknowledged — see §5. |
| LLM cost cap policy | **$150/tenant/month hard cap on background, fail-open on interactive** for the pilot. Revisit at 3 tenants. | Architecture brief is right but vague; pick a number and write it into `ai_usage_ledger` enforcement. |
| Recording retention default | **90 days for ISO**, configurable per tenant later | Matches architecture brief default. Defer the per-tenant config UI to Tier 2 stretch. |
| Multi-tenancy schema | **Single schema + RLS** for ISO, not schema-per-tenant. Architecture brief's hybrid (schema-per-tenant for hot data) is for ≥10 schools. | Premature optimisation otherwise. |
| Pilot scope | **Module 1 Admin only**, as the build brief commits. Resist scope creep to Classroom in pilot — the data isn't there yet anyway. | The decisions log already commits to this; don't reopen. |

### 4b. Procurement

| Service | Cost | Tier needed | Signup |
|---|---|---|---|
| Domain | ~$10-20/yr | T0+ | Cloudflare Registrar or Porkbun |
| GitHub | $0 | T0+ | github.com |
| Cloudflare account | $0 (free Pages + Access) | T0+ | cloudflare.com |
| Vercel | $0 hobby / $20 pro | T1 / T2 | vercel.com |
| Supabase | $0 free / $25 pro | T1 / T2 | supabase.com |
| Fly.io (CP-SAT service) | $5-20/mo | T1+ | fly.io |
| Anthropic API key | usage-based, ~$10-300/mo | T1+ | console.anthropic.com — **enable prompt caching** |
| Trigger.dev | $0 free / $20 pro | T1 / T2 | trigger.dev |
| Resend (email) | $0 → $20 at scale | T1+ | resend.com |
| 360dialog (WhatsApp) | ~$50/mo + msg | T2 | 360dialog.com — **5-10 day template approval, start now if T2 is < 3 weeks away** |
| Sentry | $0 dev / $26 team | T2 | sentry.io |
| LLC / sole-trader entity if not already in place | varies | T2 | required before signing WhatsApp BSP + Anthropic ToS as a business |

### 4c. School inputs (ISO must hand over)

Pulled from `docs/module_inputs.md` and the 12-item handover checklist:

**Tier 1 blockers (need for live pilot demo with real form submissions):**
1. Student roster CSV — G9-G12 minimum, ideally G1-G12 (name EN, name AR, DOB, gender, nationality, current section, parent_name + phone + email per parent)
2. Parent WhatsApp + AI-reports consent — even a one-line email from the principal is enough for the pilot
3. Confirmation of section-code suffix meanings: `AL` / `AS` / `A2` (still open from 2026-05-22)
4. Existing AY 26-27 period × day timetable if any exists (we only have the load matrix)

**Tier 2 blockers (need for production pilot):**
5. Bell schedule + room inventory
6. Existing SSO provider (Google Workspace vs Microsoft 365 — drives the auth setup)
7. **Smart-board brand** — Promethean / SMART / ViewSonic / other. Gates Classroom V1 path. **Ask in week 1 even if Classroom is months out.**
8. **Alumni placement spreadsheet** (last 5 years). Schools rarely have this clean; ask immediately so they have time to compile. Gates the university-fit signal.
9. Existing report-card template (the one currently in use) so the Manhaj IP template can be diff'd against it for the soft-sell
10. Chart of accounts + last 24 months of monthly actuals + AY 26-27 budget (Finance module — V3 in the brief, but ask early)
11. Last 12 months of de-identified parent comms (optional; massive AI-tone-quality lift if they share)
12. SEN student list + IEP files (under strict access control; needed for Teacher Productivity module)

The handover xlsx (`handover/Manhaj_Data_Handover_Template.xlsx`) already collects 1, 5, 6, 7, 9, 10, 11, 12. **Ship that file to ISO this week** regardless of which tier you're at — it produces the inputs that block every later tier.

---

## 5. Architectural risks + opinionated calls

### Risk 1 — Static-HTML demo as a comfort blanket
**Risk:** the principal sees the static demo, says "yes, do it", and you keep iterating on `python3 -m http.server` because Tier 1 is "two weeks away". By month two you've built sophisticated client-only JS, a fake auth gate in localStorage, and a roster mocked in a JSON file. None of it survives the Next.js cutover.
**Call:** **Cut to Tier 1 the day the pilot is verbally confirmed.** Do not add a second feature to the static demo after Tier 0. The static demo's job is to win the meeting, not to evolve.
**Why:** every hour spent improving the static demo past Tier 0 is wasted twice — once now (because you can't show it to two people at once), and once at cutover (because you're rewriting it).

### Risk 2 — Supabase RLS retrofit
**Risk:** "We'll add RLS later, when we have real student data" is the most common pattern that produces a 6-week emergency before going live with a real school. Adding RLS to a populated database means writing policies *and* backfilling `school_id` on every row, *and* fixing every query that previously worked.
**Call:** **RLS from the day Supabase is provisioned (Tier 1).** Even with one tenant. The policy `using (school_id = auth.jwt() ->> 'school_id'::uuid)` on every table is the entire surface area. Architecture brief §7 commits to this and it must not be deferred.
**Why:** the cost to start with RLS is hours. The cost to add RLS later, once you have real data, is weeks plus the risk of leaking student records across tenants.

### Risk 3 — Multi-tenancy schema mismatch
**Risk:** the architecture brief commits to **hybrid tenancy** (schema-per-tenant for hot data, shared schema + RLS for warm). Current `001_init.sql` is shared-schema with `school_id` everywhere — no schema-per-tenant pattern in sight. If you implement Tier 2 as shared-schema-only, then later need to split out hot tables, that's a migration nightmare on live data.
**Call:** **Stay shared-schema + RLS for the pilot.** Defer schema-per-tenant until you have ≥5 schools and benchmarking shows the warm tables benefit from isolation. The architecture brief's hybrid recommendation was written without a current-scale check; for one to three tenants, hybrid is overkill. Revisit explicitly at school #5.
**Why:** the only reason hybrid wins is when one tenant's hot data threatens another's perf. With one tenant that doesn't happen. Don't pre-pay complexity.

### Risk 4 — WhatsApp BSP vendor lock
**Risk:** WhatsApp Business API access is BSP-mediated. Switching BSPs (360dialog ↔ Twilio ↔ Meta direct) is a 2-4 week project including re-approval of every templated message. If you pick the wrong one and need to switch at school #3, you eat weeks.
**Call:** **360dialog for the pilot.** Cheaper at low volume, MENA-default. **Abstract the send/receive interface** behind a `MessagingProvider` Typescript interface from day 1 so the BSP becomes a config swap, not a rewrite. The actual API differences are small (templates, webhooks); make sure the abstraction is in place so a 2-week rebuild is a 2-day reconfiguration.
**Why:** you will not get the BSP choice right under pilot-time pressure. Build the escape hatch instead.

### Risk 5 — Claude cost ceiling via "we'll watch the dashboard"
**Risk:** architecture brief says hard cap on background, fail-open on interactive. In practice "hard cap" gets enforced via an Anthropic-dashboard alert + a Slack notification + you-promising-to-check. By the time you notice, the school's monthly report job has burned $400 because Haiku was called per student per subject per axis instead of per student.
**Call:** **Enforce the cap in code, in front of every background AI call.** A `ai_usage_ledger` table; every Haiku call writes a row with `tenant_id`, `model`, `input_tokens`, `output_tokens`, `cost_usd`, `request_kind`. A pre-call check sums the month-to-date and refuses (or degrades to template-only output) past the cap. Interactive (Sonnet) calls log but don't block.
**Why:** the only AI-cost-runaway story that ends well is the one where the system refuses to spend past the cap. Email alerts don't catch nightly batch jobs.

### Risk 6 — Storage decision premature
**Risk:** architecture brief lists "Supabase Storage + S3" as the call. Supabase Storage is S3-compatible under the hood (it wraps S3 with RLS). Once you've put audio summaries in Supabase Storage, moving them to an external S3 means refactoring URLs, signed-URL generation, and possibly retention policies.
**Call:** **Supabase Storage only, with a `media` abstraction in code.** Don't introduce an external S3 bucket until volume justifies it. Behind a `BlobStore` interface so the cutover is config + script. The Supabase Storage RLS integration is genuinely better than rolling your own S3 + signed URLs for the first few tenants.
**Why:** Supabase Storage works fine to ~1TB; the cost-per-GB advantage of raw S3 only kicks in at much larger volumes. Premature.

### Bonus risk (out-of-band): the working directory is on OneDrive
**Risk:** OneDrive sync conflicts on a codebase produce silent file duplication (`school-ops/` vs `school-ops 2/` — exactly what's happening right now). When two machines edit, one becomes "Conflict" and gets renamed. For a code repo this is a corruption-class problem.
**Call:** **Move the project out of OneDrive and into a GitHub-tracked local clone before Tier 1 work starts.** Keep the handover xlsx + design assets in OneDrive; everything else in `~/dev/manhaj/` synced via Git only.
**Why:** the directory locking that prevented this review from writing to the real `school-ops/docs/` path is a foreshock. Don't run a production codebase on OneDrive.

---

## 6. One-page summary

| # | Work item | Tier | Owner | Blocker | Hours |
|---|---|---|---|---|---|
| 1 | Add `school_id` RLS migration (002_rls.sql) | T1 prep | you | none | 2 |
| 2 | Add missing spine tables migration (003_spine.sql) | T1 prep | you | none | 6 |
| 3 | Extract ETL persist interface for PG swap | T1 prep | you | none | 3 |
| 4 | Fix demo JSON fetch paths for static hosting | T0 | you | none | 1 |
| 5 | Build Tailwind config from CSS tokens | T1 prep | you | none | 1.5 |
| 6 | Externalise sample student report data to JSON | T0 | you | none | 2 |
| 7 | Add `/healthz.json` to demo | T0 | you | none | 0.5 |
| 8 | Write CP-SAT constraint DSL spec | T1 prep | you | none | 3 |
| 9 | Write prompt-caching scope spec | T1 prep | you | none | 2 |
| 10 | Seed Manhaj IP into DB (004_seed_manhaj_ip.sql) | T1 prep | you | none | 3 |
| 11 | LICENSE + NOTICE | T0 | you | none | 0.5 |
| 12 | Password-gate static demo | T0 | you | none | 1 |
| 13 | Move repo out of OneDrive to local + GitHub Private | T0 | you | none | 1 |
| 14 | Buy `manhaj.app` domain | T0 | you | spend ~$15 | 0.5 |
| 15 | Cloudflare Pages deploy + Access gate | T0 | you | accounts | 2 |
| 16 | Send handover xlsx to ISO | T1 input | you | none | 0.5 |
| 17 | Get roster, AL/AS/A2 confirmation, period grid from ISO | T1 input | ISO | school turnaround | school days |
| 18 | Get smart-board brand + alumni list from ISO | T2 input | ISO | school turnaround | school days |
| 19 | Stand up Supabase project + run all migrations | T1 | you | accounts | 3 |
| 20 | Next.js scaffold + port admin dashboard | T1 | you | T1 prep done | 16 |
| 21 | Next.js port of course-selection form + DB writes | T1 | you | roster | 10 |
| 22 | Claude Sonnet chat + constraint DSL route | T1 | you | API key, spec | 12 |
| 23 | CP-SAT FastAPI service on Fly.io | T1 | you | DSL spec | 10 |
| 24 | Magic-link auth + ISO seed | T1 | you | Supabase up | 4 |
| 25 | Cloudflare/Vercel custom domain wiring | T1 | you | domain | 2 |
| 26 | 360dialog account + template approvals | T2 | you | entity, school OK | 5-10 days wait |
| 27 | WhatsApp send/receive abstraction | T2 | you | 360dialog | 8 |
| 28 | Substitute engine end-to-end | T2 | you | bell sched, roster | 16 |
| 29 | Roster CSV ingest pipeline | T2 | you | roster CSV format | 6 |
| 30 | Trigger.dev nightly attendance reconcile | T2 | you | attendance source | 6 |
| 31 | Monthly parent report job (Haiku + cap enforcement) | T2 | you | rubric scores in DB | 20 |
| 32 | `ai_usage_ledger` enforcement layer | T2 | you | none (do early) | 6 |
| 33 | RLS audit log + principal view | T2 | you | none | 6 |
| 34 | Google Workspace SSO + production cutover | T2 | you | ISO IT | 8 |
| 35 | Sentry + AI usage dashboard | T2 | you | accounts | 4 |

**Tier 0 critical path:** items 4, 6, 7, 11, 12, 13, 14, 15 → shareable URL by end of day.
**Tier 1 critical path:** items 1, 2, 5, 8, 10, 19-25 → live demo with persistence in ~10 working days.
**Tier 2 critical path:** items 17, 26 (longest external wait), then 27-31 → ~5-6 weeks once Tier 1 is shipped.

---

*End of review. Next action: do items 11, 13, 14 today; items 1-10 + 12 + 15 this week; ship Tier 0 by Friday.*
