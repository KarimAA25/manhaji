# Parent · Calendar tab · Implementation Plan (Phase 2.5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the 6-block Parent Calendar against `lib/mock-calendar.ts`. Live ICS feed at `/api/calendar/feed.ics`. Pure UI + ICS generator — no schema.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-parent-calendar-tab.md`](../specs/2026-05-27-parent-calendar-tab.md)

---

## File map

**Create:**
- `apps/web/lib/mock-calendar.ts` + `apps/web/lib/calendar.test.ts`
- `apps/web/lib/ics.ts` + `apps/web/lib/ics.test.ts`
- `apps/web/app/api/calendar/feed.ics/route.ts`
- `apps/web/app/parent/calendar/components/{EventTypeFilter,MonthGrid,UpcomingList,SyncCard}.tsx`
- `apps/web/app/parent/calendar/CalendarClient.tsx`

**Modify:**
- `apps/web/app/parent/calendar/page.tsx`
- `apps/web/app/globals.css`

---

## Task 1 — Mock calendar fixture + tests

**Files:**
- Create: `apps/web/lib/mock-calendar.ts`
- Create: `apps/web/lib/calendar.test.ts`

- [ ] **Step 1: `mock-calendar.ts`**

```ts
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
```

- [ ] **Step 2: `calendar.test.ts`** — 10 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_EVENTS, DEMO_TODAY, eventsForChild, eventsInMonth, upcomingEvents,
  eventTypeCounts, relativeDay,
} from "./mock-calendar";

describe("mock-calendar fixture", () => {
  it("has at least 15 events", () => {
    expect(MOCK_EVENTS.length).toBeGreaterThanOrEqual(15);
  });
  it("each event has a valid type", () => {
    for (const e of MOCK_EVENTS) {
      expect(["exam","meeting","event","club","holiday"]).toContain(e.type);
    }
  });
  it("DEMO_TODAY is May 22 2026", () => {
    expect(DEMO_TODAY).toBe("2026-05-22");
  });
});

describe("eventsForChild", () => {
  it("returns all events when childId='all'", () => {
    expect(eventsForChild(MOCK_EVENTS, "all").length).toBe(MOCK_EVENTS.length);
  });
  it("returns single-child + household events", () => {
    const omar = eventsForChild(MOCK_EVENTS, "omar-al-habsi");
    expect(omar.every(e => e.child_id === "omar-al-habsi" || e.child_id === "household")).toBe(true);
  });
});

describe("eventsInMonth", () => {
  it("returns multiples of 7 cells", () => {
    const cells = eventsInMonth(MOCK_EVENTS, 2026, 4);  // May (monthIndex 4)
    expect(cells.length % 7).toBe(0);
  });
  it("marks today's cell", () => {
    const cells = eventsInMonth(MOCK_EVENTS, 2026, 4);
    expect(cells.some(c => c.is_today && c.date === DEMO_TODAY)).toBe(true);
  });
  it("attaches events to the right days", () => {
    const cells = eventsInMonth(MOCK_EVENTS, 2026, 4);
    const may22 = cells.find(c => c.date === "2026-05-22");
    expect(may22?.events.some(e => e.title === "Mathematics mid-term")).toBe(true);
  });
});

describe("upcomingEvents", () => {
  it("returns events within 14 days of today, sorted", () => {
    const ups = upcomingEvents(MOCK_EVENTS, 14);
    expect(ups.length).toBeGreaterThan(0);
    const sorted = [...ups].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    expect(ups).toEqual(sorted);
  });
});

describe("eventTypeCounts", () => {
  it("sums per-type to total", () => {
    const c = eventTypeCounts(MOCK_EVENTS);
    expect(c.exam + c.meeting + c.event + c.club + c.holiday).toBe(MOCK_EVENTS.length);
  });
});

