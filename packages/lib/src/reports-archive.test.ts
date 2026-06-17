import { describe, expect, it } from "vitest";
import {
  MOCK_ARCHIVE, archiveForChild, archiveKpis, latestReport, reportsByChild,
} from "./mock-reports-archive";

describe("mock-reports-archive fixture", () => {
  it("has 11 reports per child × 3 children = 33 total", () => {
    expect(MOCK_ARCHIVE.length).toBe(33);
  });
  it("includes 27 monthly + 6 term reports", () => {
    expect(MOCK_ARCHIVE.filter(r => r.type === "monthly").length).toBe(27);
    expect(MOCK_ARCHIVE.filter(r => r.type === "term").length).toBe(6);
  });
});

describe("archiveForChild", () => {
  it("returns all when childId='all'", () => {
    expect(archiveForChild(MOCK_ARCHIVE, "all").length).toBe(MOCK_ARCHIVE.length);
  });
  it("filters to one child", () => {
    const layla = archiveForChild(MOCK_ARCHIVE, "layla-al-habsi");
    expect(layla.length).toBe(11);
    expect(layla.every(r => r.child_id === "layla-al-habsi")).toBe(true);
  });
});

describe("latestReport", () => {
  it("returns the most-recent report overall", () => {
    const r = latestReport(MOCK_ARCHIVE);
    expect(r).not.toBeNull();
    expect(r?.date).toBeDefined();
  });
});

describe("archiveKpis", () => {
  it("returns total/monthly/term counts", () => {
    const k = archiveKpis(MOCK_ARCHIVE);
    expect(k.total).toBe(33);
    expect(k.monthly + k.term).toBe(k.total);
  });
});
