/**
 * Parent · Calendar tab.
 *
 * Server component renders the event list once; CalendarClient owns all
 * interactive state (filter chips, month nav). Mock data today; future
 * RPC swap is a one-import change.
 */

import { MOCK_EVENTS } from "@manhaj/lib/mock-calendar";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default function ParentCalendarPage() {
  return <CalendarClient events={MOCK_EVENTS} />;
}