describe("relativeDay", () => {
  it("returns 'today' for same-day events", () => {
    expect(relativeDay(DEMO_TODAY + "T11:10:00+04:00")).toBe("today");
  });
  it("returns 'in N days' for future", () => {
    expect(relativeDay("2026-05-28T16:00:00+04:00")).toMatch(/in \d+ days/);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-calendar.ts apps/web/lib/calendar.test.ts && git commit -m "lib/mock-calendar: 16-event May/June fixture + helpers"
```

Expect 80 tests pass (70 prior + 10 new).

---

## Task 2 — ICS generator + route handler

**Files:**
- Create: `apps/web/lib/ics.ts`
- Create: `apps/web/lib/ics.test.ts`
- Create: `apps/web/app/api/calendar/feed.ics/route.ts`

- [ ] **Step 1: `lib/ics.ts`**

```ts
/**
 * iCalendar (RFC 5545) text generator.
 *
 * Minimum spec: VCALENDAR wrapper · VEVENT per event · TZID=Asia/Muscat.
 * Skips line-folding (lines under 75 chars in our fixture). Multi-day
 * all-day events use DTSTART;VALUE=DATE form.
 */

import type { CalendarEvent } from "./mock-calendar";

const CRLF = "\r\n";

/** Convert an ISO local string to iCal's TZID form: 20260512T093000 */
function toIcalLocal(iso: string): string {
  // iso looks like "2026-05-12T09:30:00+04:00"
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  const time = timePart.replace(/[:].*/, "").replace(/:/g, "");  // strip +04:00, then colons
  const t = timePart.split(/[+-]/)[0].replace(/:/g, "");          // "093000"
  return `${y}${m}${d}T${t}`;
}

/** Date-only form for all-day events: 20260524 */
function toIcalDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Escape special chars per RFC 5545 §3.3.11 (text values). */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g,  "\\;")
    .replace(/,/g,  "\\,")
    .replace(/\n/g, "\\n");
}

export function eventsToIcs(events: CalendarEvent[], calName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Manhaj//Parent Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    "X-WR-TIMEZONE:Asia/Muscat",
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@manhaj.app`);
    lines.push(`SUMMARY:${escapeText(e.title)}`);
    if (e.all_day) {
      // DTEND for all-day events is exclusive — add 1 day to the ICS end.
      const start = toIcalDate(e.starts_at);
      const endDate = new Date(e.ends_at);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      const end = endDate.toISOString().slice(0, 10).replace(/-/g, "");
      lines.push(`DTSTART;VALUE=DATE:${start}`);
      lines.push(`DTEND;VALUE=DATE:${end}`);
    } else {
      lines.push(`DTSTART;TZID=Asia/Muscat:${toIcalLocal(e.starts_at)}`);
      lines.push(`DTEND;TZID=Asia/Muscat:${toIcalLocal(e.ends_at)}`);
    }
    if (e.location)    lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    lines.push(`CATEGORIES:${e.type.toUpperCase()}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
```

- [ ] **Step 2: `lib/ics.test.ts`** — 6 tests

```ts
import { describe, expect, it } from "vitest";
import { eventsToIcs } from "./ics";
import { MOCK_EVENTS } from "./mock-calendar";

describe("eventsToIcs", () => {
  const ics = eventsToIcs(MOCK_EVENTS, "Manhaj · Household");

  it("starts with BEGIN:VCALENDAR and ends with END:VCALENDAR", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
  it("contains the calendar name", () => {
    expect(ics).toContain("X-WR-CALNAME:Manhaj · Household");
  });
  it("emits one VEVENT per event", () => {
    const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(count).toBe(MOCK_EVENTS.length);
  });
  it("formats timed events with TZID", () => {
    expect(ics).toMatch(/DTSTART;TZID=Asia\/Muscat:202605\d{2}T\d{6}/);
  });
  it("formats all-day events with VALUE=DATE", () => {
    expect(ics).toMatch(/DTSTART;VALUE=DATE:202\d{5}/);
  });
  it("uses CRLF line endings", () => {
    expect(ics.includes("\r\n")).toBe(true);
    expect(ics.includes("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
  });
});
```

- [ ] **Step 3: Route handler `apps/web/app/api/calendar/feed.ics/route.ts`**

```ts
import { NextRequest } from "next/server";
import { MOCK_EVENTS, eventsForChild } from "@/lib/mock-calendar";
import { eventsToIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const childParam = req.nextUrl.searchParams.get("child") ?? "all";
  const events = childParam === "all"
    ? MOCK_EVENTS
    : eventsForChild(MOCK_EVENTS, childParam);
  const calName = childParam === "all"
    ? "Manhaj · Household"
    : `Manhaj · ${childParam}`;

  const body = eventsToIcs(events, calName);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":  "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/ics.ts apps/web/lib/ics.test.ts apps/web/app/api/calendar/feed.ics && git commit -m "lib/ics: iCalendar generator + /api/calendar/feed.ics route"
```

Expect 86 tests pass (80 prior + 6 new).

---

## Task 3 — EventTypeFilter + MonthGrid

**Files:**
- Create: `apps/web/app/parent/calendar/components/EventTypeFilter.tsx`
- Create: `apps/web/app/parent/calendar/components/MonthGrid.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `EventTypeFilter.tsx`** (client)

```tsx
"use client";

import type { EventType, EventTypeCount } from "@/lib/mock-calendar";

const TYPES: Array<{ key: EventType; label: string }> = [
  { key: "exam",    label: "Exams" },
  { key: "meeting", label: "Parent-teacher" },
  { key: "event",   label: "Events" },
  { key: "club",    label: "Clubs" },
  { key: "holiday", label: "Holidays" },
];

export default function EventTypeFilter({
  active, counts, totalAll, onToggle, onClearAll,
}: {
  active:     Set<EventType>;
  counts:     EventTypeCount;
  totalAll:   number;
  onToggle:   (t: EventType) => void;
  onClearAll: () => void;
}) {
  return (
    <div role="toolbar" aria-label="Filter event types" className="cal-cat-row">
      <button
        type="button"
        className={`cal-cat-pill ${active.size === 0 ? "active" : ""}`}
        aria-pressed={active.size === 0}
        onClick={onClearAll}
      >
        All<span className="cal-cat-count">{totalAll}</span>
      </button>
      {TYPES.map(t => (
        <button
          key={t.key} type="button"
          className={`cal-cat-pill cal-type-${t.key} ${active.has(t.key) ? "active" : ""}`}
          aria-pressed={active.has(t.key)}
          onClick={() => onToggle(t.key)}
        >
          {t.label}<span className="cal-cat-count">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `MonthGrid.tsx`** (client — month nav state)

```tsx
"use client";

import { useState } from "react";
import type { DayCell, CalendarEvent } from "@/lib/mock-calendar";
import { eventsInMonth } from "@/lib/mock-calendar";
import { DEMO_CHILDREN } from "@/lib/child";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function avatarForChild(child_id: string): string {
  if (child_id === "household") return "⌂";
  const c = DEMO_CHILDREN.find(c => c.id === child_id);
  return c?.initial ?? "?";
}

export default function MonthGrid({
  events,
  initialYear = 2026,
  initialMonth = 4,    // May, 0-indexed
  multiChild,
}: {
  events:       CalendarEvent[];
  initialYear?: number;
  initialMonth?: number;
  multiChild:   boolean;
}) {
  const [year, setYear]   = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const cells: DayCell[] = eventsInMonth(events, year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else             setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else              setMonth(month + 1);
  }

  return (
    <section className="cal-month-card" aria-label="Month view">
      <header className="cal-month-head">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">›</button>
      </header>
      <div className="cal-month-grid">
        {DOW.map(d => <div key={d} className="cal-month-dow">{d}</div>)}
        {cells.map((c, i) => {
          const cls = [
            "cal-month-cell",
            c.in_month   ? "" : "cal-not-in-month",
            c.is_weekend ? "cal-is-weekend" : "",
            c.is_today   ? "cal-is-today"   : "",
            c.events.some(e => e.type === "holiday") ? "cal-has-holiday" : "",
          ].filter(Boolean).join(" ");
          return (
            <div key={i} className={cls}>
              <div className="cal-month-num">{c.date.slice(-2)}</div>
              {c.events.slice(0, 3).map(ev => (
                <div key={ev.id} className={`cal-month-ev cal-type-${ev.type}`} title={ev.title}>
                  {multiChild && <span className="cal-month-av">{avatarForChild(ev.child_id)}</span>}
                  <span className="cal-month-ev-text">{ev.title}</span>
                </div>
              ))}
              {c.events.length > 3 && (
                <div className="cal-month-more">+{c.events.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Parent Calendar · EventTypeFilter
   ========================================================================= */
.cal-cat-row {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 10px 12px;
  margin-bottom: var(--space-3); display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
}
.cal-cat-pill {
  font-size: 10.5px; padding: 4px 10px; border-radius: var(--radius-2xl);
  font-weight: var(--font-weight-semibold); cursor: pointer;
  background: var(--color-surface-subtle); color: var(--color-muted);
  border: 1px solid var(--color-border); font-family: inherit;
  display: inline-flex; align-items: center; gap: 4px;
}
.cal-cat-pill.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.cal-cat-pill.cal-type-exam.active    { background: var(--color-danger);   border-color: var(--color-danger); }
.cal-cat-pill.cal-type-meeting.active { background: var(--color-accent);   border-color: var(--color-accent); }
.cal-cat-pill.cal-type-event.active   { background: var(--color-warning);  border-color: var(--color-warning); }
.cal-cat-pill.cal-type-club.active    { background: var(--color-success);  border-color: var(--color-success); }
.cal-cat-pill.cal-type-holiday.active { background: #553C9A; border-color: #553C9A; }
.cal-cat-count { background: rgba(255,255,255,0.16); padding: 1px 5px; border-radius: 6px; font-size: 9px; }
.cal-cat-pill:not(.active) .cal-cat-count { background: var(--color-soft); color: var(--color-muted); }

/* =========================================================================
   Parent Calendar · MonthGrid
   ========================================================================= */
.cal-month-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.cal-month-head {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px;
}
.cal-month-head h3 { margin: 0; font-size: 14px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.cal-nav {
  background: transparent; border: 1px solid var(--color-border);
  width: 26px; height: 26px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: inherit; cursor: pointer; color: var(--color-ink); font-size: 16px;
}
.cal-nav:hover { background: var(--color-soft); }

.cal-month-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
}
.cal-month-dow {
  font-size: 9px; text-align: center; color: var(--color-muted);
  font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .03em; padding: 4px 0;
}
.cal-month-cell {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); min-height: 78px; padding: 4px 6px;
  display: flex; flex-direction: column; gap: 2px; overflow: hidden;
}
.cal-not-in-month { background: var(--color-surface-subtle); opacity: .55; }
.cal-is-weekend   { background: var(--color-surface-subtle); }
.cal-is-today     { border: 2px solid var(--color-primary); background: var(--color-info-soft); }
.cal-has-holiday  { background: #FAF5FF; border-color: #D6BCFA; }
.cal-month-num    { font-weight: var(--font-weight-bold); font-size: 10.5px; color: var(--color-muted); }
.cal-is-today .cal-month-num { color: var(--color-primary); }

.cal-month-ev {
  font-size: 9px; line-height: 1.2; padding: 2px 5px; border-radius: 3px;
  display: flex; align-items: center; gap: 3px; font-weight: var(--font-weight-bold);
  overflow: hidden;
}
.cal-month-ev .cal-month-av {
  width: 14px; height: 14px; border-radius: 50%; background: rgba(0,0,0,.10);
  display: inline-flex; align-items: center; justify-content: center; font-size: 8.5px; flex-shrink: 0;
  color: var(--color-ink);
}
.cal-month-ev-text { white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.cal-month-ev.cal-type-exam    { background: var(--color-danger-soft);  color: var(--color-danger-text); }
.cal-month-ev.cal-type-meeting { background: var(--color-info-soft);    color: var(--color-info-text); }
.cal-month-ev.cal-type-event   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.cal-month-ev.cal-type-club    { background: var(--color-success-soft); color: var(--color-success-text); }
.cal-month-ev.cal-type-holiday { background: #E9D8FD; color: #553C9A; }
.cal-month-more { font-size: 8.5px; color: var(--color-muted); padding: 0 5px; }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/parent/calendar/components apps/web/app/globals.css && git commit -m "Calendar: EventTypeFilter + MonthGrid"
```

---

## Task 4 — UpcomingList + SyncCard

**Files:**
- Create: `apps/web/app/parent/calendar/components/UpcomingList.tsx`
- Create: `apps/web/app/parent/calendar/components/SyncCard.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `UpcomingList.tsx`** (server)

```tsx
import type { CalendarEvent } from "@/lib/mock-calendar";
import { formatDate, relativeDay } from "@/lib/mock-calendar";
import { DEMO_CHILDREN } from "@/lib/child";

const TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  exam: "EXAM", meeting: "MEETING", event: "EVENT", club: "CLUB", holiday: "HOLIDAY",
};

export default function UpcomingList({
  events, multiChild,
}: {
  events:     CalendarEvent[];
  multiChild: boolean;
}) {
  if (events.length === 0) {
    return (
      <section className="cal-up-card" aria-label="Upcoming events">
        <header className="cal-up-head"><h3>Upcoming · next 14 days</h3></header>
        <p className="cal-up-empty">No upcoming events in the next 14 days.</p>
      </section>
    );
  }
  return (
    <section className="cal-up-card" aria-label="Upcoming events">
      <header className="cal-up-head">
        <h3>Upcoming · next 14 days</h3>
        <p className="cal-up-sub">List view of the calendar above.</p>
      </header>
      <ul className="cal-up-list" role="list">
        {events.map(ev => {
          const child = ev.child_id === "household"
            ? { full_name: "Household", initial: "⌂" }
            : DEMO_CHILDREN.find(c => c.id === ev.child_id);
          return (
            <li key={ev.id} className="cal-up-row">
              <span className="cal-up-when">{relativeDay(ev.starts_at)}</span>
              <span className="cal-up-body">
                <span className="cal-up-title">{ev.title}</span>
                <span className="cal-up-meta">
                  {formatDate(ev.starts_at, { withTime: !ev.all_day })}
                  {ev.location && ` · ${ev.location}`}
                  {ev.description && ` · ${ev.description}`}
                </span>
              </span>
              <span className="cal-up-tags">
                {multiChild && (
                  <span className="cal-up-childtag">
                    <span className="cal-up-childav">{child?.initial ?? "?"}</span>
                    {child?.full_name?.split(" ")[0] ?? ""}
                  </span>
                )}
                <span className={`cal-up-typetag cal-type-${ev.type}`}>{TYPE_LABEL[ev.type]}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: `SyncCard.tsx`** (client — uses window.location)

```tsx
"use client";

import { useEffect, useState } from "react";

const PATH = "/api/calendar/feed.ics";

export default function SyncCard({ activeChildId }: { activeChildId: string }) {
  const [host, setHost] = useState("");

  useEffect(() => { setHost(window.location.host); }, []);

  const childQuery = activeChildId === "all" ? "" : `?child=${encodeURIComponent(activeChildId)}`;
  const httpsUrl   = host ? `https://${host}${PATH}${childQuery}` : `${PATH}${childQuery}`;
  const webcalUrl  = host ? `webcal://${host}${PATH}${childQuery}` : "";

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(httpsUrl);
    }
    console.log("[calendar] copy ICS URL", httpsUrl);
  }

  function googleHref() {
    if (!host) return "#";
    return `https://www.google.com/calendar/render?cid=${encodeURIComponent(httpsUrl)}`;
  }

  return (
    <section className="cal-sync-card" aria-label="Sync calendar">
      <header className="cal-sync-head">
        <h3>Sync to your phone</h3>
        <p className="cal-sync-sub">Add school events to Apple / Google Calendar · one tap.</p>
      </header>
      <div className="cal-sync-body">
        <div className="cal-sync-left">
          <h4>One ICS feed that stays in sync</h4>
          <p>Adds today + every future school event for the active child (or the whole household). Updates when the school changes a date.</p>
        </div>
        <div className="cal-sync-actions">
          <a className="cal-sync-btn primary" href={webcalUrl}>Add to Apple Calendar</a>
          <a className="cal-sync-btn primary" href={googleHref()} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          <button type="button" className="cal-sync-btn ghost" onClick={copy}>Copy ICS link</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Parent Calendar · UpcomingList
   ========================================================================= */
.cal-up-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.cal-up-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.cal-up-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.cal-up-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.cal-up-empty { font-size: 11.5px; color: var(--color-muted); margin: 0; }
.cal-up-list { list-style: none; padding: 0; margin: 0; }
.cal-up-row {
  display: grid; grid-template-columns: 90px 1fr auto;
  gap: 12px; align-items: center; padding: 10px 0;
  border-bottom: 1px dashed var(--color-border); font-size: 11px;
}
.cal-up-row:last-child { border-bottom: 0; }
.cal-up-when { font-size: 10.5px; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.cal-up-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cal-up-title { color: var(--color-ink); font-weight: var(--font-weight-bold); font-size: 12px; }
.cal-up-meta  { color: var(--color-muted); font-size: 10.5px; }
.cal-up-tags  { display: flex; gap: 4px; align-items: center; }
.cal-up-childtag {
  background: var(--color-soft); color: var(--color-ink);
  padding: 2px 8px; border-radius: var(--radius-2xl); font-size: 9.5px;
  font-weight: var(--font-weight-bold); display: inline-flex; align-items: center; gap: 4px;
}
.cal-up-childav {
  width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.10);
  display: inline-flex; align-items: center; justify-content: center; font-size: 8px;
}
.cal-up-typetag {
  font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
}
.cal-up-typetag.cal-type-exam    { background: var(--color-danger-soft);  color: var(--color-danger-text); }
.cal-up-typetag.cal-type-meeting { background: var(--color-info-soft);    color: var(--color-info-text); }
.cal-up-typetag.cal-type-event   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.cal-up-typetag.cal-type-club    { background: var(--color-success-soft); color: var(--color-success-text); }
.cal-up-typetag.cal-type-holiday { background: #E9D8FD; color: #553C9A; }

/* =========================================================================
   Parent Calendar · SyncCard
   ========================================================================= */
.cal-sync-card {
  background: linear-gradient(135deg, var(--color-surface-subtle), #F0F4FA);
  border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  padding: 14px 16px; margin-bottom: var(--space-3);
}
.cal-sync-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.cal-sync-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.cal-sync-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.cal-sync-body { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; }
@media (max-width: 700px) { .cal-sync-body { grid-template-columns: 1fr; } }
.cal-sync-left h4 { margin: 0 0 4px; font-size: 12px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.cal-sync-left p  { margin: 0; font-size: 10.5px; color: var(--color-muted); line-height: 1.5; }
.cal-sync-actions { display: flex; flex-direction: column; gap: 6px; }
.cal-sync-btn {
  background: var(--color-primary); color: #fff;
  padding: 8px 14px; border-radius: var(--radius-md); font-size: 10.5px;
  font-weight: var(--font-weight-bold); text-align: center; cursor: pointer;
  border: 0; font-family: inherit; text-decoration: none;
}
.cal-sync-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
.cal-sync-btn.ghost:hover { background: var(--color-soft); color: var(--color-ink); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/calendar/components apps/web/app/globals.css && git commit -m "Calendar: UpcomingList + SyncCard"
```

---

## Task 5 — CalendarClient + page assembly

**Files:**
- Create: `apps/web/app/parent/calendar/CalendarClient.tsx`
- Modify: `apps/web/app/parent/calendar/page.tsx`

- [ ] **Step 1: `CalendarClient.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useActiveChild, ALL_CHILDREN_ID } from "@/lib/child";
import {
  type CalendarEvent, type EventType,
  eventsForChild, eventTypeCounts, upcomingEvents,
} from "@/lib/mock-calendar";

import EventTypeFilter from "./components/EventTypeFilter";
import MonthGrid       from "./components/MonthGrid";
import UpcomingList    from "./components/UpcomingList";
import SyncCard        from "./components/SyncCard";

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const { activeId } = useActiveChild();
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());

  const scoped = useMemo(() => eventsForChild(events, activeId), [events, activeId]);

  const filtered = useMemo(
    () => activeTypes.size === 0 ? scoped : scoped.filter(e => activeTypes.has(e.type)),
    [scoped, activeTypes],
  );

  const counts   = useMemo(() => eventTypeCounts(scoped), [scoped]);
  const upcoming = useMemo(() => upcomingEvents(filtered, 14), [filtered]);

  function toggleType(t: EventType) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  const multiChild = activeId === ALL_CHILDREN_ID;

  return (
    <div className="container">
      <h1>Calendar</h1>
      <p className="sub">{multiChild ? "Household view" : "Single-child view"} · AY 2025–26</p>

      <EventTypeFilter
        active={activeTypes}
        counts={counts}
        totalAll={scoped.length}
        onToggle={toggleType}
        onClearAll={() => setActiveTypes(new Set())}
      />

      <MonthGrid events={filtered} multiChild={multiChild} />
      <UpcomingList events={upcoming} multiChild={multiChild} />
      <SyncCard activeChildId={activeId} />
    </div>
  );
}
```

- [ ] **Step 2: Replace `page.tsx`**

```tsx
/**
 * Parent · Calendar tab.
 *
 * Server component renders the event list once; CalendarClient owns all
 * interactive state (filter chips, month nav). Mock data today; future
 * RPC swap is a one-import change.
 */

import { MOCK_EVENTS } from "@/lib/mock-calendar";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default function ParentCalendarPage() {
  return <CalendarClient events={MOCK_EVENTS} />;
}
```

- [ ] **Step 3: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/calendar/page.tsx apps/web/app/parent/calendar/CalendarClient.tsx && git commit -m "/parent/calendar: page assembly · ChildSwitcher-aware month + upcoming + sync"
```

---

## Task 6 — Verification + push + memory

- [ ] **Step 1: Full suite**
```bash
cd ~/dev/manhaj/apps/web && npm test && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -15
```
86 tests pass. Build green.

- [ ] **Step 2: Visual smoke + ICS feed sanity check**

Run dev server. Open `/parent/calendar`:
- All 6 blocks render.
- Click "Exams" chip → only red exam tiles remain.
- Switch to ChildSwitcher → Layla → only Layla + household events.
- Click "Copy ICS link" → URL copied to clipboard.
- Visit `http://localhost:3033/api/calendar/feed.ics` in a new tab. Confirm the response is valid iCalendar text starting with `BEGIN:VCALENDAR`.
- Optional: paste the URL into Apple Calendar's "Calendar → Add Subscription…" dialog and confirm the events show up.

- [ ] **Step 3: Push**
```bash
cd ~/dev/manhaj && git push origin main
```

- [ ] **Step 4: Update memory** at `~/.claude/projects/.../memory/project_school_ops_decisions.md` with a new entry.

---

## Self-review

| Spec section | Plan task |
|---|---|
| §5 fixture | Task 1 |
| §8 ICS generator + route | Task 2 |
| §7.1-7.2 EventTypeFilter / MonthGrid | Task 3 |
| §7.3-7.4 UpcomingList / SyncCard | Task 4 |
| §9 page assembly | Task 5 |
| §10 acceptance criteria | Task 6 |

Types consistent across files. No "TBD" / placeholder language. ICS spec is concrete (RFC 5545 minimum subset).
