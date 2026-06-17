import { describe, expect, it, beforeEach } from "vitest";
import { DEMO_CHILDREN, readActiveChildId, writeActiveChildId, ALL_CHILDREN_ID } from "./child";

beforeEach(() => {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
});

describe("child", () => {
  it("DEMO_CHILDREN contains at least one child", () => {
    expect(DEMO_CHILDREN.length).toBeGreaterThan(0);
  });

  it("readActiveChildId defaults to ALL when nothing stored", () => {
    expect(readActiveChildId()).toBe(ALL_CHILDREN_ID);
  });

  it("readActiveChildId returns stored value when it matches a known child", () => {
    const id = DEMO_CHILDREN[0].id;
    writeActiveChildId(id);
    expect(readActiveChildId()).toBe(id);
  });

  it("readActiveChildId falls back to ALL when stored value is unknown", () => {
    localStorage.setItem("manhaj.parent.activeChild", "ghost-child-id");
    expect(readActiveChildId()).toBe(ALL_CHILDREN_ID);
  });
});
