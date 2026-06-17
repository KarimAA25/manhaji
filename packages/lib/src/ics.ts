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
