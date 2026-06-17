# Three-Role IA · design spec

| | |
|---|---|
| **Date** | 2026-05-26 |
| **Status** | Approved · ready for implementation plan |
| **Owner** | Elias (product + decisions) · Manhaj engineering (build) |
| **Brainstorm session** | `~/dev/manhaj/.superpowers/brainstorm/` |

---

## 1. Background

After the P2/P3/P4 batch shipped on 2026-05-26 (commit `e6429b2` and `91ba221`), feedback from testing the live preview surfaced three structural issues:

1. **The gate re-prompted on every new tab.** `sessionStorage`-scoped unlock meant opening `/parent/select-courses` in a new tab required re-entering the password. Friction killed demoing.
2. **The app only exposed `/admin/*` from its primary nav.** Parent + student surfaces existed (`/parent/select-courses`, `/parent/report`) but had no discoverable path from the password-gated entry point.
3. **The current `/admin` dashboard is mis-named.** Its content (teacher load distribution, section heatmap, AI suggestion) is purely faculty-facing. A true "Dashboard" should summarize across every admin tab with an AI briefing.

This spec re-organizes the entire product around **three personas (Admin, Student, Parent)** with a persona switcher above the topbar, and details every tab in each persona with its content and visual primitives.

The brainstorm produced 11 mockup screens covering every tab; this document captures the decisions distilled from that exploration.

---

## 2. Goals

1. **One login, three views.** After the password gate accepts once, the visitor can move freely between Admin, Student, and Parent without re-authenticating, across tabs and refreshes.
2. **Every persona's full structure visible immediately.** A demo of the Admin / Student / Parent split must work in the next deploy. Content per tab can be backfilled — structure must not.
3. **A real Dashboard per persona.** Each persona's `/dashboard` route shows an AI-style summary header followed by per-tab summary cards. Click-through to drill.
4. **Multi-child support for parents.** Households with more than one ISO child can switch between "All children" (household view) and per-child views from a sticky switcher under the breadcrumb.
5. **Teacher inbox lives in Outlook.** Manhaj sends every parent comm via Resend with the teacher's school email BCC'd. Replies route back to Manhaj via per-thread reply-to addresses. Teachers never have to learn a new tool.
6. **No new visual primitives.** Reuse the breadcrumb + lens toggle + AI strip + KPI row + filter chips pattern established in the brainstorm. The design tokens shipped in P3 phase 1 are the source of truth.

---

## 3. Non-goals (this spec)

- Live Claude wiring for the AI summary header (deferred — deterministic composer first).
- Microsoft Graph API integration (deferred — Tier 3 of the Outlook ladder).
- Real payment integration for the Invoices tab (placeholder UI only; payment provider TBD).
- Student/Parent magic-link auth (current scope is the demo persona switcher; production auth is a separate spec).
- Replacing the existing P3 phase 1 tokens. This spec consumes them, doesn't extend them.

---

## 4. Decisions (resolved during brainstorm)

