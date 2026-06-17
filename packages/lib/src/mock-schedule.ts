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
