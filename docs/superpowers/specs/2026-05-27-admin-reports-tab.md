# Admin · Reports tab — Spec (Phase 2.7)

**Goal.** Replace the `/admin/reports` placeholder with the maximalist 6-block content layer for the **parent-communication pipeline** — drafts → review → ready → sent → opened → replied → bounces. This is "Manhaj's reason to exist" from the principal's POV: it's how Manhaj proves it actually got the reports out the door.

**Audience.** Principal / academic head. Lives on `/admin/reports`.

**Data.** Static `lib/mock-reports.ts` fixture (no schema). Shape mirrors a future RPC return.

---

## 1. Blocks (top-to-bottom)

1. **KpiRow** — 5 pills:
   - Reports drafted (`246`)
   - In teacher review (`58`)
   - Ready to send (`32`)
   - Sent this term (`421`, with `93% open rate · 38% reply rate`)
   - Bounces / hard fails (`4`, tone danger)

2. **SendPipelineFunnel** — horizontal funnel with 7 stages: Draft → Review → Ready → Sent → Opened → Replied → Bounced. Each stage shows count + width-proportional bar. Click-target ghost (no real drill-in this phase).

3. **SectionProgress** — table-style list of 6 sections (10A/10B/9A/9B/7B/KG2):
   - Section label · teacher · `progress` micro-bar (`X / Y reports drafted, Z reviewed`) · next-due chip · "Ping teacher" ghost button.
   - Sections with >2 days to deadline get a yellow chip; <1 day = red.

4. **TemplatesShelf** — grid of 6 of Manhaj's 17 built-in templates (a "see all" link goes nowhere this phase):
   - Card per template: icon (emoji), name (e.g. *"Monthly progress · Y10"*), category badge, last-used date, usage count.

5. **EngagementHeatmap** — section × month-of-AY (Sep-May, 9 columns), cell shade = open rate %. Caption: *"Open rate by section · last 9 months."* Hot rows = high engagement.

6. **ComplianceLog** — newest-first list of 5 audit entries:
   - Row: timestamp · actor · action (e.g. *"Sent 28 Y10 monthly reports"*) · scope (PDPL category) · result chip.
   - Footer "Export per term (CSV)" ghost button (no-op this phase).

---

## 2. Fixture shape (`lib/mock-reports.ts`)

```ts
type PipelineStage = "draft" | "review" | "ready" | "sent" | "opened" | "replied" | "bounced";

type PipelineStat = { stage: PipelineStage; count: number; label: string };

type SectionReport = {
  section_id:    string;
  section_label: string;
  homeroom:      string;
  drafted:       number;
  reviewed:      number;
  target:        number;
  next_due:      string;        // ISO date
  days_to_due:   number;
};

type Template = {
  id:         string;
  name:       string;
  category:   "Monthly" | "Term" | "Behavioural" | "Attendance" | "Fee" | "Achievement";
  icon:       string;
  last_used:  string;
  usage_count: number;
};

type HeatmapRow = { section_id: string; section_label: string; by_month: number[] };  // length 9

type AuditEntry = {
  id:         string;
  timestamp:  string;
  actor:      string;
  action:     string;
  scope:      string;
  result:     "success" | "warning" | "fail";
};
```

Helpers:
- `reportKpis(stats, sections, audit)` → KpiRow numbers.
- `sectionsAtRisk(sections)` → sections with `days_to_due < 1`.

Fixture: 7 pipeline stages, 6 sections, 6 templates (of 17 nominal), 6 heatmap rows (section × 9 months), 5 audit entries.

---

## 3. Acceptance criteria

- All 6 blocks render on `/admin/reports`.
- All blocks are server components (no client state needed — there are no toggles or pickers in this tab).
- 8+ tests across fixture + helpers.
- tsc clean, lint 0 errors, build green.

---

## 4. Deferred

- Real RPC + writes for drafting/sending/reviewing.
- Per-template detail drawer + body editor.
- Live Resend + bounce webhook (Phase 2.4b-2 — already scoped, deferred).
- Heatmap drill-in (click cell → see which reports went unopened).
