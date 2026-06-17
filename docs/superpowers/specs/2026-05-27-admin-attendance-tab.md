# Admin · Attendance tab · design spec (Phase 2.2)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) |
| **Brainstorm mockup** | `~/dev/manhaj/.superpowers/brainstorm/.../content/attendance-deep.html` + `attendance-trend-fix-v2.html` |

---

## 1. Background

Phase 1 left `/admin/attendance` as a `<PlaceholderPage />`. This spec turns it into a full-fidelity demo page covering every block the principal saw in the brainstorm — **Maximalist scope (all 16 features)** — backed by synthetic data in `lib/mock-attendance.ts`. The trend chart adopts the axis-anchored target marker pattern the user explicitly approved during brainstorm (no dashed line crossing the data).

## 2. Goals

1. **All 16 brainstorm blocks** render against synthetic data — cohort patterns, per-section drill, chronic absentees + benchmarks, per-student advisor drill, teacher take-attendance roll call.
2. **Lens toggle is meaningful.** Principal lens shows cohort + drill blocks. Advisor lens emphasises per-student drill. Teacher lens shows the take-attendance UI. Toggling hides irrelevant blocks rather than gating routes.
3. **Reusable `<TrendChart />`** for time-series with calendar-anchored event markers + axis-anchored target marker. Same component is used by Reports + future Finance.

## 3. Non-goals (this PR)

- Real Supabase RPC, schema changes, or live attendance feed.
- Click-to-drill from cohort heat-strip into a section's daily grid (drill blocks render against a hard-coded "current selection" student/section for now).
- Sending the AI-drafted re-engagement message (button logs to console — wired to Resend in Phase 2.4 Parent Messages).
- Editing the calendar heat or per-day attendance state (read-only display).
- Mobile-first redesign — page works at 375 px but uses horizontal-scroll fallbacks for heavy tables / heatmaps.

## 4. Decisions (resolved at scope check)

| # | Question | Decision |
|---|---|---|
| 1 | Scope | **Maximalist** — all 16 features in one PR. |
| 2 | Data source | New `apps/web/lib/mock-attendance.ts`. References students by ID from `lib/mock-students.ts`. |
| 3 | Trend chart pattern | Numbered event markers on the line + axis-anchored green arrow + "Target 95%" label + subtle pink below-target tint. **No dashed line crossing the chart.** |
| 4 | Lens behaviour | Component shows / hides per lens via a CSS class on the wrapper (`<div className="att-page lens-{lens}">`). No conditional rendering — keeps the DOM stable + a11y consistent. |
| 5 | Cause confidence | 2 levels — `high` (green) and `medium` (amber). No "low" tier. |
| 6 | Per-student drill identity | Hard-codes Omar Saadi (from `MOCK_STUDENTS`) since the advisor blocks need a single subject. Lens toggle on the page reveals these blocks; selecting a different student is deferred. |

## 5. File map

**Create:**

| Path | Role |
|---|---|
| `apps/web/lib/mock-attendance.ts` | Fixture: daily aggregates, day-of-week, period-of-day, causes, sections, subjects, chronic absentees, benchmarks, calendar heat, lessons missed, today's roll-call |
| `apps/web/lib/attendance.test.ts` | Vitest tests for the fixture + cohortSummary additions |
| `apps/web/app/components/TrendChart.tsx` | Reusable SVG line chart with axis-anchored target + numbered markers |
| `apps/web/app/admin/attendance/components/DayOfWeekHeatmap.tsx` | 6-week × Mon-Fri grid |
| `apps/web/app/admin/attendance/components/PeriodBars.tsx` | P1-P7 vertical bars |
| `apps/web/app/admin/attendance/components/AiCausesCards.tsx` | 4 cause cards with confidence chip |
| `apps/web/app/admin/attendance/components/SectionHeatStrip.tsx` | Per-section weekly bars (green/amber/red) |
| `apps/web/app/admin/attendance/components/SubjectCorrelation.tsx` | Subject × hours-missed bars |
| `apps/web/app/admin/attendance/components/ChronicAbsenteesTable.tsx` | Sortable table with pattern + cause + status |
| `apps/web/app/admin/attendance/components/BenchmarkBars.tsx` | This-term vs last vs YoY vs target |
| `apps/web/app/admin/attendance/components/PerStudentCalendarHeat.tsx` | 20-week × 5-day grid, present/late/absent/no-school |
| `apps/web/app/admin/attendance/components/LessonsMissedList.tsx` | Lessons missed during a student's last 14 days |
| `apps/web/app/admin/attendance/components/ReEngagementDraft.tsx` | AI-drafted parent message editor preview |
| `apps/web/app/admin/attendance/components/TakeAttendanceUI.tsx` | Today's roll call (P/L/A buttons) |

