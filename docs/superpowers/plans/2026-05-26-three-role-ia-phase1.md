# Three-Role IA · Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the structural shape of the three-persona IA — gate fix, role switcher, every Admin/Student/Parent tab discoverable, deterministic AI summary header. Content backfilled in Phase 2.

**Architecture:** Demo persona switcher (navy strip above the topbar) routes between three role areas. `localStorage` persists both the gate unlock and the active role. Each persona has its own layout shell with persona-specific nav. Placeholder pages render a shared `<PlaceholderPage>` component. The Admin Dashboard composes a deterministic summary from existing RPC data; no live Claude call yet.

**Tech Stack:** Next.js 16 (Turbopack, App Router) · React Server Components + client components for state · TypeScript strict · Supabase SSR · existing `lib/design-tokens.json` for styling · vitest for the one pure function we add.

**Spec reference:** [`docs/superpowers/specs/2026-05-26-three-role-ia-design.md`](../specs/2026-05-26-three-role-ia-design.md)

---

## File map (created or modified)

**Create:**
- `apps/web/vitest.config.ts` — test runner config
- `apps/web/lib/role.ts` — typed role enum + persistence helpers
- `apps/web/lib/role.test.ts` — unit tests for role
- `apps/web/lib/summary.ts` — deterministic AI-style summary composer
- `apps/web/lib/summary.test.ts` — unit tests
- `apps/web/lib/child.ts` — active-child hook (parent persona)
- `apps/web/app/components/RoleSwitcher.tsx` — top-level navy strip
- `apps/web/app/components/PlaceholderPage.tsx` — shared "in development" page
- `apps/web/app/components/AiBriefingHeader.tsx` — dashboard summary card
- `apps/web/app/components/TabSummaryCard.tsx` — per-tab summary card
- `apps/web/app/admin/faculty/page.tsx` — current `/admin` content moves here
- `apps/web/app/admin/students/page.tsx` — placeholder
- `apps/web/app/admin/attendance/page.tsx` — placeholder
- `apps/web/app/admin/schedule/page.tsx` — placeholder
- `apps/web/app/admin/reports/page.tsx` — placeholder
- `apps/web/app/student/layout.tsx`
- `apps/web/app/student/page.tsx` — Dashboard
- `apps/web/app/student/schedule/page.tsx` — placeholder
- `apps/web/app/student/homework/page.tsx` — placeholder
- `apps/web/app/student/past-reports/page.tsx` — placeholder
- `apps/web/app/student/growth/page.tsx` — placeholder
- `apps/web/app/student/components/StudentNav.tsx`
- `apps/web/app/parent/components/ParentNav.tsx`
- `apps/web/app/parent/components/ChildSwitcher.tsx`
- `apps/web/app/parent/page.tsx` — Dashboard
- `apps/web/app/parent/courses/page.tsx` — moved + renamed from `parent/select-courses`
- `apps/web/app/parent/past-reports/page.tsx` — placeholder
- `apps/web/app/parent/invoices/page.tsx` — placeholder
- `apps/web/app/parent/messages/page.tsx` — placeholder
- `apps/web/app/parent/calendar/page.tsx` — placeholder

**Modify:**
- `apps/web/package.json` — add `vitest` deps + `test` script
- `apps/web/public/gate.js` — `sessionStorage` → `localStorage`
- `apps/web/app/layout.tsx` — render `<RoleSwitcher />` above children
- `apps/web/app/globals.css` — persona-switcher + shared-primitive CSS
- `apps/web/app/admin/page.tsx` — becomes new Dashboard (was Faculty)
- `apps/web/app/admin/components/AdminNav.tsx` — new tabs: Faculty, Students, Attendance, Schedule, Reports (drops external Attendance link)
- `apps/web/app/parent/layout.tsx` — render `<ChildSwitcher />` + `<ParentNav />`
- `apps/web/app/parent/select-courses/page.tsx` — content moves to `parent/courses/page.tsx`; old route becomes a redirect via `proxy.ts`
- `apps/web/proxy.ts` — add `/parent/select-courses` → `/parent/courses` redirect

**Delete:**
- (nothing — old `parent/select-courses` page stays as redirect target via proxy)

---

## Task 1 — Add vitest scaffold

We add unit testing for the two pure functions (`lib/role.ts` and `lib/summary.ts`). Vitest is the lightest-weight option for a Next.js + TypeScript codebase.

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`

- [ ] **Step 1: Install vitest + helpers**

Run from `apps/web/`:
```bash
cd ~/dev/manhaj/apps/web && npm install --save-dev vitest@^2.0.0 @vitest/expect@^2.0.0
```
Expected: deps added to `devDependencies`; no `peer dep` warnings that block the install.

- [ ] **Step 2: Add `test` script to `package.json`**

Find the `"scripts"` block and add a `"test"` entry:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

Create `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: Verify the test runner boots cleanly**

Run from `apps/web/`:
```bash
npm test
```
Expected: vitest prints `No test files found, exiting with code 0` (or similar). That's fine — we add tests in later tasks.

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/package.json apps/web/package-lock.json apps/web/vitest.config.ts && git commit -m "Add vitest scaffold for pure-function unit tests"
```

---

## Task 2 — Gate fix: `sessionStorage` → `localStorage`

The password gate currently re-prompts every new tab because `sessionStorage` is tab-scoped. Switch to `localStorage` so one unlock persists across tabs + browser restarts.

**Files:**
- Modify: `apps/web/public/gate.js:37,105`

- [ ] **Step 1: Edit `gate.js` line 37**

Find:
```js
  if (sessionStorage.getItem('manhaj_unlocked') === 'true') return;
```
Replace with:
```js
  if (localStorage.getItem('manhaj_unlocked') === 'true') return;
```

- [ ] **Step 2: Edit `gate.js` line 105 (in `tryUnlock`)**

Find:
```js
      sessionStorage.setItem('manhaj_unlocked', 'true');
```
Replace with:
```js
      localStorage.setItem('manhaj_unlocked', 'true');
```

- [ ] **Step 3: Update the comment block at the top of `gate.js`**

Find the comment about "How the check works:" (around line 9) and append:
```js
//
// Persistence: the unlock state is stored in localStorage so one password
// entry covers every tab + survives browser restarts. Cleared only when the
// user clears their browser data.
```

- [ ] **Step 4: Smoke test the change**

Run dev server:
```bash
cd ~/dev/manhaj/apps/web && PORT=3033 npm run dev
```
Open `http://localhost:3033/admin` — localhost bypasses the gate, so this only confirms no JS errors land. Check the browser console for any `localStorage` access errors.

Stop the dev server (`Ctrl+C`).

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/public/gate.js && git commit -m "Gate: persist unlock in localStorage (was sessionStorage)"
```

---

## Task 3 — `lib/role.ts` + tests

Pure logic for the persona switcher. Defines the role enum, default, and read/write helpers backed by localStorage.

**Files:**
- Create: `apps/web/lib/role.ts`
- Create: `apps/web/lib/role.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/lib/role.test.ts`:
```ts
import { describe, expect, it, beforeEach } from "vitest";
import { ROLES, isRole, defaultRole, readActiveRole, writeActiveRole, ROUTE_FOR_ROLE } from "./role";