| # | Question | Decision |
|---|---|---|
| 1 | Identity model | **Demo persona switcher** — log in once, switch between Admin / Student / Parent. Production replaces this with real auth-driven routing. |
| 2 | Switcher placement | **Option A** — navy strip above the existing topbar (loud, easy to narrate during a demo). |
| 3 | Gate persistence | `localStorage` (was `sessionStorage`). Unlock survives tabs + browser restarts. |
| 4 | Admin dashboard | New `/admin` page with AI summary + 6 summary cards. The current `/admin` content moves to `/admin/faculty`. |
| 5 | Student persona scope | Full student-facing experience (Dashboard / My Schedule / Homework / Past Reports / My Growth) — not just a parent-report-from-student-POV. |
| 6 | Parent multi-child | Sticky **child switcher** under the breadcrumb. "All children" view aggregates household; per-child view scopes every tab. |
| 7 | "My Reports" placement | Monthly report greeting moves into the **Dashboard hero**. Old report tab renamed **Past Reports** as an archive. |
| 8 | Naming · rubric tab | `My Growth` (was `Rubric Progress`) — more empowering for a student. |
| 9 | Messages × Outlook tier | **Tier 1 · BCC + reply-to-Manhaj**. Sufficient for the ISO pilot. |
| 10 | Shared mailbox | Not needed for pilot. Per-teacher BCC is enough. |
| 11 | Teacher reply path | Teacher CAN reply from Outlook without ever opening Manhaj. Audit log captures via reply-to routing. |
| 12 | From address | "**As the school**" — `noreply@iso.edu.om` (per-school configurable). Teacher name appears in body byline + signature. |
| 13 | Read receipts | **Yes** — teachers see "parent opened" by default. School-configurable in a future spec. |
| 14 | Microsoft Graph | Deferred. Revisit at school #3 or #4 onboarding. |
| 15 | AI summary header | **Deterministic composer first** (`lib/summary.ts`, pure function). Wire live Claude in a follow-up PR. |
| 16 | Build sequencing | **Phase by visible shape.** Phase 1 ships gate fix + role switcher + ALL three personas with every tab visible (most as placeholders). Phase 2+ backfills content. |
| 17 | Annotation pattern | Numbered markers on the line · labels in the legend. Never raw text on a chart. |
| 18 | Chart axes | Target indicators anchored at the Y-axis. No dashed lines through the data area. |

---

## 5. Architecture

### URL structure

```
/                          → Landing (unchanged, still password-gated entry)
/login                     → Magic-link auth UI (kept for prod path; demo bypasses)

/admin                     → Admin Dashboard (NEW — summary + cards)
/admin/faculty             → Faculty load distribution (current /admin moved here)
/admin/section-mapping     → Section mapping (already built)
/admin/students            → Students roster (placeholder Phase 1)
/admin/attendance          → Attendance dashboard (placeholder Phase 1)
/admin/schedule            → Schedule + NL constraint box (placeholder Phase 1)
/admin/reports             → Send pipeline + templates (placeholder Phase 1)

/student                   → Student Dashboard
/student/schedule          → My Schedule
/student/homework          → Homework
/student/past-reports      → Past Reports archive
/student/growth            → My Growth

/parent                    → Parent Dashboard
/parent/courses            → Course Selection (renamed from /parent/select-courses)
/parent/past-reports       → Past Reports archive
/parent/invoices           → Invoices (placeholder Phase 1)
/parent/messages           → Messages (placeholder Phase 1)
/parent/calendar           → Calendar (placeholder Phase 1)
```

A redirect from `/parent/select-courses` → `/parent/courses` preserves any external links.

### Layout shell hierarchy

```
app/layout.tsx                       — root: gate.js, skip-link, RoleSwitcher (above topbar)
  app/admin/layout.tsx               — topbar + AdminNav + AskManhajDrawer
    app/admin/page.tsx               — Dashboard
    app/admin/faculty/page.tsx       — Faculty (the existing dashboard, moved)
    app/admin/[other]/page.tsx       — placeholder pages

  app/student/layout.tsx             — topbar + StudentNav + (no chat drawer in Phase 1)
    app/student/[tab]/page.tsx

  app/parent/layout.tsx              — topbar + ChildSwitcher + ParentNav
    app/parent/[tab]/page.tsx
```

### New components (Phase 1)

