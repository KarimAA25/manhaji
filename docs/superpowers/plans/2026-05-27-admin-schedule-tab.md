# Admin · Schedule tab · Implementation Plan (Phase 2.6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the 6-block Admin Schedule against `lib/mock-schedule.ts`. Pure UI — no schema.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-admin-schedule-tab.md`](../specs/2026-05-27-admin-schedule-tab.md)

---

## File map

**Create:**
- `apps/web/lib/mock-schedule.ts` + `apps/web/lib/schedule.test.ts`
- `apps/web/app/admin/schedule/components/{KpiRow,TimetableGrid,ActionQueue,TeacherLoadHeatmap,CurriculumCoverage,AskManhajCard}.tsx`
- `apps/web/app/admin/schedule/ScheduleClient.tsx`

**Modify:**
- `apps/web/app/admin/schedule/page.tsx`
- `apps/web/app/globals.css`

---

## Task 1 — Mock fixture + tests

**Files:** `apps/web/lib/mock-schedule.ts` + `apps/web/lib/schedule.test.ts`

- [ ] **Step 1: `mock-schedule.ts`**

```ts
/**
 * Manhaj Phase 2.6 demo fixture — synthetic weekly schedule for the
 * Admin · Schedule tab. 6 sections × 5 days × 7 periods = 210 slots.
 * A small handful of slots are tagged as conflicts or gaps to drive
 * ActionQueue. Shape mirrors a future RPC return.
 */

export type Period = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";
export type Day    = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export const DAYS:    Day[]    = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const PERIODS: Period[] = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];

export type Slot = {
  section_id:   string;
  day:          Day;
  period:       Period;
  state:        "normal" | "conflict" | "gap" | "break";
  subject?:     string;
  teacher?:     string;
  room?:        string;
  conflict_id?: string;
};

export type ActionItem = {
  id:       string;
  kind:     "conflict" | "gap";
  when:     string;
  section:  string;
  subject?: string;
  ai_fix:   string;
};

export type TeacherLoad = {
  teacher: string;
  by_day:  Record<Day, number>;
  total:   number;
};

export type CurriculumRow = {
  subject:    string;
  current_hr: number;
  target_hr:  number;
};

export const SECTIONS = [
  { id: "10A", label: "10A · HS"      },
  { id: "10B", label: "10B · HS"      },
  { id: "9A",  label: "9A · HS"       },
  { id: "9B",  label: "9B · MS"       },
  { id: "7B",  label: "7B · MS"       },
  { id: "KG2", label: "KG2 · Primary" },
];

/* -------------------------------------------------------------------------- */
/* slot builder                                                                */
/* -------------------------------------------------------------------------- */

type SlotSeed = {
  subject:  string;
  teacher:  string;
  room:     string;
  state?:   Slot["state"];
  conflict_id?: string;
};

// One week-template per section. Cell may be a SlotSeed, "break", or a "gap"/"conflict" marker.
const TEMPLATES: Record<string, Array<SlotSeed | "break" | { gap: true; conflict_id: string; subject?: string } | { conflict: true; conflict_id: string; subject: string; teacher: string; room: string }>> = {
  "10A": [
    // Mon
    { subject: "English",     teacher: "Ms Khan",   room: "R204" },
    { subject: "Maths",       teacher: "Mr Faisal", room: "R201" },
    { gap: true, conflict_id: "AQ-1", subject: "Chemistry" },         // Mon P3 unfilled
    "break",
    { subject: "History",     teacher: "Ms Swart",  room: "R210" },
    { subject: "PE",          teacher: "Mr Omar",   room: "Gym"  },
    { subject: "Arabic",      teacher: "Mr Salim",  room: "R204" },
    // Tue
    { subject: "Biology",     teacher: "Ms Aida",   room: "Lab 2"},
    { subject: "Maths",       teacher: "Mr Faisal", room: "R201" },
    { subject: "English",     teacher: "Ms Khan",   room: "R204" },
    "break",
    { subject: "Geography",   teacher: "Ms Swart",  room: "R210" },
    { conflict: true, conflict_id: "AQ-2", subject: "Chemistry", teacher: "Ms Aida", room: "Lab 1" }, // double-booked
    { subject: "Arabic",      teacher: "Mr Salim",  room: "R204" },
    // Wed
    { subject: "Physics",     teacher: "Mr Nasser", room: "Lab 3"},
    { subject: "English",     teacher: "Ms Khan",   room: "R204" },
    { subject: "Maths",       teacher: "Mr Faisal", room: "R201" },
    "break",
    { subject: "Chemistry",   teacher: "Ms Aida",   room: "Lab 1"},
    { subject: "MUN club",    teacher: "Ms Swart",  room: "R210" },
    { subject: "Arabic",      teacher: "Mr Salim",  room: "R204" },
    // Thu
    { subject: "Maths",       teacher: "Mr Faisal", room: "R201" },
    { subject: "Physics",     teacher: "Mr Nasser", room: "Lab 3"},
    { subject: "English",     teacher: "Ms Khan",   room: "R204" },
    "break",
    { subject: "Biology",     teacher: "Ms Aida",   room: "Lab 2"},
    { subject: "ICT",         teacher: "Mr Khaled", room: "ICT"  },
    { subject: "PE",          teacher: "Mr Omar",   room: "Gym"  },
    // Fri
    { subject: "English",     teacher: "Ms Khan",   room: "R204" },
    { subject: "Maths",       teacher: "Mr Faisal", room: "R201" },
    { subject: "History",     teacher: "Ms Swart",  room: "R210" },
    "break",
    { subject: "Arabic",      teacher: "Mr Salim",  room: "R204" },
    { subject: "Chemistry",   teacher: "Ms Aida",   room: "Lab 1"},
    { gap: true, conflict_id: "AQ-3", subject: "Study hall" },         // Fri P7 unfilled
  ],
  "10B": filledWeek("Mr Faisal", "R202"),
  "9A":  filledWeek("Ms Aida",   "Lab 2"),
  "9B":  filledWeek("Mr Omar",   "Gym"),
  "7B":  filledWeek("Mr Khaled", "ICT"),
  "KG2": filledWeek("Ms Layla",  "KG-Room"),
};

function filledWeek(homeroomTeacher: string, homeroomRoom: string): SlotSeed[] {
  const subjects = ["English", "Maths", "Arabic", "Science", "History", "Art", "PE"];
  const out: SlotSeed[] = [];
  for (let d = 0; d < 5; d++) {
    for (let p = 0; p < 7; p++) {
      if (p === 3) { out.push("break" as unknown as SlotSeed); continue; }
      const subj = subjects[(d + p) % subjects.length];
      out.push({ subject: subj, teacher: homeroomTeacher, room: homeroomRoom });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* build slots                                                                 */
/* -------------------------------------------------------------------------- */

function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  for (const section of SECTIONS) {
    const tpl = TEMPLATES[section.id];
    if (!tpl) continue;
    for (let d = 0; d < DAYS.length; d++) {
      for (let p = 0; p < PERIODS.length; p++) {
        const i = d * PERIODS.length + p;
        const cell = tpl[i];
        const base = { section_id: section.id, day: DAYS[d], period: PERIODS[p] };
        if (cell === "break") {
          slots.push({ ...base, state: "break" });
        } else if (cell && typeof cell === "object" && "gap" in cell) {
          slots.push({ ...base, state: "gap", subject: cell.subject, conflict_id: cell.conflict_id });
        } else if (cell && typeof cell === "object" && "conflict" in cell) {
          slots.push({ ...base, state: "conflict",
            subject: cell.subject, teacher: cell.teacher, room: cell.room, conflict_id: cell.conflict_id });
        } else if (cell) {
          const seed = cell as SlotSeed;
          slots.push({ ...base, state: "normal",
            subject: seed.subject, teacher: seed.teacher, room: seed.room });
        }
      }
    }
  }
  return slots;
}

export const MOCK_SLOTS: Slot[] = buildSlots();

/* -------------------------------------------------------------------------- */
/* action queue                                                                */
/* -------------------------------------------------------------------------- */

export const MOCK_ACTIONS: ActionItem[] = [
  { id: "AQ-1", kind: "gap",      when: "Mon · P3", section: "10A",
    subject: "Chemistry",
    ai_fix:  "Move Ms Swart from Tue P5 (light load) → cover Mon P3. Net: +1 hr Ms Swart, history rescheduled to Thu P2." },
  { id: "AQ-2", kind: "conflict", when: "Tue · P6", section: "10A",
    subject: "Chemistry",
    ai_fix:  "Lab 1 double-booked with 9A Biology. Move 9A Bio → Lab 2 (free Tue P6). Zero teacher change." },
  { id: "AQ-3", kind: "gap",      when: "Fri · P7", section: "10A",
    subject: "Study hall",
    ai_fix:  "Auto-fill with Mr Khaled (ICT free Fri P7) → light supervised study. Optional." },
  { id: "AQ-4", kind: "gap",      when: "Wed · P5", section: "9B",
    subject: "Music",
    ai_fix:  "No music teacher on payroll Wed. Suggest combining with 7B music P5 in Gym anteroom (capacity OK)." },
  { id: "AQ-5", kind: "conflict", when: "Thu · P2", section: "10B",
    subject: "Maths",
    ai_fix:  "Mr Faisal teaching 10A simultaneously. Swap 10B Thu P2 ↔ 10B Thu P6 (Mr Faisal free P6)." },
];

/* -------------------------------------------------------------------------- */
/* teacher loads                                                               */
/* -------------------------------------------------------------------------- */

export const MOCK_TEACHER_LOADS: TeacherLoad[] = [
  { teacher: "Ms Khan",    by_day: { Mon: 5, Tue: 4, Wed: 5, Thu: 4, Fri: 5 }, total: 23 },
  { teacher: "Mr Faisal",  by_day: { Mon: 6, Tue: 5, Wed: 5, Thu: 6, Fri: 6 }, total: 28 },
  { teacher: "Ms Swart",   by_day: { Mon: 3, Tue: 3, Wed: 4, Thu: 2, Fri: 3 }, total: 15 },
  { teacher: "Mr Omar",    by_day: { Mon: 3, Tue: 2, Wed: 2, Thu: 3, Fri: 2 }, total: 12 },
  { teacher: "Mr Salim",   by_day: { Mon: 4, Tue: 4, Wed: 4, Thu: 4, Fri: 4 }, total: 20 },
  { teacher: "Ms Aida",    by_day: { Mon: 5, Tue: 6, Wed: 5, Thu: 5, Fri: 5 }, total: 26 },
  { teacher: "Mr Nasser",  by_day: { Mon: 4, Tue: 5, Wed: 4, Thu: 5, Fri: 4 }, total: 22 },
  { teacher: "Mr Khaled",  by_day: { Mon: 3, Tue: 4, Wed: 3, Thu: 4, Fri: 3 }, total: 17 },
  { teacher: "Ms Layla",   by_day: { Mon: 6, Tue: 6, Wed: 6, Thu: 6, Fri: 6 }, total: 30 },
];

/* -------------------------------------------------------------------------- */
/* curriculum                                                                  */
/* -------------------------------------------------------------------------- */

export const MOCK_CURRICULUM: CurriculumRow[] = [
  { subject: "English",   current_hr: 5, target_hr: 5 },
  { subject: "Maths",     current_hr: 5, target_hr: 5 },
  { subject: "Arabic",    current_hr: 5, target_hr: 5 },
  { subject: "Chemistry", current_hr: 3, target_hr: 4 },
  { subject: "Biology",   current_hr: 3, target_hr: 4 },
  { subject: "Physics",   current_hr: 2, target_hr: 4 },
  { subject: "History",   current_hr: 3, target_hr: 3 },
  { subject: "PE",        current_hr: 2, target_hr: 2 },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function slotsForSection(slots: Slot[], sectionId: string): Slot[] {
  return slots.filter(s => s.section_id === sectionId);
}

export function scheduleKpis(
  slots: Slot[], actions: ActionItem[], loads: TeacherLoad[], curriculum: CurriculumRow[],
) {
  const teaching = slots.filter(s => s.state !== "break");
  const filled   = teaching.filter(s => s.state === "normal").length;
  const total    = teaching.length;
  const pct      = total === 0 ? 0 : Math.round((filled / total) * 100);
  const conflicts = actions.filter(a => a.kind === "conflict").length;
  const gaps      = actions.filter(a => a.kind === "gap").length;
  const avgLoad  = loads.length === 0 ? 0 : Math.round(loads.reduce((s, l) => s + l.total, 0) / loads.length);
  const maxLoad  = loads.reduce((m, l) => Math.max(m, l.total), 0);
  const curTotal  = curriculum.reduce((s, r) => s + r.current_hr, 0);
  const tgtTotal  = curriculum.reduce((s, r) => s + r.target_hr,  0);
  const curPct    = tgtTotal === 0 ? 0 : Math.round((curTotal / tgtTotal) * 100);
  return { coverage_pct: pct, conflicts, gaps, avg_load: avgLoad, max_load: maxLoad, curriculum_pct: curPct };
}

export function overloadedTeachers(loads: TeacherLoad[]): string[] {
  const out: string[] = [];
  for (const l of loads) {
    if (Object.values(l.by_day).some(n => n > 5)) out.push(l.teacher);
  }
  return out;
}
```

