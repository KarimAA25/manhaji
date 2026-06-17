/**
 * Manhaj Phase 2.5 demo fixture — synthetic calendar events for the
 * Parent Calendar tab. ~20 events in May 2026 across 3 children +
 * household. Time zone: Asia/Muscat (UTC+4).
 *
 * The shape mirrors a future RPC return so swapping mock → live is a
 * one-import change.
 */

export type EventType = "exam" | "meeting" | "event" | "club" | "holiday";

export type CalendarEvent = {
  id:          string;
  title:       string;
  type:        EventType;
  starts_at:   string;
  ends_at:     string;
  all_day:     boolean;
  child_id:    string | "household";
  location?:   string;
  description?: string;
};

export type DayCell = {
  date:       string;
  events:     CalendarEvent[];
  is_today:   boolean;
  is_weekend: boolean;
  in_month:   boolean;
};

export type EventTypeCount = Record<EventType, number>;
export type ChildEventCount = { child_id: string | "household"; label: string; count: number };

export const DEMO_TODAY = "2026-05-22";

function e(
  id: string, title: string, type: EventType,
  starts_at: string, ends_at: string, all_day: boolean,
  child_id: CalendarEvent["child_id"],
  location?: string, description?: string,
): CalendarEvent {
  return { id, title, type, starts_at, ends_at, all_day, child_id, location, description };
}

export const MOCK_EVENTS: CalendarEvent[] = [
  // Yasmin (KG2)
  e("yas-concert",  "Spring concert",                  "event",
    "2026-05-04T09:30:00+04:00", "2026-05-04T11:00:00+04:00", false,
    "yasmin-al-habsi", "School auditorium", "KG2 spring concert · Yasmin singing second verse"),
  e("yas-music",    "Music day",                       "club",
    "2026-05-27T10:00:00+04:00", "2026-05-27T11:30:00+04:00", false,
    "yasmin-al-habsi", "Music room"),

  // Layla (10A)
  e("lay-honor",    "Honor citations ceremony",        "event",
    "2026-05-08T18:00:00+04:00", "2026-05-08T19:30:00+04:00", false,
    "layla-al-habsi", "School auditorium", "Layla recognised for MUN finalist citation"),
  e("lay-chem",     "Chemistry mid-term",              "exam",
    "2026-05-12T09:30:00+04:00", "2026-05-12T11:00:00+04:00", false,
    "layla-al-habsi", "Lab 1", "50-question paper, 90 minutes. Bring calculator."),
  e("lay-mun-1",    "MUN debate",                      "club",
    "2026-05-14T16:00:00+04:00", "2026-05-14T17:30:00+04:00", false,
    "layla-al-habsi", "R204", "Model UN preparation"),
  e("lay-eng-mid",  "English mid-term",                "exam",
    "2026-05-19T08:55:00+04:00", "2026-05-19T10:25:00+04:00", false,
    "layla-al-habsi", "R204", "Timed essay"),
  e("lay-mun-2",    "MUN club",                        "club",
    "2026-05-20T16:00:00+04:00", "2026-05-20T17:30:00+04:00", false,
    "layla-al-habsi", "R204"),
  e("lay-math-mid", "Mathematics mid-term",            "exam",
    "2026-05-22T11:10:00+04:00", "2026-05-22T12:40:00+04:00", false,
    "layla-al-habsi", "R201"),
  e("lay-mun-3",    "MUN club",                        "club",
    "2026-05-28T16:00:00+04:00", "2026-05-28T17:30:00+04:00", false,
    "layla-al-habsi", "R204"),

  // Omar (7B)
  e("oma-football", "Football match",                  "club",
    "2026-05-07T16:00:00+04:00", "2026-05-07T17:30:00+04:00", false,
    "omar-al-habsi", "Pitch · home"),
  e("oma-maths",    "Maths quiz",                      "exam",
    "2026-05-14T10:00:00+04:00", "2026-05-14T10:45:00+04:00", false,
    "omar-al-habsi", "R301", "Percentages, ratios, simple linear equations"),

  // Household / school-wide
  e("hh-midterm-week", "Mid-term assessment week",     "event",
    "2026-05-05T08:00:00+04:00", "2026-05-09T16:00:00+04:00", true,
    "household", "Whole school", "Mid-term exams across all year groups"),
  e("hh-ptm",       "Parent-teacher evening",          "meeting",
    "2026-05-18T16:00:00+04:00", "2026-05-18T20:00:00+04:00", false,
    "household", "Various", "Book slots from your dashboard. Ms Swart 3 slots remaining."),
  e("hh-invoice-due", "Term 2 invoice due",            "event",
    "2026-05-25T00:00:00+04:00", "2026-05-25T23:59:00+04:00", true,
    "household", undefined, "Household balance OMR 1,820 outstanding"),
  e("hh-eid-1",     "Eid Al-Adha · public holiday",    "holiday",
    "2026-06-24T00:00:00+04:00", "2026-06-26T23:59:00+04:00", true,
    "household", undefined, "School closed Thursday-Saturday. Resume Sunday 27 June."),
  e("hh-eoy",       "End-of-year ceremony",            "event",
    "2026-06-30T18:00:00+04:00", "2026-06-30T20:30:00+04:00", false,
    "household", "School auditorium", "All families welcome"),
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function eventsForChild(events: CalendarEvent[], childId: string): CalendarEvent[] {
  if (childId === "all") return events;
  return events.filter(e => e.child_id === childId || e.child_id === "household");
}

/** Build the day-cells for a given month (Sunday-first). Includes prev/next padding. */
export function eventsInMonth(
  events: CalendarEvent[], year: number, monthIndex0: number,
): DayCell[] {
  const first = new Date(Date.UTC(year, monthIndex0, 1));
  const startDow = first.getUTCDay();              // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();

  // Pad backwards from the first
  const cells: DayCell[] = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(Date.UTC(year, monthIndex0, 1 - (startDow - i)));
    cells.push(buildCell(d, events, false));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(buildCell(new Date(Date.UTC(year, monthIndex0, d)), events, true));
  }
  // Pad forwards to a multiple of 7
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const next = new Date(last.date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    cells.push(buildCell(next, events, false));
  }
  return cells;
}

