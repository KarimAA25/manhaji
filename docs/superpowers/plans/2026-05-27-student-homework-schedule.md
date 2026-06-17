# Student · Homework + My Schedule · Implementation Plan (Phase 2.8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build 4 blocks on `/student/homework` + 3 blocks on `/student/schedule`. Pure UI — no schema. Demo student = Layla (10A). Deterministic `DEMO_NOW`.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-student-homework-schedule.md`](../specs/2026-05-27-student-homework-schedule.md)

---

## File map

**Create:**
- `apps/web/lib/mock-homework.ts` + `apps/web/lib/homework.test.ts`
- `apps/web/lib/mock-student-schedule.ts` + `apps/web/lib/student-schedule.test.ts`
- `apps/web/app/student/homework/components/{KpiRow,DueSoonBanner,HomeworkList,CompletionTrend}.tsx`
- `apps/web/app/student/schedule/components/{NowCard,TodayTimeline,WeekView}.tsx`

**Modify:**
- `apps/web/app/student/homework/page.tsx`
- `apps/web/app/student/schedule/page.tsx`
- `apps/web/app/globals.css`

---

## Task 1 — Homework fixture + tests

**Files:** `apps/web/lib/mock-homework.ts` + `apps/web/lib/homework.test.ts`

- [ ] **Step 1: `mock-homework.ts`**

