# Past Reports + My Growth · Implementation Plan (Phase 2.9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build 3+2+4 = 9 blocks across `/parent/past-reports`, `/student/past-reports`, `/student/growth`. Pure UI — no schema.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-past-reports-and-growth.md`](../specs/2026-05-27-past-reports-and-growth.md)

---

## File map

**Create:**
- `apps/web/lib/mock-reports-archive.ts` + `apps/web/lib/reports-archive.test.ts`
- `apps/web/lib/mock-growth.ts` + `apps/web/lib/growth.test.ts`
- `apps/web/app/parent/past-reports/components/{KpiRow,ReportTimeline,ReportPreviewCard}.tsx`
- `apps/web/app/parent/past-reports/PastReportsClient.tsx`
- `apps/web/app/student/past-reports/components/StudentReportArchive.tsx`
- `apps/web/app/student/growth/components/{RubricRadar,AxisSparklines,StrengthsAndGrowth,GoalsList}.tsx`

**Modify:**
- `apps/web/app/parent/past-reports/page.tsx`
- `apps/web/app/student/past-reports/page.tsx`
- `apps/web/app/student/growth/page.tsx`
- `apps/web/app/globals.css`

---

## Task 1 — Mock reports-archive fixture + tests

**Files:** `apps/web/lib/mock-reports-archive.ts` + `apps/web/lib/reports-archive.test.ts`

- [ ] **Step 1: `mock-reports-archive.ts`**

```ts
/**
 * Manhaj Phase 2.9 demo fixture — 11 archived reports per child (3 children).
 * 9 monthly (Sep 2025 → May 2026) + 2 term (Term 1, Term 2) = 11 × 3 = 33.
 * Mirrors a future RPC return.
 */

export type ReportType = "monthly" | "term";

export type ArchivedReport = {
  id:          string;
  child_id:    string;
  child_name:  string;
  period:      string;
  type:        ReportType;
  date:        string;
  headline:    string;
  axes:        Array<{ name: string; score: number; trend: "up" | "flat" | "down" }>;
  prev_summary?: string;
};

const CHILDREN: Array<{ id: string; name: string }> = [
  { id: "layla-al-habsi",  name: "Layla Al-Habsi"  },
  { id: "omar-al-habsi",   name: "Omar Al-Habsi"   },
  { id: "yasmin-al-habsi", name: "Yasmin Al-Habsi" },
];

const MONTHS: Array<{ period: string; date: string }> = [
  { period: "September 2025", date: "2025-09-28" },
  { period: "October 2025",   date: "2025-10-28" },
  { period: "November 2025",  date: "2025-11-28" },
  { period: "December 2025",  date: "2025-12-19" },
  { period: "January 2026",   date: "2026-01-28" },
  { period: "February 2026",  date: "2026-02-26" },
  { period: "March 2026",     date: "2026-03-28" },
  { period: "April 2026",     date: "2026-04-28" },
  { period: "May 2026",       date: "2026-05-28" },
];

const TERMS: Array<{ period: string; date: string }> = [
  { period: "Term 1 · 2025-26", date: "2025-12-15" },
  { period: "Term 2 · 2025-26", date: "2026-04-04" },
];

const LAYLA_HEADLINES: string[] = [
  "Strong start. English + History above target. Maths effort climbing.",
  "Solid month. MUN debate runner-up. Chemistry needs more lab time.",
  "Best month yet — top of class in English. Maths still mid-pack.",
  "Term 1 wrap: 5 of 7 subjects above target. Two areas to focus on.",
  "Energetic return. Effort + Communication scores at 6-month highs.",
  "Mid-term: Maths jumped from 3 → 4. Behaviour exemplary.",
  "Strong narrative essay (89/100). Lab work catching up to peers.",
  "Layla had a strong April. Highlights to celebrate, two areas to support.",
  "May mid-term week complete. Holding line on all 6 axes.",
];

const OMAR_HEADLINES: string[] = [
  "Bedding in well. PE + ICT strong. Reading volume still light.",
  "Football team selection — first 11. Maths quiz needs prep.",
  "Mixed month. Strong in clubs, slipping on homework hand-ins.",
  "Term 1 wrap: behaviour incident, recovery plan in place.",
  "January reset. 3 of 4 catch-up packs complete.",
  "Strong recovery month. Behaviour back to baseline.",
  "Maths confidence growing — first 80+ score this year.",
  "April steady. Watch homework consistency over May.",
  "End-of-year prep: 1 alert open · re-engagement plan agreed.",
];

const YASMIN_HEADLINES: string[] = [
  "Settled into KG2 routines. Phonics + Numeracy on track.",
  "Confident with peers. Music recital next week.",
  "Strong reading progress. 14 sight words secure.",
  "Term 1 wrap: meeting expectations across all areas.",
  "Loves the new art project. Building scissor confidence.",
  "Big personality on stage — spring concert second-verse soloist.",
  "Numeracy jump: counting to 30 secure.",
  "April: First independent reading. Family proud.",
  "Spring concert highlight. Strong year-end trajectory.",
];

function axesFor(childId: string, monthIndex: number): ArchivedReport["axes"] {
  // Layla's progression — improving over time.
  const base = childId === "layla-al-habsi"
    ? [3.6, 3.8, 4.0, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5]
    : childId === "omar-al-habsi"
    ? [3.2, 3.0, 2.9, 2.7, 3.0, 3.2, 3.4, 3.5, 3.6]
    : [4.2, 4.3, 4.3, 4.4, 4.5, 4.5, 4.6, 4.7, 4.7];
  const score = base[Math.min(monthIndex, base.length - 1)];
  const prev  = base[Math.max(0, monthIndex - 1)];
  const trend: "up" | "flat" | "down" =
    score > prev ? "up" : score < prev ? "down" : "flat";
  return [
    { name: "Academic",      score: round(score),       trend },
    { name: "Effort",        score: round(score + 0.2), trend },
    { name: "Behaviour",     score: round(score + 0.3), trend: "flat" },
    { name: "Collaboration", score: round(score + 0.1), trend },
    { name: "Communication", score: round(score),       trend },
    { name: "Self-direction",score: round(score - 0.1), trend },
  ];
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/* build reports                                                               */
/* -------------------------------------------------------------------------- */

function buildReports(): ArchivedReport[] {
  const out: ArchivedReport[] = [];
  for (const c of CHILDREN) {
    const headlines = c.id === "layla-al-habsi"  ? LAYLA_HEADLINES
                    : c.id === "omar-al-habsi"   ? OMAR_HEADLINES
                    : YASMIN_HEADLINES;
    for (let i = 0; i < MONTHS.length; i++) {
      const m = MONTHS[i];
      out.push({
        id:         `${c.id}-${m.period.toLowerCase().replace(/\s+/g, "-")}`,
        child_id:   c.id,
        child_name: c.name,
        period:     m.period,
        type:       "monthly",
        date:       m.date,
        headline:   headlines[i],
        axes:       axesFor(c.id, i),
      });
    }
    for (const t of TERMS) {
      out.push({
        id:         `${c.id}-${t.period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        child_id:   c.id,
        child_name: c.name,
        period:     t.period,
        type:       "term",
        date:       t.date,
        headline:   c.id === "layla-al-habsi"
                      ? "Term snapshot: 5 of 7 subjects above target. Two areas to focus on."
                      : c.id === "omar-al-habsi"
                      ? "Term snapshot: behaviour incident closed. Re-engagement plan in place."
                      : "Term snapshot: meeting expectations across all KG2 areas.",
        axes:       axesFor(c.id, c.id === "layla-al-habsi" ? 7 : 4),
      });
    }
  }
  return out;
}

