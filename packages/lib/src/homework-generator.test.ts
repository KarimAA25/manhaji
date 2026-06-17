import { describe, it, expect } from "vitest";
import { generateHomework } from "./homework-generator";

const BASE: Parameters<typeof generateHomework>[0] = {
  section_id: "10A",
  subject:    "History",
  topic:      "the rise of constitutional monarchies",
  difficulty: "medium",
  count:      5,
};

describe("generateHomework", () => {
  it("returns exactly `count` questions", () => {
    const { questions } = generateHomework(BASE);
    expect(questions).toHaveLength(5);
  });

  it("is deterministic — same input produces same output", () => {
    const a = generateHomework(BASE).questions.map(q => q.text);
    const b = generateHomework({ ...BASE }).questions.map(q => q.text);
    expect(a).toEqual(b);
  });

  it("substitutes the topic token into question text", () => {
    const { questions } = generateHomework(BASE);
    // At least one question should contain the topic string
    const hasToken = questions.some(q =>
      q.text.includes("constitutional monarchies")
    );
    expect(hasToken).toBe(true);
  });

  it("uses 'today's lesson' when topic is empty string", () => {
    const { questions } = generateHomework({ ...BASE, topic: "" });
    const hasDefault = questions.some(q => q.text.includes("today's lesson"));
    expect(hasDefault).toBe(true);
  });

  it("easy difficulty generates MCQ-heavy set (>=50% MCQ)", () => {
    const { questions } = generateHomework({ ...BASE, difficulty: "easy", count: 10 });
    const mcqCount = questions.filter(q => q.type === "mcq").length;
    expect(mcqCount).toBeGreaterThanOrEqual(5);
  });

  it("hard difficulty generates essay-heavy set (>=50% essay)", () => {
    const { questions } = generateHomework({ ...BASE, difficulty: "hard", count: 10 });
    const essayCount = questions.filter(q => q.type === "essay").length;
    expect(essayCount).toBeGreaterThanOrEqual(5);
  });

  it("falls back to generic templates for unknown subject", () => {
    // Should not throw; should return valid questions
    const { questions } = generateHomework({ ...BASE, subject: "Philosophy", count: 3 });
    expect(questions).toHaveLength(3);
    expect(questions.every(q => q.text.length > 0)).toBe(true);
  });
});
