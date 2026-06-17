import { describe, expect, it } from "vitest";
import {
  ATT_DAILY, ATT_EVENTS, ATT_DOW, ATT_PERIODS, ATT_CAUSES, ATT_SECTIONS,
  ATT_CHRONIC, ATT_BENCHMARK, ATT_CAL_OMAR, ATT_LESSONS, ATT_KPIS,
} from "./mock-attendance";

describe("mock-attendance fixture", () => {
  it("has at least 30 daily points", () => {
    expect(ATT_DAILY.length).toBeGreaterThanOrEqual(30);
  });
  it("daily pct is always 0–100", () => {
    for (const d of ATT_DAILY) {
      expect(d.pct).toBeGreaterThanOrEqual(0);
      expect(d.pct).toBeLessThanOrEqual(100);
    }
  });
  it("has 3 event markers", () => {
    expect(ATT_EVENTS.length).toBe(3);
    expect(ATT_EVENTS.map(e => e.id)).toEqual([1, 2, 3]);
  });
  it("has 6 weeks of day-of-week + each period 1-7", () => {
    expect(ATT_DOW.length).toBe(6);
    expect(ATT_PERIODS.map(p => p.period)).toEqual([1,2,3,4,5,6,7]);
  });
  it("has 4 AI cause cards with valid confidence", () => {
    expect(ATT_CAUSES.length).toBe(4);
    for (const c of ATT_CAUSES) {
      expect(["high", "medium"]).toContain(c.confidence);
    }
  });
  it("has 6 section weekly bars with 5 days each", () => {
    expect(ATT_SECTIONS.length).toBe(6);
    for (const s of ATT_SECTIONS) expect(s.days.length).toBe(5);
  });
  it("has at least 5 chronic absentees with cross-ref IDs", () => {
    expect(ATT_CHRONIC.length).toBeGreaterThanOrEqual(5);
    for (const r of ATT_CHRONIC) expect(r.student_id).toBeTruthy();
  });
  it("Omar's calendar heat has 20 weeks of 5 days", () => {
    expect(ATT_CAL_OMAR.length).toBe(20);
    for (const w of ATT_CAL_OMAR) expect(w.length).toBe(5);
  });
  it("benchmark has 4 rows with sane percentages", () => {
    expect(ATT_BENCHMARK.length).toBe(4);
    for (const b of ATT_BENCHMARK) {
      expect(b.pct).toBeGreaterThanOrEqual(0);
      expect(b.pct).toBeLessThanOrEqual(100);
    }
  });
  it("KPIs all defined", () => {
    expect(ATT_KPIS.this_week_pct).toBeGreaterThan(0);
    expect(ATT_KPIS.chronic_count).toBeGreaterThan(0);
    expect(ATT_LESSONS.length).toBeGreaterThan(0);
  });
});
