import { NextRequest } from "next/server";
import { MOCK_EVENTS, eventsForChild } from "@manhaj/lib/mock-calendar";
import { eventsToIcs } from "@manhaj/lib/ics";
import { getActivitiesForYear } from "@manhaj/lib/queries/activities";
import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import type { CalendarEvent } from "@manhaj/lib/mock-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const childParam = req.nextUrl.searchParams.get("child") ?? "all";
  const calName = childParam === "all" ? "Manhaji · Household" : `Manhaji · ${childParam}`;

  let events: CalendarEvent[];
  try {
    const academicYearId = await getCurrentAcademicYearId();
    if (academicYearId) {
      const activities = await getActivitiesForYear(academicYearId);
      events = activities.map(a => ({
        id:       a.id,
        title:    a.title,
        type:     (a.kind === "exam" || a.kind === "meeting" || a.kind === "club" || a.kind === "holiday" ? a.kind : "event") as CalendarEvent["type"],
        starts_at: `${a.activity_date}T08:00:00+04:00`,
        ends_at:   `${a.activity_date}T17:00:00+04:00`,
        all_day:   true,
        child_id:  "household" as const,
        location:  a.event_location ?? undefined,
        description: a.description ?? undefined,
      }));
      if (events.length === 0) events = MOCK_EVENTS;
    } else {
      events = MOCK_EVENTS;
    }
  } catch {
    events = MOCK_EVENTS;
  }

  if (childParam !== "all") events = eventsForChild(events, childParam);

  const body = eventsToIcs(events, calName);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":  "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