```ts
/**
 * Manhaj Phase 2.8 demo fixture — synthetic homework list for Layla (10A).
 * Mirrors a future RPC return.
 */

export type HomeworkStatus = "overdue" | "due-today" | "not-started" | "in-progress" | "done";

export type HomeworkItem = {
  id:           string;
  subject:      string;
  title:        string;
  due:          string;       // ISO
  status:       HomeworkStatus;
  ai_estimate:  string;
  catch_up_pack?: boolean;
};

export type WeekCompletion = { week_label: string; on_time_pct: number };

export const DEMO_HW_TODAY = "2026-05-27";

export const MOCK_HOMEWORK: HomeworkItem[] = [
  { id: "hw-1", subject: "Maths",     title: "Algebra worksheet · Ch 7",
    due: "2026-05-26T16:00:00+04:00", status: "overdue",
    ai_estimate: "~35 min · same difficulty as last week's quiz.",
    catch_up_pack: true },
  { id: "hw-2", subject: "English",   title: "Essay draft: 'A character I admire'",
    due: "2026-05-27T20:00:00+04:00", status: "due-today",
    ai_estimate: "~45 min · 300-400 words · use the planning sheet first." },
  { id: "hw-3", subject: "Chemistry", title: "Lab write-up · titration",
    due: "2026-05-27T23:59:00+04:00", status: "in-progress",
    ai_estimate: "~25 min left · you've done the data table." },
  { id: "hw-4", subject: "Arabic",    title: "Vocabulary list · Unit 12",
    due: "2026-05-28T08:00:00+04:00", status: "due-today",
    ai_estimate: "~15 min · 20 words." },
  { id: "hw-5", subject: "Biology",   title: "Read pp 142-150 + answer Q1-Q4",
    due: "2026-05-29T08:00:00+04:00", status: "not-started",
    ai_estimate: "~30 min reading + ~15 min questions." },
  { id: "hw-6", subject: "History",   title: "Source-analysis Q3 from sheet",
    due: "2026-05-30T16:00:00+04:00", status: "not-started",
    ai_estimate: "~20 min · use the source pack on Manhaj." },
  { id: "hw-7", subject: "Physics",   title: "Problem set 11.2 (skip Q5)",
    due: "2026-06-02T16:00:00+04:00", status: "in-progress",
    ai_estimate: "~40 min remaining · stuck on Q3? Try the worked example." },

  // Done this week
  { id: "hw-8",  subject: "English",  title: "Reading log entry",
    due: "2026-05-25T20:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-9",  subject: "Maths",    title: "Quiz prep · linear equations",
    due: "2026-05-24T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-10", subject: "Geography",title: "Map labelling · Middle East",
    due: "2026-05-24T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-11", subject: "Arabic",   title: "Recitation practice",
    due: "2026-05-23T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-12", subject: "Chemistry",title: "Pre-lab questions",
    due: "2026-05-22T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-13", subject: "PE",       title: "Fitness log entry",
    due: "2026-05-22T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-14", subject: "ICT",      title: "Spreadsheet exercise",
    due: "2026-05-21T16:00:00+04:00", status: "done", ai_estimate: "" },
];

export const MOCK_COMPLETION: WeekCompletion[] = [
  { week_label: "Wk -3", on_time_pct: 71 },
  { week_label: "Wk -2", on_time_pct: 83 },
  { week_label: "Wk -1", on_time_pct: 91 },
  { week_label: "Wk 0",  on_time_pct: 88 },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function homeworkKpis(items: HomeworkItem[]) {
  let overdue = 0, dueSoon = 0, inProgress = 0, doneThisWeek = 0;
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const cutoff  = todayMs + 24 * 60 * 60 * 1000;
  const weekAgo = todayMs - 7 * 24 * 60 * 60 * 1000;
  for (const h of items) {
    if (h.status === "overdue")    overdue++;
    if (h.status === "due-today" || (h.status !== "done" && Date.parse(h.due) <= cutoff && Date.parse(h.due) >= todayMs)) dueSoon++;
    if (h.status === "in-progress") inProgress++;
    if (h.status === "done" && Date.parse(h.due) >= weekAgo) doneThisWeek++;
  }
  return { overdue, due_soon: dueSoon, in_progress: inProgress, done_this_week: doneThisWeek };
}

export function mostUrgent(items: HomeworkItem[]): HomeworkItem | null {
  const overdue = items.filter(h => h.status === "overdue");
  if (overdue.length > 0) {
    return [...overdue].sort((a, b) => a.due.localeCompare(b.due))[0];
  }
  const dueToday = items.filter(h => h.status === "due-today");
  if (dueToday.length > 0) {
    return [...dueToday].sort((a, b) => a.due.localeCompare(b.due))[0];
  }
  return null;
}

export type HomeworkGroup = { key: HomeworkStatus | "later"; label: string; items: HomeworkItem[] };

export function groupByStatus(items: HomeworkItem[]): HomeworkGroup[] {
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const weekEnd = todayMs + 7 * 24 * 60 * 60 * 1000;
  const overdue:   HomeworkItem[] = [];
  const dueToday:  HomeworkItem[] = [];
  const dueWeek:   HomeworkItem[] = [];
  const later:     HomeworkItem[] = [];
  const done:      HomeworkItem[] = [];
  for (const h of items) {
    if (h.status === "overdue")          { overdue.push(h);  continue; }
    if (h.status === "done")             { done.push(h);     continue; }
    const dueMs = Date.parse(h.due);
    if (h.status === "due-today")        { dueToday.push(h); continue; }
    if (dueMs <= weekEnd)                { dueWeek.push(h);  continue; }
    later.push(h);
  }
  return [
    { key: "overdue",      label: "Overdue",       items: overdue  },
    { key: "due-today",    label: "Due today",     items: dueToday },
    { key: "in-progress",  label: "Due this week", items: dueWeek  },
    { key: "later",        label: "Later",         items: later    },
    { key: "done",         label: "Done · this week", items: done   },
  ].filter(g => g.items.length > 0);
}

export function relativeDue(iso: string): string {
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const dueMs   = Date.parse(iso);
  const diff    = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return `${-diff} day${-diff === 1 ? "" : "s"} late`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${diff} days`;
}
```

- [ ] **Step 2: `homework.test.ts`** — 6 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_HOMEWORK, MOCK_COMPLETION, homeworkKpis, mostUrgent, groupByStatus,
} from "./mock-homework";

describe("mock-homework fixture", () => {
  it("has 14+ items spanning all statuses", () => {
    expect(MOCK_HOMEWORK.length).toBeGreaterThanOrEqual(14);
    const statuses = new Set(MOCK_HOMEWORK.map(h => h.status));
    expect(statuses.has("overdue")).toBe(true);
    expect(statuses.has("done")).toBe(true);
  });
  it("has 4 weeks of completion data", () => {
    expect(MOCK_COMPLETION.length).toBe(4);
  });
});

describe("homeworkKpis", () => {
  const k = homeworkKpis(MOCK_HOMEWORK);
  it("counts overdue items", () => {
    expect(k.overdue).toBeGreaterThanOrEqual(1);
  });
  it("counts in-progress items", () => {
    expect(k.in_progress).toBeGreaterThanOrEqual(1);
  });
});

describe("mostUrgent", () => {
  it("returns the overdue item first if any exist", () => {
    const u = mostUrgent(MOCK_HOMEWORK);
    expect(u).not.toBeNull();
    expect(u?.status).toBe("overdue");
  });
});

describe("groupByStatus", () => {
  it("returns ordered groups, overdue first", () => {
    const groups = groupByStatus(MOCK_HOMEWORK);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].key).toBe("overdue");
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-homework.ts apps/web/lib/homework.test.ts && git commit -m "lib/mock-homework: 14-item Layla fixture + helpers"
```

Expect 111 tests (105 prior + 6 new).

---

## Task 2 — Schedule fixture + tests

**Files:** `apps/web/lib/mock-student-schedule.ts` + `apps/web/lib/student-schedule.test.ts`

- [ ] **Step 1: `mock-student-schedule.ts`**

