/**
 * Persona role identity for the demo switcher.
 *
 * Four roles for the pilot: admin, teacher, student, parent.
 * Production will replace the switcher with real auth-driven routing,
 * but the role enum + URL map stay the same.
 */

export const ROLES = ["admin", "teacher", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

const STORAGE_KEY = "manhaj.role";

export const ROUTE_FOR_ROLE: Record<Role, string> = {
  admin:   "/admin",
  teacher: "/teacher",
  student: "/student",
  parent:  "/parent",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function defaultRole(): Role {
  return "admin";
}

/** Read the active role from localStorage. Falls back to default if missing/invalid. */
export function readActiveRole(): Role {
  if (typeof localStorage === "undefined") return defaultRole();
  const stored = localStorage.getItem(STORAGE_KEY);
  return isRole(stored) ? stored : defaultRole();
}

/** Persist the active role. Silently noop in SSR contexts. */
export function writeActiveRole(role: Role): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, role);
}