// Minimal localStorage shim — vitest's `node` env doesn't ship one.
beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-expect-error — installing a test-only global
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
  it("ROLES contains exactly admin/student/parent", () => {
    expect(ROLES).toEqual(["admin", "student", "parent"]);
  });

  it("isRole accepts known roles only", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("parent")).toBe(true);
    expect(isRole("teacher")).toBe(false);
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
    writeActiveRole("parent");
    expect(readActiveRole()).toBe("parent");
  });

  it("readActiveRole falls back to default when stored value is invalid", () => {
    localStorage.setItem("manhaj.role", "not-a-role");
    expect(readActiveRole()).toBe("admin");
  });

  it("ROUTE_FOR_ROLE maps each role to its base path", () => {
    expect(ROUTE_FOR_ROLE.admin).toBe("/admin");
    expect(ROUTE_FOR_ROLE.student).toBe("/student");
    expect(ROUTE_FOR_ROLE.parent).toBe("/parent");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: errors about `Cannot find module './role'` — the test file imports a module that doesn't exist yet.

- [ ] **Step 3: Create the minimal `role.ts` to make tests pass**

Create `apps/web/lib/role.ts`:
```ts
/**
 * Persona role identity for the demo switcher.
 *
 * Three roles for the pilot: admin (principal/HoDs), student (G9-12),
 * parent (guardian). Production will replace the switcher with real
 * auth-driven routing, but the role enum + URL map stay the same.
 */

export const ROLES = ["admin", "student", "parent"] as const;
export type Role = (typeof ROLES)[number];

const STORAGE_KEY = "manhaj.role";

export const ROUTE_FOR_ROLE: Record<Role, string> = {
  admin:   "/admin",
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: `7 passed`. No failures.

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/role.ts apps/web/lib/role.test.ts && git commit -m "lib/role: typed role enum + localStorage persistence + tests"
```

---

## Task 4 — `<RoleSwitcher />` + CSS + integrate into root layout

The visible navy strip above the topbar with three pills (Admin / Student / Parent). Persists active role; routes to base path on click.

**Files:**
- Create: `apps/web/app/components/RoleSwitcher.tsx`
- Modify: `apps/web/app/globals.css` (append role-switcher styles)
- Modify: `apps/web/app/layout.tsx` (render `<RoleSwitcher />`)

- [ ] **Step 1: Create `RoleSwitcher.tsx`**

Create `apps/web/app/components/RoleSwitcher.tsx`:
```tsx
"use client";

/**
 * Persona switcher — the navy strip above the Manhaj topbar.
 *
 * Three pills: Admin, Student, Parent. Clicking a pill routes to that
 * persona's base path and persists the choice in localStorage so the
 * next visit lands on the same persona.
 *
 * Production behaviour: when NEXT_PUBLIC_DEMO_MODE !== "true", returns null
 * so real auth-driven routing handles persona selection instead.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLES, ROUTE_FOR_ROLE, type Role, readActiveRole, writeActiveRole, isRole } from "@/lib/role";

const LABELS: Record<Role, string> = {
  admin:   "Admin",
  student: "Student",
  parent:  "Parent",
};

function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin"))   return "admin";
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/parent"))  return "parent";
  return null;
}

export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // SSR-safe hydration: render with the URL-derived role first, then
  // upgrade to the localStorage value on mount.
  const initial = roleFromPath(pathname);
  const [active, setActive] = useState<Role | null>(initial);

  useEffect(() => {
    const fromUrl = roleFromPath(pathname);
    if (fromUrl) {
      setActive(fromUrl);
      writeActiveRole(fromUrl);
      return;
    }
    const stored = readActiveRole();
    if (isRole(stored)) setActive(stored);
  }, [pathname]);

  // Demo-mode flag: hide entirely in production.
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  function pick(role: Role) {
    if (role === active) return;
    writeActiveRole(role);
    setActive(role);
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
```

- [ ] **Step 2: Append role-switcher CSS to `globals.css`**

Open `apps/web/app/globals.css` and append (after the existing `.amd-*` drawer block, before the `prefers-reduced-motion` block):
```css
/* =========================================================================
   Persona / role switcher — navy strip above the topbar
   ========================================================================= */
.role-switcher {
  background: var(--color-primary);
  padding: 8px 18px;
  display: flex; gap: 6px; align-items: center;
  position: sticky; top: 0; z-index: 60;
  border-bottom: 1px solid var(--color-border);
}
.role-switcher-label {
  color: rgba(199, 210, 220, .85);
  font-size: 10px; text-transform: uppercase; letter-spacing: .08em;
  font-weight: var(--font-weight-bold); margin-right: 6px;
}
.role-switcher-pill {
  background: transparent;
  color: rgba(255, 255, 255, .65);
  border: 1px solid rgba(255, 255, 255, .18);
  padding: 5px 14px;
  border-radius: var(--radius-2xl);
  font-size: 11.5px; font-weight: var(--font-weight-semibold);
  font-family: inherit; cursor: pointer;
  min-height: 32px;
}
.role-switcher-pill:hover { background: rgba(255, 255, 255, .08); color: #fff; }
.role-switcher-pill.active {
  background: #fff; color: var(--color-primary); border-color: #fff;
}
.role-switcher-pill:focus-visible {
  outline: 2px solid #fff; outline-offset: 2px;
}
```

- [ ] **Step 3: Render `<RoleSwitcher />` in the root layout**

Open `apps/web/app/layout.tsx`. The current body contains the skip-link + `{children}`. Update to:
```tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import RoleSwitcher from "./components/RoleSwitcher";

export const metadata: Metadata = {
  title: "Manhaj — School Ops Platform",
  description: "Unified Admin + Classroom + Finance for K-12 schools.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script src="/gate.js" strategy="beforeInteractive" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <RoleSwitcher />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Add the demo-mode env flag**

Open `apps/web/.env.local` (create if missing). Add:
```
NEXT_PUBLIC_DEMO_MODE=true
```
This flag drives `RoleSwitcher` visibility. Set to anything other than `"true"` in production env vars to hide the switcher.

- [ ] **Step 5: Verify the switcher renders without crashing**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
```
Expected: `EXIT=0`, no type errors.

```bash
cd ~/dev/manhaj/apps/web && npm run lint
```
Expected: same 3 pre-existing warnings as before; no new errors.

Run dev server (`PORT=3033 npm run dev`), open `http://localhost:3033/admin`, confirm:
- The navy strip is visible at the very top.
- All three pills render.
- "Admin" pill is highlighted (white background, navy text).
- Clicking "Student" navigates to `/student` (will 404 for now — that's fine, Student layout comes in Task 9).

Stop dev server.

- [ ] **Step 6: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/components/RoleSwitcher.tsx apps/web/app/globals.css apps/web/app/layout.tsx apps/web/.env.local && git commit -m "RoleSwitcher: navy persona switcher above the topbar"
```

Note: if `.env.local` is gitignored (it should be), only the other three files will commit. That's correct — env vars are per-environment.

---

## Task 5 — `lib/summary.ts` deterministic composer + tests

Pure function that takes the existing `DashboardData` plus a persona and emits the AI-style summary header content. Phase 3 will wrap a live Claude call around the same signature.

**Files:**
- Create: `apps/web/lib/summary.ts`
- Create: `apps/web/lib/summary.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/lib/summary.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { DashboardData } from "./data";
import { composeSummary } from "./summary";

const EMPTY: DashboardData = {
  school_id: null, teachers: [], sections: [], subjects: [], load: [],
  stats: {
    n_teachers: 0, n_sections: 0, n_subjects: 0, n_load: 0,
    total_cap: 0, total_assigned: 0,
    over_capacity: 0, at_capacity: 0, under_utilised: 0, healthy: 0,
    unmapped_sections: 0, vacant_roles: 0,
  },
};

function withStats(overrides: Partial<DashboardData["stats"]>): DashboardData {
  return { ...EMPTY, stats: { ...EMPTY.stats, ...overrides } };
}

describe("composeSummary · admin", () => {
  it("leads with unmapped sections when present", () => {
    const s = composeSummary("admin", withStats({ unmapped_sections: 12, n_sections: 41 }));
    expect(s.headline).toContain("12");
    expect(s.headline.toLowerCase()).toContain("section");
  });

  it("leads with over-capacity when sections are mapped", () => {
    const s = composeSummary("admin", withStats({ over_capacity: 3, unmapped_sections: 0 }));
    expect(s.headline.toLowerCase()).toContain("over capacity");
  });

  it("gives a balanced headline when there are no flags", () => {
    const s = composeSummary("admin", withStats({}));
    expect(s.headline.toLowerCase()).toContain("balanced");
  });

  it("always returns today / this_week / this_month fields", () => {
    const s = composeSummary("admin", withStats({ unmapped_sections: 5 }));
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });
});

describe("composeSummary · student", () => {
  it("returns a student-framed headline", () => {
    const s = composeSummary("student", EMPTY);
    expect(s.headline.toLowerCase()).toMatch(/here.s how|good morning|welcome/);
  });
});

describe("composeSummary · parent", () => {
  it("returns a parent-framed headline", () => {
    const s = composeSummary("parent", EMPTY);
    expect(s.headline.toLowerCase()).toMatch(/celebrate|support|here.s/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: errors about `Cannot find module './summary'`.

- [ ] **Step 3: Create the composer**

Create `apps/web/lib/summary.ts`:
```ts
/**
 * Deterministic summary composer for the persona Dashboard headers.
 *
 * Pure function: takes DashboardData + persona (+ optional child id for the
 * parent persona later) and returns a 4-part summary object that the
 * <AiBriefingHeader /> renders.
 *
 * Phase 3 will replace the bodies of admin/student/parent composers with
 * Claude calls (Layer-2 prompt cache per docs/prompt_caching_spec.md) — the
 * exported signature stays the same.
 */

import type { DashboardData } from "./data";

export type Persona = "admin" | "student" | "parent";

export type Summary = {
  /** One-sentence anchor that goes in the H1 of the briefing card. */
  headline: string;
  /** Brief "today" line — typically 1 sentence. */
  today: string;
  /** Brief "this week" line. */
  this_week: string;
  /** Brief "this month" line. */
  this_month: string;
  /** Optional CTA suggestion (e.g. "Open Section Mapping"). */
  ai_suggested_action?: string;
};

export function composeSummary(persona: Persona, data: DashboardData): Summary {
  switch (persona) {
    case "admin":   return adminSummary(data);
    case "student": return studentSummary(data);
    case "parent":  return parentSummary(data);
  }
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

function adminSummary(data: DashboardData): Summary {
  const s = data.stats;
  const headlineBits: string[] = [];

  if (s.unmapped_sections > 0) {
    headlineBits.push(`${s.unmapped_sections} sections to map`);
  }
  if (s.over_capacity > 0) {
    headlineBits.push(`${s.over_capacity} teacher${s.over_capacity === 1 ? "" : "s"} over capacity`);
  }
  if (s.vacant_roles > 0) {
    headlineBits.push(`${s.vacant_roles} unfilled role${s.vacant_roles === 1 ? "" : "s"}`);
  }
  if (s.under_utilised > 0) {
    headlineBits.push(`${s.under_utilised} with slack to redistribute`);
  }

  const headline = headlineBits.length === 0
    ? "Plan is balanced — no flags this morning."
    : `${headlineBits.join(" · ")}.`;

  const today = s.unmapped_sections > 0
    ? `${s.unmapped_sections} sections awaiting confirmation today.`
    : s.over_capacity > 0
      ? `${s.over_capacity} teacher${s.over_capacity === 1 ? "" : "s"} over capacity today.`
      : "Nothing urgent flagged for today.";

  const this_week = s.n_load > 0
    ? `${s.n_load} weekly assignments across ${s.n_sections} sections.`
    : "Workbook has not been ingested yet.";

  const utilisation = s.total_cap > 0
    ? Math.round((100 * s.total_assigned) / s.total_cap)
    : 0;
  const this_month = `Load utilisation ${utilisation}% across ${s.n_teachers} teachers.`;

  const ai_suggested_action = s.unmapped_sections > 0
    ? "Open Section Mapping to confirm the high-school AS / A2 rows first."
    : undefined;

  return { headline, today, this_week, this_month, ai_suggested_action };
}

/* -------------------------------------------------------------------------- */
/* Student                                                                     */
/* -------------------------------------------------------------------------- */

function studentSummary(_data: DashboardData): Summary {
  // Phase 1 ships static student data (no student-specific feed yet). Phase 2
  // will pass real homework + schedule counts into this function.
  return {
    headline: "Good morning — here's where you stand.",
    today: "Your next class starts soon. Check My Schedule for what to bring.",
    this_week: "A few items due — open Homework to see them.",
    this_month: "Your rubric trends sit in My Growth — keep building.",
  };
}

/* -------------------------------------------------------------------------- */
/* Parent                                                                      */
/* -------------------------------------------------------------------------- */

function parentSummary(_data: DashboardData): Summary {
  return {
    headline: "Here's what to celebrate, what to support.",
    today: "Check the Today strip for what your child is doing right now.",
    this_week: "Upcoming exams and any school messages are highlighted below.",
    this_month: "Open the latest monthly report for the full rubric write-up.",
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: all tests pass. If a test fails, fix the composer to match the assertion (or fix the assertion if the behaviour differs from the spec by design — but match the spec).

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/summary.ts apps/web/lib/summary.test.ts && git commit -m "lib/summary: deterministic per-persona summary composer + tests"
```

---

## Task 6 — Shared visual primitives: `<AiBriefingHeader />`, `<TabSummaryCard />`, `<PlaceholderPage />`

Three components reused across every Dashboard and placeholder page.

**Files:**
- Create: `apps/web/app/components/AiBriefingHeader.tsx`
- Create: `apps/web/app/components/TabSummaryCard.tsx`
- Create: `apps/web/app/components/PlaceholderPage.tsx`
- Modify: `apps/web/app/globals.css` (append primitive CSS)

- [ ] **Step 1: Create `<AiBriefingHeader />`**

Create `apps/web/app/components/AiBriefingHeader.tsx`:
```tsx
/**
 * Navy gradient briefing card used at the top of every persona Dashboard.
 *
 * Consumes the deterministic Summary shape from lib/summary.ts. Phase 3 will
 * swap the source from the deterministic composer to a live Claude call —
 * this component does not change.
 */

import type { Summary } from "@/lib/summary";

export default function AiBriefingHeader({ summary, refreshedAgoMin }: {
  summary: Summary;
  refreshedAgoMin?: number;
}) {
  return (
    <section className="ai-briefing" aria-label="Manhaj briefing">
      <div className="ai-briefing-label">Manhaj briefing</div>
      <p className="ai-briefing-headline">{summary.headline}</p>
      {summary.ai_suggested_action && (
        <p className="ai-briefing-cta"><b>Suggested first move:</b> {summary.ai_suggested_action}</p>
      )}
      <div className="ai-briefing-sections">
        <div>
          <div className="ai-briefing-sect-label">Today</div>
          <div className="ai-briefing-sect-body">{summary.today}</div>
        </div>
        <div>
          <div className="ai-briefing-sect-label">This week</div>
          <div className="ai-briefing-sect-body">{summary.this_week}</div>
        </div>
        <div>
          <div className="ai-briefing-sect-label">This month</div>
          <div className="ai-briefing-sect-body">{summary.this_month}</div>
        </div>
      </div>
      <div className="ai-briefing-meta">
        Drafted by Manhaj{refreshedAgoMin != null ? ` · refreshed ${refreshedAgoMin} min ago` : ""} · verify before acting
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `<TabSummaryCard />`**

Create `apps/web/app/components/TabSummaryCard.tsx`:
```tsx
/**
 * Generic per-tab summary card for persona dashboards.
 *
 * Big number on top, trend line, and a couple of detail rows. Click-through
 * via an enclosing <Link>; this component itself is presentational.
 */

import Link from "next/link";

export type TabSummary = {
  label: string;
  href: string;
  big: string;
  big_suffix?: string;
  trend?: { text: string; tone: "up" | "down" | "warn" | "flat" };
  rows?: Array<{ label: string; value: string }>;
};

export default function TabSummaryCard({ summary }: { summary: TabSummary }) {
  const toneClass = summary.trend ? `tone-${summary.trend.tone}` : "";
  return (
    <Link href={summary.href} className="tab-summary-card">
      <div className="tab-summary-head">
        <span className="tab-summary-label">{summary.label}</span>
        <span className="tab-summary-arrow" aria-hidden="true">→</span>
      </div>
      <div className="tab-summary-big">
        {summary.big}
        {summary.big_suffix && <span className="tab-summary-big-suffix"> {summary.big_suffix}</span>}
      </div>
      {summary.trend && (
        <div className={`tab-summary-trend ${toneClass}`}>{summary.trend.text}</div>
      )}
      {summary.rows && summary.rows.length > 0 && (
        <div className="tab-summary-rows">
          {summary.rows.map(r => (
            <div key={r.label} className="tab-summary-row">
              <span>{r.label}</span><b>{r.value}</b>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Create `<PlaceholderPage />`**

Create `apps/web/app/components/PlaceholderPage.tsx`:
```tsx
/**
 * Phase 1 placeholder for tabs whose content lands in Phase 2+.
 *
 * Renders the tab title, a short "what will be here" description, and an
 * optional preview block. Visible in the persona's nav so the structural
 * shape of the IA is discoverable today.
 */

import type { ReactNode } from "react";

export default function PlaceholderPage({
  title, lead, bullets, preview,
}: {
  title: string;
  lead: string;
  bullets?: string[];
  preview?: ReactNode;
}) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <p className="sub">{lead}</p>

      <div className="banner" role="status" style={{ background: "var(--color-info-soft)", borderColor: "#90CDF4", color: "var(--color-info-text)" }}>
        <b>In development.</b> This page lands in the next build phase. The structure below shows what you can expect.
      </div>

      {bullets && bullets.length > 0 && (
        <div className="card">
          <div className="card-label">What will be here</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 12.5, color: "var(--color-ink)" }}>
            {bullets.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}

      {preview && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-label">Preview</div>
          {preview}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Append primitive CSS to `globals.css`**

Open `apps/web/app/globals.css` and append (before the `prefers-reduced-motion` block):
```css
/* =========================================================================
   AI briefing header — used at the top of every persona Dashboard
   ========================================================================= */
.ai-briefing {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: #fff;
  border-radius: var(--radius-2xl);
  padding: 22px 26px;
  box-shadow: var(--shadow-md);
  position: relative; overflow: hidden;
  margin-bottom: var(--space-4);
}
.ai-briefing::after {
  content: ""; position: absolute; right: -40px; top: -40px;
  width: 200px; height: 200px; background: rgba(255,255,255,.05); border-radius: 50%;
}
.ai-briefing-label {
  font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em;
  color: rgba(255,255,255,.6); font-weight: var(--font-weight-bold);
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}
.ai-briefing-label::before {
  content: "M"; width: 22px; height: 22px; border-radius: var(--radius-sm);
  background: rgba(255,255,255,.18);
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 11px; letter-spacing: 0;
}
.ai-briefing-headline {
  font-size: 17px; font-weight: var(--font-weight-bold);
  line-height: 1.45; margin: 0;
}
.ai-briefing-cta {
  font-size: 12px; margin: 8px 0 0; color: rgba(255,255,255,.9); line-height: 1.5;
}
.ai-briefing-cta b { color: #fff; }
.ai-briefing-sections {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 18px;
}
@media (max-width: 700px) {
  .ai-briefing-sections { grid-template-columns: 1fr; gap: 10px; }
}
.ai-briefing-sect-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
  color: rgba(255,255,255,.55); font-weight: var(--font-weight-bold); margin-bottom: 5px;
}
.ai-briefing-sect-body {
  font-size: 12.5px; line-height: 1.55; color: rgba(255,255,255,.92);
}
.ai-briefing-meta {
  margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.12);
  font-size: 10.5px; color: rgba(255,255,255,.5); font-style: italic;
}

/* =========================================================================
   Tab summary card — small navigable card on every Dashboard
   ========================================================================= */
.tab-summary-card {
  display: block; text-decoration: none; color: inherit;
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  box-shadow: var(--shadow-sm); transition: box-shadow .15s;
}
.tab-summary-card:hover { box-shadow: var(--shadow-md); }
.tab-summary-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
}
.tab-summary-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-muted); font-weight: var(--font-weight-bold);
}
.tab-summary-arrow { font-size: 14px; color: var(--color-muted); }
.tab-summary-big {
  font-size: 22px; font-weight: var(--font-weight-black);
  color: var(--color-primary); line-height: 1.1; margin: 4px 0 4px;
}
.tab-summary-big-suffix {
  font-size: 13px; color: var(--color-muted); font-weight: var(--font-weight-semibold);
}
.tab-summary-trend { font-size: 11px; font-weight: var(--font-weight-semibold); }
.tab-summary-trend.tone-up   { color: var(--color-success); }
.tab-summary-trend.tone-down { color: var(--color-danger); }
.tab-summary-trend.tone-warn { color: var(--color-warning); }
.tab-summary-trend.tone-flat { color: var(--color-muted); }
.tab-summary-rows {
  margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--color-border);
}
.tab-summary-row {
  display: flex; justify-content: space-between; font-size: 11px;
  padding: 3px 0; color: var(--color-muted);
}
.tab-summary-row b { color: var(--color-ink); font-weight: var(--font-weight-bold); }

/* Helper: per-Dashboard 3-column tab-summary grid that collapses on mobile */
.tab-summary-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3);
  margin-bottom: var(--space-3);
}
@media (max-width: 800px) {
  .tab-summary-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 500px) {
  .tab-summary-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Type-check + lint + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -5
```
Expected: `EXIT=0` on each; build prints the existing route list (Student / Parent routes not yet present — that's fine).

- [ ] **Step 6: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/components/AiBriefingHeader.tsx apps/web/app/components/TabSummaryCard.tsx apps/web/app/components/PlaceholderPage.tsx apps/web/app/globals.css && git commit -m "Shared primitives: AiBriefingHeader, TabSummaryCard, PlaceholderPage"
```

---

## Task 7 — `/admin` restructure: move current page to `/admin/faculty`, build new Dashboard

The current `/admin/page.tsx` (load distribution, heatmap, AI suggestion) becomes `/admin/faculty/page.tsx`. The new `/admin/page.tsx` is the Dashboard: AI briefing + 6 summary cards.

**Files:**
- Create: `apps/web/app/admin/faculty/page.tsx`
- Modify: `apps/web/app/admin/page.tsx` (full rewrite)

- [ ] **Step 1: Create `app/admin/faculty/page.tsx` from the current `app/admin/page.tsx`**

Copy the entire current content of `apps/web/app/admin/page.tsx` into `apps/web/app/admin/faculty/page.tsx`. The file is ~205 lines starting with `import Link from "next/link";` and includes the `AdminDashboard` server component and `MiniTeacherList` helper.

Run:
```bash
cp ~/dev/manhaj/apps/web/app/admin/page.tsx ~/dev/manhaj/apps/web/app/admin/faculty/page.tsx
```

Then open the new file and rename the exported function:
```diff
- export default async function AdminDashboard() {
+ export default async function AdminFaculty() {
```

- [ ] **Step 2: Replace `app/admin/page.tsx` with the new Dashboard**

Open `apps/web/app/admin/page.tsx` and replace the entire contents with:
```tsx
/**
 * Admin Dashboard — AI briefing + 6 per-tab summary cards.
 *
 * Server component. Reads existing dashboard data via getDashboardData and
 * runs it through the deterministic summary composer (lib/summary.ts). Phase
 * 3 will swap the composer for a live Claude call without changing the
 * component shape.
 */

import { getDashboardData } from "@/lib/data";
import { composeSummary } from "@/lib/summary";
import AiBriefingHeader from "../components/AiBriefingHeader";
import TabSummaryCard, { type TabSummary } from "../components/TabSummaryCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const summary = composeSummary("admin", data);
  const s = data.stats;
  const util = s.total_cap > 0 ? Math.round((100 * s.total_assigned) / s.total_cap) : 0;

  const cards: TabSummary[] = [
    {
      label: "Faculty",
      href: "/admin/faculty",
      big: String(s.n_teachers),
      big_suffix: "teachers",
      trend: s.over_capacity > 0
        ? { text: `▲ ${s.over_capacity} over capacity`, tone: "down" }
        : { text: "All within capacity", tone: "up" },
      rows: [
        { label: "Load utilisation", value: `${util}%` },
        { label: "With slack",       value: String(s.under_utilised) },
      ],
    },
    {
      label: "Sections",
      href: "/admin/section-mapping",
      big: String(s.n_sections),
      trend: s.unmapped_sections > 0
        ? { text: `${s.unmapped_sections} / ${s.n_sections} need mapping`, tone: "warn" }
        : { text: "All mapped", tone: "up" },
      rows: [
        { label: "Subjects", value: String(s.n_subjects) },
        { label: "Workbook rows", value: String(s.n_load) },
      ],
    },
    {
      label: "Students",
      href: "/admin/students",
      big: "—",
      trend: { text: "Roster lands in Phase 2", tone: "flat" },
      rows: [
        { label: "Renewal rate",     value: "—" },
        { label: "Flagged for support", value: "—" },
      ],
    },
    {
      label: "Attendance",
      href: "/admin/attendance",
      big: "—",
      trend: { text: "Live feed lands in Phase 2", tone: "flat" },
      rows: [
        { label: "Chronic absentees", value: "—" },
        { label: "Worst section",     value: "—" },
      ],
    },
    {
      label: "Schedule",
      href: "/admin/schedule",
      big: "—",
      trend: { text: "Lands in Phase 2", tone: "flat" },
      rows: [
        { label: "Conflicts",      value: "—" },
        { label: "Subs needed",    value: "—" },
      ],
    },
    {
      label: "Reports",
      href: "/admin/reports",
      big: "—",
      trend: { text: "Lands in Phase 2", tone: "flat" },
      rows: [
        { label: "Awaiting review", value: "—" },
        { label: "Next batch",      value: "—" },
      ],
    },
  ];

  return (
    <div className="container">
      <h1>Good morning, Principal.</h1>
      <p className="sub">Dashboard · AY {process.env.NEXT_PUBLIC_ACADEMIC_YEAR}</p>

      <AiBriefingHeader summary={summary} />

      <div className="tab-summary-grid">
        {cards.map(c => <TabSummaryCard key={c.label} summary={c} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -10
```
Expected: build succeeds. The route list now shows both `/admin` and `/admin/faculty`.

- [ ] **Step 4: Visual smoke test**

Run dev server, open `http://localhost:3033/admin`:
- The AI briefing header appears with summary text.
- 6 summary cards render in a responsive grid.
- Click "Faculty" card → opens `/admin/faculty` → shows the old dashboard content (load list, heatmap, etc.).
- Click "Sections" card → opens `/admin/section-mapping` → existing page.

Stop dev server.

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/faculty/page.tsx apps/web/app/admin/page.tsx && git commit -m "/admin restructure: Dashboard at /admin, Faculty content moves to /admin/faculty"
```

---

## Task 8 — Admin placeholder tabs

Four new routes under `/admin/*`: Students, Attendance, Schedule, Reports. Each uses `<PlaceholderPage />` with content that matches the spec's tab descriptions.

**Files:**
- Create: `apps/web/app/admin/students/page.tsx`
- Create: `apps/web/app/admin/attendance/page.tsx`
- Create: `apps/web/app/admin/schedule/page.tsx`
- Create: `apps/web/app/admin/reports/page.tsx`

- [ ] **Step 1: Create the Students placeholder**

Create `apps/web/app/admin/students/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";

export default function AdminStudentsPage() {
  return (
    <PlaceholderPage
      title="Students"
      lead="School-wide roster scoped to grade band / section, with risk scoring and intervention tracking."
      bullets={[
        "Roster table with rubric average and status badge per student",
        "Re-enrollment funnel (invited → confirmed → cash collected)",
        "Cohort heatmap (section × rubric axis)",
        "Behavioural incidents timeline with AI-suggested next steps",
        "Admissions inbox with AI scoring",
        "Bulk parent comms via the template catalog",
      ]}
    />
  );
}
```

- [ ] **Step 2: Create the Attendance placeholder**

Create `apps/web/app/admin/attendance/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";

export default function AdminAttendancePage() {
  return (
    <PlaceholderPage
      title="Attendance"
      lead="Cohort patterns at the top, drill down to section → student → day → period."
      bullets={[
        "Daily attendance trend with calendar-anchored event markers",
        "Day-of-week and period-of-day pattern heatmaps",
        "AI-attributed causes (medical / weather / travel / transport) with confidence levels",
        "Per-section heat-strip with hotspot drill-down",
        "Chronic absentees table with AI-drafted re-engagement messages",
        "Teacher view: one-tap roll call with auto-fill for known excused absences",
      ]}
    />
  );
}
```

- [ ] **Step 3: Create the Schedule placeholder**

Create `apps/web/app/admin/schedule/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";

export default function AdminSchedulePage() {
  return (
    <PlaceholderPage
      title="Schedule"
      lead="Section + teacher + room view of the weekly bell schedule, with natural-language change requests."
      bullets={[
        "Section week-grid (Mon–Fri × P1–P7), color-coded for gaps and conflicts",
        "Ask Manhaj — type \"move Mr Salim's lab to mornings\" → get a proposed diff",
        "Action queue: unfilled periods, conflicts, sub coverage with AI suggestions",
        "Teacher load by day and room / lab utilisation",
        "Curriculum coverage check vs IGCSE minimums",
        "Change log with per-row roll-back",
      ]}
    />
  );
}
```

- [ ] **Step 4: Create the Reports placeholder**

Create `apps/web/app/admin/reports/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";

export default function AdminReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      lead="Pipeline + templates + delivery quality + compliance log for every parent comm sent through Manhaj."
      bullets={[
        "Send pipeline funnel (drafts → review → ready → sent → opened → replied → bounces)",
        "Per-section batch progress with teacher review state",
        "17 Manhaj-built templates (monthly, term, behavioural, attendance, fee, achievement)",
        "Engagement heatmap (section × month, open rate %)",
        "Delivery diagnostics with AI follow-up suggestions for bounces",
        "PDPL / regulator compliance log, exportable per term",
      ]}
    />
  );
}
```

- [ ] **Step 5: Type-check + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -15
```
Expected: all four new routes appear in the build output.

- [ ] **Step 6: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students apps/web/app/admin/attendance apps/web/app/admin/schedule apps/web/app/admin/reports && git commit -m "Admin placeholder tabs: Students, Attendance, Schedule, Reports"
```

---

## Task 9 — Update `AdminNav` with new tabs

Adds Faculty + Students + Attendance + Schedule + Reports to the admin nav. Drops the external "Attendance" link that pointed to `manhaj.pages.dev`.

**Files:**
- Modify: `apps/web/app/admin/components/AdminNav.tsx`

- [ ] **Step 1: Replace `AdminNav.tsx` contents**

Open `apps/web/app/admin/components/AdminNav.tsx` and replace the entire file:
```tsx
"use client";

/**
 * Admin top-level tab nav. Active state driven by the URL.
 *
 * Renders all 7 admin tabs from the IA spec — Dashboard (the default
 * /admin route), Faculty, Sections, Students, Attendance, Schedule, Reports.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/admin",                 label: "Dashboard" },
  { href: "/admin/faculty",         label: "Faculty" },
  { href: "/admin/section-mapping", label: "Sections" },
  { href: "/admin/students",        label: "Students" },
  { href: "/admin/attendance",      label: "Attendance" },
  { href: "/admin/schedule",        label: "Schedule" },
  { href: "/admin/reports",         label: "Reports" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      {LINKS.map(l => {
        // Exact match for Dashboard (root /admin), prefix match for sub-routes.
        const isActive = l.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Verify the new nav renders**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint
```
Expected: no errors.

Run dev server, open `/admin`. Confirm all 7 tabs are visible and active state moves correctly when you click between them.

- [ ] **Step 3: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/components/AdminNav.tsx && git commit -m "AdminNav: 7 tabs · Dashboard, Faculty, Sections, Students, Attendance, Schedule, Reports"
```

---

## Task 10 — Student persona scaffold

New `/student/*` area. Layout shell + nav + 5 pages (Dashboard + 4 placeholders).

**Files:**
- Create: `apps/web/app/student/layout.tsx`
- Create: `apps/web/app/student/page.tsx` — Dashboard
- Create: `apps/web/app/student/schedule/page.tsx`
- Create: `apps/web/app/student/homework/page.tsx`
- Create: `apps/web/app/student/past-reports/page.tsx`
- Create: `apps/web/app/student/growth/page.tsx`
- Create: `apps/web/app/student/components/StudentNav.tsx`

- [ ] **Step 1: Create `StudentNav.tsx`**

Create `apps/web/app/student/components/StudentNav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/student",               label: "Dashboard" },
  { href: "/student/schedule",      label: "My Schedule" },
  { href: "/student/homework",      label: "Homework" },
  { href: "/student/past-reports",  label: "Past Reports" },
  { href: "/student/growth",        label: "My Growth" },
];

export default function StudentNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      {LINKS.map(l => {
        const isActive = l.href === "/student"
          ? pathname === "/student"
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create `app/student/layout.tsx`**

Create `apps/web/app/student/layout.tsx`:
```tsx
/**
 * Layout for /student/* routes — topbar + StudentNav.
 *
 * Phase 1 hard-codes the demo student as Layla Al-Habsi. Phase 2 wires real
 * student identity (either via auth or a query param like the parent report).
 */

import StudentNav from "./components/StudentNav";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "International School of Oman";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <div className="brand-name">
              Manhaj <span className="brand-sub">· {SCHOOL_NAME}</span>
            </div>
          </div>
          <StudentNav />
        </div>
        <div className="top-right">
          <span style={{ fontSize: 12 }}>Layla Al-Habsi · 10A</span>
          <div className="avatar" title="Student">LA</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
```

- [ ] **Step 3: Create the Student Dashboard**

Create `apps/web/app/student/page.tsx`:
```tsx
/**
 * Student Dashboard.
 *
 * Phase 1: AI briefing + 4 tab summary cards. Phase 2 replaces the briefing
 * with the warm monthly-report greeting card per the spec ("Layla, here's
 * how April went.").
 */

import { composeSummary } from "@/lib/summary";
import AiBriefingHeader from "../components/AiBriefingHeader";
import TabSummaryCard, { type TabSummary } from "../components/TabSummaryCard";

// Phase 1: no live student data feed yet. We pass an empty data object so the
// composer returns its static student fallback message.
import type { DashboardData } from "@/lib/data";
const EMPTY: DashboardData = {
  school_id: null, teachers: [], sections: [], subjects: [], load: [],
  stats: { n_teachers: 0, n_sections: 0, n_subjects: 0, n_load: 0,
    total_cap: 0, total_assigned: 0, over_capacity: 0, at_capacity: 0,
    under_utilised: 0, healthy: 0, unmapped_sections: 0, vacant_roles: 0 },
};

export const dynamic = "force-dynamic";

export default function StudentDashboard() {
  const summary = composeSummary("student", EMPTY);

  const cards: TabSummary[] = [
    {
      label: "My Schedule",
      href: "/student/schedule",
      big: "P3 · Maths",
      trend: { text: "Starts 11:10 · Mr Saab", tone: "flat" },
      rows: [
        { label: "Next",        value: "P4 · Physics" },
        { label: "Today total", value: "6 classes" },
      ],
    },
    {
      label: "Homework",
      href: "/student/homework",
      big: "3",
      trend: { text: "1 due tomorrow", tone: "warn" },
      rows: [
        { label: "Maths worksheet", value: "Tomorrow" },
        { label: "English essay",   value: "Thu" },
      ],
    },
    {
      label: "Past Reports",
      href: "/student/past-reports",
      big: "8",
      trend: { text: "Archive · since Sept 2025", tone: "flat" },
      rows: [
        { label: "Last opened", value: "March 2026" },
        { label: "Term reports", value: "3 available" },
      ],
    },
    {
      label: "My Growth",
      href: "/student/growth",
      big: "4.1",
      big_suffix: "/ 5",
      trend: { text: "▲ 3 months rising", tone: "up" },
      rows: [
        { label: "Strongest", value: "Homework 4.6" },
        { label: "Building",  value: "Written 2.8" },
      ],
    },
  ];

  return (
    <div className="container">
      <h1>Welcome, Layla.</h1>
      <p className="sub">Your dashboard · AY {process.env.NEXT_PUBLIC_ACADEMIC_YEAR}</p>

      <AiBriefingHeader summary={summary} />

      <div className="tab-summary-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        {cards.map(c => <TabSummaryCard key={c.label} summary={c} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the four student placeholder pages**

Create `apps/web/app/student/schedule/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function StudentSchedulePage() {
  return <PlaceholderPage
    title="My Schedule"
    lead="Today's classes and the rest of the week — what's next, where, what to bring."
    bullets={[
      "\"Right now\" card with current period + room + teacher + what to bring",
      "Today's timeline with done / now / upcoming states",
      "Weekly view with break + lunch markers",
    ]}
  />;
}
```

Create `apps/web/app/student/homework/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function StudentHomeworkPage() {
  return <PlaceholderPage
    title="Homework"
    lead="What's due, what's in progress, what's done — with AI nudges for overdue items."
    bullets={[
      "To-do list with due dates and status pills (overdue / in progress / not started / done)",
      "AI nudges that estimate time-to-complete based on prior homework",
      "One-tap link to the catch-up pack when you've missed a lesson",
    ]}
  />;
}
```

Create `apps/web/app/student/past-reports/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function StudentPastReportsPage() {
  return <PlaceholderPage
    title="Past Reports"
    lead="Archive of every monthly and term report from earlier this year."
    bullets={[
      "Monthly reports back to September 2025",
      "Term reports (terms 1 and 2 so far)",
      "Compare-to-previous month view",
    ]}
  />;
}
```

Create `apps/web/app/student/growth/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function StudentGrowthPage() {
  return <PlaceholderPage
    title="My Growth"
    lead="6-axis rubric over time, your strongest areas and where to build."
    bullets={[
      "Rubric radar comparing this month to last",
      "Per-axis sparklines over the last 6 months",
      "Goals you and your advisor set together, with progress",
    ]}
  />;
}
```

- [ ] **Step 5: Type-check + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -20
```
Expected: build succeeds. The route list now includes `/student`, `/student/schedule`, `/student/homework`, `/student/past-reports`, `/student/growth`.

- [ ] **Step 6: Visual smoke test**

Run dev server, click "Student" pill in the persona switcher. Confirm:
- Topbar shows "Manhaj · ISO" + StudentNav (5 tabs) + "Layla Al-Habsi · 10A" avatar.
- Dashboard renders AI briefing + 4 cards.
- Clicking each nav tab opens the corresponding placeholder.

Stop dev server.

- [ ] **Step 7: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/student && git commit -m "Student persona: layout + nav + Dashboard + 4 placeholder tabs"
```

---

## Task 11 — `lib/child.ts` + `<ChildSwitcher />`

Active child persistence + the sticky child switcher for the parent persona.

**Files:**
- Create: `apps/web/lib/child.ts`
- Create: `apps/web/lib/child.test.ts`
- Create: `apps/web/app/parent/components/ChildSwitcher.tsx`
- Modify: `apps/web/app/globals.css` (append child-switcher CSS)

- [ ] **Step 1: Write the failing test for `lib/child.ts`**

Create `apps/web/lib/child.test.ts`:
```ts
import { describe, expect, it, beforeEach } from "vitest";
import { DEMO_CHILDREN, readActiveChildId, writeActiveChildId, ALL_CHILDREN_ID } from "./child";

beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-expect-error — test-only global shim
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
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: `Cannot find module './child'`.

- [ ] **Step 3: Create `lib/child.ts`**

Create `apps/web/lib/child.ts`:
```ts
/**
 * Active-child persistence for the parent persona.
 *
 * Phase 1 hard-codes a small demo household. Phase 2 replaces DEMO_CHILDREN
 * with a server-side fetch (manhaj_parent_children_public RPC).
 */

export const ALL_CHILDREN_ID = "all" as const;
export type ChildId = string | typeof ALL_CHILDREN_ID;

export type DemoChild = {
  id: string;
  full_name: string;
  initial: string;        // displayed in the avatar
  grade_label: string;    // "10A · HS"
  alert_count?: number;
};

export const DEMO_CHILDREN: DemoChild[] = [
  { id: "layla-al-habsi",  full_name: "Layla Al-Habsi",  initial: "L", grade_label: "10A · HS" },
  { id: "omar-al-habsi",   full_name: "Omar Al-Habsi",   initial: "O", grade_label: "7B · MS",  alert_count: 1 },
  { id: "yasmin-al-habsi", full_name: "Yasmin Al-Habsi", initial: "Y", grade_label: "KG2 · Primary" },
];

const STORAGE_KEY = "manhaj.parent.activeChild";

export function readActiveChildId(): ChildId {
  if (typeof localStorage === "undefined") return ALL_CHILDREN_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return ALL_CHILDREN_ID;
  if (stored === ALL_CHILDREN_ID) return ALL_CHILDREN_ID;
  if (DEMO_CHILDREN.some(c => c.id === stored)) return stored;
  return ALL_CHILDREN_ID;
}

export function writeActiveChildId(id: ChildId): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: all child + role + summary tests pass.

- [ ] **Step 5: Create `<ChildSwitcher />`**

Create `apps/web/app/parent/components/ChildSwitcher.tsx`:
```tsx
"use client";

/**
 * Sticky child switcher under the breadcrumb in the parent layout.
 *
 * "All children" pill on the left (household aggregate view). One pill per
 * child after that, each showing avatar + name + grade label + optional
 * alert badge.
 *
 * Single-child households still see the switcher, but only their child's
 * pill is shown (the "All children" pill is hidden).
 */

import { useEffect, useState } from "react";
import {
  ALL_CHILDREN_ID, DEMO_CHILDREN, readActiveChildId, writeActiveChildId, type ChildId,
} from "@/lib/child";

export default function ChildSwitcher() {
  const [active, setActive] = useState<ChildId>(ALL_CHILDREN_ID);

  useEffect(() => { setActive(readActiveChildId()); }, []);

  function pick(id: ChildId) {
    if (id === active) return;
    setActive(id);
    writeActiveChildId(id);
  }

  const showAll = DEMO_CHILDREN.length > 1;

  return (
    <nav aria-label="Switch child" className="child-switcher">
      {showAll && (
        <button
          type="button"
          onClick={() => pick(ALL_CHILDREN_ID)}
          aria-current={active === ALL_CHILDREN_ID ? "true" : undefined}
          className={`child-tab aggregate ${active === ALL_CHILDREN_ID ? "active" : ""}`}
        >
          <span className="child-av" aria-hidden="true">⌂</span>
          <span className="child-meta">
            <span className="child-nm">All children</span>
            <span className="child-sub">household view</span>
          </span>
        </button>
      )}
      {DEMO_CHILDREN.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => pick(c.id)}
          aria-current={active === c.id ? "true" : undefined}
          className={`child-tab ${active === c.id ? "active" : ""}`}
        >
          <span className="child-av" aria-hidden="true">{c.initial}</span>
          <span className="child-meta">
            <span className="child-nm">{c.full_name}</span>
            <span className="child-sub">{c.grade_label}</span>
          </span>
          {c.alert_count && c.alert_count > 0 && (
            <span className="child-badge" aria-label={`${c.alert_count} alerts`}>
              {c.alert_count} alert{c.alert_count === 1 ? "" : "s"}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Append child-switcher CSS to `globals.css`**

Open `apps/web/app/globals.css` and append (before the `prefers-reduced-motion` block):
```css
/* =========================================================================
   Parent persona · child switcher
   ========================================================================= */
.child-switcher {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 8px;
  margin: var(--space-3) auto; max-width: 1100px;
  display: flex; gap: 6px; flex-wrap: wrap;
  box-shadow: var(--shadow-sm);
}
.child-tab {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border); background: var(--color-surface-subtle);
  font-size: 12px; font-weight: var(--font-weight-semibold); color: var(--color-muted);
  cursor: pointer; font-family: inherit;
}
.child-tab:hover { background: var(--color-soft); }
.child-tab.active {
  background: var(--color-primary); color: #fff; border-color: var(--color-primary);
}
.child-tab.aggregate.active {
  background: linear-gradient(135deg, var(--color-accent), var(--color-primary));
  border-color: transparent;
}
.child-tab .child-av {
  width: 26px; height: 26px; border-radius: 50%;
  background: #C7D2DC; color: var(--color-ink);
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 10.5px;
}
.child-tab.active .child-av { background: rgba(255,255,255,.2); color: #fff; }
.child-tab .child-meta { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
.child-tab .child-nm { font-weight: var(--font-weight-bold); }
.child-tab .child-sub { font-size: 9.5px; font-weight: var(--font-weight-medium); opacity: .7; margin-top: 2px; }
.child-tab .child-badge {
  margin-left: 6px; background: var(--color-danger-soft); color: var(--color-danger-text);
  font-size: 9px; padding: 1px 6px; border-radius: 8px; font-weight: var(--font-weight-bold);
}
.child-tab.active .child-badge { background: rgba(255,255,255,.2); color: #fff; }
.child-tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

- [ ] **Step 7: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/child.ts apps/web/lib/child.test.ts apps/web/app/parent/components/ChildSwitcher.tsx apps/web/app/globals.css && git commit -m "ChildSwitcher: parent multi-child switcher with localStorage persistence"
```

---

## Task 12 — Parent persona restructure: layout + ParentNav + Courses redirect

The parent layout grows a `<ChildSwitcher />` + `<ParentNav />`. The wizard moves from `/parent/select-courses` to `/parent/courses` (with a redirect from the old URL).

**Files:**
- Modify: `apps/web/app/parent/layout.tsx`
- Create: `apps/web/app/parent/components/ParentNav.tsx`
- Create: `apps/web/app/parent/courses/page.tsx`
- Modify: `apps/web/app/parent/select-courses/page.tsx` (becomes a redirect)
- Modify: `apps/web/proxy.ts` (add the redirect)

- [ ] **Step 1: Create `ParentNav.tsx`**

Create `apps/web/app/parent/components/ParentNav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/parent",              label: "Dashboard" },
  { href: "/parent/courses",      label: "Course Selection" },
  { href: "/parent/past-reports", label: "Past Reports" },
  { href: "/parent/invoices",     label: "Invoices" },
  { href: "/parent/messages",     label: "Messages" },
  { href: "/parent/calendar",     label: "Calendar" },
];

export default function ParentNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      {LINKS.map(l => {
        const isActive = l.href === "/parent"
          ? pathname === "/parent"
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={isActive ? "active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite `app/parent/layout.tsx`**

Open `apps/web/app/parent/layout.tsx` and replace contents with:
```tsx
/**
 * Layout for /parent/* routes.
 *
 * Renders the Manhaj topbar with ParentNav, the sticky ChildSwitcher
 * underneath, and the parent-only mobile-first CSS scoped via parent.css.
 */

import "./parent.css";
import ParentNav from "./components/ParentNav";
import ChildSwitcher from "./components/ChildSwitcher";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "International School of Oman";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <div className="brand-name">
              Manhaj <span className="brand-sub">· {SCHOOL_NAME}</span>
            </div>
          </div>
          <ParentNav />
        </div>
        <div className="top-right">
          <span style={{ fontSize: 12 }}>Mr Al-Habsi</span>
          <div className="avatar" title="Parent">P</div>
        </div>
      </header>
      <ChildSwitcher />
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
```

- [ ] **Step 3: Move the course-selection wizard to `/parent/courses`**

Run:
```bash
cp ~/dev/manhaj/apps/web/app/parent/select-courses/page.tsx ~/dev/manhaj/apps/web/app/parent/courses/page.tsx
```

The copied file is the existing course-selection wizard — no content changes needed. The file already lives behind the parent layout, so the new layout components (ParentNav + ChildSwitcher) automatically wrap it.

- [ ] **Step 4: Replace the old `/parent/select-courses` page with a redirect**

Open `apps/web/app/parent/select-courses/page.tsx` and replace the entire file contents with:
```tsx
/**
 * Legacy redirect: /parent/select-courses → /parent/courses.
 *
 * The course-selection wizard moved to /parent/courses as part of the
 * three-role IA restructure. This redirect preserves any external links
 * (email reminders, shared URLs) for at least 1 academic year.
 */

import { redirect } from "next/navigation";

export default function LegacyCourseSelectionRedirect() {
  redirect("/parent/courses");
}
```

- [ ] **Step 5: Update `proxy.ts` to handle the redirect at the edge**

Open `apps/web/proxy.ts` and view its current contents. If it already exports a proxy/middleware function, add a redirect check at the top of that function (return early with a 308 permanent redirect when the path matches `/parent/select-courses`). If the file is bare (it should at minimum handle some auth gating), here is the full replacement that preserves existing behaviour for everything else AND adds the redirect:

```ts
/**
 * Next.js 16 edge proxy (replacement for middleware.ts).
 *
 * Adds:
 *   - 308 permanent redirect /parent/select-courses → /parent/courses
 *     for the three-role IA restructure (2026-05-26).
 *
 * Production note: when we flip back to magic-link auth, add the /admin
 * gate redirect here too (see git history before commit 4088795).
 */

import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/parent/select-courses") {
    const url = req.nextUrl.clone();
    url.pathname = "/parent/courses";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/parent/:path*"],
};
```

If the existing `proxy.ts` has other logic that should be preserved, merge the redirect at the top of the existing `proxy` function and leave the rest unchanged.

- [ ] **Step 6: Type-check + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -15
```
Expected: build succeeds; routes include both `/parent/select-courses` (redirect) and `/parent/courses` (the wizard).

- [ ] **Step 7: Visual smoke test**

Run dev server, click "Parent" pill. Confirm:
- Topbar + ParentNav (6 tabs) + ChildSwitcher visible.
- Navigating to `/parent/select-courses` redirects to `/parent/courses`.
- The wizard renders correctly inside the new layout.

Stop dev server.

- [ ] **Step 8: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/layout.tsx apps/web/app/parent/components apps/web/app/parent/courses apps/web/app/parent/select-courses apps/web/proxy.ts && git commit -m "Parent persona: ParentNav + ChildSwitcher in layout · wizard moves to /parent/courses with redirect"
```

---

## Task 13 — Parent placeholder tabs + Dashboard

Five new routes under `/parent/*`: Dashboard, Past Reports, Invoices, Messages, Calendar.

**Files:**
- Create: `apps/web/app/parent/page.tsx` — Dashboard
- Create: `apps/web/app/parent/past-reports/page.tsx`
- Create: `apps/web/app/parent/invoices/page.tsx`
- Create: `apps/web/app/parent/messages/page.tsx`
- Create: `apps/web/app/parent/calendar/page.tsx`

- [ ] **Step 1: Create the Parent Dashboard**

Create `apps/web/app/parent/page.tsx`:
```tsx
/**
 * Parent Dashboard.
 *
 * Phase 1: AI briefing + 4 tab summary cards. Phase 2 hoists the monthly-
 * report greeting card here ("Layla had a strong April. Here's what to
 * celebrate, what to support.") per the spec.
 */

import { composeSummary } from "@/lib/summary";
import AiBriefingHeader from "../components/AiBriefingHeader";
import TabSummaryCard, { type TabSummary } from "../components/TabSummaryCard";
import type { DashboardData } from "@/lib/data";

const EMPTY: DashboardData = {
  school_id: null, teachers: [], sections: [], subjects: [], load: [],
  stats: { n_teachers: 0, n_sections: 0, n_subjects: 0, n_load: 0,
    total_cap: 0, total_assigned: 0, over_capacity: 0, at_capacity: 0,
    under_utilised: 0, healthy: 0, unmapped_sections: 0, vacant_roles: 0 },
};

export const dynamic = "force-dynamic";

export default function ParentDashboard() {
  const summary = composeSummary("parent", EMPTY);

  const cards: TabSummary[] = [
    {
      label: "Course Selection",
      href: "/parent/courses",
      big: "Open",
      trend: { text: "Submit electives for next year", tone: "flat" },
      rows: [
        { label: "Status", value: "Not started" },
        { label: "Deadline", value: "29 Jan" },
      ],
    },
    {
      label: "Invoices",
      href: "/parent/invoices",
      big: "OMR 750",
      trend: { text: "Due 25 May · Term 2 balance", tone: "warn" },
      rows: [
        { label: "Paid this year", value: "OMR 3,750" },
        { label: "Next invoice",   value: "July (T3)" },
      ],
    },
    {
      label: "Messages",
      href: "/parent/messages",
      big: "2",
      big_suffix: "unread",
      trend: { text: "From Ms Swart + Finance", tone: "warn" },
      rows: [
        { label: "Last reply", value: "14 May" },
        { label: "Open threads", value: "1" },
      ],
    },
    {
      label: "Past Reports",
      href: "/parent/past-reports",
      big: "8",
      trend: { text: "Archive · since Sept 2025", tone: "flat" },
      rows: [
        { label: "Last opened", value: "March 2026" },
        { label: "Term reports", value: "3 available" },
      ],
    },
  ];

  return (
    <div className="container">
      <h1>Welcome, Mr Al-Habsi.</h1>
      <p className="sub">Your dashboard · AY {process.env.NEXT_PUBLIC_ACADEMIC_YEAR}</p>

      <AiBriefingHeader summary={summary} />

      <div className="tab-summary-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        {cards.map(c => <TabSummaryCard key={c.label} summary={c} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the Past Reports placeholder**

Create `apps/web/app/parent/past-reports/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function ParentPastReportsPage() {
  return <PlaceholderPage
    title="Past Reports"
    lead="Archive of every monthly and term report Manhaj has sent for your child(ren)."
    bullets={[
      "Monthly reports back to September 2025",
      "Term report cards (terms 1 and 2 so far)",
      "Multi-child view — toggle between Layla, Omar, Yasmin",
    ]}
  />;
}
```

- [ ] **Step 3: Create the Invoices placeholder**

Create `apps/web/app/parent/invoices/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function ParentInvoicesPage() {
  return <PlaceholderPage
    title="Invoices"
    lead="Tuition balance, installment plans, receipts, and upcoming invoices."
    bullets={[
      "Outstanding balance with Pay-now button (payment provider TBD)",
      "Installment plan: Term 1 / Term 2 / Term 3 with status pills",
      "Fee breakdown (tuition, books, transport, clubs, optional trips)",
      "Payment history with downloadable PDF receipts",
      "AI alert when the next invoice is about to go out",
      "Household-aggregate view when you have more than one child",
    ]}
  />;
}
```

- [ ] **Step 4: Create the Messages placeholder**

Create `apps/web/app/parent/messages/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function ParentMessagesPage() {
  return <PlaceholderPage
    title="Messages"
    lead="Email thread with the school. Teachers reply from Outlook; you reply here — Manhaj keeps everything in sync."
    bullets={[
      "Inbox-style list of threads, categorized (Academic / Admin / Finance / Calendar)",
      "Child-tag chip on every row when you have more than one child",
      "Compose / reply UI sends via Resend",
      "Teachers BCC'd on every send so they can reply from Outlook",
      "Read receipts so teachers know when you've opened a message",
    ]}
  />;
}
```

- [ ] **Step 5: Create the Calendar placeholder**

Create `apps/web/app/parent/calendar/page.tsx`:
```tsx
import PlaceholderPage from "../../components/PlaceholderPage";
export default function ParentCalendarPage() {
  return <PlaceholderPage
    title="Calendar"
    lead="School year calendar with your child's exams, parent-teacher evenings, and school events."
    bullets={[
      "Month grid with today highlighted and weekends greyed",
      "Filter chips by event type (Exams / Meetings / Events / Clubs / Holidays)",
      "Multi-child mode tags each event with the child it belongs to",
      "Upcoming list for the next 14 days",
      "Sync to Apple / Google Calendar via an ICS feed that stays up-to-date",
    ]}
  />;
}
```

- [ ] **Step 6: Type-check + build**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -25
```
Expected: build succeeds; routes include all 18 from the spec.

- [ ] **Step 7: Visual smoke test**

Run dev server. From the Parent persona, click each nav tab and confirm:
- Dashboard renders AI briefing + 4 cards.
- Each placeholder shows "In development" banner + bullets.
- Wizard at `/parent/courses` still works.

Stop dev server.

- [ ] **Step 8: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/page.tsx apps/web/app/parent/past-reports apps/web/app/parent/invoices apps/web/app/parent/messages apps/web/app/parent/calendar && git commit -m "Parent placeholder tabs: Dashboard, Past Reports, Invoices, Messages, Calendar"
```

---

## Task 14 — Visual smoke test + final checks

Final verification gate before push. Confirms every Phase 1 acceptance criterion.

**Files:** none modified.

- [ ] **Step 1: Run the full test suite**

```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expected: all role + child + summary tests pass; no failures.

- [ ] **Step 2: Type-check**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
```
Expected: `EXIT=0`.

- [ ] **Step 3: Lint**

```bash
cd ~/dev/manhaj/apps/web && npm run lint
```
Expected: same 3 pre-existing warnings only; no new errors.

- [ ] **Step 4: Production build**

```bash
cd ~/dev/manhaj/apps/web && npm run build 2>&1 | tail -30
```
Expected: build succeeds; route list shows exactly these 18 routes (plus internal `/_not-found`):
```
/
/admin
/admin/attendance
/admin/faculty
/admin/reports
/admin/schedule
/admin/section-mapping
/admin/students
/api/chat
/api/sections/save-mapping
/auth/callback
/login
/parent
/parent/calendar
/parent/courses
/parent/invoices
/parent/messages
/parent/past-reports
/parent/report
/parent/select-courses    (redirects to /parent/courses)
/student
/student/growth
/student/homework
/student/past-reports
/student/schedule
```
If a route is missing, return to the relevant task and re-check.

- [ ] **Step 5: Mobile + desktop visual smoke**

Start dev server. In Chrome (or whichever browser):

**Desktop (1280 × 900):**
- Navigate to `/admin`.
- Confirm: navy role-switcher strip above the topbar, all three pills visible, "Admin" highlighted.
- Click each AdminNav tab. Each loads without 404; active state moves correctly.
- Click the "Student" persona pill. Lands on `/student`. StudentNav shows 5 tabs. Click each — they load.
- Click the "Parent" persona pill. Lands on `/parent`. ParentNav shows 6 tabs. ChildSwitcher visible below the topbar with "All children" + 3 child pills.
- Click `/parent/courses` — the wizard renders.
- Navigate manually to `/parent/select-courses` — should redirect to `/parent/courses`.

**Mobile (375 × 812 — Chrome device emulation):**
- Same flow but verify no horizontal overflow on any persona Dashboard.
- ChildSwitcher pills wrap to two rows cleanly.
- ParentNav tabs scroll horizontally OR wrap (existing `.nav` CSS handles this).

Stop dev server.

- [ ] **Step 6: Push to origin/main**

```bash
cd ~/dev/manhaj && git push origin main
```
Vercel auto-deploys. Visit `https://manhaj-ten.vercel.app/admin` and repeat the desktop smoke test against the live preview. Confirm the gate prompts exactly once even after closing + reopening the tab.

- [ ] **Step 7: Update memory + decisions log**

Append a new entry at the top of `~/.claude/projects/-Users-eliasmouawad-Library-CloudStorage-OneDrive-Personal/memory/project_school_ops_decisions.md`:

```markdown
## 2026-MM-DD — Three-role IA Phase 1 shipped

- Spec: `docs/superpowers/specs/2026-05-26-three-role-ia-design.md`
- Plan: `docs/superpowers/plans/2026-05-26-three-role-ia-phase1.md`
- Phase 1 = structural shape only. All 18 routes live; most tabs render `<PlaceholderPage />` with content briefs.
- Gate persistence: `localStorage` (was `sessionStorage`). One unlock survives tabs + refreshes.
- Role switcher: navy strip above the topbar, demo-mode only (`NEXT_PUBLIC_DEMO_MODE=true`).
- Deterministic summary composer in `lib/summary.ts`; Layer-2 prompt cache wires Phase 3.
- ChildSwitcher hard-codes a 3-child demo household; real data wires in Phase 2.
- `/parent/select-courses` → `/parent/courses` 308 redirect via `proxy.ts`.

### Pending
- Phase 2: backfill real content per tab (Students roster, Attendance feed, Invoices placeholder data, Messages threads, Calendar ICS).
- Phase 3: live Claude composer + Resend Outlook integration (Tier 1).
```

- [ ] **Step 8: Final commit (memory updates)**

```bash
cd ~/.claude/projects/-Users-eliasmouawad-Library-CloudStorage-OneDrive-Personal/memory && git status 2>&1 | head -5
```
If this directory is a git repo, commit the memory update. Otherwise, no commit needed — `MEMORY.md` and the decisions log are just files Claude reads.

---

## Phase 1 acceptance criteria · final check

Walk this list against the live deploy. Every box must check.

- [ ] Persona switcher renders on every authenticated route (3 pills, active state highlights, persists active role).
- [ ] Gate prompts exactly once. Re-opening any tab does not re-prompt.
- [ ] All 18 spec routes resolve (no 404).
- [ ] `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test` all pass.
- [ ] `/admin` shows the new Dashboard (AI briefing + 6 cards). `/admin/faculty` shows the original Faculty content.
- [ ] `/student` Dashboard + 4 placeholders.
- [ ] `/parent` Dashboard + 6 tabs · ChildSwitcher under the breadcrumb.
- [ ] `/parent/select-courses` redirects to `/parent/courses`.
- [ ] Mobile (375 px) shows no horizontal overflow on any Dashboard.

When every box is checked, Phase 1 is done. Phase 2 (real content per tab) is a separate spec → plan cycle.

---

## Self-review against the spec

| Spec section | Plan task(s) |
|---|---|
| §4 #1 Identity model — demo persona switcher | Task 4 |
| §4 #2 Switcher placement (Option A) | Task 4 step 2 (CSS) |
| §4 #3 Gate persistence (localStorage) | Task 2 |
| §4 #4 Admin dashboard / Faculty rename | Task 7 |
| §4 #5 Student persona scope | Task 10 |
| §4 #6 Parent multi-child | Tasks 11 + 12 |
| §4 #7 "My Reports" in Dashboard hero | Deferred to Phase 2 (Phase 1 ships briefing only — flagged in `apps/web/app/student/page.tsx` comment) |
| §4 #8 Naming "My Growth" | Task 10 |
| §4 #9-14 Messages × Outlook | Deferred to Phase 2 — placeholder explains the model (Task 13 step 4) |
| §4 #15 Deterministic AI summary | Task 5 |
| §4 #16 Build sequencing | This entire plan = Phase 1 |
| §4 #17-18 Annotation + axis pattern | Documented in the spec; Phase 2 charts will adopt it |
| §5 URL structure | Tasks 7, 8, 10, 12, 13 (all 18 routes live) |
| §5 Layout shell hierarchy | Tasks 4 (root) + 10 (student) + 12 (parent) |
| §5 New components | Tasks 4 + 6 + 11 |
| §6 Personas in detail | Tasks 7, 8, 10, 13 (placeholder content briefs match spec text) |
| §7 Persona switcher behaviour | Task 4 |
| §8 Child switcher behaviour | Task 11 |
| §9 Messages × Outlook | Phase 2 (this plan only stages the route + placeholder) |
| §10 AI summary | Task 5 |
| §11 Build sequencing | This plan |
| §12 Data-model deltas | Phase 2 (no schema changes in Phase 1 — placeholders read no new data) |
| §13 Open follow-ups | Phase 2+ |
| §14 Risks | All mitigated by demo-mode flag, env-var, redirect, etc. |

All Phase 1 spec requirements are covered. Phase 2+ items are deferred deliberately and tracked in §13 of the spec.