```ts
/**
 * Manhaj Phase 2.8 demo fixture — Layla's weekly schedule (10A).
 * DEMO_NOW is frozen to Wed P3 (10:35) for deterministic "right now" UI.
 */

export type StudentPeriod = {
  period:    string;       // "P1"..."P7" or "BR1"/"BR2"/"LUNCH"
  day:       "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  subject:   string;
  teacher?:  string;
  room?:     string;
  bring?:    string[];
  start:     string;       // "HH:MM"
  end:       string;       // "HH:MM"
  state?:   "break" | "lunch";
};

export const DEMO_NOW = "2026-05-27T10:35:00+04:00";  // Wed P3
export const DEMO_DAY: StudentPeriod["day"] = "Wed";

/* Bell schedule template (same start/end every day) */
const BELLS: Array<{ key: string; start: string; end: string; state?: "break" | "lunch" }> = [
  { key: "P1",    start: "08:00", end: "08:50" },
  { key: "P2",    start: "08:55", end: "09:45" },
  { key: "P3",    start: "10:00", end: "10:50" },
  { key: "BR",    start: "10:50", end: "11:05", state: "break" },
  { key: "P4",    start: "11:05", end: "11:55" },
  { key: "P5",    start: "12:00", end: "12:50" },
  { key: "LUNCH", start: "12:50", end: "13:35", state: "lunch" },
  { key: "P6",    start: "13:35", end: "14:25" },
  { key: "P7",    start: "14:30", end: "15:20" },
];

type WeekRow = { Mon: Partial<StudentPeriod>; Tue: Partial<StudentPeriod>; Wed: Partial<StudentPeriod>; Thu: Partial<StudentPeriod>; Fri: Partial<StudentPeriod> };

const WEEK: Record<string, WeekRow> = {
  P1: {
    Mon: { subject: "English",   teacher: "Ms Khan",    room: "R204" },
    Tue: { subject: "Biology",   teacher: "Ms Aida",    room: "Lab 2", bring: ["lab coat", "notebook"] },
    Wed: { subject: "Physics",   teacher: "Mr Nasser",  room: "Lab 3" },
    Thu: { subject: "Maths",     teacher: "Mr Faisal",  room: "R201" },
    Fri: { subject: "English",   teacher: "Ms Khan",    room: "R204" },
  },
  P2: {
    Mon: { subject: "Maths",     teacher: "Mr Faisal",  room: "R201" },
    Tue: { subject: "Maths",     teacher: "Mr Faisal",  room: "R201" },
    Wed: { subject: "English",   teacher: "Ms Khan",    room: "R204" },
    Thu: { subject: "Physics",   teacher: "Mr Nasser",  room: "Lab 3" },
    Fri: { subject: "Maths",     teacher: "Mr Faisal",  room: "R201" },
  },
  P3: {
    Mon: { subject: "Chemistry", teacher: "Ms Aida",    room: "Lab 1", bring: ["lab coat", "calculator"] },
    Tue: { subject: "English",   teacher: "Ms Khan",    room: "R204" },
    Wed: { subject: "Maths",     teacher: "Mr Faisal",  room: "R201", bring: ["calculator", "geometry set", "notebook"] },
    Thu: { subject: "English",   teacher: "Ms Khan",    room: "R204" },
    Fri: { subject: "History",   teacher: "Ms Swart",   room: "R210" },
  },
  P4: {
    Mon: { subject: "History",   teacher: "Ms Swart",   room: "R210" },
    Tue: { subject: "Geography", teacher: "Ms Swart",   room: "R210" },
    Wed: { subject: "Chemistry", teacher: "Ms Aida",    room: "Lab 1", bring: ["lab coat"] },
    Thu: { subject: "Biology",   teacher: "Ms Aida",    room: "Lab 2", bring: ["lab coat"] },
    Fri: { subject: "Arabic",    teacher: "Mr Salim",   room: "R204" },
  },
  P5: {
    Mon: { subject: "PE",        teacher: "Mr Omar",    room: "Gym",   bring: ["PE kit", "water bottle"] },
    Tue: { subject: "Chemistry", teacher: "Ms Aida",    room: "Lab 1", bring: ["lab coat"] },
    Wed: { subject: "MUN club",  teacher: "Ms Swart",   room: "R210" },
    Thu: { subject: "ICT",       teacher: "Mr Khaled",  room: "ICT"   },
    Fri: { subject: "Chemistry", teacher: "Ms Aida",    room: "Lab 1", bring: ["lab coat"] },
  },
  P6: {
    Mon: { subject: "Arabic",    teacher: "Mr Salim",   room: "R204" },
    Tue: { subject: "Arabic",    teacher: "Mr Salim",   room: "R204" },
    Wed: { subject: "Arabic",    teacher: "Mr Salim",   room: "R204" },
    Thu: { subject: "PE",        teacher: "Mr Omar",    room: "Gym",   bring: ["PE kit"] },
    Fri: { subject: "Arabic",    teacher: "Mr Salim",   room: "R204" },
  },
};

/* -------------------------------------------------------------------------- */
/* build periods                                                               */
/* -------------------------------------------------------------------------- */

function buildPeriods(): StudentPeriod[] {
  const days: StudentPeriod["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const out: StudentPeriod[] = [];
  for (const day of days) {
    for (const b of BELLS) {
      if (b.state) {
        out.push({
          period: b.key, day,
          subject: b.state === "break" ? "Break" : "Lunch",
          start: b.start, end: b.end, state: b.state,
        });
        continue;
      }
      const subj = WEEK[b.key]?.[day];
      if (!subj || !subj.subject) {
        out.push({ period: b.key, day, subject: "Study", start: b.start, end: b.end });
        continue;
      }
      out.push({ period: b.key, day,
        subject: subj.subject, teacher: subj.teacher, room: subj.room, bring: subj.bring,
        start: b.start, end: b.end,
      });
    }
  }
  return out;
}

export const MOCK_PERIODS: StudentPeriod[] = buildPeriods();

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function periodsForDay(periods: StudentPeriod[], day: StudentPeriod["day"]): StudentPeriod[] {
  return periods.filter(p => p.day === day);
}

export function currentPeriod(
  periods: StudentPeriod[], nowIso: string,
): { current: StudentPeriod | null; next: StudentPeriod | null; minutes_left: number } {
  const now = new Date(nowIso);
  const day = (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getUTCDay()]) as StudentPeriod["day"];
  const todays = periodsForDay(periods, day);
  // Convert HH:MM strings to today's UTC date+time, treating them as Asia/Muscat (+04:00)
  function toMs(hhmm: string): number {
    const dateStr = nowIso.slice(0, 10);   // YYYY-MM-DD
    return Date.parse(`${dateStr}T${hhmm}:00+04:00`);
  }
  const nowMs = now.getTime();
  for (let i = 0; i < todays.length; i++) {
    const p = todays[i];
    const startMs = toMs(p.start);
    const endMs   = toMs(p.end);
    if (nowMs >= startMs && nowMs < endMs) {
      const next = todays[i + 1] ?? null;
      const minutes_left = Math.max(0, Math.round((endMs - nowMs) / 60000));
      return { current: p, next, minutes_left };
    }
  }
  return { current: null, next: null, minutes_left: 0 };
}
```