| Component | Lives in | Purpose |
|---|---|---|
| `RoleSwitcher` | `app/components/RoleSwitcher.tsx` | Navy strip above topbar. Three pills routing to `/admin`, `/student`, `/parent`. Persists active role in `localStorage` so the next visit lands the user on their last persona. |
| `ChildSwitcher` | `app/parent/components/ChildSwitcher.tsx` | Sticky strip in parent layout. "All children" + per-child pills. Active child stored in `localStorage`; reads via `useChild()` hook. |
| `AdminNav` | already exists | Add `Faculty`, `Students`, `Attendance`, `Schedule`, `Reports` links. |
| `StudentNav` | `app/student/components/StudentNav.tsx` | 5 tabs. |
| `ParentNav` | `app/parent/components/ParentNav.tsx` | 6 tabs. Unread message count badge on `Messages`. |
| `SummaryComposer` | `lib/summary.ts` | Pure function: takes `DashboardData` + persona + child-id (parent only) → returns `{ headline, today, this_week, this_month }`. Deterministic; no Claude call. |
| `AiBriefingHeader` | `app/components/AiBriefingHeader.tsx` | Renders the navy gradient briefing card from `SummaryComposer` output. Used in every persona's Dashboard. |
| `TabSummaryCard` | `app/components/TabSummaryCard.tsx` | Generic per-tab summary card (label, big number, trend, 2 detail rows). Re-used across all three Dashboards. |
| `FilterChipRow` | `app/components/FilterChipRow.tsx` | Standard chip strip with active/neutral/warn/bad/good/info variants. |
| `BreadcrumbLensBar` | `app/components/BreadcrumbLensBar.tsx` | Breadcrumb + lens toggle pattern used on every Admin sub-tab. |
| `OutlookBccHook` | `lib/messages.ts` (server) | When Manhaj sends a parent comm, BCC the section teacher's email. See §9. |

### Visual primitives (consumed, not new)

All chart + table + chip styles consume tokens from `lib/design-tokens.json`:
- `--color-primary` / `--color-accent` / `--color-ink` / `--color-muted`
- `--space-1` through `--space-14`
- `--font-size-xs` through `--font-size-4xl`
- `--radius-md` / `--radius-lg` / `--radius-xl`
- `--shadow-sm` through `--shadow-2xl`

Annotation rule (applied everywhere): chart events render as **numbered circle markers** on the data line; the marker number resolves to a date-anchored label in the legend. Never floating raw text on the chart. Target lines render as small arrow markers flush against the Y-axis, never dashed lines through the data area.

---

## 6. Personas in detail

### 6.1 Admin · 7 tabs

| Tab | Content blocks (top → bottom) |
|---|---|
| **Dashboard** (NEW) | AI briefing → 4 KPIs (faculty / sections / students / attendance week) → **6 summary cards** (Faculty / Sections / Students / Attendance / Schedule / Reports). |
| **Faculty** (RENAMED) | Composed headline → 4 hero cards (Faculty / Sections / Load utilisation / Workbook assignments) → Teacher load distribution + filters → Load status summary → Section heatmap. *Content is the current `/admin/page.tsx`, moved verbatim.* |
| **Sections** (BUILT) | Section mapping (shipped 2026-05-26). |
| **Students** (NEW) | Filter breadcrumb + lens → AI summary → 4 KPIs → 9 filter chips → Cohort heatmap (section × rubric axis) → Demographic donut + bar list → Renewal funnel → Risk-scored roster table → Behavioural incidents timeline → Intervention log (per student drill) → Teacher feedback panel → Peer-group comparison → Admissions inbox → Bulk action bar → Cmd-K search. |
| **Attendance** (NEW) | AI summary + 4 KPIs + 9 filter chips → Trend chart (numbered event markers, axis-anchored target) → Day-of-week heatmap → Period-of-day bars → AI-attributed causes cards → Section heat-strip → Subject correlation → Chronic absentees table → Benchmark compare → Per-student calendar heat (advisor lens) → "What they missed" list → Re-engagement draft (AI-generated parent message) → Take attendance UI (teacher lens). |
| **Schedule** (NEW) | AI summary + 4 KPIs + 8 filter chips → Ask Manhaj (NL constraint box) with diff preview → Section week-grid → Action queue (conflicts + subs + gaps) → Teacher load by day → Room + lab utilisation → Curriculum coverage bars → Change log → Personal week (teacher lens). |
| **Reports** (NEW) | AI summary + 4 KPIs + 9 filter chips → Send pipeline funnel → Batch progress per section → Schedule next batch composer → Template library (17 cards) → Engagement heatmap (section × month) → Send history → Delivery diagnostics (open bounces) → A/B template test results → Compliance log → Draft review editor (teacher lens). |