function buildCell(d: Date, events: CalendarEvent[], in_month: boolean): DayCell {
  const date = isoDay(d);
  const dow  = d.getUTCDay();
  const evs  = events.filter(e => eventOnDay(e, date));
  return {
    date,
    events: evs,
    is_today:   date === DEMO_TODAY,
    is_weekend: dow === 5 || dow === 6,
    in_month,
  };
}

function isoDay(d: Date): string {
  const y  = d.getUTCFullYear();
  const m  = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function eventOnDay(ev: CalendarEvent, day: string): boolean {
  const start = ev.starts_at.slice(0, 10);
  const end   = ev.ends_at.slice(0, 10);
  return day >= start && day <= end;
}

/** Returns events starting within `windowDays` from DEMO_TODAY, sorted ascending. */
export function upcomingEvents(events: CalendarEvent[], windowDays = 14): CalendarEvent[] {
  const todayMs = Date.parse(DEMO_TODAY + "T00:00:00+04:00");
  const cutoff  = todayMs + windowDays * 24 * 60 * 60 * 1000;
  return events
    .filter(e => {
      const s = Date.parse(e.starts_at);
      return s >= todayMs && s <= cutoff;
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function eventTypeCounts(events: CalendarEvent[]): EventTypeCount {
  const r: EventTypeCount = { exam: 0, meeting: 0, event: 0, club: 0, holiday: 0 };
  for (const e of events) r[e.type]++;
  return r;
}

export function childEventCounts(events: CalendarEvent[]): ChildEventCount[] {
  const byId = new Map<string, number>();
  for (const e of events) byId.set(e.child_id, (byId.get(e.child_id) ?? 0) + 1);
  return Array.from(byId.entries()).map(([child_id, count]) => ({
    child_id,
    label: child_id === "household" ? "Household" : child_id,
    count,
  }));
}

/** Human-friendly date string. Uses Asia/Muscat. */
export function formatDate(iso: string, opts?: { withTime?: boolean }): string {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "Asia/Muscat",
  });
  if (!opts?.withTime) return dateStr;
  const timeStr = d.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Muscat",
  });
  return `${dateStr} · ${timeStr}`;
}

/** Days from DEMO_TODAY → event start. Returns "today" / "tomorrow" / "in N days". */
export function relativeDay(iso: string): string {
  const todayMs = Date.parse(DEMO_TODAY + "T00:00:00+04:00");
  const eventMs = Date.parse(iso);
  const diffDays = Math.round((eventMs - todayMs) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 0)   return `in ${diffDays} days`;
  return `${-diffDays} days ago`;
}
