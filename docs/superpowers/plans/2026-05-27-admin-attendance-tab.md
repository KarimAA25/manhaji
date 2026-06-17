# Admin · Attendance tab · Implementation Plan (Phase 2.2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Render all 16 brainstorm blocks of the Admin Attendance page against `lib/mock-attendance.ts` synthetic data. Lens toggle (Principal / Advisor / Teacher) hides/shows blocks via CSS.

**Architecture:** Static fixture → new `lib/summary.ts` composer → 1 reusable component (`<TrendChart />`) + 11 page-scoped components → assembled in `app/admin/attendance/page.tsx`.

**Tech Stack:** Next.js 16 App Router · server components by default, `"use client"` only where state / onClick needed · vitest for `lib/` units · existing design tokens.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-admin-attendance-tab.md`](../specs/2026-05-27-admin-attendance-tab.md)

**Visual reference:** the brainstorm mockups at `~/dev/manhaj/.superpowers/brainstorm/52924-1779812321/content/attendance-deep.html` and `.../attendance-trend-fix-v2.html` are still on disk (gitignored). When a component's CSS is heavy, the mockup is the source of truth for styling — read it to match.

---

## File map

**Create:**
- `apps/web/lib/mock-attendance.ts`
- `apps/web/lib/attendance.test.ts`
- `apps/web/app/components/TrendChart.tsx`
- `apps/web/app/admin/attendance/components/{DayOfWeekHeatmap,PeriodBars,AiCausesCards,SectionHeatStrip,SubjectCorrelation,ChronicAbsenteesTable,BenchmarkBars,PerStudentCalendarHeat,LessonsMissedList,ReEngagementDraft,TakeAttendanceUI}.tsx`

**Modify:**
- `apps/web/lib/summary.ts` — add `attendanceCohortSummary()` export
- `apps/web/lib/summary.test.ts` — tests for the new export
- `apps/web/app/admin/attendance/page.tsx` — full rewrite (replaces placeholder)
- `apps/web/app/globals.css` — append CSS blocks for each new component

---

## Task 1 — Mock attendance fixture + tests

**Files:**
- Create: `apps/web/lib/mock-attendance.ts`
- Create: `apps/web/lib/attendance.test.ts`

- [ ] **Step 1: Write `mock-attendance.ts`** with the full fixture below. This is ~280 lines but mechanical.

```ts
/**
 * Manhaj Phase 2.2 demo fixture — synthetic attendance series for the
 * Admin Attendance tab.
 *
 * Shape mirrors a future RPC return. Cross-references student IDs from
 * lib/mock-students.ts where needed (chronic absentees + take-attendance roll).
 */

// =========================
// Types
// =========================
export type DailyPoint   = { date: string; pct: number };
export type DayOfWeekRow = { week_label: string; mon: number; tue: number; wed: number; thu: number; fri: number };
export type PeriodAvg    = { period: 1|2|3|4|5|6|7; pct: number };
export type EventMarker  = { id: number; date: string; label: string; tone: "muted" | "neutral" | "warn" };
export type CauseCard    = { id: string; title: string; body: string; confidence: "high" | "medium" };
export type SectionWeekRow = { section_code: string; days: Array<"good"|"watch"|"bad">; week_pct: number };
export type SubjectMiss    = { subject: string; hours_missed: number };
export type ChronicRow = {
  student_id:  string;
  student_name: string;
  section_code: string;
  days_missed:  number;
  pattern:      string;
  cause:        string;
  status:       "support" | "watch" | "excused" | "contact";
};
export type BenchmarkRow = { label: string; pct: number; tone: "us" | "neutral" | "target" };
export type CalendarDay  = "p" | "l" | "a" | "x";
export type CalendarRow  = CalendarDay[];
export type LessonMissed = { date: string; period: string; subject: string; teacher: string; note: string };
export type ReEngagementDraft = {
  to:          string;
  template_id: string;
  subject:     string;
  body:        string;
};
export type RollCallStatus = "P" | "L" | "A";
export type RollCallRow = {
  student_id:    string;
  student_name:  string;
  preset_flag?:  "medical" | "religious" | "transport";
  preset_date?:  string;
};
export type AttendanceKpis = {
  this_week_pct:    number;
  chronic_count:    number;
  late_today_count: number;
  sub_coverage:     number;
};

// =========================
// Daily aggregate · last 30 school days
// Smooth band 95-97% with 3 visible dips: Eid (~70), mid-term week (~83), illness spike (~88).
// =========================
export const ATT_DAILY: DailyPoint[] = [
  { date: "2026-04-13", pct: 97.1 },
  { date: "2026-04-14", pct: 96.4 },
  { date: "2026-04-15", pct: 95.8 },
  { date: "2026-04-16", pct: 96.9 },
  { date: "2026-04-17", pct: 95.4 },
  { date: "2026-04-20", pct: 95.1 },
  { date: "2026-04-21", pct: 96.0 },
  { date: "2026-04-22", pct: 96.7 },
  { date: "2026-04-23", pct: 95.9 },
  { date: "2026-04-24", pct: 70.2 }, // Eid Al-Fitr
  { date: "2026-04-27", pct: 88.1 },
  { date: "2026-04-28", pct: 93.7 },
  { date: "2026-04-29", pct: 95.4 },
  { date: "2026-04-30", pct: 96.1 },
  { date: "2026-05-01", pct: 96.5 },
  { date: "2026-05-04", pct: 95.2 },
  { date: "2026-05-05", pct: 96.1 },
  { date: "2026-05-06", pct: 96.4 },
  { date: "2026-05-07", pct: 96.8 },
  { date: "2026-05-08", pct: 83.4 }, // mid-term assessment week
  { date: "2026-05-11", pct: 91.7 },
  { date: "2026-05-12", pct: 94.1 },
  { date: "2026-05-13", pct: 95.6 },
  { date: "2026-05-14", pct: 96.2 },
  { date: "2026-05-15", pct: 96.8 },
  { date: "2026-05-18", pct: 95.9 },
  { date: "2026-05-19", pct: 96.4 },
  { date: "2026-05-20", pct: 88.5 }, // illness spike
  { date: "2026-05-21", pct: 92.8 },
  { date: "2026-05-22", pct: 96.2 },
];

// =========================
// Event markers (numbered)
// =========================
export const ATT_EVENTS: EventMarker[] = [
  { id: 1, date: "2026-04-24", label: "24 Apr · Public holiday (Eid Al-Fitr)", tone: "muted" },
  { id: 2, date: "2026-05-08", label: "8 May · Mid-term assessment week",      tone: "neutral" },
  { id: 3, date: "2026-05-20", label: "20 May · Seasonal illness spike",       tone: "warn" },
];

// =========================
// Day-of-week · last 6 weeks (Mondays consistently weakest)
// =========================
export const ATT_DOW: DayOfWeekRow[] = [
  { week_label: "Wk 22", mon: 93, tue: 97, wed: 95, thu: 97, fri: 98 },
  { week_label: "Wk 21", mon: 94, tue: 96, wed: 95, thu: 97, fri: 99 },
  { week_label: "Wk 20", mon: 90, tue: 94, wed: 97, thu: 98, fri: 99 },
  { week_label: "Wk 19", mon: 93, tue: 95, wed: 96, thu: 97, fri: 98 },
  { week_label: "Wk 18", mon: 94, tue: 95, wed: 96, thu: 98, fri: 99 },
  { week_label: "Wk 17", mon: 95, tue: 97, wed: 97, thu: 98, fri: 99 },
];

// =========================
// Period-of-day · last 30 days (P1 and P7 lowest)
// =========================
export const ATT_PERIODS: PeriodAvg[] = [
  { period: 1, pct: 91 },
  { period: 2, pct: 96 },
  { period: 3, pct: 97 },
  { period: 4, pct: 97 },
  { period: 5, pct: 96 },
  { period: 6, pct: 95 },
  { period: 7, pct: 93 },
];