**Modify:**

- `apps/web/lib/summary.ts` — add `attendanceCohortSummary(...)` export
- `apps/web/lib/summary.test.ts` — tests for the new summary
- `apps/web/app/admin/attendance/page.tsx` — replace placeholder with the assembled page
- `apps/web/app/globals.css` — append CSS blocks for each new component

## 6. Data shape

`apps/web/lib/mock-attendance.ts` exports:

```ts
// Aggregates
export type DailyPoint   = { date: string; pct: number };           // 30 entries
export type DayOfWeekRow = { week_label: string; mon: number; tue: number; wed: number; thu: number; fri: number };
export type PeriodAvg    = { period: 1|2|3|4|5|6|7; pct: number };

export type EventMarker  = { id: number; date: string; label: string; tone: "muted" | "neutral" | "warn" };  // 3-4 entries

export type CauseCard    = { id: string; title: string; body: string; confidence: "high" | "medium" };

// Section / subject
export type SectionWeekRow = { section_code: string; days: Array<"good"|"watch"|"bad">; week_pct: number };  // 5 days
export type SubjectMiss    = { subject: string; hours_missed: number };

// Chronic absentees
export type ChronicRow = {
  student_id:  string;       // refs MOCK_STUDENTS
  student_name: string;
  section_code: string;
  days_missed:  number;
  pattern:      string;       // "Mondays + post-exam"
  cause:        string;       // "Disengagement", "Medical (flu)", "Religious", "Unknown"
  status:       "support" | "watch" | "excused" | "contact";
};

// Benchmark
export type BenchmarkRow = { label: string; pct: number; tone: "us" | "neutral" | "target" };

// Per-student drill
export type CalendarDay = "p" | "l" | "a" | "x";  // present / late / absent / no-school
export type CalendarRow = CalendarDay[];           // 5 days per week
export type LessonMissed = { date: string; period: string; subject: string; teacher: string; note: string };

// AI draft
export type ReEngagementDraft = {
  to:         string;
  template_id: string;
  subject:    string;
  body:       string;          // markdown-friendly newline-separated
};

// Take attendance
export type RollCallStatus = "P" | "L" | "A";
export type RollCallRow    = {
  student_id:    string;
  student_name:  string;
  preset_flag?:  "medical" | "religious" | "transport";
  preset_date?:  string;
};

// KPI numbers (precomputed for the page)
export type AttendanceKpis = {
  this_week_pct:     number;     // 96.2
  chronic_count:     number;     // 5
  late_today_count:  number;     // 14
  sub_coverage:      number;     // 2
};

// Exports
export const ATT_DAILY:      DailyPoint[];           // 30 entries, last 30 school days
export const ATT_EVENTS:     EventMarker[];          // 3 entries
export const ATT_DOW:        DayOfWeekRow[];         // 6 weeks
export const ATT_PERIODS:    PeriodAvg[];            // P1-P7
export const ATT_CAUSES:     CauseCard[];            // 4 cards
export const ATT_SECTIONS:   SectionWeekRow[];       // 6 sections (HS focus)
export const ATT_SUBJECTS:   SubjectMiss[];          // 5 subjects
export const ATT_CHRONIC:    ChronicRow[];           // 5 rows
export const ATT_BENCHMARK:  BenchmarkRow[];         // 4 rows (this term / last term / YoY / target)
export const ATT_CAL_OMAR:   CalendarRow[];          // 20 weeks for Omar Saadi
export const ATT_LESSONS:    LessonMissed[];         // ~4 entries
export const ATT_DRAFT_OMAR: ReEngagementDraft;
export const ATT_ROLL_10A:   RollCallRow[];          // today's 10A roster
export const ATT_KPIS:       AttendanceKpis;
```

**Realism rules:**
- Daily series: smooth band around 95-97% with one big dip on the Eid marker (~70%), a mid-term week-mark dip (~83%), and a recent illness-spike dip (~88%).
- Day-of-week pattern: Monday consistently 2-3 points below the week mean.
- Period-of-day: P1 and P7 lowest (~91-93%), P2-P5 peak (~96-97%).
- 4 cause cards: flu cluster (high), Monday dip (high), transport delay (medium), religious/cultural (high).
- 5 chronic absentees match `MOCK_STUDENTS` ids; Omar Saadi at the top with 12 days missed.
- Benchmark: this-term 96.2 / last-term 94.1 / YoY 93.7 / target 95.
- Omar's 20-week calendar heat: ~12 absences clustered in 4 blocks; first two excused (medical), last two unexplained; pattern intensifies near exam periods.

