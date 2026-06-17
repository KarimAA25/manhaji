import { describe, expect, it } from "vitest";
import {
  MOCK_HOMEWORK, MOCK_COMPLETION, homeworkKpis, mostUrgent, groupByStatus,
} from "./mock-homework";

describe("mock-homework fixture", () => {
  it("has 14+ items spanning all statuses", () => {
    expect(MOCK_HOMEWORK.length).toBeGreaterThanOrEqual(14);
    const statuses = new Set(MOCK_HOMEWORK.map(h => h.status));
    expect(statuses.has("overdue")).toBe(true);
    expect(statuses.has("done")).toBe(true);
  });
  it("has 4 weeks of completion data", () => {
    expect(MOCK_COMPLETION.length).toBe(4);
  });
});

describe("homeworkKpis", () => {
  const k = homeworkKpis(MOCK_HOMEWORK);
  it("counts overdue items", () => {
    expect(k.overdue).toBeGreaterThanOrEqual(1);
  });
  it("counts in-progress items", () => {
    expect(k.in_progress).toBeGreaterThanOrEqual(1);
  });
});

describe("mostUrgent", () => {
  it("returns the overdue item first if any exist", () => {
    const u = mostUrgent(MOCK_HOMEWORK);
    expect(u).not.toBeNull();
    expect(u?.status).toBe("overdue");
  });
});

describe("groupByStatus", () => {
  it("returns ordered groups, overdue first", () => {
    const groups = groupByStatus(MOCK_HOMEWORK);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].key).toBe("overdue");
  });
});
