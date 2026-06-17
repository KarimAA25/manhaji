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