// =========================
// AI-attributed causes
// =========================
export const ATT_CAUSES: CauseCard[] = [
  { id: "flu", title: "Illness cluster", confidence: "high",
    body: "5 students in 10B (same wing, overlapping symptoms). Recommend a note to all 10B parents on hand-hygiene." },
  { id: "monday", title: "Monday dip pattern", confidence: "high",
    body: "Mondays consistently 2-3 pts below the week average. Worth reviewing the Monday P1 schedule (currently Maths/Arabic for HS)." },
  { id: "transport", title: "Transport delay", confidence: "medium",
    body: "Late arrivals concentrated in 2 sections served by the same bus route (Athaiba-North)." },
  { id: "religious", title: "Religious / cultural", confidence: "high",
    body: "3 students absent today aligned to Eid travel — already excused, parents notified." },
];

// =========================
// Section heat-strip · this week (5 school days per section)
// =========================
export const ATT_SECTIONS: SectionWeekRow[] = [
  { section_code: "9A",    days: ["good","good","good","watch","good"], week_pct: 97 },
  { section_code: "9B",    days: ["good","good","watch","good","good"], week_pct: 95 },
  { section_code: "10A",   days: ["good","good","good","good","good"],  week_pct: 98 },
  { section_code: "10B",   days: ["bad","bad","bad","watch","watch"],   week_pct: 87 },
  { section_code: "11 AS", days: ["watch","good","good","good","good"], week_pct: 94 },
  { section_code: "12 A2", days: ["good","good","good","good","good"],  week_pct: 99 },
];

// =========================
// Subject correlation · this term · hours missed
// =========================
export const ATT_SUBJECTS: SubjectMiss[] = [
  { subject: "Mathematics", hours_missed: 142 },
  { subject: "Arabic",      hours_missed: 128 },
  { subject: "English",     hours_missed: 96 },
  { subject: "Chemistry",   hours_missed: 76 },
  { subject: "PE",          hours_missed: 44 },
];

// =========================
// Chronic absentees (cross-ref MOCK_STUDENTS by id)
// =========================
export const ATT_CHRONIC: ChronicRow[] = [
  { student_id: "omar-saadi",      student_name: "Omar Saadi",      section_code: "11 AS", days_missed: 12, pattern: "Mondays + post-exam",   cause: "Disengagement", status: "support" },
  { student_id: "maya-habibi",     student_name: "Maya Habibi",     section_code: "10B",   days_missed:  9, pattern: "Cluster Apr 15-25",     cause: "Medical (flu)", status: "watch"   },
  { student_id: "rashid-al-saadi", student_name: "Rashid Al-Saadi", section_code: "9B",    days_missed:  7, pattern: "Fridays",               cause: "Religious",     status: "excused" },
  { student_id: "yasmin-naser",    student_name: "Yasmin Naser",    section_code: "11 AS", days_missed:  6, pattern: "Scattered",             cause: "Unknown",       status: "contact" },
  { student_id: "hala-mohsen",     student_name: "Hala Mohsen",     section_code: "9A",    days_missed:  6, pattern: "Post-exam slump",       cause: "Disengagement", status: "support" },
];

// =========================
// Benchmark
// =========================
export const ATT_BENCHMARK: BenchmarkRow[] = [
  { label: "HS · this term",          pct: 96.2, tone: "us"      },
  { label: "HS · last term",          pct: 94.1, tone: "neutral" },
  { label: "HS · same time last year", pct: 93.7, tone: "neutral" },
  { label: "School target",            pct: 95.0, tone: "target"  },
];

// =========================
// Per-student calendar heat · 20 weeks for Omar Saadi
// 5 days/week × 20 weeks = 100 cells. Last 8 weeks intensify near exam periods.
// =========================
const _omarCal: CalendarDay[][] = [
  ["p","p","p","l","p"], ["p","p","p","a","a"], ["p","p","l","p","p"], ["p","p","p","p","p"],
  ["a","a","p","p","p"], ["p","p","l","p","x"], ["a","p","p","p","p"], ["p","a","a","a","a"],
  ["p","p","p","l","p"], ["p","p","p","p","p"], ["p","l","a","p","p"], ["p","p","a","p","p"],
  ["p","p","p","l","p"], ["p","l","a","a","p"], ["p","p","p","p","p"], ["p","p","p","l","p"],
  ["a","a","p","p","p"], ["p","p","l","p","p"], ["p","a","p","p","p"], ["l","p","a","a","p"],
];
export const ATT_CAL_OMAR: CalendarRow[] = _omarCal;

// =========================
// Lessons missed (Omar · last 14 days)
// =========================
export const ATT_LESSONS: LessonMissed[] = [
  { date: "2026-05-22", period: "P3", subject: "Calculus",  teacher: "Mr Saab",   note: "limits unit-test review" },
  { date: "2026-05-22", period: "P5", subject: "Chemistry", teacher: "Mr Salim",  note: "organic reactions lab"   },
  { date: "2026-05-17", period: "P1", subject: "Mathematics", teacher: "Mr Saab", note: "15 min late"             },
  { date: "2026-05-15", period: "P2", subject: "English",   teacher: "Ms Swart",  note: "essay feedback session"  },
];

// =========================
// AI-drafted parent message (re-engagement after unexplained absence · T-11)
// =========================
export const ATT_DRAFT_OMAR: ReEngagementDraft = {
  to:          "Omar Saadi's parent",
  template_id: "T-11",
  subject:     "Re: Omar — could we arrange a short call?",
  body:        "Dear Mr Saadi,\n\nWe noticed Omar missed school on 22 May without an explanation, following 3 other unexplained absences this month. We'd like to understand if anything is happening so we can support him. Could we arrange a short call this week?\n\nManhaj is also attaching the lessons Omar missed so he can catch up.\n\nBest,\nMs Swart · Student Advisor · International School of Oman",
};

// =========================
// Today's roll call · 10A
// =========================
export const ATT_ROLL_10A: RollCallRow[] = [
  { student_id: "layla-al-habsi",  student_name: "Layla Al-Habsi"  },
  { student_id: "aya-mansour",     student_name: "Aya Mansour"     },
  { student_id: "khalil-al-mansoor", student_name: "Khalil Al-Mansoor" },
  { student_id: "rania-khalifa",   student_name: "Rania Khalifa", preset_flag: "medical", preset_date: "22 May" },
  { student_id: "tariq-said",      student_name: "Tariq Said"      },
];

// =========================
// KPIs (precomputed for the page header)
// =========================
export const ATT_KPIS: AttendanceKpis = {
  this_week_pct:    96.2,
  chronic_count:    5,
  late_today_count: 14,
  sub_coverage:     2,
};
```

- [ ] **Step 2: Write `attendance.test.ts`** with 8 sanity tests:

```ts
import { describe, expect, it } from "vitest";
import {
  ATT_DAILY, ATT_EVENTS, ATT_DOW, ATT_PERIODS, ATT_CAUSES, ATT_SECTIONS,
  ATT_CHRONIC, ATT_BENCHMARK, ATT_CAL_OMAR, ATT_LESSONS, ATT_KPIS,
} from "./mock-attendance";

