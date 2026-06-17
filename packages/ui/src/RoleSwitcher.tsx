"use client";

/**
 * Persona switcher — the navy strip above the Manhaj topbar.
 *
 * Four pills: Admin, Teacher, Student, Parent. Clicking a pill routes to that
 * persona's base path and persists the choice in localStorage.
 *
 * Production behaviour: when DEMO_MODE !== "true", returns null
 * so real auth-driven routing handles persona selection instead.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLES, ROUTE_FOR_ROLE, type Role, readActiveRole, writeActiveRole, isRole } from "@manhaj/lib/role";

const LABELS: Record<Role, string> = {
  admin:   "Admin",
  teacher: "Teacher",
  student: "Student",
  parent:  "Parent",
};

function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin"))   return "admin";
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/parent"))  return "parent";
  return null;
}

export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const [storedRole, setStoredRole] = useState<Role | null>(() => {
    if (typeof window === "undefined") return null;
    const v = readActiveRole();
    return isRole(v) ? v : null;
  });

  const fromUrl = roleFromPath(pathname);
  const active: Role | null = fromUrl ?? storedRole;

  useEffect(() => {
    if (fromUrl) writeActiveRole(fromUrl);
  }, [fromUrl]);

  if (process.env.DEMO_MODE !== "true") return null;

  function pick(role: Role) {
    if (role === active) return;
    writeActiveRole(role);
    setStoredRole(role);
    router.push(ROUTE_FOR_ROLE[role]);
  }

  return (
    <nav aria-label="Switch persona" className="role-switcher">
      <span className="role-switcher-label">Viewing as</span>
      {ROLES.map(role => {
        const isActive = role === active;
        return (
          <button
            key={role}
            type="button"
            onClick={() => pick(role)}
            aria-current={isActive ? "page" : undefined}
            className={`role-switcher-pill ${isActive ? "active" : ""}`}
          >
            {LABELS[role]}
          </button>
        );
      })}
    </nav>
  );
}
