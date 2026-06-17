import { describe, expect, it } from "vitest";
import {
  MOCK_PERIODS, DEMO_NOW, DEMO_DAY, periodsForDay, currentPeriod,
} from "./mock-student-schedule";

describe("mock-student-schedule fixture", () => {
  it("has 5 days × 9 bell rows = 45 periods", () => {
    expect(MOCK_PERIODS.length).toBe(45);
  });
});

describe("periodsForDay", () => {
  it("returns 9 rows for Wed", () => {
    expect(periodsForDay(MOCK_PERIODS, "Wed").length).toBe(9);
  });
});

describe("currentPeriod", () => {
  const { current, next, minutes_left } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  it("identifies Wed P3 as current at 10:35", () => {
    expect(current?.period).toBe("P3");
    expect(current?.day).toBe(DEMO_DAY);
    expect(current?.subject).toBe("Maths");
  });
  it("computes minutes_left > 0 and <= 50", () => {
    expect(minutes_left).toBeGreaterThan(0);
    expect(minutes_left).toBeLessThanOrEqual(50);
  });
  it("returns the Break as next period", () => {
    expect(next?.period).toBe("BR");
  });
});
