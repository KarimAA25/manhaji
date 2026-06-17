import { NextRequest } from "next/server";
import { MOCK_EVENTS, eventsForChild } from "@manhaj/lib/mock-calendar";
import { eventsToIcs } from "@manhaj/lib/ics";

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
