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
