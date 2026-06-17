import { describe, expect, it } from "vitest";
import {
  MOCK_THREADS, MESSAGE_RECIPIENTS, threadsForChild, categoryCounts, formatRelative,
} from "./mock-messages";

describe("mock-messages fixture", () => {
  it("has 12 threads", () => {
    expect(MOCK_THREADS.length).toBe(12);
  });
  it("every thread has at least 1 message and messages share the thread_id", () => {
    for (const t of MOCK_THREADS) {
      expect(t.messages.length).toBeGreaterThan(0);
      for (const m of t.messages) expect(m.thread_id).toBe(t.id);
    }
  });
  it("has 6 message recipients", () => {
    expect(MESSAGE_RECIPIENTS.length).toBeGreaterThanOrEqual(6);
  });
  it("has at least 3 unread threads", () => {
    const unread = MOCK_THREADS.filter(t => t.unread).length;
    expect(unread).toBeGreaterThanOrEqual(3);
  });
  it("has household-tagged threads", () => {
    expect(MOCK_THREADS.some(t => t.child_id === "household")).toBe(true);
  });
});

describe("threadsForChild", () => {
  it("returns all threads when childId='all'", () => {
    expect(threadsForChild(MOCK_THREADS, "all").length).toBe(MOCK_THREADS.length);
  });
  it("returns single-child + household threads when a child is active", () => {
    const omar = threadsForChild(MOCK_THREADS, "omar-al-habsi");
    expect(omar.every(t => t.child_id === "omar-al-habsi" || t.child_id === "household")).toBe(true);
    expect(omar.length).toBeGreaterThan(3);
  });
});

describe("categoryCounts", () => {
  it("counts all + per-category + unread", () => {
    const c = categoryCounts(MOCK_THREADS);
    expect(c.all).toBe(MOCK_THREADS.length);
    expect(c.academic + c.admin + c.finance + c.calendar).toBe(c.all);
  });
});

describe("formatRelative", () => {
  it("returns day-month for older dates", () => {
    const s = formatRelative("2026-04-22T10:00:00Z");
    expect(s.toLowerCase()).toMatch(/apr/);
  });
});