- [ ] **Step 2: `schedule.test.ts`** — 9 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM,
  SECTIONS, DAYS, PERIODS,
  slotsForSection, scheduleKpis, overloadedTeachers,
} from "./mock-schedule";

describe("mock-schedule fixture", () => {
  it("has 6 sections × 5 days × 7 periods = 210 slots", () => {
    expect(MOCK_SLOTS.length).toBe(SECTIONS.length * DAYS.length * PERIODS.length);
  });
  it("includes at least one gap and one conflict for 10A", () => {
    const ten = slotsForSection(MOCK_SLOTS, "10A");
    expect(ten.some(s => s.state === "gap")).toBe(true);
    expect(ten.some(s => s.state === "conflict")).toBe(true);
  });
  it("has at least 5 ActionQueue items", () => {
    expect(MOCK_ACTIONS.length).toBeGreaterThanOrEqual(5);
  });
});

describe("slotsForSection", () => {
  it("returns 35 slots (5x7) per section", () => {
    expect(slotsForSection(MOCK_SLOTS, "10A").length).toBe(35);
  });
});

describe("scheduleKpis", () => {
  const k = scheduleKpis(MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);
  it("returns coverage_pct in 0..100", () => {
    expect(k.coverage_pct).toBeGreaterThan(0);
    expect(k.coverage_pct).toBeLessThanOrEqual(100);
  });
  it("counts conflicts + gaps correctly", () => {
    expect(k.conflicts + k.gaps).toBe(MOCK_ACTIONS.length);
  });
  it("returns avg + max load > 0", () => {
    expect(k.avg_load).toBeGreaterThan(0);
    expect(k.max_load).toBeGreaterThanOrEqual(k.avg_load);
  });
  it("curriculum_pct is sane", () => {
    expect(k.curriculum_pct).toBeGreaterThan(50);
    expect(k.curriculum_pct).toBeLessThanOrEqual(100);
  });
});

