import { describe, expect, it, beforeEach } from "vitest";
import { ROLES, isRole, defaultRole, readActiveRole, writeActiveRole, ROUTE_FOR_ROLE } from "./role";

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

describe("role", () => {
  it("ROLES contains exactly admin/teacher/student/parent in order", () => {
    expect(ROLES).toEqual(["admin", "teacher", "student", "parent"]);
  });

  it("isRole accepts all four roles", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("teacher")).toBe(true);
    expect(isRole("student")).toBe(true);
    expect(isRole("parent")).toBe(true);
    expect(isRole("principal")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
  });

  it("defaultRole returns admin", () => {
    expect(defaultRole()).toBe("admin");
  });

  it("readActiveRole returns default when nothing stored", () => {
    expect(readActiveRole()).toBe("admin");
  });

  it("readActiveRole returns stored value when valid", () => {
    writeActiveRole("teacher");
    expect(readActiveRole()).toBe("teacher");
  });

  it("readActiveRole falls back to default when stored value is invalid", () => {
    localStorage.setItem("manhaj.role", "not-a-role");
    expect(readActiveRole()).toBe("admin");
  });

  it("ROUTE_FOR_ROLE maps each role to its base path", () => {
    expect(ROUTE_FOR_ROLE.admin).toBe("/admin");
    expect(ROUTE_FOR_ROLE.teacher).toBe("/teacher");
    expect(ROUTE_FOR_ROLE.student).toBe("/student");
    expect(ROUTE_FOR_ROLE.parent).toBe("/parent");
  });
});