describe("mock-attendance fixture", () => {
  it("has at least 30 daily points", () => {
    expect(ATT_DAILY.length).toBeGreaterThanOrEqual(30);
  });
  it("daily pct is always 0–100", () => {
    for (const d of ATT_DAILY) {
      expect(d.pct).toBeGreaterThanOrEqual(0);
      expect(d.pct).toBeLessThanOrEqual(100);
    }
  });
  it("has 3 event markers", () => {
    expect(ATT_EVENTS.length).toBe(3);
    expect(ATT_EVENTS.map(e => e.id)).toEqual([1, 2, 3]);
  });
  it("has 6 weeks of day-of-week + each period 1-7", () => {
    expect(ATT_DOW.length).toBe(6);
    expect(ATT_PERIODS.map(p => p.period)).toEqual([1,2,3,4,5,6,7]);
  });
  it("has 4 AI cause cards with valid confidence", () => {
    expect(ATT_CAUSES.length).toBe(4);
    for (const c of ATT_CAUSES) {
      expect(["high", "medium"]).toContain(c.confidence);
    }
  });
  it("has 6 section weekly bars with 5 days each", () => {
    expect(ATT_SECTIONS.length).toBe(6);
    for (const s of ATT_SECTIONS) expect(s.days.length).toBe(5);
  });
  it("has at least 5 chronic absentees with cross-ref IDs", () => {
    expect(ATT_CHRONIC.length).toBeGreaterThanOrEqual(5);
    for (const r of ATT_CHRONIC) expect(r.student_id).toBeTruthy();
  });
  it("Omar's calendar heat has 20 weeks of 5 days", () => {
    expect(ATT_CAL_OMAR.length).toBe(20);
    for (const w of ATT_CAL_OMAR) expect(w.length).toBe(5);
  });
  it("benchmark has 4 rows with sane percentages", () => {
    expect(ATT_BENCHMARK.length).toBe(4);
    for (const b of ATT_BENCHMARK) {
      expect(b.pct).toBeGreaterThanOrEqual(0);
      expect(b.pct).toBeLessThanOrEqual(100);
    }
  });
  it("KPIs all defined", () => {
    expect(ATT_KPIS.this_week_pct).toBeGreaterThan(0);
    expect(ATT_KPIS.chronic_count).toBeGreaterThan(0);
    expect(ATT_LESSONS.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run tests** — confirm 41 total pass (31 prior + 10 new).

```bash
cd ~/dev/manhaj/apps/web && npm test
```

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/mock-attendance.ts apps/web/lib/attendance.test.ts && git commit -m "lib/mock-attendance: 30-day fixture · DOW · periods · causes · sections · chronic · benchmark · cal heat · lessons · draft · roll-call"
```

---

## Task 2 — Extend `lib/summary.ts` with `attendanceCohortSummary`

**Files:**
- Modify: `apps/web/lib/summary.ts`
- Modify: `apps/web/lib/summary.test.ts`

- [ ] **Step 1: Append failing tests to `summary.test.ts`**

```ts
import {
  ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS,
} from "./mock-attendance";
import { attendanceCohortSummary } from "./summary";

describe("attendanceCohortSummary", () => {
  it("returns a Summary with all 4 required fields", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline).toBeTruthy();
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });

  it("headline names the worst section when one falls below 90", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline).toContain("10B");
    expect(s.headline.toLowerCase()).toContain("87");
  });

  it("ai_suggested_action mentions the worst section", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.ai_suggested_action).toBeTruthy();
    expect(s.ai_suggested_action!.toLowerCase()).toContain("10b");
  });

  it("falls back to steady headline when all sections are above 90", () => {
    const sections = ATT_SECTIONS.map(x => ({ ...x, week_pct: 95 }));
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, sections, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline.toLowerCase()).toMatch(/steady|on track/);
    expect(s.ai_suggested_action).toBeUndefined();
  });

  it("today line counts late arrivals + sub coverage", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.today).toContain("14");
    expect(s.today).toContain("2");
  });
});
```

- [ ] **Step 2: Run test, confirm failing** (`attendanceCohortSummary` not exported).

- [ ] **Step 3: Implement** — append to `apps/web/lib/summary.ts`:

```ts
import type {
  DailyPoint, CauseCard, SectionWeekRow, ChronicRow, AttendanceKpis,
} from "./mock-attendance";

// ... after existing exports ...

export function attendanceCohortSummary(
  daily:    DailyPoint[],
  causes:   CauseCard[],
  sections: SectionWeekRow[],
  chronic:  ChronicRow[],
  kpis:     AttendanceKpis,
): Summary {
  // Worst section: any section with week_pct < 90
  const worst = [...sections].sort((a, b) => a.week_pct - b.week_pct)[0];
  const highConfidenceCause = causes.find(c => c.confidence === "high");

  let headline: string;
  if (worst && worst.week_pct < 90) {
    const causeBit = highConfidenceCause ? ` · likely cause: ${highConfidenceCause.title.toLowerCase()}` : "";
    headline = `${worst.section_code} at ${worst.week_pct}%${causeBit}.`;
  } else {
    headline = `Attendance steady at ${kpis.this_week_pct.toFixed(1)}% — all sections on track.`;
  }

  const today = `${kpis.late_today_count} late arrivals today · ${kpis.sub_coverage} substitute coverage slot${kpis.sub_coverage === 1 ? "" : "s"} open.`;

  const this_week = `${chronic.length} chronic absentee${chronic.length === 1 ? "" : "s"} flagged · Monday dip pattern persists.`;

  const target = 95;
  const this_month = `Composite ${kpis.this_week_pct.toFixed(1)}% vs ${target}% target (+${(kpis.this_week_pct - target).toFixed(1)} pts).`;

  const ai_suggested_action = (worst && worst.week_pct < 90)
    ? `Review ${worst.section_code} parent comms before Friday — five chronic absences this week.`
    : undefined;

  return { headline, today, this_week, this_month, ai_suggested_action };
}
```

- [ ] **Step 4: Run tests, all green** (5 new + existing).

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/summary.ts apps/web/lib/summary.test.ts && git commit -m "lib/summary: add attendanceCohortSummary"
```

---

## Task 3 — Reusable `<TrendChart />` with axis-anchored target

**Files:**
- Create: `apps/web/app/components/TrendChart.tsx`
- Modify: `apps/web/app/globals.css`

This is the SVG showpiece. The axis-anchored target marker pattern was approved during the brainstorm (see `~/dev/manhaj/.superpowers/brainstorm/52924-1779812321/content/attendance-trend-fix-v2.html`). **No dashed line crossing the data area.**

- [ ] **Step 1: Component** — server-renderable, takes the data shape via props.

