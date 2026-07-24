import { describe, expect, it } from "vitest";
import { eventsToIcs } from "./ics";
import { MOCK_EVENTS } from "./mock-calendar";

describe("eventsToIcs", () => {
  const ics = eventsToIcs(MOCK_EVENTS, "Manhaji · Household");

  it("starts with BEGIN:VCALENDAR and ends with END:VCALENDAR", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
  it("contains the calendar name", () => {
    expect(ics).toContain("X-WR-CALNAME:Manhaji · Household");
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
