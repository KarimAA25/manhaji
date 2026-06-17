import { describe, expect, it } from "vitest";
import {
  LAYLA_SUBJECTS,
  PLACEMENT_TIERS,
  IMPROVEMENT_PLAN,
  MOM_DELTA,
  subjectsByGrade,
  flaggedSubjects,
  trendingUpSubjects,
  type IGCSEGrade,
} from "./mock-student-academic";

/* -------------------------------------------------------------------------- */
/* Fixture shape                                                               */
/* -------------------------------------------------------------------------- */

describe("LAYLA_SUBJECTS fixture", () => {
  it("has 10 subjects", () => {
    expect(LAYLA_SUBJECTS.length).toBe(10);
  });

  it("every subject has a valid IGCSE grade", () => {
    const valid: IGCSEGrade[] = ["A*", "A", "A-", "B+", "B", "B-", "C+", "C"];
    for (const s of LAYLA_SUBJECTS) {
      expect(valid).toContain(s.grade);
    }
  });

  it("every subject has a valid trend", () => {
    for (const s of LAYLA_SUBJECTS) {
      expect(["up", "flat", "down"]).toContain(s.trend);
    }
  });

  it("percentile is between 0 and 100 for every subject", () => {
    for (const s of LAYLA_SUBJECTS) {
      expect(s.percentile).toBeGreaterThanOrEqual(0);
      expect(s.percentile).toBeLessThanOrEqual(100);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Placement tiers                                                             */
/* -------------------------------------------------------------------------- */

describe("PLACEMENT_TIERS fixture", () => {
  it("has exactly 3 tiers", () => {
    expect(PLACEMENT_TIERS.length).toBe(3);
  });

  it("tier percentages sum to 100", () => {
    const sum = PLACEMENT_TIERS.reduce((acc, t) => acc + t.band_pct, 0);
    expect(sum).toBe(100);
  });

  it("every tier has at least 3 example universities", () => {
    for (const t of PLACEMENT_TIERS) {
      expect(t.example_universities.length).toBeGreaterThanOrEqual(3);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Improvement plan                                                            */
/* -------------------------------------------------------------------------- */

describe("IMPROVEMENT_PLAN fixture", () => {
  it("has exactly 3 plan cards", () => {
    expect(IMPROVEMENT_PLAN.length).toBe(3);
  });

  it("every card has a non-empty headline and body", () => {
    for (const c of IMPROVEMENT_PLAN) {
      expect(c.headline.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Month-over-month delta                                                      */
/* -------------------------------------------------------------------------- */

describe("MOM_DELTA fixture", () => {
  it("has exactly 3 groups (up / flat / down)", () => {
    expect(MOM_DELTA.length).toBe(3);
  });

  it("includes one group per kind", () => {
    const kinds = MOM_DELTA.map(g => g.kind);
    expect(kinds).toContain("up");
    expect(kinds).toContain("flat");
    expect(kinds).toContain("down");
  });
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

describe("subjectsByGrade", () => {
  it("returns subjects with the highest grade first", () => {
    const sorted = subjectsByGrade(LAYLA_SUBJECTS);
    for (let i = 0; i < sorted.length - 1; i++) {
      const gradeOrder: Record<IGCSEGrade, number> = {
        "A*": 8, "A": 7, "A-": 6, "B+": 5, "B": 4, "B-": 3, "C+": 2, "C": 1,
      };
      expect(gradeOrder[sorted[i].grade]).toBeGreaterThanOrEqual(gradeOrder[sorted[i + 1].grade]);
    }
  });
});

describe("flaggedSubjects", () => {
  it("returns only subjects with flag === true", () => {
    const flagged = flaggedSubjects(LAYLA_SUBJECTS);
    for (const s of flagged) {
      expect(s.flag).toBe(true);
    }
  });

  it("Physics is flagged", () => {
    const flagged = flaggedSubjects(LAYLA_SUBJECTS);
    expect(flagged.some(s => s.subject === "Physics")).toBe(true);
  });
});

describe("trendingUpSubjects", () => {
  it("returns only subjects with trend === 'up'", () => {
    const up = trendingUpSubjects(LAYLA_SUBJECTS);
    for (const s of up) {
      expect(s.trend).toBe("up");
    }
  });

  it("History should be in trending up subjects", () => {
    const up = trendingUpSubjects(LAYLA_SUBJECTS);
    expect(up.some(s => s.subject === "History")).toBe(true);
  });
});