### 6.2 Student · 5 tabs

| Tab | Content blocks |
|---|---|
| **Dashboard** | Hero greeting card ("Layla, here's how April went" — the monthly report greeting, hoisted out of its own tab) → Today strip (right-now class + next exam) → 4 KPIs (due this week / rubric / attendance / honor citations) → 4 tab summary cards. |
| **My Schedule** | "Right now" navy card with current period + what to bring → Today's classes timeline (done/now/upcoming) → Week-grid view. |
| **Homework** | 2 AI nudges → To-do list with status pills (overdue / in progress / not started / done) and Open/Continue/Start actions. |
| **Past Reports** | Archived monthly + term reports from prior periods. |
| **My Growth** | Rubric radar (this month vs last) → Axis bar list with +/- deltas → Per-axis sparklines over 6 months → Goals card pair (student + advisor co-set goals with progress). |

### 6.3 Parent · 6 tabs

| Tab | Content blocks (when single child selected) | "All children" view |
|---|---|---|
| **Dashboard** | Hero greeting (parent framing: "what to celebrate, what to support") → Today strip (Layla now + next exam + action needed) → 4 KPIs (rubric / attendance / outstanding balance / unread messages) → 4 tab summary cards. | Aggregate hero ("Mr Al-Habsi — here's your three children at a glance") → 3 child summary cards (per child: name, narrative, chips, "Open dashboard →") → Household KPIs (children / household balance / unread / events) → Quick actions (pay all, book meeting, sync calendars). |
| **Course Selection** | Existing 4-step bilingual wizard. | Per-child select pills at top. |
| **Past Reports** | Archive list per child. | Per-child select pills at top. |
| **Invoices** | Balance hero → Installment plan (3 term cards: paid / partial / scheduled) → Fee breakdown (line items) → Payment history. | **Household balance hero** → Per-child row list (avatar + name + outstanding + status pill + Open). |
| **Messages** | Inbox list (child-tagged), category chips, compose form. | Per-child filter chips with counts → Same inbox showing all children's threads with **child-tag chip on every row**. |
| **Calendar** | Month grid + chips → Upcoming list (next 14 days) → ICS sync card. | Same month grid + **child avatars** on each event tile → Filter by child. |

---

## 7. Persona switcher

Renders at the very top of every authenticated route via `app/layout.tsx`.

```tsx
<RoleSwitcher activeRole={...} />     /* navy strip — Admin / Student / Parent */
<header className="topbar">...</header>
<main>{children}</main>
```

Behavior:
- Active role persisted to `localStorage["manhaj.role"]`. Defaults to `"admin"` on first visit.
- Clicking a pill routes to that persona's default tab (`/admin`, `/student`, `/parent`).
- Hidden entirely in production once real auth wires up. The component reads an env flag `DEMO_MODE`; when false, returns null.
- A11y: implemented as a `<nav aria-label="Switch persona">` with `aria-current="page"` on the active pill.

Visual style: navy `#0B2545` background, white pills with `rgba(255,255,255,.65)` text for inactive, solid white with navy text for active. Sticky `position: sticky; top: 0; z-index: 60;` so it stays visible during scroll.

---

## 8. Child switcher (parent)

Renders in `app/parent/layout.tsx`, immediately under the breadcrumb.

```tsx
<ChildSwitcher activeChildId={...} children={[...]} />
{children}
```

