import { describe, expect, it } from "vitest";
import { MOCK_GROWTH, MOCK_GOALS, AXIS_LABELS, axisStrengths, axisGrowthAreas } from "./mock-growth";

describe("mock-growth fixture", () => {
  it("has 6 axes", () => {
    expect(MOCK_GROWTH.length).toBe(6);
    expect(AXIS_LABELS.length).toBe(6);
  });
  it("each axis has 6 months of history", () => {
    for (const a of MOCK_GROWTH) {
      expect(a.history.length).toBe(6);
    }
  });
  it("has 4 goals", () => {
    expect(MOCK_GOALS.length).toBe(4);
  });
});

describe("axisStrengths", () => {
  it("returns the 2 axes with the highest this_mo", () => {
    const top = axisStrengths(MOCK_GROWTH);
    expect(top.length).toBe(2);
    expect(top[0].this_mo).toBeGreaterThanOrEqual(top[1].this_mo);
  });
});

describe("axisGrowthAreas", () => {
  it("returns the 2 axes with the lowest this_mo", () => {
    const bot = axisGrowthAreas(MOCK_GROWTH);
    expect(bot.length).toBe(2);
    expect(bot[0].this_mo).toBeLessThanOrEqual(bot[1].this_mo);
  });
});