```tsx
/**
 * Reusable line trend chart with calendar-anchored event markers and an
 * axis-anchored target marker.
 *
 * Used by Admin · Attendance for the 30-day daily aggregate. Phase 2.4
 * Reports will reuse it for the send-pipeline historical view.
 *
 * Why server-renderable: there's no interactivity inside the SVG; consumers
 * pass a fully-resolved dataset and the component computes coordinates.
 */

type Tone = "muted" | "neutral" | "warn";

export type TrendPoint = { date: string; pct: number };
export type TrendMarker = { id: number; date: string; label: string; tone: Tone };

export default function TrendChart({
  points,
  markers = [],
  target = 95,
  height = 170,
  title = "Trend",
}: {
  points:   TrendPoint[];
  markers?: TrendMarker[];
  target?:  number;
  height?:  number;
  title?:   string;
}) {
  // Normalised viewBox: x = index across `points`, y = % (0–100).
  const W = 400;
  const H = height;
  const padL = 32;          // left padding for Y-axis labels
  const padR = 0;
  const padTop = 20;
  const padBot = 30;        // room for the x-axis label
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBot;

  // Y-axis: 85–100 visible range
  const yMin = 85;
  const yMax = 100;
  function y(pct: number): number {
    const clamped = Math.max(yMin, Math.min(yMax, pct));
    return padTop + (1 - (clamped - yMin) / (yMax - yMin)) * plotH;
  }
  function x(i: number): number {
    if (points.length <= 1) return padL;
    return padL + (i / (points.length - 1)) * plotW;
  }

  const polyPoints = points.map((p, i) => `${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ");
  const areaPath = [
    `M${padL},${y(points[0]?.pct ?? yMin).toFixed(1)}`,
    ...points.slice(1).map((p, i) => `L${x(i + 1).toFixed(1)},${y(p.pct).toFixed(1)}`),
    `L${(padL + plotW).toFixed(1)},${(padTop + plotH).toFixed(1)}`,
    `L${padL},${(padTop + plotH).toFixed(1)}`,
    "Z",
  ].join(" ");

  // Map marker date → x-coord
  function markerX(dateStr: string): number | null {
    const idx = points.findIndex(p => p.date === dateStr);
    if (idx === -1) return null;
    return x(idx);
  }

  const yTarget = y(target);

  return (
    <section className="trend-card" aria-label={title}>
      <div className="trend-wrap">
        <svg
          className="trend-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title} · last ${points.length} data points`}
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#3D5A80" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3D5A80" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Below-target subtle tint */}
          <rect
            x={padL} y={yTarget}
            width={plotW} height={padTop + plotH - yTarget}
            fill="#FED7D7" opacity="0.18"
          />

          {/* Gridlines */}
          <line x1={padL} y1={y(100)} x2={padL + plotW} y2={y(100)} stroke="#EEF2F7" />
          <line x1={padL} y1={y(95)}  x2={padL + plotW} y2={y(95)}  stroke="#EEF2F7" />
          <line x1={padL} y1={y(90)}  x2={padL + plotW} y2={y(90)}  stroke="#EEF2F7" />
          <line x1={padL} y1={y(85)}  x2={padL + plotW} y2={y(85)}  stroke="#EEF2F7" />

          {/* Y-axis line */}
          <line x1={padL} y1={padTop} x2={padL} y2={padTop + plotH} stroke="#E5EAF0" strokeWidth="1.5" />

          {/* Y-axis labels */}
          <text x={padL - 6} y={y(100) + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">100</text>
          <text x={padL - 6} y={y(95)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">95</text>
          <text x={padL - 6} y={y(90)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">90</text>
          <text x={padL - 6} y={y(85)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">85</text>

          {/* Axis-anchored target marker — green arrow flush against the Y-axis */}
          <polygon
            points={`${padL},${(yTarget - 5).toFixed(1)} ${padL + 6},${yTarget.toFixed(1)} ${padL},${(yTarget + 5).toFixed(1)}`}
            fill="#2F855A"
          />
          <line x1={padL} y1={yTarget} x2={padL + 6} y2={yTarget} stroke="#2F855A" strokeWidth="2" />
          <text x={padL + 10} y={yTarget + 3} fontSize="8.5" fill="#2F855A" fontWeight="700">Target {target}%</text>

          {/* Filled area + line */}
          <path d={areaPath} fill="url(#trendFill)" />
          <polyline
            points={polyPoints}
            fill="none" stroke="#0B2545" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Event markers — numbered circles on the line */}
          {markers.map(m => {
            const mx = markerX(m.date);
            if (mx == null) return null;
            const idx = points.findIndex(p => p.date === m.date);
            const my = y(points[idx].pct);
            return (
              <g key={m.id}>
                <line x1={mx} y1={yTarget} x2={mx} y2={my - 6} stroke="#5A6B82" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                <circle cx={mx} cy={my + 4} r="9" fill="#fff" stroke="#0B2545" strokeWidth="1.5" />
                <text x={mx} y={my + 7} fontSize="9" fontWeight="700" fill="#0B2545" textAnchor="middle">{m.id}</text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text x={padL + plotW / 2} y={H - 10} fontSize="8.5" fill="#5A6B82" textAnchor="middle">
            last {points.length} school days →
          </text>
        </svg>

        <div className="trend-legend">
          <span className="trend-legend-item">
            <span className="trend-legend-sw" style={{ background: "#0B2545" }} /> Daily %
          </span>
          <span className="trend-legend-item">
            <span className="trend-legend-sw" style={{ background: "#FED7D7", opacity: 0.6 }} /> Below-target zone
          </span>
          <span className="trend-legend-item trend-legend-arrow">
            <span className="trend-legend-target" /> Target marker
          </span>
          {markers.length > 0 && (
            <span className="trend-legend-marks">
              {markers.map(m => (
                <span key={m.id} className="trend-legend-pill">{`${m.id} · ${m.label}`}</span>
              ))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: CSS** — append to `globals.css` before the `@media (prefers-reduced-motion: reduce)` block:

```css
/* =========================================================================
   Reusable TrendChart
   ========================================================================= */
.trend-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.trend-wrap { position: relative; }
.trend-svg { width: 100%; height: 170px; display: block; }
.trend-legend {
  display: flex; gap: 14px; font-size: 10px; color: var(--color-muted);
  margin-top: 4px; flex-wrap: wrap; align-items: center;
}
.trend-legend-item { display: inline-flex; align-items: center; gap: 4px; }
.trend-legend-sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
.trend-legend-arrow { display: inline-flex; align-items: center; gap: 4px; }
.trend-legend-target {
  width: 0; height: 0; display: inline-block;
  border-top: 5px solid transparent; border-bottom: 5px solid transparent;
  border-left: 8px solid #2F855A;
}
.trend-legend-marks { border-left: 1px solid var(--color-border); padding-left: 14px; margin-left: 6px; display: inline-flex; gap: 6px; flex-wrap: wrap; }
.trend-legend-pill {
  background: var(--color-surface-subtle); border: 1px solid var(--color-border);
  padding: 2px 8px; border-radius: 10px; font-size: 9.5px;
  color: var(--color-ink); font-weight: var(--font-weight-semibold);
}
```

- [ ] **Step 3: Verify** — `cd apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -5` clean.

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/components/TrendChart.tsx apps/web/app/globals.css && git commit -m "TrendChart: reusable SVG with axis-anchored target + numbered markers"
```

---

## Task 4 — DayOfWeekHeatmap + PeriodBars + AiCausesCards

Three smaller cohort-pattern components in one task. Each is self-contained.

**Files:**
- Create: `apps/web/app/admin/attendance/components/DayOfWeekHeatmap.tsx`
- Create: `apps/web/app/admin/attendance/components/PeriodBars.tsx`
- Create: `apps/web/app/admin/attendance/components/AiCausesCards.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `DayOfWeekHeatmap.tsx`** — server component, 6-week × Mon-Fri grid, color-banded by %.

```tsx
import type { DayOfWeekRow } from "@/lib/mock-attendance";

function band(pct: number): string {
  if (pct < 92) return "att-1";
  if (pct < 95) return "att-2";
  if (pct < 97) return "att-3";
  return "att-4";
}

export default function DayOfWeekHeatmap({ rows }: { rows: DayOfWeekRow[] }) {
  return (
    <section className="dow-card att-block-cohort-only" aria-label="Day-of-week pattern · last 6 weeks">
      <header className="dow-head">
        <h3>Day-of-week pattern · last 6 weeks</h3>
        <p className="dow-sub">Spot the chronic Monday dip and Friday catch-up.</p>
      </header>
      <div className="dow-grid">
        <div />
        <div className="dow-col-head">Mon</div>
        <div className="dow-col-head">Tue</div>
        <div className="dow-col-head">Wed</div>
        <div className="dow-col-head">Thu</div>
        <div className="dow-col-head">Fri</div>
        {rows.map(r => (
          <>
            <div key={`${r.week_label}-rh`} className="dow-row-head">{r.week_label}</div>
            {(["mon","tue","wed","thu","fri"] as const).map(d => {
              const v = r[d];
              return <div key={`${r.week_label}-${d}`} className={`dow-cell ${band(v)}`}>{v}</div>;
            })}
          </>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `PeriodBars.tsx`** — server component, P1-P7 bars sized by %.

```tsx
import type { PeriodAvg } from "@/lib/mock-attendance";

export default function PeriodBars({ rows }: { rows: PeriodAvg[] }) {
  const max = 100;
  return (
    <section className="periodbars-card att-block-cohort-only" aria-label="Period-of-day pattern · last 30 days">
      <header className="periodbars-head">
        <h3>Period-of-day pattern · last 30 days</h3>
        <p className="periodbars-sub">P1 and P7 absorb most absences. Useful for scheduling.</p>
      </header>
      <div className="periodbars-row">
        {rows.map(r => {
          const height = ((r.pct - 85) / (max - 85)) * 100;
          return (
            <div key={r.period} className="periodbars-col">
              <div className="periodbars-val">{r.pct}%</div>
              <div className="periodbars-bar" style={{ height: `${Math.max(8, height)}%` }} />
              <div className="periodbars-l">P{r.period}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `AiCausesCards.tsx`** — server component, 4 cards in a 2×2 grid (collapse to 1-col under 700 px).

```tsx
import type { CauseCard } from "@/lib/mock-attendance";

export default function AiCausesCards({ rows }: { rows: CauseCard[] }) {
  return (
    <section className="aicauses-card att-block-cohort-only" aria-label="AI-attributed causes · this week">
      <header className="aicauses-head">
        <h3>AI-attributed causes · this week</h3>
        <p className="aicauses-sub">Manhaj clusters absences by likely cause. Confidence stamped per row.</p>
      </header>
      <div className="aicauses-grid">
        {rows.map(c => (
          <div key={c.id} className="aicauses-item">
            <div className="aicauses-h">
              <span className="aicauses-title">{c.title}</span>
              <span className={`aicauses-conf c-${c.confidence}`}>{c.confidence}</span>
            </div>
            <p className="aicauses-body">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Admin Attendance · Day-of-week heatmap
   ========================================================================= */
.dow-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.dow-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.dow-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.dow-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.dow-grid { display: grid; grid-template-columns: 50px repeat(5, 1fr); gap: 3px; font-size: 9.5px; }
.dow-col-head, .dow-row-head { padding: 4px 0; text-align: center; color: var(--color-muted); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .03em; font-size: 8.5px; }
.dow-row-head { color: var(--color-ink); font-size: 10px; padding: 4px 6px; text-align: left; display: flex; align-items: center; }
.dow-cell {
  height: 22px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: var(--font-weight-bold); font-size: 9.5px;
}
.dow-cell.att-1 { background: var(--color-danger); }
.dow-cell.att-2 { background: var(--color-warn); }
.dow-cell.att-3 { background: #38A169; }
.dow-cell.att-4 { background: var(--color-success); }

/* =========================================================================
   Admin Attendance · Period-of-day bars
   ========================================================================= */
.periodbars-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.periodbars-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.periodbars-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.periodbars-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.periodbars-row { display: flex; gap: 6px; align-items: flex-end; height: 110px; }
.periodbars-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.periodbars-bar { width: 80%; background: var(--color-accent); border-radius: 4px 4px 0 0; }
.periodbars-val { font-size: 9.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.periodbars-l { font-size: 9.5px; color: var(--color-muted); font-weight: var(--font-weight-semibold); }

/* =========================================================================
   Admin Attendance · AI causes cards
   ========================================================================= */
.aicauses-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.aicauses-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.aicauses-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.aicauses-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.aicauses-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
@media (max-width: 700px) { .aicauses-grid { grid-template-columns: 1fr; } }
.aicauses-item {
  background: linear-gradient(135deg, var(--color-surface-subtle), #F0F4FA);
  border: 1px solid var(--color-border); border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-sm); padding: 10px 12px;
  font-size: 11px; color: var(--color-ink); line-height: 1.5;
}
.aicauses-h { display: flex; align-items: center; gap: 8px; font-size: 10.5px; font-weight: var(--font-weight-bold); margin-bottom: 4px; }
.aicauses-title { color: var(--color-ink); }
.aicauses-body { margin: 0; }
.aicauses-conf {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: var(--font-weight-bold);
}
.aicauses-conf.c-high { background: var(--color-success-soft); color: var(--color-success-text); }
.aicauses-conf.c-medium { background: var(--color-warning-soft); color: var(--color-warning-text); }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -5
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/components apps/web/app/globals.css && git commit -m "Attendance: DayOfWeekHeatmap + PeriodBars + AiCausesCards"
```

---

## Task 5 — SectionHeatStrip + SubjectCorrelation

**Files:**
- Create: `apps/web/app/admin/attendance/components/SectionHeatStrip.tsx`
- Create: `apps/web/app/admin/attendance/components/SubjectCorrelation.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `SectionHeatStrip.tsx`**

```tsx
import type { SectionWeekRow } from "@/lib/mock-attendance";

export default function SectionHeatStrip({ rows }: { rows: SectionWeekRow[] }) {
  return (
    <section className="strip-card att-block-cohort-only" aria-label="Section heat-strip · this week">
      <header className="strip-head">
        <h3>Section heat-strip · this week</h3>
        <p className="strip-sub">Each bar = one section. Green=good, amber=watch, red=gap.</p>
      </header>
      <div className="strip-list">
        {rows.map(r => (
          <div key={r.section_code} className="strip-row">
            <span className="strip-label">{r.section_code}</span>
            <div className="strip-bars" aria-label={`${r.section_code} ${r.week_pct}%`}>
              {r.days.map((d, i) => (
                <span key={i} className={`strip-bar bar-${d}`} />
              ))}
            </div>
            <span className={`strip-pct ${r.week_pct < 90 ? "is-bad" : ""}`}>{r.week_pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `SubjectCorrelation.tsx`**

```tsx
import type { SubjectMiss } from "@/lib/mock-attendance";

export default function SubjectCorrelation({ rows }: { rows: SubjectMiss[] }) {
  const max = rows.length > 0 ? Math.max(...rows.map(r => r.hours_missed)) : 1;
  return (
    <section className="subjcorr-card att-block-cohort-only" aria-label="Subject correlation · absences by subject">
      <header className="subjcorr-head">
        <h3>Subject correlation · absences by subject</h3>
        <p className="subjcorr-sub">Where missed lessons cluster. Useful for catch-up planning.</p>
      </header>
      <div className="subjcorr-list">
        {rows.map(r => (
          <div key={r.subject} className="subjcorr-row">
            <span className="subjcorr-nm">{r.subject}</span>
            <div className="subjcorr-bar"><div className="subjcorr-fill" style={{ width: `${(r.hours_missed / max) * 100}%` }} /></div>
            <span className="subjcorr-v">{r.hours_missed} hrs</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Admin Attendance · Section heat-strip
   ========================================================================= */
.strip-card, .subjcorr-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.strip-head, .subjcorr-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.strip-head h3, .subjcorr-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.strip-sub, .subjcorr-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.strip-list { display: flex; flex-direction: column; gap: 4px; }
.strip-row { display: grid; grid-template-columns: 60px 1fr 60px; gap: 8px; align-items: center; padding: 3px 0; }
.strip-label { font-size: 10.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.strip-bars { display: flex; gap: 2px; height: 18px; }
.strip-bar { flex: 1; border-radius: 2px; }
.strip-bar.bar-good  { background: #38A169; }
.strip-bar.bar-watch { background: var(--color-warn); }
.strip-bar.bar-bad   { background: var(--color-danger); }
.strip-pct { font-size: 10.5px; color: var(--color-muted); text-align: right; font-weight: var(--font-weight-bold); }
.strip-pct.is-bad { color: var(--color-danger); }

/* =========================================================================
   Admin Attendance · Subject correlation
   ========================================================================= */
.subjcorr-list { display: flex; flex-direction: column; gap: 2px; }
.subjcorr-row { display: grid; grid-template-columns: 100px 1fr 60px; gap: 10px; align-items: center; font-size: 10.5px; padding: 4px 0; }
.subjcorr-nm { color: var(--color-ink); font-weight: var(--font-weight-semibold); }
.subjcorr-bar { background: var(--color-soft); height: 10px; border-radius: 3px; overflow: hidden; }
.subjcorr-fill { background: var(--color-danger); height: 100%; }
.subjcorr-v { color: var(--color-muted); text-align: right; font-weight: var(--font-weight-bold); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/components apps/web/app/globals.css && git commit -m "Attendance: SectionHeatStrip + SubjectCorrelation"
```

---

## Task 6 — ChronicAbsenteesTable + BenchmarkBars

**Files:**
- Create: `apps/web/app/admin/attendance/components/ChronicAbsenteesTable.tsx`
- Create: `apps/web/app/admin/attendance/components/BenchmarkBars.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `ChronicAbsenteesTable.tsx`** (sortable client component)

```tsx
"use client";

import { useMemo, useState } from "react";
import type { ChronicRow } from "@/lib/mock-attendance";

type Sort = "missed" | "section" | "cause";

const STATUS_CHIP: Record<ChronicRow["status"], "bad" | "warn" | "info" | "neutral"> = {
  support: "bad", watch: "warn", excused: "info", contact: "warn",
};

const STATUS_LABEL: Record<ChronicRow["status"], string> = {
  support: "support", watch: "watch", excused: "excused", contact: "contact",
};

export default function ChronicAbsenteesTable({ rows }: { rows: ChronicRow[] }) {
  const [sort, setSort] = useState<Sort>("missed");
  const sorted = useMemo(() => {
    const c = [...rows];
    switch (sort) {
      case "missed":  c.sort((a, b) => b.days_missed - a.days_missed); break;
      case "section": c.sort((a, b) => a.section_code.localeCompare(b.section_code)); break;
      case "cause":   c.sort((a, b) => a.cause.localeCompare(b.cause)); break;
    }
    return c;
  }, [rows, sort]);
  const maxMiss = Math.max(...rows.map(r => r.days_missed), 1);

  return (
    <section className="chronic-card att-block-cohort-only" aria-label="Chronic absentees · this term">
      <header className="chronic-head">
        <div>
          <h3>Chronic absentees · this term</h3>
          <p className="chronic-sub">Students with &gt; 5 days missed. Sort by missed-days, section, or cause.</p>
        </div>
        <div className="chronic-toggle" role="tablist">
          {([["missed","By missed"],["section","By section"],["cause","By cause"]] as Array<[Sort,string]>).map(([k,l]) => (
            <button key={k} type="button" role="tab" aria-selected={sort===k} onClick={() => setSort(k)}
              className={`chronic-pill ${sort===k ? "active" : ""}`}>{l}</button>
          ))}
        </div>
      </header>
      <div className="chronic-tbl-wrap">
        <table className="chronic-tbl">
          <thead>
            <tr><th>Student</th><th>Section</th><th>Missed</th><th>Pattern</th><th>Cause (AI)</th><th>Status</th></tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.student_id}>
                <td className="chronic-nm">{r.student_name}</td>
                <td>{r.section_code}</td>
                <td>
                  <span className="chronic-miss-bar"><span className="chronic-miss-fill" style={{ width: `${(r.days_missed / maxMiss) * 100}%` }} /></span>
                  {" "}{r.days_missed}d
                </td>
                <td>{r.pattern}</td>
                <td>{r.cause}</td>
                <td>
                  <span className={`chip-pill chip-${STATUS_CHIP[r.status]}`} style={{ cursor: "default" }}>{STATUS_LABEL[r.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `BenchmarkBars.tsx`**

```tsx
import type { BenchmarkRow } from "@/lib/mock-attendance";

export default function BenchmarkBars({ rows }: { rows: BenchmarkRow[] }) {
  const max = 100;
  return (
    <section className="bench-card att-block-cohort-only" aria-label="Compared to last term + last year">
      <header className="bench-head">
        <h3>Compared to last term + last year</h3>
        <p className="bench-sub">Are we trending better or worse than ourselves?</p>
      </header>
      <div className="bench-list">
        {rows.map(r => (
          <div key={r.label} className="bench-row">
            <span className="bench-nm">{r.label}</span>
            <div className="bench-bar"><div className={`bench-fill bench-${r.tone}`} style={{ width: `${(r.pct / max) * 100}%` }} /></div>
            <span className="bench-v">{r.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Admin Attendance · Chronic absentees table
   ========================================================================= */
.chronic-card, .bench-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.chronic-head, .bench-head {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px;
  gap: 12px; flex-wrap: wrap;
}
.chronic-head h3, .bench-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.chronic-sub, .bench-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.chronic-toggle { display: flex; gap: 3px; background: var(--color-surface-subtle); border: 1px solid var(--color-border); padding: 2px; border-radius: var(--radius-md); }
.chronic-pill {
  padding: 3px 10px; border-radius: var(--radius-sm); border: 0;
  background: transparent; color: var(--color-muted);
  font-size: 10px; font-weight: var(--font-weight-semibold);
  font-family: inherit; cursor: pointer;
}
.chronic-pill.active { background: var(--color-primary); color: #fff; }
.chronic-tbl-wrap { overflow-x: auto; }
.chronic-tbl { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 720px; }
.chronic-tbl th, .chronic-tbl td { padding: 8px 10px; border-bottom: 1px dashed var(--color-border); text-align: left; }
.chronic-tbl th { background: var(--color-surface-subtle); font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.chronic-nm { font-weight: var(--font-weight-bold); color: var(--color-ink); }
.chronic-miss-bar { display: inline-block; width: 90px; height: 8px; background: var(--color-soft); border-radius: 4px; vertical-align: middle; overflow: hidden; }
.chronic-miss-fill { background: var(--color-danger); height: 100%; display: block; }

/* =========================================================================
   Admin Attendance · Benchmark bars
   ========================================================================= */
.bench-list { display: flex; flex-direction: column; gap: 2px; }
.bench-row { display: grid; grid-template-columns: 200px 1fr 60px; gap: 10px; align-items: center; font-size: 10.5px; padding: 4px 0; }
.bench-nm { color: var(--color-ink); font-weight: var(--font-weight-semibold); }
.bench-bar { background: var(--color-soft); height: 10px; border-radius: 3px; overflow: hidden; }
.bench-fill { height: 100%; }
.bench-fill.bench-us       { background: var(--color-primary); }
.bench-fill.bench-neutral  { background: var(--color-accent); }
.bench-fill.bench-target   { background: #38A169; }
.bench-v { color: var(--color-muted); text-align: right; font-weight: var(--font-weight-bold); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/components apps/web/app/globals.css && git commit -m "Attendance: ChronicAbsenteesTable + BenchmarkBars"
```

---

## Task 7 — Advisor lens · Calendar heat + Lessons missed + Re-engagement draft

**Files:**
- Create: `apps/web/app/admin/attendance/components/PerStudentCalendarHeat.tsx`
- Create: `apps/web/app/admin/attendance/components/LessonsMissedList.tsx`
- Create: `apps/web/app/admin/attendance/components/ReEngagementDraft.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `PerStudentCalendarHeat.tsx`**

```tsx
import type { CalendarRow } from "@/lib/mock-attendance";

export default function PerStudentCalendarHeat({
  weeks, studentName, sectionCode,
}: {
  weeks:       CalendarRow[];
  studentName: string;
  sectionCode: string;
}) {
  return (
    <section className="cal-card att-block-advisor-only" aria-label={`${studentName} · attendance calendar`}>
      <header className="cal-head">
        <h3>{studentName} · attendance calendar · last {weeks.length} weeks</h3>
        <p className="cal-sub">{sectionCode} · green=present, amber=late, red=absent. Each cell is one school day.</p>
      </header>
      <div className="cal-grid">
        {weeks.flatMap((row, wIdx) =>
          row.map((d, dIdx) => (
            <div key={`${wIdx}-${dIdx}`} className={`cal-day cal-${d}`} aria-label={`Week ${wIdx + 1} day ${dIdx + 1}: ${d}`} />
          ))
        )}
      </div>
      <p className="cal-foot">
        <b>Manhaj:</b> Cluster pattern visible — absences concentrate around exam periods. First two clusters excused (medical),
        most recent two unexplained.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: `LessonsMissedList.tsx`**

```tsx
import type { LessonMissed } from "@/lib/mock-attendance";

export default function LessonsMissedList({ rows, studentName }: { rows: LessonMissed[]; studentName: string }) {
  return (
    <section className="lessons-card att-block-advisor-only" aria-label={`What ${studentName} missed`}>
      <header className="lessons-head">
        <h3>What {studentName} missed · last 14 school days</h3>
        <p className="lessons-sub">Lessons missed during absences. Click to send Manhaj-generated catch-up pack.</p>
      </header>
      <ul className="lessons-list">
        {rows.map((l, i) => (
          <li key={i} className="lessons-row">
            <span className="lessons-date">{l.date.slice(5)}</span>
            <span className="lessons-body">
              <b>{l.period} · {l.subject}</b>{" "}<small>{l.teacher} · {l.note}</small>
            </span>
            <button type="button" className="lessons-action" onClick={() => console.log("[catch-up]", l)}>▸ catch-up pack</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `ReEngagementDraft.tsx`** (client component for the button handlers)

```tsx
"use client";

import type { ReEngagementDraft } from "@/lib/mock-attendance";

export default function ReEngagementDraft({ draft }: { draft: ReEngagementDraft }) {
  return (
    <section className="draft-card att-block-advisor-only" aria-label="Re-engagement message · AI draft">
      <header className="draft-head">
        <h3>Re-engagement message · AI draft</h3>
        <p className="draft-sub">Manhaj drafts using the 17-template catalog. Teacher / advisor reviews before send.</p>
      </header>
      <div className="draft-box">
        <div className="draft-meta">To: {draft.to} · Template: <code>{draft.template_id}</code></div>
        <div className="draft-subject">{draft.subject}</div>
        <div className="draft-body">
          {draft.body.split("\n").map((line, i) => <p key={i} className="draft-line">{line || " "}</p>)}
        </div>
        <div className="draft-actions">
          <button type="button" className="draft-btn draft-ghost" onClick={() => console.log("[draft] edit")}>Edit</button>
          <button type="button" className="draft-btn draft-ghost" onClick={() => console.log("[draft] regenerate")}>Regenerate</button>
          <button type="button" className="draft-btn draft-primary" onClick={() => console.log("[draft] send", draft)}>Send via email</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: CSS**

```css
/* =========================================================================
   Admin Attendance · Per-student calendar heat
   ========================================================================= */
.cal-card, .lessons-card, .draft-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.cal-head, .lessons-head, .draft-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.cal-head h3, .lessons-head h3, .draft-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.cal-sub, .lessons-sub, .draft-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.cal-grid {
  display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; margin-top: 6px;
}
@media (max-width: 700px) { .cal-grid { grid-template-columns: repeat(10, 1fr); } }
.cal-day { aspect-ratio: 1; border-radius: 2px; min-height: 14px; }
.cal-day.cal-p { background: #38A169; }
.cal-day.cal-l { background: var(--color-warn); }
.cal-day.cal-a { background: var(--color-danger); }
.cal-day.cal-x { background: var(--color-border); }
.cal-foot { font-size: 10.5px; color: var(--color-muted); margin-top: 10px; line-height: 1.5; }
.cal-foot b { color: var(--color-ink); }

/* =========================================================================
   Admin Attendance · Lessons missed list
   ========================================================================= */
.lessons-list { list-style: none; padding: 0; margin: 0; background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px 10px; }
.lessons-row { display: grid; grid-template-columns: 60px 1fr 110px; gap: 10px; padding: 6px 0; font-size: 10.5px; align-items: center; border-bottom: 1px dashed var(--color-border); }
.lessons-row:last-child { border-bottom: 0; }
.lessons-date { font-weight: var(--font-weight-bold); color: var(--color-danger); font-size: 9.5px; }
.lessons-body { color: var(--color-ink); }
.lessons-body small { color: var(--color-muted); }
.lessons-action {
  background: var(--color-info-soft); color: var(--color-info-text);
  border: 0; border-radius: var(--radius-sm);
  font-size: 9.5px; font-weight: var(--font-weight-bold); padding: 4px 8px; cursor: pointer; font-family: inherit;
}

/* =========================================================================
   Admin Attendance · Re-engagement draft
   ========================================================================= */
.draft-box {
  background: var(--color-surface-subtle); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px;
}
.draft-meta { font-size: 10px; color: var(--color-muted); text-transform: uppercase; letter-spacing: .04em; font-weight: var(--font-weight-bold); margin-bottom: 6px; }
.draft-meta code { background: var(--color-soft); padding: 1px 5px; border-radius: 3px; font-size: 10.5px; color: var(--color-info-text); }
.draft-subject { font-size: 12px; font-weight: var(--font-weight-bold); color: var(--color-ink); margin-bottom: 8px; }
.draft-body {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); padding: 10px 12px; font-size: 11.5px; line-height: 1.55; color: var(--color-ink);
}
.draft-line { margin: 0 0 6px; }
.draft-actions { display: flex; gap: 6px; margin-top: 8px; }
.draft-btn { font-size: 10px; padding: 5px 10px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); cursor: pointer; border: 0; font-family: inherit; }
.draft-primary { background: var(--color-primary); color: #fff; }
.draft-ghost   { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/components apps/web/app/globals.css && git commit -m "Attendance · advisor lens: PerStudentCalendarHeat + LessonsMissedList + ReEngagementDraft"
```

---

## Task 8 — Teacher lens · `<TakeAttendanceUI />`

**Files:**
- Create: `apps/web/app/admin/attendance/components/TakeAttendanceUI.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `TakeAttendanceUI.tsx`** (client component, state per student)

```tsx
"use client";

import { useState } from "react";
import type { RollCallRow, RollCallStatus } from "@/lib/mock-attendance";

export default function TakeAttendanceUI({ rows, sectionCode }: { rows: RollCallRow[]; sectionCode: string }) {
  const initial: Record<string, RollCallStatus | undefined> = {};
  for (const r of rows) {
    if (r.preset_flag === "medical" || r.preset_flag === "religious" || r.preset_flag === "transport") {
      initial[r.student_id] = "A";
    }
  }
  const [state, setState] = useState<Record<string, RollCallStatus | undefined>>(initial);

  function set(id: string, status: RollCallStatus) {
    setState(prev => ({ ...prev, [id]: prev[id] === status ? undefined : status }));
  }

  return (
    <section className="roll-card att-block-teacher-only" aria-label={`Take attendance · ${sectionCode} today`}>
      <header className="roll-head">
        <h3>Take attendance · {sectionCode} · P3 today</h3>
        <p className="roll-sub">Click P / L / A. Auto-fills from system flags (known medical, religious, etc.). One tap per student.</p>
      </header>
      <div className="roll-list">
        {rows.map(r => {
          const active = state[r.student_id];
          return (
            <div key={r.student_id} className="roll-row">
              <span className="roll-nm">{r.student_name}</span>
              {(["P","L","A"] as RollCallStatus[]).map(opt => (
                <button
                  key={opt} type="button"
                  className={`roll-btn roll-${opt.toLowerCase()} ${active === opt ? "active" : ""}`}
                  aria-pressed={active === opt}
                  onClick={() => set(r.student_id, opt)}
                >{opt}</button>
              ))}
              {r.preset_flag && (
                <span className="roll-preset">{r.preset_flag} · {r.preset_date}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="roll-foot"><b>Manhaj:</b> Pre-flagged absences are auto-filled from yesterday's medical / religious notes. Parents already informed.</p>
    </section>
  );
}
```

- [ ] **Step 2: CSS**

```css
/* =========================================================================
   Admin Attendance · Take attendance (teacher lens)
   ========================================================================= */
.roll-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.roll-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.roll-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.roll-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.roll-list { background: var(--color-surface-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px 0; }
.roll-row { display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 4px; padding: 5px 10px; border-bottom: 1px dashed var(--color-border); align-items: center; font-size: 11px; }
.roll-row:last-child { border-bottom: 0; }
.roll-nm { color: var(--color-ink); font-weight: var(--font-weight-semibold); }
.roll-btn { font-size: 9.5px; padding: 3px 9px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); cursor: pointer; min-width: 28px; text-align: center; border: 1px solid var(--color-border); background: var(--color-card); color: var(--color-muted); font-family: inherit; }
.roll-btn:hover { background: var(--color-soft); }
.roll-btn.active.roll-p { background: #38A169; color: #fff; border-color: #38A169; }
.roll-btn.active.roll-l { background: var(--color-warning-soft); color: var(--color-warning-text); border-color: var(--color-warning-soft-border); }
.roll-btn.active.roll-a { background: var(--color-danger-soft); color: var(--color-danger-text); border-color: var(--color-danger-soft-border); }
.roll-preset { font-size: 9px; color: var(--color-muted); }
.roll-foot { font-size: 10.5px; color: var(--color-muted); margin-top: 10px; }
.roll-foot b { color: var(--color-ink); }
```

- [ ] **Step 3: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/components apps/web/app/globals.css && git commit -m "Attendance · teacher lens: TakeAttendanceUI"
```

---

## Task 9 — Page assembly + lens-aware wrapper

**Files:**
- Modify: `apps/web/app/admin/attendance/page.tsx`
- Modify: `apps/web/app/globals.css` (KPI row + lens CSS)

- [ ] **Step 1: Replace `page.tsx`** with the full assembly:

```tsx
"use client";

import { useState } from "react";

import {
  ATT_DAILY, ATT_EVENTS, ATT_DOW, ATT_PERIODS, ATT_CAUSES, ATT_SECTIONS,
  ATT_SUBJECTS, ATT_CHRONIC, ATT_BENCHMARK, ATT_CAL_OMAR, ATT_LESSONS,
  ATT_DRAFT_OMAR, ATT_ROLL_10A, ATT_KPIS,
} from "@/lib/mock-attendance";
import { attendanceCohortSummary } from "@/lib/summary";

import AiBriefingHeader from "../../components/AiBriefingHeader";
import BreadcrumbLensBar, { type Lens } from "../../components/BreadcrumbLensBar";
import FilterChipRow, { type Chip } from "../../components/FilterChipRow";
import TrendChart from "../../components/TrendChart";

import DayOfWeekHeatmap        from "./components/DayOfWeekHeatmap";
import PeriodBars              from "./components/PeriodBars";
import AiCausesCards           from "./components/AiCausesCards";
import SectionHeatStrip        from "./components/SectionHeatStrip";
import SubjectCorrelation      from "./components/SubjectCorrelation";
import ChronicAbsenteesTable   from "./components/ChronicAbsenteesTable";
import BenchmarkBars           from "./components/BenchmarkBars";
import PerStudentCalendarHeat  from "./components/PerStudentCalendarHeat";
import LessonsMissedList       from "./components/LessonsMissedList";
import ReEngagementDraft       from "./components/ReEngagementDraft";
import TakeAttendanceUI        from "./components/TakeAttendanceUI";

export default function AdminAttendancePage() {
  const summary = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
  const [lens, setLens] = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const chips: Chip[] = [
    { key: "today",     label: "Today",                              tone: "neutral", active: active === "today" },
    { key: "week",      label: "This week",                          tone: "neutral", active: active === "week"  },
    { key: "month",     label: "This month",                         tone: "neutral", active: active === "month" },
    { key: "chronic",   label: `Chronic · ${ATT_KPIS.chronic_count}`, tone: "warn",    active: active === "chronic" },
    { key: "late",      label: `Late · ${ATT_KPIS.late_today_count}`, tone: "warn",    active: active === "late" },
    { key: "unexcused", label: "Unexcused · 7",                      tone: "bad",     active: active === "unexcused" },
    { key: "medical",   label: "Medical · 12",                       tone: "info",    active: active === "medical" },
    { key: "religious", label: "Religious / cultural · 3",           tone: "neutral", active: active === "religious" },
    { key: "transport", label: "Transport · 2",                      tone: "neutral", active: active === "transport" },
  ];

  return (
    <div className={`container att-page lens-${lens}`}>
      <BreadcrumbLensBar
        steps={[{ label: "School" }, { label: "HS", active: true }]}
        lens={lens}
        onLensChange={setLens}
      />

      <AiBriefingHeader summary={summary} />

      <div className="att-kpi-row">
        <div className="att-kpi-card"><div className="att-kpi-l">This week</div><div className="att-kpi-v">{ATT_KPIS.this_week_pct.toFixed(1)}<span className="att-kpi-suffix">%</span></div><div className="att-kpi-d">— flat vs last</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Chronic absentees</div><div className="att-kpi-v att-kpi-bad">{ATT_KPIS.chronic_count}</div><div className="att-kpi-d">▲ +2 since April</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Late arrivals today</div><div className="att-kpi-v att-kpi-warn">{ATT_KPIS.late_today_count}</div><div className="att-kpi-d">across 8 sections</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Sub coverage needed</div><div className="att-kpi-v att-kpi-warn">{ATT_KPIS.sub_coverage}</div><div className="att-kpi-d">today + tomorrow</div></div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      {/* Cohort lens blocks (Principal default) */}
      <div className="att-block-cohort-only">
        <TrendChart points={ATT_DAILY} markers={ATT_EVENTS} target={95} title="Attendance trend · last 30 school days" />
      </div>
      <DayOfWeekHeatmap rows={ATT_DOW} />
      <PeriodBars rows={ATT_PERIODS} />
      <AiCausesCards rows={ATT_CAUSES} />
      <SectionHeatStrip rows={ATT_SECTIONS} />
      <SubjectCorrelation rows={ATT_SUBJECTS} />
      <ChronicAbsenteesTable rows={ATT_CHRONIC} />
      <BenchmarkBars rows={ATT_BENCHMARK} />

      {/* Advisor lens — per-student drill */}
      <PerStudentCalendarHeat weeks={ATT_CAL_OMAR} studentName="Omar Saadi" sectionCode="11 AS" />
      <LessonsMissedList rows={ATT_LESSONS} studentName="Omar" />
      <ReEngagementDraft draft={ATT_DRAFT_OMAR} />

      {/* Teacher lens — roll call */}
      <TakeAttendanceUI rows={ATT_ROLL_10A} sectionCode="10A" />
    </div>
  );
}
```

- [ ] **Step 2: Append CSS for the KPI row and lens-driven block visibility**:

```css
/* =========================================================================
   Admin Attendance · KPI row + lens-driven block visibility
   ========================================================================= */
.att-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: var(--space-3); }
@media (max-width: 700px) { .att-kpi-row { grid-template-columns: repeat(2, 1fr); } }
.att-kpi-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 12px; }
.att-kpi-l { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.att-kpi-v { font-size: 20px; font-weight: var(--font-weight-black); color: var(--color-primary); line-height: 1.1; margin-top: 4px; }
.att-kpi-suffix { font-size: 13px; color: var(--color-muted); font-weight: var(--font-weight-semibold); }
.att-kpi-d { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
.att-kpi-v.att-kpi-bad  { color: var(--color-danger); }
.att-kpi-v.att-kpi-warn { color: var(--color-warning); }

/* Lens-driven block visibility */
.att-page.lens-principal .att-block-advisor-only,
.att-page.lens-principal .att-block-teacher-only,
.att-page.lens-advisor   .att-block-cohort-only,
.att-page.lens-advisor   .att-block-teacher-only,
.att-page.lens-teacher   .att-block-cohort-only,
.att-page.lens-teacher   .att-block-advisor-only { display: none; }
```

- [ ] **Step 3: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -30
```
Expect: build green, `/admin/attendance` listed as dynamic (because of useState).

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/attendance/page.tsx apps/web/app/globals.css && git commit -m "/admin/attendance: page assembly · 16 blocks · lens-driven visibility"
```

---

## Task 10 — Verification + push + memory

- [ ] **Step 1: Full test suite + tsc + lint + build**

```bash
cd ~/dev/manhaj/apps/web && npm test && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -30
```
All clean. ~46 total tests pass (31 prior + 10 attendance fixture + 5 attendance summary).

- [ ] **Step 2: Visual smoke** — run dev server, open `/admin/attendance` at 1280 px:
   - All 8 cohort blocks visible by default (Principal lens).
   - Click "Student Advisor" pill → cohort blocks hide, calendar heat + lessons + draft visible.
   - Click "Teacher" pill → only take-attendance roll call visible (+ AI briefing + KPIs + chips).
   - Trend chart axis-anchored target marker green arrow flush against the Y-axis. No dashed line crossing the data.
   - Numbered markers 1/2/3 on the trend line with legend pills below.

- [ ] **Step 3: Push**

```bash
cd ~/dev/manhaj && git push origin main
```

- [ ] **Step 4: Update memory** at `~/.claude/projects/.../memory/project_school_ops_decisions.md` with a new top-of-file entry.

---

## Self-review

| Spec section | Plan task |
|---|---|
| §5 fixture + types | Task 1 |
| §6 cohort summary | Task 2 |
| §8 TrendChart | Task 3 |
| §8 DOW + Periods + Causes | Task 4 |
| §8 SectionHeatStrip + SubjectCorrelation | Task 5 |
| §8 ChronicAbsenteesTable + BenchmarkBars | Task 6 |
| §8 Advisor drill (calendar + lessons + draft) | Task 7 |
| §8 Teacher TakeAttendanceUI | Task 8 |
| §9 page assembly + lens CSS | Task 9 |
| §10 acceptance criteria | Task 10 |

Type names match across tasks. No "TBD" / placeholder language. Lens behaviour is CSS-only — no conditional rendering, no hydration risk.
