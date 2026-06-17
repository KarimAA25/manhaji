# Student · Homework + My Schedule tabs — Spec (Phase 2.8)

**Goal.** Replace the last two student-persona placeholders (`/student/homework` and `/student/schedule`) with real, student-eye content. Layla Al-Habsi (10A) is the demo student. Single phase, two tabs.

**Audience.** Student (Layla, Y10). Demo identity hard-coded in the layout already.

**Data.** Two static fixtures (`lib/mock-homework.ts`, `lib/mock-student-schedule.ts`). No schema.

---

## 1. Homework tab — 4 blocks

1. **KpiRow** — 4 pills:
   - Overdue (`1`, danger if > 0)
   - Due in 24h (`3`, warn)
   - In progress (`2`)
   - Done this week (`7`, good)

2. **DueSoonBanner** — single highlight card for the most-urgent overdue or due-today item:
   - Subject + title + due (e.g. *"Maths · Algebra worksheet · OVERDUE 1 day"*).
   - AI nudge line (e.g. *"Likely 35 min · same difficulty as last week's quiz."*).
   - "Mark done" + "Open catch-up pack" ghost buttons (no-ops).

3. **HomeworkList** — full to-do list, grouped by status:
   - Group order: Overdue → Due today → Due this week → Later → Done.
   - Each row: subject pill, title, due chip, status pill (`overdue` / `due-today` / `not-started` / `in-progress` / `done`), AI estimate ("~25 min · similar to Apr 12 quiz") on the second line.

4. **CompletionTrend** — small SVG bar chart, last 4 weeks: `Wk -3` to `Wk 0`, % of items completed on time. Caption explains the trend.

## 2. My Schedule tab — 3 blocks

1. **NowCard** — large card showing the *current* period for Layla (using a fixed `DEMO_NOW = 2026-05-27T10:35:00+04:00` so the demo is deterministic):
   - Current period (e.g. *"P3 · Maths · Mr Faisal · R201"*).
   - Time remaining (*"22 min left of P3"*).
   - "What to bring": list (e.g. calculator, geometry set, notebook).
   - Next-up preview line (P4 · Break · 10 min → P5 · etc.).

2. **TodayTimeline** — 7-row vertical timeline for today (Wed):
   - Each row = one period.
   - Visual state: done (greyed + ✓), now (highlighted with primary border + pulse-free), upcoming (default).
   - Shows subject · teacher · room.
   - Break / lunch rows styled differently.

3. **WeekView** — 5 columns Mon-Fri, 7 rows per column, condensed cells:
   - Each cell = subject abbreviation + room number.
   - Today's column gets a primary-color top border.
   - "Today" tag pinned to current period cell.

---

## 3. Fixture shapes

`lib/mock-homework.ts`:
```ts
type HomeworkStatus = "overdue" | "due-today" | "not-started" | "in-progress" | "done";

type HomeworkItem = {
  id:        string;
  subject:   string;     // "Maths"
  title:     string;     // "Algebra worksheet"
  due:       string;     // ISO date+time
  status:    HomeworkStatus;
  ai_estimate: string;   // "~25 min · similar to Apr 12 quiz"
  catch_up_pack?: boolean;
};

type WeekCompletion = { week_label: string; on_time_pct: number };
```

`lib/mock-student-schedule.ts`:
```ts
type StudentPeriod = {
  period:  string;       // "P1" / "P2" / ... / "BR" / "LUNCH"
  day:     string;       // "Mon"..."Fri"
  subject: string;
  teacher?: string;
  room?:    string;
  bring?:   string[];
  state?:  "break" | "lunch";
};

const DEMO_NOW = "2026-05-27T10:35:00+04:00";  // Wed P3
```

Helpers:
- `homeworkKpis(items)` → KPI counts.
- `mostUrgent(items)` → first overdue or due-today.
- `groupByStatus(items)` → ordered groups for HomeworkList.
- `currentPeriod(periods, now)` → `{ current, next, minutes_left }`.
- `periodsForDay(periods, day)` → 7 rows.

---

## 4. Acceptance criteria

- All 4 + 3 = 7 blocks render on the two tabs.
- TopNav stays on the right tab when switching between Homework / Schedule.
- KpiRow / DueSoonBanner / HomeworkList / CompletionTrend on `/student/homework`.
- NowCard / TodayTimeline / WeekView on `/student/schedule`.
- 10+ tests total across both fixtures + helpers.
- tsc clean, lint 0 errors, build green.

---

## 5. Deferred

- Real submission flow + file uploads.
- Live "right now" computed from real `now` (currently frozen DEMO_NOW for determinism).
- Catch-up pack drawer content.
- Push notifications / next-class reminders.