## 7. AI cohort summary additions

`lib/summary.ts` gets `attendanceCohortSummary(...)`:

```ts
export function attendanceCohortSummary(
  daily:    DailyPoint[],
  causes:   CauseCard[],
  sections: SectionWeekRow[],
  chronic:  ChronicRow[],
  kpis:     AttendanceKpis,
): Summary;
```

Rules:
- **headline**: prioritise `worst_section` (any section with `week_pct < 90`) → "{section} at {pct}% · likely cause: {primary high-confidence cause}". Otherwise fall back to "Attendance steady at {weekly_pct}% — no sections below 90."
- **today**: `{late_today_count} late arrivals across {sub_coverage} sub-need slots.`
- **this_week**: `{recent incidents count} chronic absentees flagged · day-of-week dip on Mondays.`
- **this_month**: `Composite vs target {target}% (last month + delta)`.
- **ai_suggested_action**: if any section below 90 → "Review {section} parent comms before Friday." Otherwise undefined.

Tests cover each branch + fallback.

## 8. Lens behaviour

Wrapper class on the page root: `att-page lens-principal | lens-advisor | lens-teacher`.

CSS rules show / hide blocks:

```
.lens-principal .att-block-advisor-only { display: none; }
.lens-principal .att-block-teacher-only { display: none; }
.lens-advisor   .att-block-cohort-only  { display: none; }
.lens-advisor   .att-block-teacher-only { display: none; }
.lens-teacher   .att-block-cohort-only  { display: none; }
.lens-teacher   .att-block-advisor-only { display: none; }
```

Block class assignment:
- **Cohort-only** (`.att-block-cohort-only`): TrendChart, DayOfWeekHeatmap, PeriodBars, AiCausesCards, SectionHeatStrip, SubjectCorrelation, ChronicAbsenteesTable, BenchmarkBars
- **Advisor-only** (`.att-block-advisor-only`): PerStudentCalendarHeat, LessonsMissedList, ReEngagementDraft
- **Teacher-only** (`.att-block-teacher-only`): TakeAttendanceUI
- **Always visible**: Breadcrumb + lens bar, AI strip, 4 KPIs, 9 chips

## 9. Acceptance criteria

- [ ] `/admin/attendance` renders all 16 blocks against synthetic data — no `<PlaceholderPage />` import.
- [ ] Lens toggle hides irrelevant blocks correctly per §8.
- [ ] Trend chart has axis-anchored green target marker (no dashed line crossing the data) + numbered event markers + legend with calendar-anchored labels.
- [ ] AI causes cards show confidence chips (high / medium).
- [ ] Chronic absentees table sortable by missed days (default), risk, cause.
- [ ] Omar Saadi's per-student calendar heat shows ~12 absences in 4 clusters.
- [ ] Re-engagement draft has Send / Edit / Regenerate buttons (log to console).
- [ ] Take-attendance UI lets the user pick P/L/A per student (state in component-local React; not persisted).
- [ ] `npm test` passes (31 prior + new attendance fixture tests + new summary tests).
- [ ] tsc clean, lint clean, build green.
- [ ] Visual smoke at 1280 px matches the brainstorm mockup. Mobile 375 px: page scrolls cleanly with horizontal-scroll fallbacks for heat-strip + chronic table.

## 10. Risks

| Risk | Mitigation |
|---|---|
| 12 new components is a lot for one PR | Tasks batched by visual section in the plan — 7 implementation tasks, not 12. |
| Trend chart SVG hand-tuning fragile | Component takes a normalised data shape; the SVG coordinates are derived. Verify visually before committing. |
| Lens-driven CSS class on the root makes hydration tricky | Root wrapper is server-rendered with the default lens (`principal`); a tiny client component swaps the class on user interaction. No hydration mismatch. |
| Mock data > 600 lines might be hard to scan | Section banners in `mock-attendance.ts` separate logical chunks; types listed at the top. |

---

## 11. Self-review

- ✓ No "TBD" / placeholder language.
- ✓ Internal consistency: types in §6 match imports in §9 and §10.
- ✓ Scope: 16 blocks per Maximalist. Subject correlation, benchmark, per-student drill, lessons missed, re-engagement draft, take-attendance all explicit.
- ✓ Lens toggle behaviour explicit per §8 — uses CSS, not conditional rendering.
- ✓ Reusable `<TrendChart />` placed in `app/components/`, not `app/admin/attendance/components/` — flagged for sharing.

Ready to write the plan.
