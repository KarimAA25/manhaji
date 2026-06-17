# Admin · Schedule tab — Spec (Phase 2.6)

**Goal.** Replace the `/admin/schedule` placeholder with the maximalist 6-block content layer the principal would actually use to *publish* the bell schedule and chase down its gaps.

**Audience.** Principal / academic head — same persona as Admin Students + Attendance. Lives on `/admin/schedule`.

**Data.** Static `lib/mock-schedule.ts` fixture (no schema). Shape mirrors a future RPC return so the swap is a one-import change.

---

## 1. Blocks (top-to-bottom)

1. **KpiRow** — 5 health pills:
   - Periods covered (e.g. `92%`, target `≥ 98%`)
   - Open conflicts (`3`)
   - Unfilled periods (`5`)
   - Teacher load — avg / max (`22 / 26 of 30`)
   - Curriculum coverage (`87%`)

2. **TimetableGrid** — week × period grid for the **selected section** (dropdown picker, default `10A`):
   - 5 columns Mon-Fri, 7 rows P1-P7.
   - Each cell shows `<Subject> · <Teacher> · <Room>`.
   - State colors: normal / conflict (orange) / gap (red, "UNFILLED") / break (grey).
   - Conflicts/gaps numbered with a tag that ties them back to ActionQueue rows.

3. **ActionQueue** — numbered list of conflicts + unfilled periods with an AI-suggested fix per row.
   - Row shape: `#N · Mon P3 · 10A Chemistry · UNFILLED · AI: Move Ms Swart from P5 (lighter load) → P3`.
   - Two action buttons per row: `Accept fix` (dry-run, just logs) and `Dismiss`.

4. **TeacherLoadHeatmap** — teacher × Mon-Fri grid, cell shade = periods taught that day (0-7 scale).
   - Side legend for the scale.
   - Highlight overloaded teachers (>5 periods/day) with a red dot.

5. **CurriculumCoverage** — per-subject bar:
   - Subject label + bar showing `current hrs/week` vs `IGCSE minimum hrs/week`.
   - Bars under minimum tinted red.

6. **AskManhajCard** — prompt input + frozen mock conversation:
   - Static example: user types *"Move Mr Salim's lab to mornings, current P6 collides with football"* → AI replies with a structured diff (3 swaps + impact summary).
   - No real LLM call — phase 2 deferred. Card sets the visual + interaction expectation.

---

## 2. Section picker

A small `<select>` above the TimetableGrid lists 6 sections (`10A`, `10B`, `9A`, `9B`, `7B`, `KG2`). Changes the grid only — KPIs and other blocks stay household-wide for now (TeacherLoadHeatmap, CurriculumCoverage, ActionQueue cover the whole school).

---

## 3. Fixture shape (`lib/mock-schedule.ts`)

```ts
type Period = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";
type Day    = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

type Slot = {
  section_id:  string;     // "10A"
  day:         Day;
  period:      Period;
  state:       "normal" | "conflict" | "gap" | "break";
  subject?:    string;     // "Chemistry"
  teacher?:    string;     // "Ms Swart"
  room?:       string;     // "Lab 1"
  conflict_id?: string;    // ties to ActionQueue rows
};

type ActionItem = {
  id:        string;       // "AQ-1"
  kind:      "conflict" | "gap";
  when:      string;       // "Mon P3"
  section:   string;       // "10A"
  subject?:  string;
  ai_fix:    string;
};

type TeacherLoad = {
  teacher: string;
  by_day:  Record<Day, number>;
  total:   number;
};

type CurriculumRow = {
  subject:    string;
  current_hr: number;
  target_hr:  number;
};
```

Helpers:
- `slotsForSection(slots, sectionId)` → 35 slots (5×7).
- `kpis(slots, actions, loads, curriculum)` → KpiRow numbers.
- `overloadedTeachers(loads)` → teachers with any day >5.

Fixture: 6 sections × 35 slots = 210 slots. ~5 gap/conflict slots to drive the ActionQueue. 12 teachers in TeacherLoadHeatmap. 8 curriculum rows.

---

## 4. Acceptance criteria

- All 6 blocks render on `/admin/schedule`.
- Section picker change → TimetableGrid re-renders client-side (no full reload).
- Conflicts/gaps in the grid are visually distinct + numbered.
- ActionQueue rows match the conflict/gap tags in the grid.
- 8+ tests across fixture + helpers.
- tsc clean, lint 0 errors, build green.

---

## 5. Deferred

- Real schedule writes (drag-drop swap, RPC, schema).
- Live LLM for "Ask Manhaj".
- Per-teacher detail drawer.
- Room utilization block (cut from 6-block list to keep MVP tight; can land as Phase 3.x).