- [ ] **Step 2: `student-schedule.test.ts`** — 5 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_PERIODS, DEMO_NOW, DEMO_DAY, periodsForDay, currentPeriod,
} from "./mock-student-schedule";

describe("mock-student-schedule fixture", () => {
  it("has 5 days × 9 bell rows = 45 periods", () => {
    expect(MOCK_PERIODS.length).toBe(45);
  });
});

describe("periodsForDay", () => {
  it("returns 9 rows for Wed", () => {
    expect(periodsForDay(MOCK_PERIODS, "Wed").length).toBe(9);
  });
});

describe("currentPeriod", () => {
  const { current, next, minutes_left } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  it("identifies Wed P3 as current at 10:35", () => {
    expect(current?.period).toBe("P3");
    expect(current?.day).toBe(DEMO_DAY);
    expect(current?.subject).toBe("Maths");
  });
  it("computes minutes_left > 0 and <= 50", () => {
    expect(minutes_left).toBeGreaterThan(0);
    expect(minutes_left).toBeLessThanOrEqual(50);
  });
  it("returns the Break as next period", () => {
    expect(next?.period).toBe("BR");
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-student-schedule.ts apps/web/lib/student-schedule.test.ts && git commit -m "lib/mock-student-schedule: 45-period fixture + currentPeriod helper"
```

Expect 116 tests (111 prior + 5 new).

---

## Task 3 — Homework UI

**Files:** 4 components in `apps/web/app/student/homework/components/` + CSS + page.tsx replacement.

- [ ] **Step 1: `KpiRow.tsx`** (server)

```tsx
import { homeworkKpis, MOCK_HOMEWORK } from "@/lib/mock-homework";

export default function KpiRow() {
  const k = homeworkKpis(MOCK_HOMEWORK);
  const pills = [
    { label: "Overdue",        value: `${k.overdue}`,        tone: k.overdue > 0 ? "danger" : "good" },
    { label: "Due in 24h",     value: `${k.due_soon}`,       tone: "warn" },
    { label: "In progress",    value: `${k.in_progress}`,    tone: "good" },
    { label: "Done · 7 days",  value: `${k.done_this_week}`, tone: "good" },
  ];
  return (
    <section className="hw-kpi-row" aria-label="Homework KPIs">
      {pills.map(p => (
        <div key={p.label} className={`hw-kpi hw-kpi-${p.tone}`}>
          <div className="hw-kpi-value">{p.value}</div>
          <div className="hw-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: `DueSoonBanner.tsx`** (server)

```tsx
import { mostUrgent, relativeDue, MOCK_HOMEWORK } from "@/lib/mock-homework";

export default function DueSoonBanner() {
  const item = mostUrgent(MOCK_HOMEWORK);
  if (!item) {
    return (
      <section className="hw-due-card hw-due-empty" aria-label="Up next">
        <p><strong>You're all caught up.</strong> Next item due tomorrow.</p>
      </section>
    );
  }
  return (
    <section className={`hw-due-card hw-due-${item.status}`} aria-label="Most urgent homework">
      <div className="hw-due-head">
        <span className="hw-due-tag">{item.subject}</span>
        <span className="hw-due-status">{item.status === "overdue" ? `OVERDUE · ${relativeDue(item.due)}` : `Due ${relativeDue(item.due)}`}</span>
      </div>
      <h3 className="hw-due-title">{item.title}</h3>
      <p className="hw-due-ai"><strong>AI:</strong> {item.ai_estimate}</p>
      <div className="hw-due-actions">
        <button type="button" className="hw-due-btn primary">Mark done</button>
        {item.catch_up_pack && <button type="button" className="hw-due-btn ghost">Open catch-up pack</button>}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `HomeworkList.tsx`** (server)

```tsx
import { groupByStatus, relativeDue, MOCK_HOMEWORK, type HomeworkItem } from "@/lib/mock-homework";

const STATUS_LABEL: Record<HomeworkItem["status"], string> = {
  "overdue":     "OVERDUE",
  "due-today":   "DUE TODAY",
  "not-started": "NOT STARTED",
  "in-progress": "IN PROGRESS",
  "done":        "DONE",
};

export default function HomeworkList() {
  const groups = groupByStatus(MOCK_HOMEWORK);
  return (
    <section className="hw-list-card" aria-label="Homework list">
      <header className="hw-list-head">
        <h3>To-do list · {MOCK_HOMEWORK.length} items</h3>
      </header>
      {groups.map(g => (
        <div key={g.key} className={`hw-group hw-group-${g.key}`}>
          <div className="hw-group-label">{g.label} · {g.items.length}</div>
          <ul className="hw-group-list" role="list">
            {g.items.map(h => (
              <li key={h.id} className={`hw-row hw-row-${h.status}`}>
                <span className="hw-row-subj">{h.subject}</span>
                <span className="hw-row-body">
                  <span className="hw-row-title">{h.title}</span>
                  {h.ai_estimate && <span className="hw-row-ai">{h.ai_estimate}</span>}
                </span>
                <span className="hw-row-due">{relativeDue(h.due)}</span>
                <span className={`hw-row-status hw-row-status-${h.status}`}>{STATUS_LABEL[h.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: `CompletionTrend.tsx`** (server)

```tsx
import { MOCK_COMPLETION } from "@/lib/mock-homework";

export default function CompletionTrend() {
  const max = 100;
  const w   = 56;
  const gap = 10;
  const h   = 90;
  const baseX = 30;
  return (
    <section className="hw-ct-card" aria-label="Completion trend">
      <header className="hw-ct-head">
        <h3>On-time completion · last 4 weeks</h3>
        <p className="hw-ct-sub">Trend up from 71% → 88% over the month. Keep it going.</p>
      </header>
      <svg viewBox="0 0 320 130" width="100%" height="130" role="img" aria-label="Bar chart">
        {/* axis */}
        <line x1="20" y1="100" x2="310" y2="100" stroke="var(--color-border)" strokeWidth="1" />
        {/* bars */}
        {MOCK_COMPLETION.map((c, i) => {
          const x  = baseX + i * (w + gap);
          const bh = Math.round((c.on_time_pct / max) * h);
          const y  = 100 - bh;
          return (
            <g key={c.week_label}>
              <rect x={x} y={y} width={w} height={bh} rx="3" fill="var(--color-primary)" opacity={0.7 + i * 0.1} />
              <text x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-ink)">{c.on_time_pct}%</text>
              <text x={x + w / 2} y={118} textAnchor="middle" fontSize="9" fill="var(--color-muted)">{c.week_label}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
```

- [ ] **Step 5: Replace `apps/web/app/student/homework/page.tsx`**

```tsx
import KpiRow         from "./components/KpiRow";
import DueSoonBanner  from "./components/DueSoonBanner";
import HomeworkList   from "./components/HomeworkList";
import CompletionTrend from "./components/CompletionTrend";

export const dynamic = "force-dynamic";

export default function StudentHomeworkPage() {
  return (
    <div className="container">
      <h1>Homework</h1>
      <p className="sub">What's due · what's in progress · what's done · AI-suggested time per task.</p>

      <KpiRow />
      <DueSoonBanner />
      <HomeworkList />
      <CompletionTrend />
    </div>
  );
}
```

- [ ] **Step 6: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Student Homework · KpiRow
   ========================================================================= */
.hw-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: var(--space-3); }
@media (max-width: 700px) { .hw-kpi-row { grid-template-columns: repeat(2, 1fr); } }
.hw-kpi { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 10px 12px; text-align: center; }
.hw-kpi-value { font-size: 18px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.hw-kpi-label { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
.hw-kpi-good   { border-color: var(--color-success); }
.hw-kpi-warn   { border-color: var(--color-warning); }
.hw-kpi-danger { border-color: var(--color-danger); }
.hw-kpi-danger .hw-kpi-value { color: var(--color-danger); }

/* =========================================================================
   Student Homework · DueSoonBanner
   ========================================================================= */
.hw-due-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
  border-left: 4px solid var(--color-primary);
}
.hw-due-overdue   { border-left-color: var(--color-danger);  background: linear-gradient(135deg, var(--color-danger-soft), var(--color-card)); }
.hw-due-due-today { border-left-color: var(--color-warning); }
.hw-due-empty     { border-left-color: var(--color-success); }
.hw-due-head { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.hw-due-tag { background: var(--color-soft); color: var(--color-ink); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 10px; font-weight: var(--font-weight-bold); }
.hw-due-status { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--color-danger); letter-spacing: .03em; }
.hw-due-due-today .hw-due-status { color: var(--color-warning-text); }
.hw-due-title { font-size: 16px; font-weight: var(--font-weight-bold); color: var(--color-ink); margin: 4px 0; }
.hw-due-ai { font-size: 11.5px; color: var(--color-muted); margin: 4px 0 10px; }
.hw-due-ai strong { color: var(--color-primary); }
.hw-due-actions { display: flex; gap: 6px; }
.hw-due-btn { padding: 7px 14px; border-radius: var(--radius-md); font-size: 11px; font-weight: var(--font-weight-bold); cursor: pointer; border: 0; font-family: inherit; }
.hw-due-btn.primary { background: var(--color-primary); color: #fff; }
.hw-due-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }

/* =========================================================================
   Student Homework · HomeworkList
   ========================================================================= */
.hw-list-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.hw-list-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.hw-list-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.hw-group { margin-bottom: 14px; }
.hw-group:last-child { margin-bottom: 0; }
.hw-group-label { font-size: 10.5px; font-weight: var(--font-weight-bold); color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
.hw-group-overdue   .hw-group-label { color: var(--color-danger); }
.hw-group-due-today .hw-group-label { color: var(--color-warning-text); }
.hw-group-done      .hw-group-label { color: var(--color-success-text); }
.hw-group-list { list-style: none; padding: 0; margin: 0; }
.hw-row {
  display: grid; grid-template-columns: 80px 1fr auto auto;
  gap: 10px; padding: 8px 0; align-items: center;
  border-bottom: 1px dashed var(--color-border); font-size: 11px;
}
.hw-row:last-child { border-bottom: 0; }
.hw-row-done .hw-row-title, .hw-row-done .hw-row-subj { color: var(--color-muted); text-decoration: line-through; }
.hw-row-subj { background: var(--color-soft); color: var(--color-ink); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 9.5px; font-weight: var(--font-weight-bold); text-align: center; }
.hw-row-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.hw-row-title { font-size: 11.5px; color: var(--color-ink); font-weight: var(--font-weight-medium); }
.hw-row-ai { font-size: 9.5px; color: var(--color-muted); }
.hw-row-due { font-size: 10px; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.hw-row-status { font-size: 9px; padding: 2px 6px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); }
.hw-row-status-overdue     { background: var(--color-danger-soft);  color: var(--color-danger-text); }
.hw-row-status-due-today   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.hw-row-status-not-started { background: var(--color-soft);         color: var(--color-muted); }
.hw-row-status-in-progress { background: var(--color-info-soft);    color: var(--color-info-text); }
.hw-row-status-done        { background: var(--color-success-soft); color: var(--color-success-text); }

/* =========================================================================
   Student Homework · CompletionTrend
   ========================================================================= */
.hw-ct-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.hw-ct-head { border-bottom: 1px solid var(--color-border); margin-bottom: 8px; padding-bottom: 10px; }
.hw-ct-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.hw-ct-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
```

- [ ] **Step 7: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/student/homework apps/web/app/globals.css && git commit -m "/student/homework: 4-block layout · KpiRow + DueSoonBanner + HomeworkList + CompletionTrend"
```

---

## Task 4 — My Schedule UI

**Files:** 3 components in `apps/web/app/student/schedule/components/` + CSS + page.tsx replacement.

- [ ] **Step 1: `NowCard.tsx`** (server)

```tsx
import { currentPeriod, MOCK_PERIODS, DEMO_NOW } from "@/lib/mock-student-schedule";

export default function NowCard() {
  const { current, next, minutes_left } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  if (!current) {
    return (
      <section className="sc-now-card sc-now-empty" aria-label="Right now">
        <h3>No class right now</h3>
        <p>You're outside school hours. Next class begins tomorrow at 08:00.</p>
      </section>
    );
  }
  return (
    <section className="sc-now-card" aria-label="Right now">
      <div className="sc-now-head">
        <span className="sc-now-tag">Right now · {current.period}</span>
        <span className="sc-now-time">{minutes_left} min left</span>
      </div>
      <h3 className="sc-now-title">{current.subject}</h3>
      <p className="sc-now-meta">
        {current.teacher && <>· {current.teacher} </>}
        {current.room && <>· {current.room} </>}
        · {current.start}–{current.end}
      </p>
      {current.bring && current.bring.length > 0 && (
        <div className="sc-now-bring">
          <span className="sc-now-bring-label">Bring:</span>
          <ul>{current.bring.map(b => <li key={b}>{b}</li>)}</ul>
        </div>
      )}
      {next && (
        <div className="sc-now-next">
          <span className="sc-now-next-label">Next up</span>
          <span>{next.period} · {next.subject}{next.room ? ` · ${next.room}` : ""} · starts {next.start}</span>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: `TodayTimeline.tsx`** (server)

```tsx
import { periodsForDay, currentPeriod, MOCK_PERIODS, DEMO_NOW, DEMO_DAY } from "@/lib/mock-student-schedule";

export default function TodayTimeline() {
  const periods = periodsForDay(MOCK_PERIODS, DEMO_DAY);
  const { current } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  const nowMs = Date.parse(DEMO_NOW);
  const dateStr = DEMO_NOW.slice(0, 10);
  return (
    <section className="sc-tl-card" aria-label="Today timeline">
      <header className="sc-tl-head">
        <h3>Today · {DEMO_DAY}</h3>
      </header>
      <ol className="sc-tl-list">
        {periods.map(p => {
          const endMs   = Date.parse(`${dateStr}T${p.end}:00+04:00`);
          const isNow   = current?.period === p.period;
          const isDone  = endMs <= nowMs && !isNow;
          const cls = ["sc-tl-row"];
          if (p.state === "break") cls.push("sc-tl-break");
          if (p.state === "lunch") cls.push("sc-tl-lunch");
          if (isDone)              cls.push("sc-tl-done");
          if (isNow)               cls.push("sc-tl-now");
          return (
            <li key={p.period} className={cls.join(" ")}>
              <span className="sc-tl-time">{p.start}–{p.end}</span>
              <span className="sc-tl-pkey">{p.period}</span>
              <span className="sc-tl-body">
                <span className="sc-tl-subj">{p.subject}</span>
                {(p.teacher || p.room) && (
                  <span className="sc-tl-meta">{p.teacher}{p.teacher && p.room ? " · " : ""}{p.room}</span>
                )}
              </span>
              {isDone && <span className="sc-tl-check">✓</span>}
              {isNow  && <span className="sc-tl-pill">NOW</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 3: `WeekView.tsx`** (server)

```tsx
import { MOCK_PERIODS, DEMO_DAY, currentPeriod, DEMO_NOW } from "@/lib/mock-student-schedule";

const DAYS: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri"> = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeekView() {
  const { current } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  // Group by day, in bell-order
  const byDay: Record<string, typeof MOCK_PERIODS> = {};
  for (const day of DAYS) byDay[day] = MOCK_PERIODS.filter(p => p.day === day);
  return (
    <section className="sc-wv-card" aria-label="Week view">
      <header className="sc-wv-head">
        <h3>This week</h3>
      </header>
      <div className="sc-wv-grid">
        {DAYS.map(d => (
          <div key={d} className={`sc-wv-col ${d === DEMO_DAY ? "sc-wv-today" : ""}`}>
            <div className="sc-wv-dow">{d}{d === DEMO_DAY ? " · Today" : ""}</div>
            {byDay[d].map(p => {
              const isNow = p.day === DEMO_DAY && current?.period === p.period;
              const cls = ["sc-wv-cell"];
              if (p.state === "break") cls.push("sc-wv-break");
              if (p.state === "lunch") cls.push("sc-wv-lunch");
              if (isNow)               cls.push("sc-wv-now");
              return (
                <div key={p.period} className={cls.join(" ")}>
                  <span className="sc-wv-key">{p.period}</span>
                  <span className="sc-wv-subj">{abbrev(p.subject)}</span>
                  {p.room && !p.state && <span className="sc-wv-room">{p.room}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function abbrev(subject: string): string {
  const map: Record<string, string> = {
    "English":   "Eng",
    "Maths":     "Mth",
    "Chemistry": "Chm",
    "Biology":   "Bio",
    "Physics":   "Phy",
    "History":   "His",
    "Geography": "Geo",
    "Arabic":    "Ara",
    "PE":        "PE",
    "ICT":       "ICT",
    "MUN club":  "MUN",
    "Study":     "Study",
    "Break":     "Break",
    "Lunch":     "Lunch",
  };
  return map[subject] ?? subject.slice(0, 3);
}
```

- [ ] **Step 4: Replace `apps/web/app/student/schedule/page.tsx`**

```tsx
import NowCard       from "./components/NowCard";
import TodayTimeline from "./components/TodayTimeline";
import WeekView      from "./components/WeekView";

export const dynamic = "force-dynamic";

export default function StudentSchedulePage() {
  return (
    <div className="container">
      <h1>My Schedule</h1>
      <p className="sub">Today + the rest of the week · what's next, where, what to bring.</p>

      <NowCard />
      <TodayTimeline />
      <WeekView />
    </div>
  );
}
```

- [ ] **Step 5: CSS** — append:

```css
/* =========================================================================
   Student Schedule · NowCard
   ========================================================================= */
.sc-now-card {
  background: linear-gradient(135deg, var(--color-primary), #4F46E5);
  color: #fff; border-radius: var(--radius-xl);
  padding: 18px 20px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.sc-now-empty { background: var(--color-card); color: var(--color-ink); border: 1px solid var(--color-border); }
.sc-now-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.sc-now-tag { font-size: 10.5px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .05em; opacity: .9; }
.sc-now-time { font-size: 11px; font-weight: var(--font-weight-bold); background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: var(--radius-2xl); }
.sc-now-title { font-size: 22px; font-weight: var(--font-weight-bold); margin: 4px 0; }
.sc-now-meta { font-size: 12px; opacity: .9; margin: 0 0 10px; }
.sc-now-bring { background: rgba(255,255,255,0.13); border-radius: var(--radius-md); padding: 8px 12px; margin-top: 10px; }
.sc-now-bring-label { font-size: 10.5px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .05em; opacity: .9; }
.sc-now-bring ul { margin: 4px 0 0; padding-left: 18px; font-size: 11.5px; }
.sc-now-next { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; opacity: .95; display: flex; gap: 10px; align-items: center; }
.sc-now-next-label { font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .05em; opacity: .85; }

/* =========================================================================
   Student Schedule · TodayTimeline
   ========================================================================= */
.sc-tl-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.sc-tl-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sc-tl-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sc-tl-list { list-style: none; padding: 0; margin: 0; }
.sc-tl-row {
  display: grid; grid-template-columns: 90px 40px 1fr auto;
  gap: 12px; padding: 9px 0;
  border-bottom: 1px dashed var(--color-border); align-items: center;
  font-size: 11px;
}
.sc-tl-row:last-child { border-bottom: 0; }
.sc-tl-time { font-size: 10.5px; color: var(--color-muted); font-family: var(--font-mono, monospace); }
.sc-tl-pkey { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--color-muted); text-align: center; }
.sc-tl-body { display: flex; flex-direction: column; gap: 2px; }
.sc-tl-subj { font-size: 12px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.sc-tl-meta { font-size: 10px; color: var(--color-muted); }
.sc-tl-row.sc-tl-done .sc-tl-subj, .sc-tl-row.sc-tl-done .sc-tl-meta { color: var(--color-muted); text-decoration: line-through; }
.sc-tl-row.sc-tl-break, .sc-tl-row.sc-tl-lunch { background: var(--color-surface-subtle); border-radius: var(--radius-sm); margin: 4px 0; padding: 6px 8px; }
.sc-tl-row.sc-tl-break .sc-tl-subj, .sc-tl-row.sc-tl-lunch .sc-tl-subj { color: var(--color-muted); font-weight: var(--font-weight-medium); }
.sc-tl-row.sc-tl-now {
  background: var(--color-info-soft);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md); padding: 8px 10px; margin: 4px 0;
}
.sc-tl-check { color: var(--color-success); font-weight: var(--font-weight-bold); }
.sc-tl-pill { background: var(--color-primary); color: #fff; padding: 2px 8px; border-radius: var(--radius-2xl); font-size: 9.5px; font-weight: var(--font-weight-bold); letter-spacing: .05em; }

/* =========================================================================
   Student Schedule · WeekView
   ========================================================================= */
.sc-wv-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.sc-wv-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sc-wv-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sc-wv-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.sc-wv-col { display: flex; flex-direction: column; gap: 3px; }
.sc-wv-dow { font-size: 9.5px; font-weight: var(--font-weight-bold); text-align: center; color: var(--color-muted); text-transform: uppercase; padding: 4px 0; border-bottom: 1px solid var(--color-border); }
.sc-wv-today .sc-wv-dow { color: var(--color-primary); border-bottom: 2px solid var(--color-primary); }
.sc-wv-cell {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); padding: 4px 5px; min-height: 36px;
  display: flex; flex-direction: column; gap: 1px; font-size: 9.5px;
}
.sc-wv-key { font-size: 8.5px; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.sc-wv-subj { color: var(--color-ink); font-weight: var(--font-weight-bold); }
.sc-wv-room { color: var(--color-muted); font-size: 8.5px; }
.sc-wv-break, .sc-wv-lunch { background: var(--color-surface-subtle); color: var(--color-muted); }
.sc-wv-now {
  background: var(--color-info-soft);
  border: 2px solid var(--color-primary);
}
.sc-wv-now .sc-wv-subj, .sc-wv-now .sc-wv-key { color: var(--color-primary); }
```

- [ ] **Step 6: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -10
cd ~/dev/manhaj && git add apps/web/app/student/schedule apps/web/app/globals.css && git commit -m "/student/schedule: 3-block layout · NowCard + TodayTimeline + WeekView"
```

---

## Self-review

| Spec section | Plan task |
|---|---|
| §1.1 KpiRow | Task 3 |
| §1.2 DueSoonBanner | Task 3 |
| §1.3 HomeworkList | Task 3 |
| §1.4 CompletionTrend | Task 3 |
| §2.1 NowCard | Task 4 |
| §2.2 TodayTimeline | Task 4 |
| §2.3 WeekView | Task 4 |
| §3 fixtures | Tasks 1 + 2 |
| §4 acceptance | Tasks 3 + 4 |

Types consistent. No placeholder language. `DEMO_NOW` lets the demo render deterministically.
