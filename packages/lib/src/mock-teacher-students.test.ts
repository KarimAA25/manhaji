import { describe, it, expect } from "vitest";
import { getStudentsForTeacher, SWART_STUDENTS } from "./mock-teacher-students";

describe("getStudentsForTeacher", () => {
  it("returns only students in the given sections", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    for (const r of rows) {
      expect(["10A", "9A"]).toContain(r.section_code);
    }
  });

  it("excludes admission-pending students", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    expect(rows.every(r => r.status !== "admission-pending")).toBe(true);
  });

  it("returns at least 9 rows for 10A + 9A", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    expect(rows.length).toBeGreaterThanOrEqual(9);
  });

  it("enriches each row with teacher_att_pct in [80, 100]", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    for (const r of rows) {
      expect(r.teacher_att_pct).toBeGreaterThanOrEqual(80);
      expect(r.teacher_att_pct).toBeLessThanOrEqual(100);
    }
  });

  it("enriches each row with last_assessment_score in [55, 95]", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    for (const r of rows) {
      expect(r.last_assessment_score).toBeGreaterThanOrEqual(55);
      expect(r.last_assessment_score).toBeLessThanOrEqual(95);
    }
  });

  it("enriches each row with a valid submission_status", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    const valid = ["submitted", "in_progress", "missing"];
    for (const r of rows) {
      expect(valid).toContain(r.submission_status);
    }
  });

  it("enriches each row with discipline_notes_count in [0, 3]", () => {
    const rows = getStudentsForTeacher(["10A", "9A"]);
    for (const r of rows) {
      expect(r.discipline_notes_count).toBeGreaterThanOrEqual(0);
      expect(r.discipline_notes_count).toBeLessThanOrEqual(3);
    }
  });

  it("returns an empty array for an unknown section", () => {
    const rows = getStudentsForTeacher(["UNKNOWN"]);
    expect(rows).toHaveLength(0);
  });

  it("is deterministic (same result on repeat calls)", () => {
    const a = getStudentsForTeacher(["10A", "9A"]);
    const b = getStudentsForTeacher(["10A", "9A"]);
    expect(a.map(r => r.teacher_att_pct)).toEqual(b.map(r => r.teacher_att_pct));
  });
});

describe("SWART_STUDENTS convenience export", () => {
  it("is the same as getStudentsForTeacher([10A, 9A])", () => {
    const from_fn = getStudentsForTeacher(["10A", "9A"]);
    expect(SWART_STUDENTS.map(r => r.id)).toEqual(from_fn.map(r => r.id));
  });
});
