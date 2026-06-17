import { describe, expect, it } from "vitest";
import {
  MOCK_DEPARTMENTS,
  MOCK_TEACHERS,
  MOCK_ONBOARDING_PIPELINE,
  MOCK_PERFORMANCE,
  contractGroups,
  facultyKpis,
  biggestDelta,
} from "./mock-faculty";

describe("mock-faculty fixture shape", () => {
  it("has exactly 9 departments", () => {
    expect(MOCK_DEPARTMENTS.length).toBe(9);
  });

  it("has exactly 25 teachers", () => {
    expect(MOCK_TEACHERS.length).toBe(25);
  });

  it("has 5 onboarding stages in descending order", () => {
    expect(MOCK_ONBOARDING_PIPELINE.length).toBe(5);
    for (let i = 1; i < MOCK_ONBOARDING_PIPELINE.length; i++) {
      expect(MOCK_ONBOARDING_PIPELINE[i].count).toBeLessThanOrEqual(
        MOCK_ONBOARDING_PIPELINE[i - 1].count,
      );
    }
  });

  it("has 9 performance rows matching department ids", () => {
    expect(MOCK_PERFORMANCE.length).toBe(9);
    const deptIds = new Set(MOCK_DEPARTMENTS.map(d => d.id));
    for (const row of MOCK_PERFORMANCE) {
      expect(deptIds.has(row.dept_id)).toBe(true);
    }
  });

  it("all teacher dept_ids reference a known department", () => {
    const deptIds = new Set(MOCK_DEPARTMENTS.map(d => d.id));
    for (const t of MOCK_TEACHERS) {
      expect(deptIds.has(t.dept_id)).toBe(true);
    }
  });
});

describe("contractGroups helper", () => {
  const groups = contractGroups(MOCK_TEACHERS);

  it("returns 3 groups", () => {
    expect(groups.length).toBe(3);
  });

  it("expiring-3m group contains only expiring-3m teachers", () => {
    const g = groups.find(g => g.key === "expiring-3m")!;
    expect(g).toBeDefined();
    expect(g.teachers.every(t => t.contract_status === "expiring-3m")).toBe(true);
  });

  it("total across all groups equals the matching teacher count", () => {
    const total = groups.reduce((s, g) => s + g.teachers.length, 0);
    const expected = MOCK_TEACHERS.filter(t => t.contract_status !== "active").length;
    expect(total).toBe(expected);
  });
});

describe("facultyKpis helper", () => {
  const k = facultyKpis(MOCK_TEACHERS);

  it("total equals MOCK_TEACHERS length", () => {
    expect(k.total).toBe(MOCK_TEACHERS.length);
  });

  it("over_capacity matches teachers with status=over", () => {
    const expected = MOCK_TEACHERS.filter(t => t.status === "over").length;
    expect(k.over_capacity).toBe(expected);
  });

  it("avg_util is a number 0–100", () => {
    expect(k.avg_util).toBeGreaterThanOrEqual(0);
    expect(k.avg_util).toBeLessThanOrEqual(100);
  });
});

describe("biggestDelta helper", () => {
  it("returns non-null for non-empty rows", () => {
    expect(biggestDelta(MOCK_PERFORMANCE)).not.toBeNull();
  });

  it("returns null for empty array", () => {
    expect(biggestDelta([])).toBeNull();
  });
});