describe("overloadedTeachers", () => {
  it("flags teachers with any day > 5 periods", () => {
    const ov = overloadedTeachers(MOCK_TEACHER_LOADS);
    expect(ov).toContain("Mr Faisal");
    expect(ov).toContain("Ms Layla");
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-schedule.ts apps/web/lib/schedule.test.ts && git commit -m "lib/mock-schedule: 210-slot fixture + 5 ActionQueue items + helpers"
```

Expect 97 tests pass (88 prior + 9 new).

---

## Task 2 — KpiRow + TimetableGrid + ActionQueue

**Files:**
- Create: `apps/web/app/admin/schedule/components/KpiRow.tsx`
- Create: `apps/web/app/admin/schedule/components/TimetableGrid.tsx`
- Create: `apps/web/app/admin/schedule/components/ActionQueue.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `KpiRow.tsx`** (server component)

```tsx
import { scheduleKpis, MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM } from "@/lib/mock-schedule";

export default function KpiRow() {
  const k = scheduleKpis(MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);
  const pills = [
    { label: "Periods covered",      value: `${k.coverage_pct}%`, tone: k.coverage_pct >= 95 ? "good" : "warn" },
    { label: "Open conflicts",       value: `${k.conflicts}`,     tone: k.conflicts === 0 ? "good" : "danger" },
    { label: "Unfilled periods",     value: `${k.gaps}`,          tone: k.gaps === 0 ? "good" : "warn" },
    { label: "Teacher load avg/max", value: `${k.avg_load} / ${k.max_load}`, tone: k.max_load > 28 ? "warn" : "good" },
    { label: "Curriculum coverage",  value: `${k.curriculum_pct}%`, tone: k.curriculum_pct >= 95 ? "good" : "warn" },
  ];
  return (
    <section className="sch-kpi-row" aria-label="Schedule KPIs">
      {pills.map(p => (
        <div key={p.label} className={`sch-kpi sch-kpi-${p.tone}`}>
          <div className="sch-kpi-value">{p.value}</div>
          <div className="sch-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: `TimetableGrid.tsx`** (client — section picker state)

```tsx
"use client";

import { useMemo, useState } from "react";
import { MOCK_SLOTS, SECTIONS, DAYS, PERIODS, slotsForSection, type Slot } from "@/lib/mock-schedule";

export default function TimetableGrid() {
  const [sectionId, setSectionId] = useState("10A");
  const slots = useMemo(() => slotsForSection(MOCK_SLOTS, sectionId), [sectionId]);

  // Build [period][day] grid index for fast lookup
  const grid: Record<string, Slot | undefined> = {};
  for (const s of slots) grid[`${s.day}-${s.period}`] = s;

  return (
    <section className="sch-tt-card" aria-label="Section timetable">
      <header className="sch-tt-head">
        <h3>Timetable</h3>
        <label className="sch-tt-picker">
          <span className="sr-only">Section</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </header>
      <div className="sch-tt-grid">
        <div className="sch-tt-cnr" />
        {DAYS.map(d => <div key={d} className="sch-tt-dow">{d}</div>)}
        {PERIODS.map(p => (
          <FragmentRow key={p} period={p} grid={grid} />
        ))}
      </div>
    </section>
  );
}

function FragmentRow({ period, grid }: { period: string; grid: Record<string, Slot | undefined> }) {
  return (
    <>
      <div className="sch-tt-period">{period}</div>
      {DAYS.map(d => {
        const s = grid[`${d}-${period}`];
        if (!s) return <div key={d} className="sch-tt-cell sch-tt-empty" />;
        if (s.state === "break") {
          return <div key={d} className="sch-tt-cell sch-tt-break"><span>Break</span></div>;
        }
        if (s.state === "gap") {
          return (
            <div key={d} className="sch-tt-cell sch-tt-gap">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">UNFILLED</div>
              <div className="sch-tt-meta">{s.subject ?? "—"}</div>
            </div>
          );
        }
        if (s.state === "conflict") {
          return (
            <div key={d} className="sch-tt-cell sch-tt-conflict">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">{s.subject}</div>
              <div className="sch-tt-meta">{s.teacher} · {s.room}</div>
            </div>
          );
        }
        return (
          <div key={d} className="sch-tt-cell sch-tt-normal">
            <div className="sch-tt-sub">{s.subject}</div>
            <div className="sch-tt-meta">{s.teacher} · {s.room}</div>
          </div>
        );
      })}
    </>
  );
}

import "./TimetableGrid";  // noop import to keep the fragment file structure tidy

const DAYS_RUNTIME: ReadonlyArray<string> = DAYS;  // satisfies TS unused-var linter
void DAYS_RUNTIME;
```

Drop the last 3 lines if TS doesn't complain. They're guard rails.

- [ ] **Step 3: `ActionQueue.tsx`** (server component)

```tsx
import { MOCK_ACTIONS } from "@/lib/mock-schedule";

export default function ActionQueue() {
  return (
    <section className="sch-aq-card" aria-label="Action queue">
      <header className="sch-aq-head">
        <h3>Action queue · {MOCK_ACTIONS.length} items</h3>
        <p className="sch-aq-sub">Conflicts + unfilled periods · AI-suggested fix per row.</p>
      </header>
      <ul className="sch-aq-list" role="list">
        {MOCK_ACTIONS.map(a => (
          <li key={a.id} className={`sch-aq-row sch-aq-${a.kind}`}>
            <span className="sch-aq-tag">#{a.id}</span>
            <span className="sch-aq-body">
              <span className="sch-aq-title">
                {a.section} · {a.when} · <em>{a.subject ?? "—"}</em>
              </span>
              <span className="sch-aq-fix"><strong>AI:</strong> {a.ai_fix}</span>
            </span>
            <span className="sch-aq-actions">
              <button type="button" className="sch-aq-btn primary">Accept fix</button>
              <button type="button" className="sch-aq-btn ghost">Dismiss</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Admin Schedule · KpiRow
   ========================================================================= */
.sch-kpi-row {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
  margin-bottom: var(--space-3);
}
@media (max-width: 880px) { .sch-kpi-row { grid-template-columns: repeat(2, 1fr); } }
.sch-kpi {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 10px 12px; text-align: center;
}
.sch-kpi-value { font-size: 18px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-kpi-label { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
.sch-kpi-good   { border-color: var(--color-success); }
.sch-kpi-warn   { border-color: var(--color-warning); }
.sch-kpi-danger { border-color: var(--color-danger); }
.sch-kpi-danger .sch-kpi-value { color: var(--color-danger); }

/* =========================================================================
   Admin Schedule · TimetableGrid
   ========================================================================= */
.sch-tt-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.sch-tt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px; }
.sch-tt-head h3 { margin: 0; font-size: 14px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-tt-picker select {
  background: var(--color-soft); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 4px 10px; font-size: 11px; font-family: inherit;
  color: var(--color-ink);
}
.sch-tt-grid { display: grid; grid-template-columns: 50px repeat(5, 1fr); gap: 4px; }
.sch-tt-cnr { background: transparent; }
.sch-tt-dow { font-size: 10px; text-align: center; color: var(--color-muted); font-weight: var(--font-weight-bold); text-transform: uppercase; }
.sch-tt-period { font-size: 10px; text-align: center; color: var(--color-muted); font-weight: var(--font-weight-bold); display: flex; align-items: center; justify-content: center; }
.sch-tt-cell {
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  padding: 5px 6px; min-height: 56px; font-size: 9.5px; display: flex; flex-direction: column; gap: 2px;
}
.sch-tt-empty   { background: var(--color-surface-subtle); }
.sch-tt-break   { background: var(--color-soft); color: var(--color-muted); text-align: center; justify-content: center; }
.sch-tt-normal  { background: var(--color-card); }
.sch-tt-gap     { background: var(--color-danger-soft);  color: var(--color-danger-text);  border-color: var(--color-danger); }
.sch-tt-conflict{ background: var(--color-warning-soft); color: var(--color-warning-text); border-color: var(--color-warning); }
.sch-tt-tag     { font-size: 8px; font-weight: var(--font-weight-bold); opacity: .8; }
.sch-tt-sub     { font-size: 10.5px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-tt-gap .sch-tt-sub, .sch-tt-conflict .sch-tt-sub { color: inherit; }
.sch-tt-meta    { font-size: 9px; color: var(--color-muted); }
.sch-tt-gap .sch-tt-meta, .sch-tt-conflict .sch-tt-meta { color: inherit; opacity: .9; }

/* =========================================================================
   Admin Schedule · ActionQueue
   ========================================================================= */
.sch-aq-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.sch-aq-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sch-aq-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-aq-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.sch-aq-list { list-style: none; padding: 0; margin: 0; }
.sch-aq-row {
  display: grid; grid-template-columns: 48px 1fr auto;
  gap: 12px; padding: 10px 0;
  border-bottom: 1px dashed var(--color-border); align-items: center;
}
.sch-aq-row:last-child { border-bottom: 0; }
.sch-aq-tag { background: var(--color-soft); color: var(--color-ink); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 10px; font-weight: var(--font-weight-bold); text-align: center; }
.sch-aq-gap .sch-aq-tag      { background: var(--color-danger-soft);  color: var(--color-danger-text); }
.sch-aq-conflict .sch-aq-tag { background: var(--color-warning-soft); color: var(--color-warning-text); }
.sch-aq-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.sch-aq-title { font-size: 11.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.sch-aq-title em { font-style: normal; color: var(--color-muted); font-weight: var(--font-weight-medium); }
.sch-aq-fix { font-size: 10.5px; color: var(--color-muted); line-height: 1.5; }
.sch-aq-fix strong { color: var(--color-primary); font-weight: var(--font-weight-bold); }
.sch-aq-actions { display: flex; gap: 6px; }
.sch-aq-btn { padding: 6px 12px; border-radius: var(--radius-md); font-size: 10.5px; font-weight: var(--font-weight-bold); cursor: pointer; border: 0; font-family: inherit; }
.sch-aq-btn.primary { background: var(--color-primary); color: #fff; }
.sch-aq-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
.sch-aq-btn.ghost:hover { background: var(--color-soft); color: var(--color-ink); }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint 2>&1 | tail -5
cd ~/dev/manhaj && git add apps/web/app/admin/schedule/components apps/web/app/globals.css && git commit -m "Schedule: KpiRow + TimetableGrid + ActionQueue"
```

---

## Task 3 — TeacherLoadHeatmap + CurriculumCoverage + AskManhajCard

**Files:** 3 components + CSS.

- [ ] **Step 1: `TeacherLoadHeatmap.tsx`** (server)

```tsx
import { MOCK_TEACHER_LOADS, DAYS, overloadedTeachers } from "@/lib/mock-schedule";

function tone(n: number): string {
  if (n === 0) return "tl-0";
  if (n <= 2)  return "tl-1";
  if (n <= 4)  return "tl-2";
  if (n <= 5)  return "tl-3";
  return "tl-4";
}

export default function TeacherLoadHeatmap() {
  const over = new Set(overloadedTeachers(MOCK_TEACHER_LOADS));
  return (
    <section className="sch-tl-card" aria-label="Teacher load heatmap">
      <header className="sch-tl-head">
        <h3>Teacher load · periods / day</h3>
        <p className="sch-tl-sub">Red dot = overloaded any day (&gt; 5 periods).</p>
      </header>
      <div className="sch-tl-grid">
        <div className="sch-tl-cnr" />
        {DAYS.map(d => <div key={d} className="sch-tl-dow">{d}</div>)}
        <div className="sch-tl-dow sch-tl-total">Total</div>
        {MOCK_TEACHER_LOADS.map(l => (
          <FragmentRow key={l.teacher} l={l} overloaded={over.has(l.teacher)} />
        ))}
      </div>
      <div className="sch-tl-legend">
        <span>Less</span>
        <span className="sch-tl-sw tl-0" />
        <span className="sch-tl-sw tl-1" />
        <span className="sch-tl-sw tl-2" />
        <span className="sch-tl-sw tl-3" />
        <span className="sch-tl-sw tl-4" />
        <span>More</span>
      </div>
    </section>
  );
}

function FragmentRow({ l, overloaded }: { l: { teacher: string; by_day: Record<string, number>; total: number }; overloaded: boolean }) {
  return (
    <>
      <div className="sch-tl-name">
        {l.teacher}
        {overloaded && <span className="sch-tl-dot" aria-label="overloaded"/>}
      </div>
      {DAYS.map(d => {
        const n = l.by_day[d] ?? 0;
        return <div key={d} className={`sch-tl-cell ${tone(n)}`}>{n}</div>;
      })}
      <div className="sch-tl-cell sch-tl-totcell">{l.total}</div>
    </>
  );
}
```

- [ ] **Step 2: `CurriculumCoverage.tsx`** (server)

```tsx
import { MOCK_CURRICULUM } from "@/lib/mock-schedule";

export default function CurriculumCoverage() {
  return (
    <section className="sch-cc-card" aria-label="Curriculum coverage">
      <header className="sch-cc-head">
        <h3>Curriculum coverage · hours / week vs IGCSE minimum</h3>
      </header>
      <ul className="sch-cc-list" role="list">
        {MOCK_CURRICULUM.map(r => {
          const pct = Math.min(100, Math.round((r.current_hr / r.target_hr) * 100));
          const under = r.current_hr < r.target_hr;
          return (
            <li key={r.subject} className="sch-cc-row">
              <span className="sch-cc-label">{r.subject}</span>
              <span className="sch-cc-bar">
                <span className={`sch-cc-fill ${under ? "under" : ""}`} style={{ width: `${pct}%` }} />
              </span>
              <span className={`sch-cc-meta ${under ? "under" : ""}`}>
                {r.current_hr} / {r.target_hr} h
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `AskManhajCard.tsx`** (client — mock interaction)

```tsx
"use client";

import { useState } from "react";

const EXAMPLE_PROMPT = "Move Mr Salim's lab to mornings — current P6 collides with the football match.";

const MOCK_REPLY = `Plan: 3 swaps · 0 conflicts created · curriculum hours preserved.

1. 10A Tue P6 (Chemistry · Lab 1 · Ms Aida) → swap with 10A Tue P2 (Biology · Lab 2 · Ms Aida).
2. 7B Wed P6 (Arabic · R204 · Mr Salim) → move to Wed P3 (currently double-period English).
3. 9B Thu P6 (Arabic · R204 · Mr Salim) → move to Thu P2 (currently spare in homeroom).

Impact summary · 0 students lose any subject hours. Mr Salim's afternoon load drops from 4 → 1. Two football match conflicts cleared.`;

export default function AskManhajCard() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [reply, setReply] = useState<string | null>(null);

  function run() {
    // No real LLM — frozen reply.
    setReply(MOCK_REPLY);
  }

  return (
    <section className="sch-aq2-card" aria-label="Ask Manhaj">
      <header className="sch-aq2-head">
        <h3>Ask Manhaj</h3>
        <p className="sch-aq2-sub">Type a change in plain English · we draft the diff for your sign-off.</p>
      </header>
      <textarea
        className="sch-aq2-input"
        value={prompt}
        rows={2}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="sch-aq2-actions">
        <button type="button" className="sch-aq2-btn primary" onClick={run}>Generate diff</button>
        {reply && <button type="button" className="sch-aq2-btn ghost" onClick={() => setReply(null)}>Clear</button>}
      </div>
      {reply && (
        <pre className="sch-aq2-reply">{reply}</pre>
      )}
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append:

```css
/* =========================================================================
   Admin Schedule · TeacherLoadHeatmap
   ========================================================================= */
.sch-tl-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.sch-tl-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sch-tl-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-tl-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.sch-tl-grid { display: grid; grid-template-columns: 120px repeat(5, 1fr) 60px; gap: 4px; }
.sch-tl-cnr { background: transparent; }
.sch-tl-dow { font-size: 10px; text-align: center; color: var(--color-muted); font-weight: var(--font-weight-bold); text-transform: uppercase; padding: 4px 0; }
.sch-tl-total { color: var(--color-ink); }
.sch-tl-name { font-size: 11px; font-weight: var(--font-weight-medium); color: var(--color-ink); padding: 6px 4px; display: flex; align-items: center; gap: 6px; }
.sch-tl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color-danger); display: inline-block; }
.sch-tl-cell { font-size: 10.5px; text-align: center; padding: 6px 4px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); }
.sch-tl-totcell { background: var(--color-soft); color: var(--color-ink); }
.tl-0 { background: var(--color-surface-subtle); color: var(--color-muted); }
.tl-1 { background: #DBEAFE; color: #1D4ED8; }
.tl-2 { background: #93C5FD; color: #1E3A8A; }
.tl-3 { background: #3B82F6; color: #FFFFFF; }
.tl-4 { background: #1E3A8A; color: #FFFFFF; }
.sch-tl-legend { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 10px; color: var(--color-muted); }
.sch-tl-sw { width: 16px; height: 12px; border-radius: 3px; }

/* =========================================================================
   Admin Schedule · CurriculumCoverage
   ========================================================================= */
.sch-cc-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.sch-cc-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sch-cc-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-cc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.sch-cc-row { display: grid; grid-template-columns: 100px 1fr 80px; gap: 12px; align-items: center; font-size: 11px; }
.sch-cc-label { color: var(--color-ink); font-weight: var(--font-weight-medium); }
.sch-cc-bar { background: var(--color-surface-subtle); border-radius: var(--radius-sm); height: 14px; overflow: hidden; }
.sch-cc-fill { display: block; height: 100%; background: var(--color-success); }
.sch-cc-fill.under { background: var(--color-danger); }
.sch-cc-meta { font-size: 10.5px; color: var(--color-muted); text-align: right; font-weight: var(--font-weight-bold); }
.sch-cc-meta.under { color: var(--color-danger); }

/* =========================================================================
   Admin Schedule · AskManhajCard
   ========================================================================= */
.sch-aq2-card { background: linear-gradient(135deg, var(--color-surface-subtle), #F0F4FA); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); }
.sch-aq2-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.sch-aq2-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.sch-aq2-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.sch-aq2-input { width: 100%; background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px 10px; font-family: inherit; font-size: 11.5px; color: var(--color-ink); resize: vertical; }
.sch-aq2-actions { display: flex; gap: 6px; margin-top: 8px; }
.sch-aq2-btn { padding: 7px 14px; border-radius: var(--radius-md); font-size: 10.5px; font-weight: var(--font-weight-bold); cursor: pointer; border: 0; font-family: inherit; }
.sch-aq2-btn.primary { background: var(--color-primary); color: #fff; }
.sch-aq2-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
.sch-aq2-reply { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 12px; margin-top: 10px; font-size: 10.5px; line-height: 1.6; color: var(--color-ink); white-space: pre-wrap; font-family: inherit; }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/admin/schedule/components apps/web/app/globals.css && git commit -m "Schedule: TeacherLoadHeatmap + CurriculumCoverage + AskManhajCard"
```

---

## Task 4 — Page assembly

**Files:** `apps/web/app/admin/schedule/page.tsx`

- [ ] **Step 1: Replace `page.tsx`**

```tsx
/**
 * Admin · Schedule tab.
 *
 * Server component (KpiRow + ActionQueue + heatmap + curriculum are server-rendered).
 * TimetableGrid and AskManhajCard are client components that own their own state.
 */

import KpiRow             from "./components/KpiRow";
import TimetableGrid      from "./components/TimetableGrid";
import ActionQueue        from "./components/ActionQueue";
import TeacherLoadHeatmap from "./components/TeacherLoadHeatmap";
import CurriculumCoverage from "./components/CurriculumCoverage";
import AskManhajCard      from "./components/AskManhajCard";

export const dynamic = "force-dynamic";

export default function AdminSchedulePage() {
  return (
    <div className="container">
      <h1>Schedule</h1>
      <p className="sub">Section + teacher + room view of the weekly bell schedule · AY 2025–26</p>

      <KpiRow />
      <TimetableGrid />
      <ActionQueue />
      <TeacherLoadHeatmap />
      <CurriculumCoverage />
      <AskManhajCard />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/schedule/page.tsx && git commit -m "/admin/schedule: page assembly · 6 blocks"
```

---

## Self-review

| Spec section | Plan task |
|---|---|
| §1 KpiRow / TimetableGrid / ActionQueue | Task 2 |
| §1 TeacherLoadHeatmap / CurriculumCoverage / AskManhajCard | Task 3 |
| §3 fixture | Task 1 |
| §4 acceptance | Task 4 |

Types consistent across files. No placeholder language. Mock fixture matches §3 shape.
