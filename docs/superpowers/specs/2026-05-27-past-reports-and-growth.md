# Past Reports (parent + student) + My Growth — Spec (Phase 2.9)

**Goal.** Replace the last three placeholders: `/parent/past-reports`, `/student/past-reports`, `/student/growth`.

**Audience.**
- Parent past-reports = Mr Al-Habsi (household, 3 children).
- Student past-reports + My Growth = Layla Al-Habsi (10A).

**Data.** Two static fixtures: `lib/mock-reports-archive.ts` (shared by both past-reports tabs) + `lib/mock-growth.ts` (Layla's 6-axis rubric history).

---

## 1. `/parent/past-reports` — 3 blocks

1. **KpiRow** — 3 pills (total reports archived, monthly count, term count).
2. **ReportTimeline** — newest-first list, grouped by child. Each row: report icon · child name · period (e.g. *"April 2026"*) · type (Monthly / Term) · headline (1 line) · `Open` button.
3. **ReportPreviewCard** — a single highlighted "most recent" report card showing the AI-composed headline + 3-axis summary (so even without clicking, the parent sees the latest takeaway).

Uses ChildSwitcher: "All children" shows all rows; single child filters to that child's reports only.

---

## 2. `/student/past-reports` — 2 blocks

1. **ReportTimeline** — Layla-only, newest-first.
2. **ReportPreviewCard** — Layla's latest report headline + 3-axis summary + "compare with previous month" diff line.

---

## 3. `/student/growth` — 4 blocks

1. **RubricRadar** — 6-axis SVG radar comparing **this month vs last month** for Layla. 6 axes:
   - Academic
   - Effort
   - Behaviour
   - Collaboration
   - Communication
   - Self-direction
   Each axis 0-5 scale.

2. **AxisSparklines** — 2-column grid, one sparkline per axis (last 6 months). Each card: axis name, current score, delta vs 6mo ago, tiny SVG sparkline.

3. **StrengthsAndGrowth** — two side-by-side cards:
   - **Strengths** (top-2 axes by current score with quote).
   - **Growth areas** (bottom-2 axes with advisor note).

4. **GoalsList** — 4 goals Layla + her advisor set, each with progress bar + status chip (on track / behind / done) + last-update date.

---

## 4. Fixture shapes

`lib/mock-reports-archive.ts`:
```ts
export type ReportType = "monthly" | "term";

export type ArchivedReport = {
  id:          string;
  child_id:    string;          // "layla-al-habsi" | "omar-al-habsi" | "yasmin-al-habsi"
  child_name:  string;
  period:      string;          // "April 2026" | "Term 1 · 2025-26"
  type:        ReportType;
  date:        string;          // ISO date issued
  headline:    string;          // AI-composed 1-liner
  axes:        Array<{ name: string; score: number; trend: "up" | "flat" | "down" }>;
  prev_summary?: string;        // "vs March 2026" line for compare-mode
};
```

Helpers:
- `archiveKpis(reports)` → KPI row.
- `archiveForChild(reports, childId)` → filtered list (ChildSwitcher honors "all").
- `latestReport(reports, childId?)` → most-recent ArchivedReport for the preview card.

Fixture: 9 monthly + 2 term = 11 per child × 3 = ~30 archived reports for parent view. Layla = 11 reports.

`lib/mock-growth.ts`:
```ts
export type AxisKey =
  | "academic" | "effort" | "behaviour"
  | "collaboration" | "communication" | "self_direction";

export type AxisLabel = { key: AxisKey; label: string; description: string };

export type MonthScore = { month: string; score: number };

export type AxisHistory = {
  axis:    AxisKey;
  label:   string;
  history: MonthScore[];        // last 6 months, oldest → newest
  this_mo: number;
  last_mo: number;
  six_mo:  number;
};

export type Goal = {
  id:         string;
  axis:       AxisKey;
  title:      string;
  detail:     string;
  progress:   number;           // 0-100
  status:     "on-track" | "behind" | "done";
  last_update: string;
};
```

Helpers:
- `axisStrengths(histories)` → top-2 axes by this_mo.
- `axisGrowthAreas(histories)` → bottom-2 axes.

Fixture: 6 axes × 6 months of history for Layla. 4 goals.

---

## 5. Acceptance criteria

- All 3 + 2 + 4 = 9 blocks render on the three tabs.
- ChildSwitcher filters `/parent/past-reports` correctly.
- 10+ new tests across both fixtures + helpers.
- tsc clean, lint 0 errors, build green.

---

## 6. Deferred

- Click-into a report (full report viewer drawer).
- PDF export of any single report.
- Advisor comments on goals (would need a write surface).
- Real radar interactivity (hover axis → detail tooltip).