export const MOCK_ARCHIVE: ArchivedReport[] = buildReports();

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function archiveForChild(reports: ArchivedReport[], childId: string): ArchivedReport[] {
  if (childId === "all") return reports;
  return reports.filter(r => r.child_id === childId);
}

export function archiveKpis(reports: ArchivedReport[]) {
  return {
    total:   reports.length,
    monthly: reports.filter(r => r.type === "monthly").length,
    term:    reports.filter(r => r.type === "term").length,
  };
}

export function latestReport(reports: ArchivedReport[], childId?: string): ArchivedReport | null {
  const scope = childId ? reports.filter(r => r.child_id === childId) : reports;
  if (scope.length === 0) return null;
  return [...scope].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function reportsByChild(reports: ArchivedReport[]): Map<string, ArchivedReport[]> {
  const m = new Map<string, ArchivedReport[]>();
  for (const r of reports) {
    if (!m.has(r.child_id)) m.set(r.child_id, []);
    m.get(r.child_id)!.push(r);
  }
  // Sort each child's list newest-first
  for (const list of m.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return m;
}
```

- [ ] **Step 2: `reports-archive.test.ts`** — 6 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_ARCHIVE, archiveForChild, archiveKpis, latestReport, reportsByChild,
} from "./mock-reports-archive";

describe("mock-reports-archive fixture", () => {
  it("has 11 reports per child × 3 children = 33 total", () => {
    expect(MOCK_ARCHIVE.length).toBe(33);
  });
  it("includes 27 monthly + 6 term reports", () => {
    expect(MOCK_ARCHIVE.filter(r => r.type === "monthly").length).toBe(27);
    expect(MOCK_ARCHIVE.filter(r => r.type === "term").length).toBe(6);
  });
});

describe("archiveForChild", () => {
  it("returns all when childId='all'", () => {
    expect(archiveForChild(MOCK_ARCHIVE, "all").length).toBe(MOCK_ARCHIVE.length);
  });
  it("filters to one child", () => {
    const layla = archiveForChild(MOCK_ARCHIVE, "layla-al-habsi");
    expect(layla.length).toBe(11);
    expect(layla.every(r => r.child_id === "layla-al-habsi")).toBe(true);
  });
});

describe("latestReport", () => {
  it("returns the most-recent report overall", () => {
    const r = latestReport(MOCK_ARCHIVE);
    expect(r).not.toBeNull();
    expect(r?.date).toBeDefined();
  });
});

describe("archiveKpis", () => {
  it("returns total/monthly/term counts", () => {
    const k = archiveKpis(MOCK_ARCHIVE);
    expect(k.total).toBe(33);
    expect(k.monthly + k.term).toBe(k.total);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-reports-archive.ts apps/web/lib/reports-archive.test.ts && git commit -m "lib/mock-reports-archive: 33-report archive fixture (3 children × 11 reports)"
```

Expect 122 tests (116 prior + 6 new).

---

## Task 2 — Mock growth fixture + tests

**Files:** `apps/web/lib/mock-growth.ts` + `apps/web/lib/growth.test.ts`

- [ ] **Step 1: `mock-growth.ts`**

```ts
/**
 * Manhaj Phase 2.9 demo fixture — Layla's 6-axis rubric history (last 6 months)
 * + 4 goals she set with her advisor.
 */

export type AxisKey =
  | "academic" | "effort" | "behaviour"
  | "collaboration" | "communication" | "self_direction";

export const AXIS_LABELS: Array<{ key: AxisKey; label: string; description: string }> = [
  { key: "academic",       label: "Academic",       description: "Subject mastery + assessment performance" },
  { key: "effort",         label: "Effort",         description: "Sustained focus + going the extra step" },
  { key: "behaviour",      label: "Behaviour",      description: "Punctuality, conduct, school values" },
  { key: "collaboration",  label: "Collaboration",  description: "Group work + peer leadership" },
  { key: "communication",  label: "Communication",  description: "Written + spoken expression" },
  { key: "self_direction", label: "Self-direction", description: "Goal-setting, initiative, reflection" },
];

export type MonthScore = { month: string; score: number };

export type AxisHistory = {
  axis:    AxisKey;
  label:   string;
  history: MonthScore[];
  this_mo: number;
  last_mo: number;
  six_mo:  number;
};

export type Goal = {
  id:          string;
  axis:        AxisKey;
  title:       string;
  detail:      string;
  progress:    number;
  status:      "on-track" | "behind" | "done";
  last_update: string;
};

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];

const HISTORIES: Array<{ axis: AxisKey; scores: number[] }> = [
  { axis: "academic",       scores: [3.8, 3.9, 4.0, 4.2, 4.3, 4.4] },
  { axis: "effort",         scores: [4.0, 4.1, 4.2, 4.3, 4.4, 4.5] },
  { axis: "behaviour",      scores: [4.3, 4.4, 4.4, 4.5, 4.5, 4.6] },
  { axis: "collaboration",  scores: [3.9, 4.0, 4.1, 4.2, 4.3, 4.4] },
  { axis: "communication",  scores: [4.0, 4.1, 4.3, 4.4, 4.5, 4.6] },
  { axis: "self_direction", scores: [3.5, 3.5, 3.6, 3.6, 3.7, 3.8] },
];

export const MOCK_GROWTH: AxisHistory[] = HISTORIES.map(h => {
  const label = AXIS_LABELS.find(a => a.key === h.axis)!.label;
  const history: MonthScore[] = MONTHS.map((m, i) => ({ month: m, score: h.scores[i] }));
  return {
    axis:    h.axis,
    label,
    history,
    this_mo: h.scores[h.scores.length - 1],
    last_mo: h.scores[h.scores.length - 2],
    six_mo:  h.scores[0],
  };
});

export const MOCK_GOALS: Goal[] = [
  { id: "g-1", axis: "academic",       title: "Lift Maths from 4.2 → 4.5 by end of term",
    detail: "Submit weekly problem-set on time + attend one extra office-hour per fortnight.",
    progress: 70, status: "on-track", last_update: "2026-05-22" },
  { id: "g-2", axis: "self_direction", title: "Plan study week in advance every Sunday",
    detail: "Use the Manhaj weekly planner. Share with advisor each Monday morning.",
    progress: 55, status: "behind",   last_update: "2026-05-20" },
  { id: "g-3", axis: "communication",  title: "Speak in MUN debate every week",
    detail: "At least one substantive intervention per session, recorded in MUN journal.",
    progress: 90, status: "on-track", last_update: "2026-05-21" },
  { id: "g-4", axis: "collaboration",  title: "Lead one group project per term",
    detail: "Volunteer for project-lead role · already led Term 2 Chemistry experiment design.",
    progress: 100, status: "done",     last_update: "2026-04-30" },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function axisStrengths(histories: AxisHistory[]): AxisHistory[] {
  return [...histories].sort((a, b) => b.this_mo - a.this_mo).slice(0, 2);
}

export function axisGrowthAreas(histories: AxisHistory[]): AxisHistory[] {
  return [...histories].sort((a, b) => a.this_mo - b.this_mo).slice(0, 2);
}
```

- [ ] **Step 2: `growth.test.ts`** — 5 tests

```ts
import { describe, expect, it } from "vitest";
import { MOCK_GROWTH, MOCK_GOALS, AXIS_LABELS, axisStrengths, axisGrowthAreas } from "./mock-growth";

describe("mock-growth fixture", () => {
  it("has 6 axes", () => {
    expect(MOCK_GROWTH.length).toBe(6);
    expect(AXIS_LABELS.length).toBe(6);
  });
  it("each axis has 6 months of history", () => {
    for (const a of MOCK_GROWTH) {
      expect(a.history.length).toBe(6);
    }
  });
  it("has 4 goals", () => {
    expect(MOCK_GOALS.length).toBe(4);
  });
});

describe("axisStrengths", () => {
  it("returns the 2 axes with the highest this_mo", () => {
    const top = axisStrengths(MOCK_GROWTH);
    expect(top.length).toBe(2);
    expect(top[0].this_mo).toBeGreaterThanOrEqual(top[1].this_mo);
  });
});

describe("axisGrowthAreas", () => {
  it("returns the 2 axes with the lowest this_mo", () => {
    const bot = axisGrowthAreas(MOCK_GROWTH);
    expect(bot.length).toBe(2);
    expect(bot[0].this_mo).toBeLessThanOrEqual(bot[1].this_mo);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-growth.ts apps/web/lib/growth.test.ts && git commit -m "lib/mock-growth: Layla 6-axis history + 4 goals fixture"
```

Expect 127 tests (122 prior + 5 new).

---

## Task 3 — Parent past-reports page

**Files:**
- Create: `apps/web/app/parent/past-reports/components/{KpiRow,ReportTimeline,ReportPreviewCard}.tsx`
- Create: `apps/web/app/parent/past-reports/PastReportsClient.tsx`
- Replace: `apps/web/app/parent/past-reports/page.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `KpiRow.tsx`** (server)

```tsx
import { archiveKpis, type ArchivedReport } from "@/lib/mock-reports-archive";

export default function KpiRow({ reports }: { reports: ArchivedReport[] }) {
  const k = archiveKpis(reports);
  const pills = [
    { label: "Total reports", value: `${k.total}`,   tone: "good" },
    { label: "Monthly",        value: `${k.monthly}`, tone: "good" },
    { label: "Term",           value: `${k.term}`,    tone: "good" },
  ];
  return (
    <section className="pr-kpi-row" aria-label="Archive KPIs">
      {pills.map(p => (
        <div key={p.label} className={`pr-kpi pr-kpi-${p.tone}`}>
          <div className="pr-kpi-value">{p.value}</div>
          <div className="pr-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: `ReportTimeline.tsx`** (server)

```tsx
import type { ArchivedReport } from "@/lib/mock-reports-archive";
import { reportsByChild } from "@/lib/mock-reports-archive";

const ICONS: Record<string, string> = { monthly: "📄", term: "📚" };

export default function ReportTimeline({ reports }: { reports: ArchivedReport[] }) {
  const groups = reportsByChild(reports);
  if (groups.size === 0) {
    return (
      <section className="pr-tl-card" aria-label="Reports timeline">
        <p className="pr-tl-empty">No reports for the current filter.</p>
      </section>
    );
  }
  return (
    <section className="pr-tl-card" aria-label="Reports timeline">
      {Array.from(groups.entries()).map(([childId, rows]) => (
        <div key={childId} className="pr-tl-group">
          <h3 className="pr-tl-group-head">{rows[0].child_name}</h3>
          <ul className="pr-tl-list" role="list">
            {rows.map(r => (
              <li key={r.id} className={`pr-tl-row pr-tl-row-${r.type}`}>
                <span className="pr-tl-ic" aria-hidden>{ICONS[r.type]}</span>
                <span className="pr-tl-body">
                  <span className="pr-tl-period">{r.period}</span>
                  <span className="pr-tl-headline">{r.headline}</span>
                </span>
                <span className={`pr-tl-type pr-tl-type-${r.type}`}>{r.type.toUpperCase()}</span>
                <button type="button" className="pr-tl-open">Open</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: `ReportPreviewCard.tsx`** (server)

```tsx
import type { ArchivedReport } from "@/lib/mock-reports-archive";

export default function ReportPreviewCard({ report }: { report: ArchivedReport | null }) {
  if (!report) {
    return (
      <section className="pr-pv-card pr-pv-empty" aria-label="Latest report preview">
        <p>No latest report.</p>
      </section>
    );
  }
  const top3 = [...report.axes].sort((a, b) => b.score - a.score).slice(0, 3);
  return (
    <section className="pr-pv-card" aria-label="Latest report preview">
      <header className="pr-pv-head">
        <span className="pr-pv-tag">Latest · {report.period}</span>
        <h3>{report.child_name}</h3>
      </header>
      <p className="pr-pv-headline">{report.headline}</p>
      <div className="pr-pv-axes">
        {top3.map(a => (
          <div key={a.name} className="pr-pv-axis">
            <span className="pr-pv-axis-name">{a.name}</span>
            <span className="pr-pv-axis-bar">
              <span className="pr-pv-axis-fill" style={{ width: `${(a.score / 5) * 100}%` }} />
            </span>
            <span className="pr-pv-axis-score">{a.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="pr-pv-actions">
        <button type="button" className="pr-pv-btn primary">Open full report</button>
        <button type="button" className="pr-pv-btn ghost">Download PDF</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `PastReportsClient.tsx`** (client)

```tsx
"use client";

import { useActiveChild, ALL_CHILDREN_ID } from "@/lib/child";
import { MOCK_ARCHIVE, archiveForChild, latestReport } from "@/lib/mock-reports-archive";
import { useMemo } from "react";

import KpiRow             from "./components/KpiRow";
import ReportTimeline     from "./components/ReportTimeline";
import ReportPreviewCard  from "./components/ReportPreviewCard";

export default function PastReportsClient() {
  const { activeId } = useActiveChild();
  const scoped  = useMemo(() => archiveForChild(MOCK_ARCHIVE, activeId), [activeId]);
  const latest  = useMemo(
    () => latestReport(MOCK_ARCHIVE, activeId === ALL_CHILDREN_ID ? undefined : activeId),
    [activeId],
  );

  return (
    <div className="container">
      <h1>Past Reports</h1>
      <p className="sub">
        {activeId === ALL_CHILDREN_ID
          ? "Archive across all children · AY 2025–26"
          : `Archive for ${latest?.child_name ?? "child"} · AY 2025–26`}
      </p>

      <KpiRow reports={scoped} />
      <ReportPreviewCard report={latest} />
      <ReportTimeline reports={scoped} />
    </div>
  );
}
```

- [ ] **Step 5: Replace `apps/web/app/parent/past-reports/page.tsx`**

```tsx
import PastReportsClient from "./PastReportsClient";

export const dynamic = "force-dynamic";

export default function ParentPastReportsPage() {
  return <PastReportsClient />;
}
```

- [ ] **Step 6: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Past Reports · KpiRow
   ========================================================================= */
.pr-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: var(--space-3); }
@media (max-width: 700px) { .pr-kpi-row { grid-template-columns: 1fr; } }
.pr-kpi { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 10px 12px; text-align: center; }
.pr-kpi-value { font-size: 20px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.pr-kpi-label { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
.pr-kpi-good { border-color: var(--color-success); }

/* =========================================================================
   Past Reports · ReportTimeline
   ========================================================================= */
.pr-tl-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.pr-tl-empty { font-size: 11.5px; color: var(--color-muted); margin: 0; }
.pr-tl-group { margin-bottom: 14px; }
.pr-tl-group:last-child { margin-bottom: 0; }
.pr-tl-group-head { font-size: 12px; font-weight: var(--font-weight-bold); color: var(--color-ink); margin: 0 0 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 6px; }
.pr-tl-list { list-style: none; padding: 0; margin: 0; }
.pr-tl-row {
  display: grid; grid-template-columns: 28px 1fr auto auto;
  gap: 10px; padding: 8px 0; align-items: center;
  border-bottom: 1px dashed var(--color-border); font-size: 11px;
}
.pr-tl-row:last-child { border-bottom: 0; }
.pr-tl-ic { font-size: 18px; }
.pr-tl-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pr-tl-period { font-size: 11.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.pr-tl-headline { font-size: 10.5px; color: var(--color-muted); }
.pr-tl-type { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); }
.pr-tl-type-monthly { background: var(--color-info-soft);    color: var(--color-info-text); }
.pr-tl-type-term    { background: var(--color-success-soft); color: var(--color-success-text); }
.pr-tl-open { padding: 5px 12px; font-size: 10.5px; font-weight: var(--font-weight-bold); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); cursor: pointer; font-family: inherit; }
.pr-tl-open:hover { background: var(--color-soft); color: var(--color-ink); }

/* =========================================================================
   Past Reports · ReportPreviewCard
   ========================================================================= */
.pr-pv-card { background: linear-gradient(135deg, var(--color-card), var(--color-surface-subtle)); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); border-left: 4px solid var(--color-primary); }
.pr-pv-empty { border-left-color: var(--color-border); }
.pr-pv-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pr-pv-tag { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-sm); background: var(--color-primary); color: #fff; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .05em; }
.pr-pv-head h3 { margin: 0; font-size: 14px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.pr-pv-headline { font-size: 12.5px; color: var(--color-ink); margin: 4px 0 10px; line-height: 1.5; }
.pr-pv-axes { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.pr-pv-axis { display: grid; grid-template-columns: 120px 1fr 40px; gap: 10px; align-items: center; font-size: 11px; }
.pr-pv-axis-name { color: var(--color-ink); font-weight: var(--font-weight-medium); }
.pr-pv-axis-bar { background: var(--color-surface-subtle); border-radius: var(--radius-sm); height: 10px; overflow: hidden; }
.pr-pv-axis-fill { display: block; height: 100%; background: var(--color-success); }
.pr-pv-axis-score { font-size: 10.5px; color: var(--color-muted); font-weight: var(--font-weight-bold); text-align: right; }
.pr-pv-actions { display: flex; gap: 6px; }
.pr-pv-btn { padding: 7px 14px; border-radius: var(--radius-md); font-size: 10.5px; font-weight: var(--font-weight-bold); cursor: pointer; border: 0; font-family: inherit; }
.pr-pv-btn.primary { background: var(--color-primary); color: #fff; }
.pr-pv-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
```

- [ ] **Step 7: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/parent/past-reports apps/web/app/globals.css && git commit -m "/parent/past-reports: archive page · KpiRow + ReportTimeline + ReportPreviewCard"
```

---

## Task 4 — Student past-reports page

**Files:**
- Create: `apps/web/app/student/past-reports/components/StudentReportArchive.tsx`
- Replace: `apps/web/app/student/past-reports/page.tsx`

- [ ] **Step 1: `StudentReportArchive.tsx`** (server)

```tsx
import { MOCK_ARCHIVE, archiveForChild, latestReport } from "@/lib/mock-reports-archive";

const ICONS: Record<string, string> = { monthly: "📄", term: "📚" };

const LAYLA_ID = "layla-al-habsi";

export default function StudentReportArchive() {
  const reports = archiveForChild(MOCK_ARCHIVE, LAYLA_ID);
  const latest  = latestReport(MOCK_ARCHIVE, LAYLA_ID);
  if (!latest) return null;
  const top3 = [...latest.axes].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <>
      <section className="pr-pv-card" aria-label="Latest report preview">
        <header className="pr-pv-head">
          <span className="pr-pv-tag">Latest · {latest.period}</span>
          <h3>{latest.child_name}</h3>
        </header>
        <p className="pr-pv-headline">{latest.headline}</p>
        <div className="pr-pv-axes">
          {top3.map(a => (
            <div key={a.name} className="pr-pv-axis">
              <span className="pr-pv-axis-name">{a.name}</span>
              <span className="pr-pv-axis-bar">
                <span className="pr-pv-axis-fill" style={{ width: `${(a.score / 5) * 100}%` }} />
              </span>
              <span className="pr-pv-axis-score">{a.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <p className="pr-pv-compare"><strong>vs previous month:</strong> +0.1 Academic · +0.1 Effort · stable Behaviour</p>
        <div className="pr-pv-actions">
          <button type="button" className="pr-pv-btn primary">Open full report</button>
        </div>
      </section>

      <section className="pr-tl-card" aria-label="Reports timeline">
        <h3 className="pr-tl-group-head">All my reports · {reports.length}</h3>
        <ul className="pr-tl-list" role="list">
          {reports.map(r => (
            <li key={r.id} className={`pr-tl-row pr-tl-row-${r.type}`}>
              <span className="pr-tl-ic" aria-hidden>{ICONS[r.type]}</span>
              <span className="pr-tl-body">
                <span className="pr-tl-period">{r.period}</span>
                <span className="pr-tl-headline">{r.headline}</span>
              </span>
              <span className={`pr-tl-type pr-tl-type-${r.type}`}>{r.type.toUpperCase()}</span>
              <button type="button" className="pr-tl-open">Open</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Replace `apps/web/app/student/past-reports/page.tsx`**

```tsx
import StudentReportArchive from "./components/StudentReportArchive";

export const dynamic = "force-dynamic";

export default function StudentPastReportsPage() {
  return (
    <div className="container">
      <h1>Past Reports</h1>
      <p className="sub">Layla Al-Habsi · 10A · AY 2025–26</p>
      <StudentReportArchive />
    </div>
  );
}
```

- [ ] **Step 3: CSS append** — single new rule for the compare line:

```css
.pr-pv-compare { font-size: 11px; color: var(--color-muted); margin: 0 0 10px; padding-top: 8px; border-top: 1px solid var(--color-border); }
.pr-pv-compare strong { color: var(--color-primary); font-weight: var(--font-weight-bold); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/student/past-reports apps/web/app/globals.css && git commit -m "/student/past-reports: Layla archive + compare-with-previous-month line"
```

---

## Task 5 — Student growth page

**Files:**
- Create: `apps/web/app/student/growth/components/{RubricRadar,AxisSparklines,StrengthsAndGrowth,GoalsList}.tsx`
- Replace: `apps/web/app/student/growth/page.tsx`

- [ ] **Step 1: `RubricRadar.tsx`** (server, SVG)

```tsx
import { MOCK_GROWTH, AXIS_LABELS } from "@/lib/mock-growth";

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = SIZE / 2 - 32;

function polyPoints(scores: number[]): string {
  const n = scores.length;
  return scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (s / 5) * MAX_R;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");
}

export default function RubricRadar() {
  const axes = AXIS_LABELS;
  const orderedHist = axes.map(a => MOCK_GROWTH.find(h => h.axis === a.key)!);
  const thisMo = orderedHist.map(h => h.this_mo);
  const lastMo = orderedHist.map(h => h.last_mo);

  const gridRings = [1, 2, 3, 4, 5].map(v => v / 5 * MAX_R);

  return (
    <section className="gr-radar-card" aria-label="6-axis rubric radar">
      <header className="gr-radar-head">
        <h3>Rubric · this month vs last month</h3>
        <div className="gr-radar-legend">
          <span className="gr-radar-sw gr-radar-sw-this" /> This
          <span className="gr-radar-sw gr-radar-sw-last" /> Last
        </div>
      </header>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height={SIZE} role="img" aria-label="Radar chart">
        {/* grid rings */}
        {gridRings.map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
        ))}
        {/* axis spokes + labels */}
        {axes.map((a, i) => {
          const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
          const x = CX + MAX_R * Math.cos(angle);
          const y = CY + MAX_R * Math.sin(angle);
          const lx = CX + (MAX_R + 18) * Math.cos(angle);
          const ly = CY + (MAX_R + 18) * Math.sin(angle);
          return (
            <g key={a.key}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fontSize="10" fontWeight="bold" fill="var(--color-muted)">
                {a.label}
              </text>
            </g>
          );
        })}
        {/* last month polygon */}
        <polygon points={polyPoints(lastMo)} fill="var(--color-muted)" fillOpacity="0.12"
                 stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* this month polygon */}
        <polygon points={polyPoints(thisMo)} fill="var(--color-primary)" fillOpacity="0.25"
                 stroke="var(--color-primary)" strokeWidth="2" />
        {/* dot markers for this month */}
        {thisMo.map((s, i) => {
          const angle = (Math.PI * 2 * i) / thisMo.length - Math.PI / 2;
          const r = (s / 5) * MAX_R;
          const x = CX + r * Math.cos(angle);
          const y = CY + r * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
        })}
      </svg>
    </section>
  );
}
```

- [ ] **Step 2: `AxisSparklines.tsx`** (server, SVG)

```tsx
import { MOCK_GROWTH, type AxisHistory } from "@/lib/mock-growth";

function sparkPath(history: AxisHistory["history"], w: number, h: number, pad = 4): string {
  if (history.length === 0) return "";
  const max = Math.max(...history.map(p => p.score));
  const min = Math.min(...history.map(p => p.score));
  const range = max - min || 1;
  const step  = (w - pad * 2) / (history.length - 1);
  return history.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - ((p.score - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export default function AxisSparklines() {
  return (
    <section className="gr-spark-card" aria-label="Axis sparklines">
      <header className="gr-spark-head">
        <h3>Per-axis trend · last 6 months</h3>
      </header>
      <div className="gr-spark-grid">
        {MOCK_GROWTH.map(h => {
          const delta = +(h.this_mo - h.six_mo).toFixed(1);
          const tone  = delta > 0 ? "good" : delta < 0 ? "warn" : "flat";
          const sign  = delta > 0 ? "+" : "";
          return (
            <article key={h.axis} className="gr-spark-tile">
              <div className="gr-spark-top">
                <span className="gr-spark-name">{h.label}</span>
                <span className={`gr-spark-delta gr-spark-${tone}`}>{sign}{delta}</span>
              </div>
              <svg viewBox="0 0 120 40" width="100%" height="40">
                <path d={sparkPath(h.history, 120, 40)} stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="gr-spark-bot">
                <span>now <strong>{h.this_mo.toFixed(1)}</strong></span>
                <span>6mo ago {h.six_mo.toFixed(1)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `StrengthsAndGrowth.tsx`** (server)

```tsx
import { MOCK_GROWTH, axisStrengths, axisGrowthAreas } from "@/lib/mock-growth";

const STRENGTH_QUOTES: Record<string, string> = {
  "Behaviour":     "Always punctual, models school values.",
  "Communication": "Strong oral contributions in MUN, growing essay voice.",
  "Effort":        "Consistent across subjects, even under pressure.",
  "Collaboration": "Trusted by peers; led Term 2 Chemistry team.",
  "Academic":      "Top quartile in English + History.",
  "Self-direction":"Has clear goals; needs help on weekly planning.",
};

const GROWTH_NOTES: Record<string, string> = {
  "Self-direction":"Use the Manhaj weekly planner each Sunday — 3 weeks straight builds the habit.",
  "Academic":      "Maths is the gap. One extra office-hour per fortnight closes it.",
  "Collaboration": "Volunteer for one more group-lead role per term.",
  "Communication": "Aim for one substantive MUN intervention per debate.",
  "Effort":        "Effort score is already 4.5 — focus elsewhere.",
  "Behaviour":     "Behaviour already at ceiling.",
};

export default function StrengthsAndGrowth() {
  const strengths    = axisStrengths(MOCK_GROWTH);
  const growthAreas  = axisGrowthAreas(MOCK_GROWTH);
  return (
    <section className="gr-sg-row" aria-label="Strengths and growth areas">
      <div className="gr-sg-card gr-sg-strengths">
        <h3>Strengths</h3>
        <ul role="list">
          {strengths.map(a => (
            <li key={a.axis}>
              <span className="gr-sg-name">{a.label}</span>
              <span className="gr-sg-score">{a.this_mo.toFixed(1)} / 5</span>
              <p className="gr-sg-note">{STRENGTH_QUOTES[a.label] ?? "—"}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="gr-sg-card gr-sg-growth">
        <h3>Growth areas</h3>
        <ul role="list">
          {growthAreas.map(a => (
            <li key={a.axis}>
              <span className="gr-sg-name">{a.label}</span>
              <span className="gr-sg-score">{a.this_mo.toFixed(1)} / 5</span>
              <p className="gr-sg-note"><strong>Advisor:</strong> {GROWTH_NOTES[a.label] ?? "—"}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: `GoalsList.tsx`** (server)

```tsx
import { MOCK_GOALS, AXIS_LABELS } from "@/lib/mock-growth";

const STATUS_LABEL: Record<string, string> = { "on-track": "ON TRACK", "behind": "BEHIND", "done": "DONE" };

export default function GoalsList() {
  return (
    <section className="gr-goals-card" aria-label="Goals">
      <header className="gr-goals-head">
        <h3>Goals · {MOCK_GOALS.length}</h3>
        <p className="gr-goals-sub">Set with your advisor at the start of term · updated weekly.</p>
      </header>
      <ul className="gr-goals-list" role="list">
        {MOCK_GOALS.map(g => {
          const axis = AXIS_LABELS.find(a => a.key === g.axis);
          return (
            <li key={g.id} className={`gr-goal-row gr-goal-${g.status}`}>
              <span className="gr-goal-tag">{axis?.label ?? g.axis}</span>
              <div className="gr-goal-body">
                <h4>{g.title}</h4>
                <p>{g.detail}</p>
                <div className="gr-goal-bar"><span className="gr-goal-fill" style={{ width: `${g.progress}%` }} /></div>
              </div>
              <div className="gr-goal-side">
                <span className={`gr-goal-chip gr-goal-chip-${g.status}`}>{STATUS_LABEL[g.status]}</span>
                <span className="gr-goal-when">Updated {g.last_update}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Replace `apps/web/app/student/growth/page.tsx`**

```tsx
import RubricRadar         from "./components/RubricRadar";
import AxisSparklines      from "./components/AxisSparklines";
import StrengthsAndGrowth  from "./components/StrengthsAndGrowth";
import GoalsList           from "./components/GoalsList";

export const dynamic = "force-dynamic";

export default function StudentGrowthPage() {
  return (
    <div className="container">
      <h1>My Growth</h1>
      <p className="sub">6-axis rubric · last 6 months · goals you and your advisor set together.</p>

      <RubricRadar />
      <AxisSparklines />
      <StrengthsAndGrowth />
      <GoalsList />
    </div>
  );
}
```

- [ ] **Step 6: CSS** — append:

```css
/* =========================================================================
   My Growth · RubricRadar
   ========================================================================= */
.gr-radar-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.gr-radar-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.gr-radar-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.gr-radar-legend { font-size: 10.5px; color: var(--color-muted); display: flex; gap: 12px; align-items: center; }
.gr-radar-sw { display: inline-block; width: 14px; height: 8px; margin-right: 4px; border-radius: 2px; vertical-align: middle; }
.gr-radar-sw-this { background: var(--color-primary); }
.gr-radar-sw-last { background: var(--color-muted); opacity: .5; }

/* =========================================================================
   My Growth · AxisSparklines
   ========================================================================= */
.gr-spark-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.gr-spark-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.gr-spark-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.gr-spark-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (max-width: 700px) { .gr-spark-grid { grid-template-columns: repeat(2, 1fr); } }
.gr-spark-tile { background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.gr-spark-top { display: flex; justify-content: space-between; align-items: center; }
.gr-spark-name { font-size: 10.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.gr-spark-delta { font-size: 10.5px; font-weight: var(--font-weight-bold); padding: 1px 6px; border-radius: var(--radius-sm); }
.gr-spark-good { background: var(--color-success-soft); color: var(--color-success-text); }
.gr-spark-warn { background: var(--color-warning-soft); color: var(--color-warning-text); }
.gr-spark-flat { background: var(--color-soft); color: var(--color-muted); }
.gr-spark-bot { display: flex; justify-content: space-between; font-size: 9.5px; color: var(--color-muted); }

/* =========================================================================
   My Growth · StrengthsAndGrowth
   ========================================================================= */
.gr-sg-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: var(--space-3); }
@media (max-width: 700px) { .gr-sg-row { grid-template-columns: 1fr; } }
.gr-sg-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; box-shadow: var(--shadow-sm); }
.gr-sg-card h3 { margin: 0 0 10px; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
.gr-sg-strengths { border-top: 3px solid var(--color-success); }
.gr-sg-growth { border-top: 3px solid var(--color-warning); }
.gr-sg-card ul { list-style: none; padding: 0; margin: 0; }
.gr-sg-card li { padding: 8px 0; border-bottom: 1px dashed var(--color-border); display: grid; grid-template-columns: 1fr auto; gap: 6px; }
.gr-sg-card li:last-child { border-bottom: 0; }
.gr-sg-name { font-size: 11.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.gr-sg-score { font-size: 10.5px; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.gr-sg-note { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; line-height: 1.5; grid-column: 1 / -1; }
.gr-sg-note strong { color: var(--color-primary); }

/* =========================================================================
   My Growth · GoalsList
   ========================================================================= */
.gr-goals-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.gr-goals-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.gr-goals-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.gr-goals-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.gr-goals-list { list-style: none; padding: 0; margin: 0; }
.gr-goal-row {
  display: grid; grid-template-columns: 130px 1fr 130px;
  gap: 12px; padding: 12px 0;
  border-bottom: 1px dashed var(--color-border); align-items: start;
}
.gr-goal-row:last-child { border-bottom: 0; }
.gr-goal-tag {
  background: var(--color-soft); color: var(--color-ink);
  padding: 4px 10px; border-radius: var(--radius-2xl); font-size: 10.5px;
  font-weight: var(--font-weight-bold); align-self: start; text-align: center;
}
.gr-goal-body h4 { margin: 0 0 4px; font-size: 12px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.gr-goal-body p  { margin: 0 0 8px; font-size: 10.5px; color: var(--color-muted); line-height: 1.5; }
.gr-goal-bar { background: var(--color-surface-subtle); border-radius: var(--radius-sm); height: 8px; overflow: hidden; }
.gr-goal-fill { display: block; height: 100%; background: var(--color-primary); }
.gr-goal-done .gr-goal-fill { background: var(--color-success); }
.gr-goal-behind .gr-goal-fill { background: var(--color-warning); }
.gr-goal-side { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.gr-goal-chip { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); }
.gr-goal-chip-on-track { background: var(--color-info-soft); color: var(--color-info-text); }
.gr-goal-chip-behind   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.gr-goal-chip-done     { background: var(--color-success-soft); color: var(--color-success-text); }
.gr-goal-when { font-size: 9.5px; color: var(--color-muted); }
```

- [ ] **Step 7: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -10
cd ~/dev/manhaj && git add apps/web/app/student/growth apps/web/app/globals.css && git commit -m "/student/growth: RubricRadar + AxisSparklines + StrengthsAndGrowth + GoalsList"
```

---

## Self-review

| Spec section | Plan task |
|---|---|
| §1 /parent/past-reports | Task 3 |
| §2 /student/past-reports | Task 4 |
| §3 /student/growth | Task 5 |
| §4 fixtures | Tasks 1 + 2 |
| §5 acceptance | Task 5 final step |

Types consistent across files. No placeholder language. Both fixtures + helpers cleanly typed.
