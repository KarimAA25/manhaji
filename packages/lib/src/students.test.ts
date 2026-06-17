import { describe, expect, it } from "vitest";
import { MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS, cohortHeat } from "./mock-students";

describe("mock-students fixture", () => {
  it("has at least 30 rows", () => {
    expect(MOCK_STUDENTS.length).toBeGreaterThanOrEqual(30);
  });
  it("has at least one honor-roll student", () => {
    expect(MOCK_STUDENTS.some(s => s.status === "honor")).toBe(true);
  });
  it("has at least one support student", () => {
    expect(MOCK_STUDENTS.some(s => s.status === "support")).toBe(true);
  });
  it("has at least one chronic-absentee flag", () => {
    expect(MOCK_STUDENTS.some(s => s.flags.includes("chronic-absentee"))).toBe(true);
  });
  it("has at least 6 incidents", () => {
    expect(MOCK_INCIDENTS.length).toBeGreaterThanOrEqual(6);
  });
  it("has at least 6 admissions in the inbox", () => {
    expect(MOCK_ADMISSIONS.length).toBeGreaterThanOrEqual(6);
  });
});

describe("cohortHeat", () => {
  it("returns one row per non-admission section", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    expect(heat.length).toBeGreaterThan(0);
    expect(heat.every(h => h.section_code !== "—")).toBe(true);
  });
  it("returns rubric averages in 0..5 inclusive", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    for (const h of heat) {
      for (const score of Object.values(h.rubric)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(5);
      }
    }
  });
  it("is sorted by section_code", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    const sorted = [...heat].sort((a, b) => a.section_code.localeCompare(b.section_code));
    expect(heat.map(h => h.section_code)).toEqual(sorted.map(h => h.section_code));
  });
});
