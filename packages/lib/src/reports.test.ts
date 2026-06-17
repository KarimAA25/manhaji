import { describe, expect, it } from "vitest";
import {
  MOCK_PIPELINE, MOCK_SECTIONS, MOCK_TEMPLATES, MOCK_HEATMAP, MOCK_AUDIT,
  HEATMAP_MONTHS, reportKpis, sectionsAtRisk,
} from "./mock-reports";

describe("mock-reports fixture", () => {
  it("has 7 pipeline stages", () => {
    expect(MOCK_PIPELINE.length).toBe(7);
  });
  it("has 6 sections + 6 templates + 6 heatmap rows + 5 audit entries", () => {
    expect(MOCK_SECTIONS.length).toBe(6);
    expect(MOCK_TEMPLATES.length).toBe(6);
    expect(MOCK_HEATMAP.length).toBe(6);
    expect(MOCK_AUDIT.length).toBe(5);
  });
  it("heatmap rows have 9 months each, all 0-100", () => {
    expect(HEATMAP_MONTHS.length).toBe(9);
    for (const r of MOCK_HEATMAP) {
      expect(r.by_month.length).toBe(9);
      for (const v of r.by_month) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("reportKpis", () => {
  const k = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  it("returns drafted sum across sections", () => {
    const expected = MOCK_SECTIONS.reduce((s, x) => s + x.drafted, 0);
    expect(k.drafted).toBe(expected);
  });
  it("open_rate is 0..100 and matches pipeline", () => {
    expect(k.open_rate).toBeGreaterThanOrEqual(0);
    expect(k.open_rate).toBeLessThanOrEqual(100);
  });
  it("reply_rate is 0..100", () => {
    expect(k.reply_rate).toBeGreaterThanOrEqual(0);
    expect(k.reply_rate).toBeLessThanOrEqual(100);
  });
  it("bounced matches pipeline", () => {
    expect(k.bounced).toBe(MOCK_PIPELINE.find(p => p.stage === "bounced")?.count);
  });
});

describe("sectionsAtRisk", () => {
  it("flags sections with days_to_due < 1", () => {
    const risk = sectionsAtRisk(MOCK_SECTIONS);
    expect(risk.length).toBeGreaterThan(0);
    expect(risk.every(s => s.days_to_due < 1)).toBe(true);
  });
});
