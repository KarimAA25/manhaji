import { describe, expect, it } from "vitest";
import {
  MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM,
  SECTIONS, DAYS, PERIODS,
  slotsForSection, scheduleKpis, overloadedTeachers,
} from "./mock-schedule";

describe("mock-schedule fixture", () => {
  it("has 6 sections × 5 days × 7 periods = 210 slots", () => {
    expect(MOCK_SLOTS.length).toBe(SECTIONS.length * DAYS.length * PERIODS.length);
  });
  it("includes at least one gap and one conflict for 10A", () => {
    const ten = slotsForSection(MOCK_SLOTS, "10A");
    expect(ten.some(s => s.state === "gap")).toBe(true);
    expect(ten.some(s => s.state === "conflict")).toBe(true);
  });
  it("has at least 5 ActionQueue items", () => {
    expect(MOCK_ACTIONS.length).toBeGreaterThanOrEqual(5);
  });
});

describe("slotsForSection", () => {
  it("returns 35 slots (5x7) per section", () => {
    expect(slotsForSection(MOCK_SLOTS, "10A").length).toBe(35);
  });
});

describe("scheduleKpis", () => {
  const k = scheduleKpis(MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);
  it("returns coverage_pct in 0..100", () => {
    expect(k.coverage_pct).toBeGreaterThan(0);
    expect(k.coverage_pct).toBeLessThanOrEqual(100);
  });
  it("counts conflicts + gaps correctly", () => {
    expect(k.conflicts + k.gaps).toBe(MOCK_ACTIONS.length);
  });
  it("returns avg + max load > 0", () => {
    expect(k.avg_load).toBeGreaterThan(0);
    expect(k.max_load).toBeGreaterThanOrEqual(k.avg_load);
  });
  it("curriculum_pct is sane", () => {
    expect(k.curriculum_pct).toBeGreaterThan(50);
    expect(k.curriculum_pct).toBeLessThanOrEqual(100);
  });
});

describe("overloadedTeachers", () => {
  it("flags teachers with any day > 5 periods", () => {
    const ov = overloadedTeachers(MOCK_TEACHER_LOADS);
    expect(ov).toContain("Mr Faisal");
    expect(ov).toContain("Ms Layla");
  });
});