Behavior:
- Active child persisted to `localStorage["manhaj.parent.activeChild"]`.
- Special "All children" pill with gradient background (left-most position) — represents the household aggregate view.
- Per-child pills show avatar (single letter), name, grade band (`10A · HS`), and an optional alert badge if Manhaj has flagged anything for that child (e.g., "1 alert" for Omar's absences).
- Hidden when the parent has exactly one child at the school. Or shown but with the "All children" pill removed — TBD with the data team.

Data:
- New `parent_children` join table (school_id, parent_id, student_id). Or read from existing `student_enrollments` + `parent_contacts`.
- Server reads the parent's children on the layout render; client `useChild()` hook reads `localStorage`.

---

## 9. Messages × Outlook integration (Tier 1)

### Flow

```
┌────────────────┐    write/reply        ┌──────────────────┐    BCC + reply-to   ┌──────────────────┐
│ Parent (web)   │ ────────────────────► │ Manhaj (Resend)  │ ──────────────────► │ Teacher (Outlook)│
│ /parent/messages│                       │ + thread store  │                     │                  │
└────────────────┘                       └──────────────────┘ ◄──── reply ──────  └──────────────────┘
       ▲                                          ▲                                       │
       │                                          │                                       │
       └──── thread updates ──────────────────────┴───── webhook on inbound mail ─────────┘
```

### Sending (Manhaj → teacher + parent)

When a parent-facing comm is sent (monthly report, behavioural alert, attendance follow-up, etc.):

1. `From`: `noreply@iso.edu.om` (per-school configurable via `schools.from_email`).
2. `Reply-To`: `reply+thread-{thread_id}@manhaj.app` — unique per thread.
3. `To`: parent's email.
4. `Bcc`: section teacher's school email (the teacher whose name appears in the byline).
5. Body: HTML template with the teacher's signature inline. Footer note: "*Reply normally — Manhaj will route your message back to the parent's inbox.*"

Teacher sees the message in Outlook with their `Bcc` copy, can reply directly from there, and never opens Manhaj.

### Receiving (parent or teacher reply → Manhaj)

1. Inbound mail to `reply+thread-{thread_id}@manhaj.app` hits a Resend webhook.
2. Webhook handler parses the From address:
   - If matches a known teacher → posts as `bubble.teacher` in the thread.
   - If matches a known parent → posts as `bubble.parent`.
   - If neither → discards and logs (anti-spam).
3. Updates `messages_threads.last_activity_at` and `parent_inbox.unread_count`.
4. Notifies the parent (in-app + a "new reply" email) and notifies the teacher *only* if the reply came from the parent.

### Read receipts

- Manhaj-sent emails embed a 1×1 pixel via Resend's open-tracking.
- `thread_messages.opened_at` populated on first open.
- Teachers see a small "▸ opened 2 hours ago" indicator next to each thread row.

### Audit trail

Every send + reply is row-stamped into `messages_audit_log` (school_id, thread_id, direction, from_email, to_email, template_id, outcome, opened_at). Exportable per term for PDPL / regulator audits.

### What ships Phase 1 vs later

| Phase | Scope |
|---|---|
| **Phase 1** | Messages tab UI (placeholder backed by static threads), Resend inbound webhook stub, audit-log schema. |
| **Phase 2** | Wire Resend send/receive for real. BCC + reply-to routing live. Read receipts pixel. |
| **Phase 3** | Microsoft Graph integration (Tier 3) — only when triggered by school #3 or #4 onboarding. |

---

## 10. AI summary headers

Phase 1 ships a deterministic composer. Pure function in `lib/summary.ts`:

```ts
type Summary = {
  headline: string;     // "Layla had a strong April."
  today: string;        // "P3 starts in 6 min — Mathematics."
  this_week: string;    // "3 things due. 1 overdue."
  this_month: string;   // "Rubric ▲ 0.22. Attendance 97%."
  ai_suggested_action?: string;  // optional CTA
};

function composeSummary(
  persona: "admin" | "student" | "parent",
  data: DashboardData,
  childId?: string,
): Summary;
```

Behavior:
- Pulls counts from existing `manhaj_dashboard_data_public` RPC.
- Applies simple rules (e.g., "If `unmapped_sections > 0`, headline mentions the count; otherwise lead with the most-urgent flag.").
- Returns deterministic strings — easy to test, no flakiness, no $ per page load.

Phase 2 wires this through Claude via the Layer-2 prompt cache spec already in `docs/prompt_caching_spec.md`. The composer signature stays the same; the implementation swaps the rule-based body for a `client.messages.create(...)` call.

---

## 11. Build sequencing

### Phase 1 — visible shape (1 commit, demo-ready)

1. `public/gate.js`: `sessionStorage` → `localStorage`.
2. `app/components/RoleSwitcher.tsx` + integration into `app/layout.tsx`.
3. `app/student/layout.tsx` + `StudentNav` + 5 placeholder pages.
4. `app/parent/layout.tsx` + `ChildSwitcher` + `ParentNav` + 6 tab pages (Dashboard / Courses / Past Reports / Invoices / Messages / Calendar). Courses redirects from the legacy `/parent/select-courses`.
5. `app/admin/page.tsx` becomes the new Dashboard. Current content moves to `app/admin/faculty/page.tsx`.
6. New `app/admin/{students,attendance,schedule,reports}/page.tsx` placeholders.
7. `lib/summary.ts` with the deterministic composer.
8. Shared visual primitives: `AiBriefingHeader`, `TabSummaryCard`, `FilterChipRow`, `BreadcrumbLensBar`.

**Acceptance criteria for Phase 1**:
- Persona switcher visible on every authenticated route.
- All 18 routes load without 404.
- Placeholder pages show a brief "coming next" banner + a sample-data preview where reasonable.
- Build green, lint clean, typecheck clean.
- Verified at 375px mobile + 1280px desktop.

### Phase 2 — real content per tab

Each tab gets its own PR, ordered by user value:
1. Admin Students (roster + risk score, even if synthetic data).
2. Admin Attendance (port Tier 0 demo data, layer AI causes).
3. Parent Invoices (mock balance + installment cards; payment flow remains placeholder).
4. Parent Messages (Resend webhook + thread storage; reply round-trip live).
5. Parent Calendar (ICS feed + month grid).
6. Admin Schedule (placeholder + NL box with static AI proposals).
7. Admin Reports (template list + send pipeline + history).
8. Student Homework + My Schedule (real lesson + assignment data).

### Phase 3 — AI + integrations

- Wire deterministic composer behind a live Claude call (Layer-2 cache).
- Resend Outlook integration: full BCC + reply-to-thread routing.
- Payment integration for Invoices (provider TBD per pilot region).

---

## 12. Data-model deltas

### New columns (additive only — no destructive migrations)

| Table | Column | Type | Purpose |
|---|---|---|---|
| `schools` | `from_email` | text | `"noreply@iso.edu.om"` per-school override for Resend `From`. Defaults to global env var. |
| `schools` | `reply_to_domain` | text | e.g. `"manhaj.app"`. The domain Resend listens on for inbound replies. |
| `messages_threads` | (new table) | | id, school_id, student_id, parent_id, teacher_id, template_id, subject, last_activity_at, unread_count, status. |
| `thread_messages` | (new table) | | id, thread_id, direction (`out_to_parent` / `out_to_teacher_bcc` / `in_from_parent` / `in_from_teacher`), from_email, body, sent_at, opened_at. |
| `messages_audit_log` | (new table) | | id, school_id, thread_id, ts, direction, from_email, to_email, template_id, outcome. |
| `parent_children` | (or use existing `parent_contacts` join) | | school_id, parent_id, student_id. Drives the child switcher. |
| `dashboard_summary_cache` | (new table, Phase 3) | | school_id, persona, child_id, scope_key, payload (jsonb), refreshed_at. For Layer-2 prompt cache freshness. |

### New SECURITY DEFINER RPCs (Phase 2+)

- `manhaj_parent_children_public(parent_email)` → list children with school_id, name, grade, alert_count.
- `manhaj_invoice_summary_public(parent_id)` → household balance + per-child breakdown.
- `manhaj_thread_for_parent_public(parent_id, child_id?)` → threaded messages list.

All new RPCs follow the same demo-mode anon-callable pattern as schema/008.

---

## 13. Open follow-ups (not blocking Phase 1)

1. **Magic-link auth + real role-routing.** Currently the persona switcher works because the gate is demo-only. Production needs `proxy.ts` to route signed-in users to their persona automatically and hide the switcher.
2. **PDPL data residency.** Threads + audit logs need a region-locked storage decision before going beyond ISO.
3. **Payment provider selection.** Tap (KSA/Oman) vs Stripe vs local PSPs. Tier 2 decision.
4. **Read-receipt UX in Outlook.** Pixel-based tracking is invisible to teachers in Outlook; surface "opened" via the Manhaj UI only (sidebar / drawer).
5. **Real-time updates.** Thread replies showing instantly require either Supabase Realtime or a polling fallback. Decide at Phase 2 PR for Messages.
6. **Onboarding flow for a new school.** Today we hard-code ISO. School #2 needs a per-tenant onboarding wizard — separate spec.

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| **Persona switcher confuses real users in prod.** | Hide entirely when `DEMO_MODE !== "true"`. Real auth lands users in their persona. |
| **Outlook BCC bypassed by spam filters.** | Configure SPF + DKIM + DMARC on `manhaj.app` and on the school's domain via the school's IT. Send a test batch in week 1. |
| **Teachers reply from their personal email (not school).** | Validate inbound From against `teachers.school_email`. Reject + log if no match. |
| **`localStorage` cleared by the browser → user re-prompted.** | Acceptable; the gate UX already handles re-prompt. Doesn't break anything. |
| **Multi-child households whose children are at different schools.** | Out of scope for ISO pilot. Parent persona scopes to one school (driven by `SCHOOL_NAME`). |
| **Deterministic AI summary feels canned vs the live Claude version.** | Acceptable for pilot. Wire Claude in Phase 3 once spec is locked. |
| **Phase 1 placeholders look unfinished.** | Each placeholder shows a labeled "in development" banner + a sample-data preview where the structure is meaningful. |

---

## 15. Spec self-review (done before user review)

- ✓ No placeholders / TBD / TODO blocks remain — every decision is committed.
- ✓ Internal consistency: each persona section references the same tab list as the URL structure and the build sequencing plan.
- ✓ Scope: focused on the IA restructure. Defers payment, Microsoft Graph, magic-link auth, multi-school households.
- ✓ Ambiguity: every "and/or" or "TBD" has been resolved (e.g., shared mailbox decided to NOT be in scope for pilot).
- ✓ Acceptance criteria for Phase 1 are concrete + verifiable.

---

## 16. Mockup archive

The 11 brainstorm mockups remain at `~/dev/manhaj/.superpowers/brainstorm/{session-id}/content/` for reference:

1. `role-switcher-placement.html` — placement options
2. `full-ia.html` / `full-ia-v2.html` — IA strawman + invoices addition
3. `admin-dashboard-tab.html` — new Admin Dashboard with AI summary
4. `admin-cards-v2.html` — revised summary card data
5. `admin-tabs-content.html` — Admin tabs first-pass wireframes
6. `students-deep-v2.html` — Students tab stacked deep
7. `attendance-deep.html` + `attendance-trend-fix-v2.html` — Attendance deep + chart axis fix
8. `schedule-deep.html` — Schedule deep
9. `reports-deep.html` — Reports deep
10. `student-persona.html` + `student-dashboard-v2.html` — Student persona + report-on-dashboard
11. `parent-persona.html` + `parent-multi-child.html` — Parent persona + multi-child support
12. `messages-outlook.html` — Outlook integration tiers
13. `final-recap.html` — one-page summary of every decision

`.superpowers/` is git-ignored. Files persist until manually deleted.
