# Parent · Calendar tab · design spec (Phase 2.5)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) §6.3 |
| **Brainstorm mockup** | `~/dev/manhaj/.superpowers/brainstorm/.../content/parent-persona.html` + `parent-multi-child.html` |

---

## 1. Background

Phase 1 left `/parent/calendar` as a `<PlaceholderPage />`. This PR ships the **maximalist scope (6 blocks)** with a **working ICS feed** so "Add to Apple Calendar" actually subscribes the user's calendar app. Pure mock data — no schema, no Resend dependency.

## 2. Goals

1. **All 6 brainstorm blocks** against synthetic data:
   1. Event-type filter chips (Exams / Parent-teacher / Events / Clubs / Holidays)
   2. Per-child filter chips (when household view is active) — driven by `useActiveChild()`
   3. Month grid (May 2026 default) with today highlighted, weekends greyed, holidays purple-tinted
   4. Child-avatar dots on event tiles (multi-child mode)
   5. Upcoming list — next 14 days, list view of the calendar
   6. Sync card with Apple / Google deep links + Copy ICS URL button
2. **Working ICS feed** at `/api/calendar/feed.ics`. Subscribers (Apple Calendar / Google Calendar) get a valid iCalendar file containing every event for the active parent. Refreshes automatically when the underlying mock fixture changes (today: a static set; tomorrow: a real DB query).
3. **Cross-child events handled.** Multi-child households see one calendar with everything; child-tag chips on each event row clarify ownership.
4. **No schema changes.** Pure mock fixture + ICS generator. The fixture shape mirrors a future events RPC return.

## 3. Non-goals

- Editing events / RSVP.
- Real DB-backed events (Phase 3 — once a school events table lands).
- Per-event reminders / push notifications.
- Importing the school's existing calendar from Google / Outlook.
- Day / week view (month + upcoming list only).

## 4. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Scope | **Maximalist** — all 6 blocks + live ICS. |
| 2 | Default month | May 2026 — matches the demo dates we've used throughout (Eid in April, mid-term in May). Hard-coded `now` = `2026-05-22` for deterministic rendering. |
| 3 | Event types | `exam` / `meeting` / `event` / `club` / `holiday`. Five types — colors match the existing chip-tone vocabulary. |
| 4 | ICS feed URL | `/api/calendar/feed.ics`. Query string `?child=layla-al-habsi` scopes to one child; otherwise returns all events visible to the demo parent (household + every child). |
| 5 | Apple Calendar deep link | `webcal://manhaj-ten.vercel.app/api/calendar/feed.ics` (rendered with the deployed host; localhost falls back to copy-URL). |
| 6 | Google Calendar deep link | `https://www.google.com/calendar/render?cid=<URL-encoded https URL>`. |
| 7 | Time zone | Asia/Muscat (UTC+4). All events stamped in this TZ in the ICS output. |
| 8 | Sync freshness | ICS feed is dynamic (rebuilt every request from the fixture). Calendar clients poll every few hours; that's fine for demo cadence. |

## 5. File map

**Create:**

| Path | Role |
|---|---|
| `apps/web/lib/mock-calendar.ts` | Fixture + types + helpers (filter, scope) |
| `apps/web/lib/calendar.test.ts` | Vitest tests |
| `apps/web/lib/ics.ts` | iCalendar text generator (pure function) |
| `apps/web/app/api/calendar/feed.ics/route.ts` | Next.js route handler — GET serves the .ics |
| `apps/web/app/parent/calendar/components/EventTypeFilter.tsx` | Chip filter |
| `apps/web/app/parent/calendar/components/MonthGrid.tsx` | 7-col month grid with event tiles |
| `apps/web/app/parent/calendar/components/UpcomingList.tsx` | Next-14-days list |
| `apps/web/app/parent/calendar/components/SyncCard.tsx` | Apple / Google / Copy-URL CTAs |
| `apps/web/app/parent/calendar/CalendarClient.tsx` | Client component with state + filtering |

**Modify:**

- `apps/web/app/parent/calendar/page.tsx` — replace placeholder with the assembled page (server fetch via `lib/mock-calendar.ts`, hands events to client)
- `apps/web/app/globals.css` — append CSS

## 6. Data shape

`apps/web/lib/mock-calendar.ts` exports:

```ts
export type EventType = "exam" | "meeting" | "event" | "club" | "holiday";

export type CalendarEvent = {
  id:          string;
  title:       string;             // "Chemistry mid-term"
  type:        EventType;
  starts_at:   string;             // ISO local "2026-05-12T09:30:00+04:00"
  ends_at:     string;             // ISO local — same day for most; multi-day for holidays
  all_day:     boolean;            // true = no time component shown
  child_id:    string | "household";  // matches lib/child.tsx IDs
  location?:   string;             // "Lab 1" / "R204"
  description?: string;            // short body for the upcoming list
};

// Aggregate types for the UI
export type DayCell = {
  date:       string;        // "2026-05-22"
  events:     CalendarEvent[];
  is_today:   boolean;
  is_weekend: boolean;
  in_month:   boolean;       // false for prev/next-month padding cells
};

export type EventTypeCount = Record<EventType, number>;
export type ChildEventCount = { child_id: string | "household"; label: string; count: number };

// Exports
export const MOCK_EVENTS:   CalendarEvent[];   // ~20 events
export const DEMO_TODAY:    string;            // "2026-05-22" — fixed for deterministic UI

export function eventsForChild(events: CalendarEvent[], childId: string): CalendarEvent[];
export function eventsInMonth(events: CalendarEvent[], year: number, monthIndex0: number): DayCell[];
export function upcomingEvents(events: CalendarEvent[], windowDays?: number): CalendarEvent[];
export function eventTypeCounts(events: CalendarEvent[]): EventTypeCount;
export function childEventCounts(events: CalendarEvent[]): ChildEventCount[];
export function formatDate(iso: string, opts?: { withTime?: boolean }): string;
```

**Realism rules (~20 events in May 2026):**
- **Layla (10A)** — Chem mid-term (12 May P3 Lab 1), MUN debate (14 May 16:00 R204), English mid-term (19 May P2 R204), Maths mid-term (22 May P5), MUN club practice (20 May, 28 May).
- **Omar (7B)** — Maths quiz (14 May), Football match (7 May Saturday 16:00).
- **Yasmin (KG2)** — Spring concert (4 May AM), Music day (27 May).
- **Household / school-wide** — Parent-teacher evening (18 May 16:00 onwards), Term 2 invoice due reminder (25 May), Eid Al-Adha public holiday (24-26 June, multi-day), Honor citations ceremony (8 May 18:00), Mid-term assessment week (5-9 May).

## 7. Components

### 7.1 `<EventTypeFilter />` — client

```tsx
type Props = {
  active:    Set<EventType>;             // empty set = all visible
  counts:    EventTypeCount;
  totalAll:  number;
  onToggle:  (t: EventType) => void;
  onClearAll: () => void;
};
```

Chips: All · Exams · Parent-teacher · Events · Clubs · Holidays. "All" is rendered as a deselect-all action. Tones map to existing palette:
- `exam` → bad (red soft)
- `meeting` → info (blue soft)
- `event` → warn (yellow soft)
- `club` → good (green soft)
- `holiday` → neutral with purple tint (`#FAF5FF` / `#553C9A`)

### 7.2 `<MonthGrid />` — client (state for current month nav)

7-column grid, 5-6 rows depending on the month. Sunday-first per ISO international school convention (will be configurable later). Pads with previous-month + next-month days (greyed). Event tiles inside each cell:

```
┌──────────────┐
│ 12           │
│ ┌──────────┐ │
│ │L Chem...│ │  ← event tile, child-avatar + truncated title
│ └──────────┘ │
└──────────────┘
```

Today's cell gets a navy outline. Holidays get a purple background. Weekends get a faint grey background.

### 7.3 `<UpcomingList />` — server

Vertical list. Sorted ascending by `starts_at`. Each row: time-relative ("in 8 days"), title (with truncation), child-tag chip + type-tag chip, optional location.

### 7.4 `<SyncCard />` — client

Three buttons:
- **Add to Apple Calendar** — clicks open `webcal://<host>/api/calendar/feed.ics?child=<active>`.
- **Add to Google Calendar** — opens `https://www.google.com/calendar/render?cid=<encoded https URL>`.
- **Copy ICS link** — copies the plain HTTPS URL to clipboard.

Host resolution: `window.location.host` on client. The component is rendered after hydration so it has access to the host. Server-render falls back to a placeholder.

## 8. ICS feed

### Generator (`lib/ics.ts`)

Pure function that converts `CalendarEvent[]` into iCalendar text per RFC 5545. Minimum spec:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manhaj//Parent Calendar//EN
X-WR-CALNAME:Manhaj · {parent or child name}
X-WR-TIMEZONE:Asia/Muscat
BEGIN:VEVENT
UID:{event.id}@manhaj.app
SUMMARY:{title}
DTSTART;TZID=Asia/Muscat:20260512T093000
DTEND;TZID=Asia/Muscat:20260512T110000
LOCATION:{location}
DESCRIPTION:{description}
CATEGORIES:{type}
END:VEVENT
... more events ...
END:VCALENDAR
```

All-day events use `DTSTART;VALUE=DATE:20260524` form. Multi-day holidays span DTSTART → DTEND.

Lines are CRLF-terminated. No line folding for now (keeps generator simple; most clients accept lines under 75 octets — our titles + descriptions are short).

### Route handler

`apps/web/app/api/calendar/feed.ics/route.ts`:

```ts
import { NextRequest } from "next/server";
import { MOCK_EVENTS, eventsForChild } from "@/lib/mock-calendar";
import { eventsToIcs } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const childParam = req.nextUrl.searchParams.get("child") ?? "all";
  const events = childParam === "all" ? MOCK_EVENTS : eventsForChild(MOCK_EVENTS, childParam);
  const calName = childParam === "all" ? "Manhaj · Household" : `Manhaj · ${childParam}`;
  const body = eventsToIcs(events, calName);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":  "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",   // 1h cache; calendar clients poll their own cadence
    },
  });
}
```

## 9. Page rendering

```tsx
// page.tsx — server component
import { MOCK_EVENTS } from "@/lib/mock-calendar";
import CalendarClient from "./CalendarClient";

export default function ParentCalendarPage() {
  return <CalendarClient events={MOCK_EVENTS} />;
}
```

```tsx
// CalendarClient.tsx — "use client"
const { activeId } = useActiveChild();
const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());
const [currentMonth, setCurrentMonth] = useState(/* May 2026 */);

const scoped = useMemo(() => eventsForChild(events, activeId), [events, activeId]);
const filtered = useMemo(
  () => activeTypes.size === 0 ? scoped : scoped.filter(e => activeTypes.has(e.type)),
  [scoped, activeTypes],
);
const days = useMemo(() => eventsInMonth(filtered, ...), [filtered, currentMonth]);
const upcoming = useMemo(() => upcomingEvents(filtered, 14), [filtered]);

return (
  <div className="container">
    <EventTypeFilter ... />
    <MonthGrid days={days} ... />
    <UpcomingList rows={upcoming} ... />
    <SyncCard activeChildId={activeId} />
  </div>
);
```

## 10. Acceptance criteria

- [ ] `/parent/calendar` renders all 6 blocks against `MOCK_EVENTS`.
- [ ] Toggling event-type chips filters month grid + upcoming list.
- [ ] Switching child via ChildSwitcher re-filters the calendar (uses `useActiveChild()`).
- [ ] Month grid shows the right number of cells with proper today / weekend / holiday styling.
- [ ] Multi-child mode: events carry a small child-avatar dot.
- [ ] `/api/calendar/feed.ics` returns valid iCalendar text (`Content-Type: text/calendar`). Pasting the URL into Apple Calendar's "Subscribe" dialog produces a populated calendar.
- [ ] "Copy ICS link" copies the URL to clipboard.
- [ ] Mobile (375 px) — month grid scrolls horizontally OR collapses to a list. No content cut-off.
- [ ] Build + lint + tsc clean. Tests pass (70 prior + N new).

## 11. Risks

| Risk | Mitigation |
|---|---|
| Month grid math is fiddly (start-of-month day-of-week, pad cells) | `eventsInMonth(events, year, monthIndex0)` is a pure function tested with vitest. Cover first-of-month landing on each weekday. |
| ICS line-folding edge case | Skip folding for 2.5 (lines stay under 75 chars). Document in `lib/ics.ts` comment. |
| Apple Calendar refusing the `webcal://` link on localhost | Document in the Sync card hint that subscribe only works on the deployed URL; localhost users use Copy URL. |
| Time-zone mismatches between server / client | All event timestamps stored as ISO with explicit `+04:00` offset. ICS emits `TZID=Asia/Muscat`. |

## 12. Self-review

- ✓ Pure UI + utility code. No schema, no auth, no Resend.
- ✓ Types in §6, §7, §8, §9 consistent.
- ✓ ICS spec compliance is concrete (RFC 5545 minimum subset).
- ✓ Empty state covered: if a filter combination has zero events, MonthGrid renders the empty cells; UpcomingList shows "No upcoming events in the next 14 days."
- ✓ Multi-child + ActiveChild context wired explicitly via §7 / §9.

Ready to write the plan.
