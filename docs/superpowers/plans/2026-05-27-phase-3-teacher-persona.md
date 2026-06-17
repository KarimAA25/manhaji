# Phase 3.0 — Teacher Persona + Landing Redesign + Analyze/Input Tabs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Teacher persona with Analyze/Input tabs, redesign the landing page as a 4-card role picker, and add Analyze/Input tab strips to the Admin shell.

**Architecture:** Six independent commits, each self-contained. Teacher persona lives at `/teacher/*` mirroring the Admin pattern (layout → nav → pages). The `lib/role.ts` enum is extended to add `"teacher"`. A new deterministic `lib/homework-generator.ts` produces subject-specific question templates with topic-token substitution (no LLM calls). CSS for all new components appends to `apps/web/app/globals.css` before the `@media (prefers-reduced-motion: reduce)` block (currently at line 2623).

**Tech Stack:** Next.js 15 App Router, TypeScript, CSS custom properties (tokens.css), Vitest, no additional npm packages.

---

## File Map

### Created (new files)
- `apps/web/app/teacher/layout.tsx` — Teacher shell topbar, TeacherNav, AskManhajDrawer
- `apps/web/app/teacher/components/TeacherNav.tsx` — 2-tab nav (Analyze / Input), usePathname active state
- `apps/web/app/teacher/page.tsx` — Analyze page: greet hero, KPI row, week grid, attendance trend, assessment table, spotlight
- `apps/web/app/teacher/input/page.tsx` — Input page (client): class picker, summary, disciplinary notes, AI homework generator
- `apps/web/app/admin/components/AdminAnalyzeInputTabs.tsx` — 2-tab strip (Analyze / Input)
- `apps/web/app/admin/input/page.tsx` — Admin Input placeholder page (4 sections)
- `apps/web/lib/homework-generator.ts` — Deterministic mock question generator
- `apps/web/lib/homework-generator.test.ts` — 5 vitest cases

### Modified (existing files)
- `apps/web/lib/role.ts` — Add `"teacher"` to ROLES and ROUTE_FOR_ROLE
- `apps/web/app/components/RoleSwitcher.tsx` — Add Teacher pill + LABELS entry
- `apps/web/app/page.tsx` — Rewrite as 4-card role picker (server component)
- `apps/web/app/admin/layout.tsx` — Wire AdminAnalyzeInputTabs below topbar
- `apps/web/app/globals.css` — Append CSS for role picker cards, ai-tabs, teacher components, admin input page

---

## Task 1: `lib/role` — add teacher role + update RoleSwitcher

**Files:**
- Modify: `apps/web/lib/role.ts`
- Modify: `apps/web/app/components/RoleSwitcher.tsx`
- Modify: `apps/web/lib/role.test.ts`

- [ ] **Step 1: Update `lib/role.ts`**

Replace the file content. The only change is adding `"teacher"` to `ROLES` and `ROUTE_FOR_ROLE`:

```typescript
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
```

- [ ] **Step 2: Update `lib/role.test.ts`**

The test `"ROLES contains exactly admin/student/parent"` must be updated — teacher is now included. Also update the `isRole("teacher")` assertion. Replace the full file:

```typescript
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
```

- [ ] **Step 3: Update `RoleSwitcher.tsx`**

Add `teacher: "Teacher"` to LABELS and add teacher pill between Admin and Student. The `roleFromPath` helper must also handle `/teacher`:

```tsx
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
import { ROLES, ROUTE_FOR_ROLE, type Role, readActiveRole, writeActiveRole, isRole } from "@/lib/role";

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
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npm test -- --silent 2>&1 | tail -10
```

Expected: all tests pass (count may go up by 1 from the new `isRole("teacher")` assertion).

- [ ] **Step 5: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/lib/role.ts apps/web/lib/role.test.ts apps/web/app/components/RoleSwitcher.tsx && git commit -m "$(cat <<'EOF'
lib/role: add teacher role + update RoleSwitcher

Extends ROLES to ["admin","teacher","student","parent"], adds ROUTE_FOR_ROLE.teacher="/teacher",
updates RoleSwitcher with Teacher pill and roleFromPath handler, updates test suite.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `/` — redesign as 4-card role picker

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css` (append CSS before line 2623)

- [ ] **Step 1: Replace `apps/web/app/page.tsx`**

This is a server component. Remove all marketing content and Supabase calls. Render a brand header + 4-card grid:

```tsx
/**
 * Manhaj — role picker landing page.
 *
 * Server component. No data fetching needed — this is a pure navigation shell.
 * Each card links to its persona's base route.
 */

import Link from "next/link";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";

type CardProps = {
  emoji: string;
  label: string;
  description: string;
  href: string;
};

function RoleCard({ emoji, label, description, href }: CardProps) {
  return (
    <Link href={href} className="rp-card">
      <span className="rp-card-emoji" aria-hidden="true">{emoji}</span>
      <span className="rp-card-label">{label}</span>
      <span className="rp-card-desc">{description}</span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <div className="brand-name">
              Manhaj <span className="brand-sub">· {SCHOOL_NAME}</span>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" tabIndex={-1} className="rp-main">
        <p className="rp-subtitle">Welcome — pick your role to enter</p>

        <div className="rp-grid">
          <RoleCard
            emoji="🛡️"
            label="Admin"
            description="Principal / academic head"
            href="/admin"
          />
          <RoleCard
            emoji="📚"
            label="Teacher"
            description="Classroom teacher"
            href="/teacher"
          />
          <RoleCard
            emoji="🎓"
            label="Student"
            description="Layla Al-Habsi · 10A"
            href="/student"
          />
          <RoleCard
            emoji="👨‍👩‍👧"
            label="Parent"
            description="Mr Al-Habsi · 3 kids"
            href="/parent"
          />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Append CSS to `apps/web/app/globals.css`**

Find the last block before `@media (prefers-reduced-motion: reduce)` (currently around line 2620). Append these rules just before that media query. Use the Edit tool to insert just before the `@media (prefers-reduced-motion: reduce)` block at line 2623:

```css
/* =========================================================================
   Role Picker Landing (/)
   ========================================================================= */
.rp-main {
  max-width: 760px;
  margin: 60px auto;
  padding: 0 28px 60px;
  text-align: center;
}
.rp-subtitle {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0 0 32px;
}
.rp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 700px) {
  .rp-grid { grid-template-columns: repeat(2, 1fr); }
}
.rp-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px 12px;
  min-height: 140px;
  text-decoration: none;
  color: var(--color-ink);
  box-shadow: var(--shadow-card);
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.rp-card:hover {
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: var(--shadow-hero);
  background: linear-gradient(160deg, #0B2545 0%, #3D5A80 100%);
  color: #fff;
}
.rp-card:hover .rp-card-desc { color: rgba(255,255,255,.7); }
.rp-card-emoji { font-size: 36px; line-height: 1; }
.rp-card-label { font-size: 16px; font-weight: 700; color: var(--color-primary); transition: color .15s; }
.rp-card:hover .rp-card-label { color: #fff; }
.rp-card-desc { font-size: 11.5px; color: var(--color-muted); transition: color .15s; }
```

- [ ] **Step 3: Run tsc + lint**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit 2>&1 | head -20 && npm run lint 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/app/page.tsx apps/web/app/globals.css && git commit -m "$(cat <<'EOF'
/: redesign as 4-card role picker (Admin/Teacher/Student/Parent)

Replaces marketing landing with a clean 4-card role-picker grid.
Each card links to its persona route with hover lift animation using design tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `/teacher` — persona scaffold (layout, nav, placeholder pages)

**Files:**
- Create: `apps/web/app/teacher/layout.tsx`
- Create: `apps/web/app/teacher/components/TeacherNav.tsx`
- Create: `apps/web/app/teacher/page.tsx` (placeholder — full content in Task 5)
- Create: `apps/web/app/teacher/input/page.tsx` (placeholder — full content in Task 6)
- Modify: `apps/web/app/globals.css` (append ai-tabs CSS + teacher layout CSS)

- [ ] **Step 1: Create `apps/web/app/teacher/layout.tsx`**

```tsx
/**
 * Layout for /teacher/* routes — shared topbar with TeacherNav.
 *
 * DEMO MODE: hard-coded teacher = Ms Swart (avatar "MS").
 * School name + AY from env, same as admin layout.
 */

import TeacherNav from "./components/TeacherNav";
import AskManhajDrawer from "../admin/components/AskManhajDrawer";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
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
          <TeacherNav />
        </div>
        <div className="top-right">
          <span style={{ fontSize: 12 }}>AY {AY}</span>
          <div className="avatar" title="Ms Swart">MS</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <AskManhajDrawer />
    </>
  );
}
```

- [ ] **Step 2: Create `apps/web/app/teacher/components/TeacherNav.tsx`**

```tsx
"use client";

/**
 * Teacher top-level tab nav.
 * Two tabs: Analyze (active on /teacher) and Input (active on /teacher/input).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/teacher",       label: "Analyze" },
  { href: "/teacher/input", label: "Input"   },
];

export default function TeacherNav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Teacher mode">
      {LINKS.map(l => {
        const isActive = l.href === "/teacher"
          ? pathname === "/teacher"
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

- [ ] **Step 3: Create placeholder `apps/web/app/teacher/page.tsx`**

This will be replaced in Task 5 with full content. For now, a skeleton that lets the scaffold compile:

```tsx
export default function TeacherAnalyzePage() {
  return (
    <div className="container">
      <h1>Teacher · Analyze</h1>
      <p className="sub">Loading full dashboard…</p>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder `apps/web/app/teacher/input/page.tsx`**

This will be replaced in Task 6:

```tsx
export default function TeacherInputPage() {
  return (
    <div className="container">
      <h1>Teacher · Input</h1>
      <p className="sub">Loading input forms…</p>
    </div>
  );
}
```

- [ ] **Step 5: Append CSS for ai-tabs to `apps/web/app/globals.css`**

Append just before the `@media (prefers-reduced-motion: reduce)` block at line ~2623 (after the role-picker CSS added in Task 2). Add:

```css
/* =========================================================================
   Analyze / Input tab strip (.ai-tabs) — used by Teacher and Admin
   ========================================================================= */
.ai-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 20px;
}
.ai-tab {
  padding: 8px 20px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color .12s, border-color .12s;
}
.ai-tab:hover { color: var(--color-primary); text-decoration: none; }
.ai-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
```

- [ ] **Step 6: Run tsc + tests**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit 2>&1 | head -20 && npm test -- --silent 2>&1 | tail -5
```

Expected: no errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/app/teacher/ apps/web/app/globals.css && git commit -m "$(cat <<'EOF'
/teacher: persona scaffold (layout, nav, placeholder pages)

Adds teacher layout (Ms Swart avatar), 2-tab TeacherNav (Analyze/Input),
placeholder pages for both tabs, and .ai-tabs CSS strip.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `/admin` — Analyze/Input tab strip + `/admin/input` page

**Files:**
- Create: `apps/web/app/admin/components/AdminAnalyzeInputTabs.tsx`
- Create: `apps/web/app/admin/input/page.tsx`
- Modify: `apps/web/app/admin/layout.tsx`
- Modify: `apps/web/app/globals.css` (append admin-input CSS)

- [ ] **Step 1: Create `apps/web/app/admin/components/AdminAnalyzeInputTabs.tsx`**

```tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminAnalyzeInputTabs() {
  const pathname = usePathname();
  const onInput = pathname?.startsWith("/admin/input");
  return (
    <nav className="ai-tabs" aria-label="Admin mode">
      <Link href="/admin" className={`ai-tab ${!onInput ? "active" : ""}`}>Analyze data</Link>
      <Link href="/admin/input" className={`ai-tab ${onInput ? "active" : ""}`}>Input data</Link>
    </nav>
  );
}
```

- [ ] **Step 2: Wire into `apps/web/app/admin/layout.tsx`**

Import `AdminAnalyzeInputTabs` and render it in `<main>` before `{children}`. The topbar already renders `AdminNav`. The tabs strip sits between the topbar and page content, so put it inside `<main>`:

```tsx
/**
 * Layout for /admin/* routes — shared topbar with nav.
 *
 * DEMO MODE: no signed-in user (visitor is on the password-gated demo),
 * so no email pill or sign-out button. The avatar is a static "PR" for
 * "Principal" — once we flip back to magic-link auth in production,
 * restore the email lookup + signOut form from git history.
 */

import AdminNav from "./components/AdminNav";
import AdminAnalyzeInputTabs from "./components/AdminAnalyzeInputTabs";
import AskManhajDrawer from "./components/AskManhajDrawer";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <AdminNav />
        </div>
        <div className="top-right">
          <span style={{ fontSize: 12 }}>AY {AY}</span>
          <div className="avatar" title="Principal">PR</div>
        </div>
      </header>
      <div className="ai-tabs-wrapper">
        <AdminAnalyzeInputTabs />
      </div>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <AskManhajDrawer />
    </>
  );
}
```

- [ ] **Step 3: Create `apps/web/app/admin/input/page.tsx`**

```tsx
/**
 * Admin · Input data tab.
 *
 * Placeholder input workflows for roster, schedule, faculty, and bulk comms.
 * These are scaffolds — each section links to or will host the real form.
 */

export default function AdminInputPage() {
  return (
    <div className="container">
      <h1>Input data</h1>
      <p className="sub">Admin data-entry workflows · AY 2026-2027</p>

      <div className="ai-input-grid">

        {/* Roster import */}
        <div className="ai-input-card">
          <div className="ai-input-card-head">
            <h3>Roster import</h3>
            <span className="ai-input-pill neutral">CSV / Excel</span>
          </div>
          <p className="ai-input-card-body">
            Drop a PowerSchool export or Excel sheet to sync the student roster.
            Last imported: <strong>14 May</strong>
          </p>
          <div className="ai-input-drop-zone">
            <span className="ai-input-drop-icon">📂</span>
            <span className="ai-input-drop-hint">Drag CSV / Excel here or click to browse</span>
          </div>
          <button type="button" className="ai-input-btn ghost" disabled>Upload file</button>
        </div>

        {/* Schedule edits */}
        <div className="ai-input-card">
          <div className="ai-input-card-head">
            <h3>Schedule edits</h3>
            <span className="ai-input-pill warn">8 pending changes</span>
          </div>
          <p className="ai-input-card-body">
            Review and approve timetable changes before publishing to teachers and students.
          </p>
          <a href="/admin/schedule" className="ai-input-btn ghost">Open schedule editor →</a>
        </div>

        {/* Faculty edits */}
        <div className="ai-input-card">
          <div className="ai-input-card-head">
            <h3>Faculty edits</h3>
            <span className="ai-input-pill bad">2 contracts expiring</span>
          </div>
          <p className="ai-input-card-body">
            Update teacher records, contract status, and subject assignments.
          </p>
          <a href="/admin/faculty" className="ai-input-btn ghost">Open faculty editor →</a>
        </div>

        {/* Bulk parent comms */}
        <div className="ai-input-card">
          <div className="ai-input-card-head">
            <h3>Bulk parent comms</h3>
            <span className="ai-input-pill neutral">17 templates</span>
          </div>
          <p className="ai-input-card-body">
            Select one or more sections and send a batch message to all parents via email.
          </p>
          <div className="ai-input-composer-placeholder">
            Select sections + compose message · 17 templates available
          </div>
          <button type="button" className="ai-input-btn ghost" disabled>Send batch →</button>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 4: Append CSS to `globals.css`**

Append after the `.ai-tabs` block added in Task 3, before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Admin Analyze/Input tabs wrapper
   ========================================================================= */
.ai-tabs-wrapper {
  border-bottom: 0;
  padding: 0 28px;
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
}
.ai-tabs-wrapper .ai-tabs {
  max-width: 1240px;
  margin: 0 auto;
  border-bottom: none;
}

/* =========================================================================
   Admin Input page (.ai-input-*)
   ========================================================================= */
.ai-input-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  margin-top: 8px;
}
@media (max-width: 700px) { .ai-input-grid { grid-template-columns: 1fr; } }
.ai-input-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ai-input-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ai-input-card-head h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-ink);
}
.ai-input-card-body {
  margin: 0;
  font-size: 11.5px;
  color: var(--color-muted);
  line-height: 1.55;
}
.ai-input-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  white-space: nowrap;
}
.ai-input-pill.neutral { background: var(--color-soft); color: var(--color-muted); }
.ai-input-pill.warn    { background: var(--color-warning-soft); color: var(--color-warning-text); border: 1px solid var(--color-warning-soft-border); }
.ai-input-pill.bad     { background: var(--color-danger-soft); color: var(--color-danger-text); border: 1px solid var(--color-danger-soft-border); }
.ai-input-drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.ai-input-drop-icon { font-size: 22px; }
.ai-input-drop-hint { font-size: 11px; color: var(--color-muted); }
.ai-input-composer-placeholder {
  background: var(--color-soft);
  border-radius: 8px;
  padding: 12px;
  font-size: 11.5px;
  color: var(--color-muted);
  text-align: center;
}
.ai-input-btn {
  display: inline-block;
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-primary);
  transition: background .12s, color .12s;
  align-self: flex-start;
}
.ai-input-btn:hover { background: var(--color-soft); text-decoration: none; }
.ai-input-btn:disabled { opacity: .5; cursor: not-allowed; }
```

- [ ] **Step 5: Run tsc + tests**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit 2>&1 | head -20 && npm test -- --silent 2>&1 | tail -5
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/app/admin/components/AdminAnalyzeInputTabs.tsx apps/web/app/admin/input/page.tsx apps/web/app/admin/layout.tsx apps/web/app/globals.css && git commit -m "$(cat <<'EOF'
/admin: Analyze/Input tab strip + /admin/input placeholder page

Adds AdminAnalyzeInputTabs component wired into admin layout, creates
/admin/input with 4 placeholder sections (roster/schedule/faculty/comms).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `/teacher` — Analyze page full content

**Files:**
- Modify: `apps/web/app/teacher/page.tsx` (replace placeholder)
- Modify: `apps/web/app/globals.css` (append teacher-analyze CSS)

- [ ] **Step 1: Replace `apps/web/app/teacher/page.tsx` with full Analyze page**

This is a server component (no `"use client"` — all data is static mock). It re-uses `TeacherMyWeek` from the admin schedule components path and `AskManhajCard` the same way.

```tsx
/**
 * Teacher · Analyze tab — Ms Swart's personal dashboard.
 *
 * Server component. All data is from in-file mock constants;
 * Phase 4 replaces with a real RPC scoped to the teacher's identity.
 *
 * Re-uses:
 *  - TeacherMyWeek (apps/web/app/admin/schedule/components/TeacherMyWeek.tsx)
 *  - TrendChart    (apps/web/app/components/TrendChart.tsx)
 *  - AskManhajCard (apps/web/app/admin/schedule/components/AskManhajCard.tsx)
 */

import TrendChart, { type TrendPoint } from "@/app/components/TrendChart";
import TeacherMyWeek from "@/app/admin/schedule/components/TeacherMyWeek";
import AskManhajCard from "@/app/admin/schedule/components/AskManhajCard";

// ---- mock data scoped to Ms Swart ----------------------------------------

const SWART_ATT: TrendPoint[] = [
  { date: "05-01", pct: 95 }, { date: "05-02", pct: 96 }, { date: "05-05", pct: 94 },
  { date: "05-06", pct: 97 }, { date: "05-07", pct: 96 }, { date: "05-08", pct: 98 },
  { date: "05-09", pct: 95 }, { date: "05-12", pct: 94 }, { date: "05-13", pct: 96 },
  { date: "05-14", pct: 97 }, { date: "05-15", pct: 95 }, { date: "05-16", pct: 94 },
  { date: "05-19", pct: 96 }, { date: "05-20", pct: 92 }, { date: "05-21", pct: 94 },
  { date: "05-22", pct: 95 }, { date: "05-23", pct: 96 },
];

const ASSESSMENTS = [
  { section: "10A", subject: "History",   pct_submitted: 92, avg_score: 74, label: "Y10 Essay — Rise of Constitutional Monarchies" },
  { section: "10A", subject: "Geography", pct_submitted: 88, avg_score: 69, label: "Map Analysis Task · Geopolitical zones" },
  { section: "9A",  subject: "History",   pct_submitted: 96, avg_score: 81, label: "Chapter 5 Quiz · Industrial Revolution" },
  { section: "10A", subject: "MUN",       pct_submitted: 100, avg_score: 88, label: "Position Paper draft · UNSC" },
];

const SPOTLIGHT = [
  { name: "Rania Khalifa",  section: "10A", note: "EAL flag · Written rubric dropped to 2.9 · needs scaffolding support",  tone: "warn"    },
  { name: "Hala Mohsen",    section: "9A",  note: "Chronic absentee · 6 days missed · missed post-exam review session",      tone: "bad"     },
  { name: "Tariq Said",     section: "10A", note: "Steady improvement in oral participation · acknowledge publicly",          tone: "good"    },
];

// --------------------------------------------------------------------------

export default function TeacherAnalyzePage() {
  return (
    <div className="container">

      {/* Greet hero */}
      <section className="ta-greet-hero">
        <h1 className="ta-greet-name">Good morning, Ms Swart.</h1>
        <p className="ta-greet-sub">
          Today: P3 History · 10A &nbsp;·&nbsp; P5 MUN club · 10A.
          &nbsp;Yesterday: 92% submission rate on Y10 essay.
        </p>
      </section>

      {/* 4-card KPI row */}
      <div className="ta-kpi-row">
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">My periods this week</div>
          <div className="ta-kpi-v">22</div>
          <div className="ta-kpi-d">across 4 sections</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">My sections</div>
          <div className="ta-kpi-v">4</div>
          <div className="ta-kpi-d">10A · 9A · 10A MUN · 12 A2</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">Avg attendance my classes</div>
          <div className="ta-kpi-v">94%</div>
          <div className="ta-kpi-d">school avg 96%</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">Pending grading</div>
          <div className="ta-kpi-v ta-kpi-warn">8</div>
          <div className="ta-kpi-d">essays · submitted yesterday</div>
        </div>
      </div>

      {/* Week grid — re-use from admin/schedule */}
      <h3 className="ta-section-head">My week</h3>
      <TeacherMyWeek />

      {/* Attendance trend */}
      <h3 className="ta-section-head">Attendance · my classes · last 17 days</h3>
      <TrendChart points={SWART_ATT} target={95} title="Attendance · Ms Swart's sections" />

      {/* Assessment table */}
      <h3 className="ta-section-head">Recent assessments</h3>
      <div className="ta-assess-card">
        <table className="ta-assess-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Subject</th>
              <th>Assessment</th>
              <th>% submitted</th>
              <th>Avg score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ASSESSMENTS.map((a, i) => (
              <tr key={i}>
                <td className="ta-assess-section">{a.section}</td>
                <td className="ta-assess-subj">{a.subject}</td>
                <td className="ta-assess-label">{a.label}</td>
                <td>
                  <span className={`ta-assess-pct ${a.pct_submitted >= 90 ? "good" : "warn"}`}>
                    {a.pct_submitted}%
                  </span>
                </td>
                <td className="ta-assess-score">{a.avg_score}%</td>
                <td>
                  <button type="button" className="ta-assess-btn">Review drafts</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student spotlight */}
      <h3 className="ta-section-head">Student spotlight · needs attention</h3>
      <div className="ta-spotlight-card">
        {SPOTLIGHT.map((s, i) => (
          <div key={i} className={`ta-spotlight-row ta-spotlight-${s.tone}`}>
            <div className="ta-spotlight-name">{s.name} <span className="ta-spotlight-section">{s.section}</span></div>
            <div className="ta-spotlight-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Ask Manhaj */}
      <h3 className="ta-section-head">Ask Manhaj</h3>
      <AskManhajCard />

    </div>
  );
}
```

- [ ] **Step 2: Append teacher-analyze CSS to `globals.css`**

Append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Teacher · Analyze page (.ta-*)
   ========================================================================= */
.ta-greet-hero {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-card);
}
.ta-greet-name { margin: 0 0 4px; font-size: 18px; font-weight: 700; color: var(--color-primary); }
.ta-greet-sub  { margin: 0; font-size: 12px; color: var(--color-muted); line-height: 1.55; }

.ta-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}
@media (max-width: 700px) { .ta-kpi-row { grid-template-columns: repeat(2, 1fr); } }
.ta-kpi-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
}
.ta-kpi-l { font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); font-weight: 600; margin-bottom: 4px; }
.ta-kpi-v { font-size: 28px; font-weight: 800; color: var(--color-primary); line-height: 1.1; }
.ta-kpi-warn { color: var(--color-warn); }
.ta-kpi-d { font-size: 10.5px; color: var(--color-muted); margin-top: 2px; }

.ta-section-head { font-size: 13px; font-weight: 700; color: var(--color-ink); margin: 24px 0 10px; }

.ta-assess-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  margin-bottom: 8px;
}
.ta-assess-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.ta-assess-table th {
  text-align: left;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-muted);
  font-weight: 600;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-soft);
}
.ta-assess-table td { padding: 9px 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.ta-assess-table tr:last-child td { border-bottom: 0; }
.ta-assess-section { font-weight: 700; color: var(--color-ink); }
.ta-assess-subj    { color: var(--color-muted); }
.ta-assess-label   { color: var(--color-ink); max-width: 300px; }
.ta-assess-pct.good { color: var(--color-success); font-weight: 700; }
.ta-assess-pct.warn { color: var(--color-warn);    font-weight: 700; }
.ta-assess-score   { color: var(--color-ink); font-weight: 600; }
.ta-assess-btn {
  font-size: 10.5px;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}
.ta-assess-btn:hover { background: var(--color-soft); }

.ta-spotlight-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
  margin-bottom: 8px;
}
.ta-spotlight-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--color-border);
  border-left: 3px solid transparent;
}
.ta-spotlight-row:last-child { border-bottom: 0; }
.ta-spotlight-good { border-left-color: var(--color-success); }
.ta-spotlight-warn { border-left-color: var(--color-warn); }
.ta-spotlight-bad  { border-left-color: var(--color-danger); }
.ta-spotlight-name { font-size: 12px; font-weight: 700; color: var(--color-ink); }
.ta-spotlight-section { font-size: 10.5px; color: var(--color-muted); font-weight: 400; margin-left: 6px; }
.ta-spotlight-note { font-size: 11px; color: var(--color-muted); line-height: 1.5; }
```

- [ ] **Step 3: Run tsc + tests**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit 2>&1 | head -20 && npm test -- --silent 2>&1 | tail -5
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/app/teacher/page.tsx apps/web/app/globals.css && git commit -m "$(cat <<'EOF'
/teacher: Analyze page (greet, KPIs, week grid, attendance, assessment, spotlight)

Full teacher dashboard: greet hero, 4-KPI row, TeacherMyWeek grid,
TrendChart attendance, assessment table, student spotlight, AskManhajCard.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `lib/homework-generator` + `/teacher/input` full page

**Files:**
- Create: `apps/web/lib/homework-generator.ts`
- Create: `apps/web/lib/homework-generator.test.ts`
- Modify: `apps/web/app/teacher/input/page.tsx` (replace placeholder)
- Modify: `apps/web/app/globals.css` (append teacher-input CSS)

- [ ] **Step 1: Create `apps/web/lib/homework-generator.ts`**

```typescript
/**
 * Deterministic homework question generator (demo — no LLM calls).
 *
 * Generates subject-specific question templates with topic-token substitution.
 * Output is deterministic for the same (section_id, subject, topic, difficulty, count, extraPrompt)
 * inputs, making the demo repeatable.
 *
 * Difficulty rules:
 *   easy   → MCQ-heavy   (60% MCQ, 40% short)
 *   medium → mixed       (20% MCQ, 60% short, 20% essay)
 *   hard   → essay-heavy (20% short, 80% essay)
 */

export type QuestionType = "mcq" | "short" | "essay";

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
};

export type GenerateInput = {
  section_id:   string;
  subject:      string;
  topic:        string;
  difficulty:   "easy" | "medium" | "hard";
  count:        number;
  extraPrompt?: string;
};

// ---- Template banks per subject ----------------------------------------

const TEMPLATES: Record<string, { mcq: string[]; short: string[]; essay: string[] }> = {
  History: {
    mcq: [
      "Which of the following was the primary cause of {topic}?",
      "In the context of {topic}, which figure played the most decisive role?",
      "Which year did {topic} reach its turning point?",
      "Which document or agreement most directly resulted from {topic}?",
    ],
    short: [
      "Explain the main causes of {topic} in 3–4 sentences.",
      "Compare and contrast {topic} with one event from the same era.",
      "Describe two consequences of {topic} for ordinary people at the time.",
      "Why is {topic} considered a turning point in history?",
      "Identify two groups that were affected differently by {topic} and explain why.",
    ],
    essay: [
      "Imagine you are a witness to {topic}. Write a 200-word diary entry describing what you see, hear, and feel.",
      "To what extent was {topic} the inevitable result of long-term social and political pressures? Argue using evidence.",
      "Evaluate the significance of {topic} for future generations. Use at least two specific examples.",
      "How did {topic} change the balance of power in the region? Write a structured essay with introduction, body, and conclusion.",
    ],
  },

  Geography: {
    mcq: [
      "Which geographical feature most influenced {topic}?",
      "Which country was most directly affected by {topic}?",
      "What term best describes the process seen in {topic}?",
    ],
    short: [
      "Describe two ways {topic} has affected population distribution.",
      "Explain how climate patterns relate to {topic}.",
      "Identify the human and physical factors that contributed to {topic}.",
      "Using a labelled diagram, explain the process of {topic}.",
    ],
    essay: [
      "Evaluate the environmental impact of {topic}. Use case-study evidence.",
      "To what extent is {topic} a global or local problem? Justify your answer.",
      "How do economic inequalities shape our response to {topic}?",
    ],
  },

  Maths: {
    mcq: [
      "Which of the following correctly simplifies an expression derived from {topic}?",
      "A problem involving {topic} gives a result of 48. Which method applies?",
      "In {topic}, what is the first step when solving for x?",
    ],
    short: [
      "Solve the following problem related to {topic}. Show all working.",
      "Explain the relationship between {topic} and real-world measurement.",
      "Prove the formula used in {topic} using two different methods.",
      "Find the area of a shape defined by the constraints of {topic}.",
    ],
    essay: [
      "Explain how the concept of {topic} connects to at least two other areas of mathematics.",
      "Design a real-world word problem based on {topic}, then solve it fully.",
      "Reflect on a common misconception students have about {topic} and explain how you would correct it.",
    ],
  },

  English: {
    mcq: [
      "Which literary device is most prominent in the passage about {topic}?",
      "In the text about {topic}, the author's tone is best described as:",
      "Which word is closest in meaning to the key term in the {topic} passage?",
    ],
    short: [
      "Write a paragraph analysing the use of imagery in the section about {topic}.",
      "Identify three examples of foreshadowing in the passage about {topic}.",
      "How does the author's choice of narrator affect the reader's understanding of {topic}?",
      "Summarise the main argument in the {topic} text in your own words.",
    ],
    essay: [
      "Explore how the writer uses language to create tension in the section about {topic}.",
      "Compare the presentation of {topic} in two texts. Use quotations and technical vocabulary.",
      "Write a 300-word creative response from the perspective of a character experiencing {topic}.",
      "Analyse the structural choices the author makes in presenting {topic}.",
    ],
  },

  Science: {
    mcq: [
      "Which variable is the independent variable in an experiment about {topic}?",
      "What is the correct unit for measuring the key quantity in {topic}?",
      "Which safety precaution is most important when working with {topic}?",
    ],
    short: [
      "Describe the method you would use to investigate {topic} in a lab setting.",
      "Explain the scientific principle behind {topic} using a diagram.",
      "What would happen if you changed one variable in the {topic} experiment?",
      "Identify potential sources of error in an experiment about {topic}.",
    ],
    essay: [
      "Design a full investigation plan to test a hypothesis related to {topic}. Include hypothesis, method, results table, and analysis.",
      "Evaluate the real-world applications of our understanding of {topic}.",
      "Explain how {topic} challenges or confirms the theory of [a relevant scientific principle].",
    ],
  },

  Arabic: {
    mcq: [
      "ما المرادف الأنسب لكلمة ذات الصلة بـ {topic}؟",
      "أيّ الجمل التالية تعبّر عن مفهوم {topic} بشكل صحيح؟",
    ],
    short: [
      "اكتب فقرة قصيرة تشرح فيها مفهوم {topic} بأسلوبك الخاص.",
      "استخرج من نص {topic} ثلاث كلمات من حقل دلالي واحد.",
      "ما رأيك في أهمية {topic}؟ عبّر عن رأيك في ثلاثة أسطر.",
    ],
    essay: [
      "اكتب مقالة من ثلاثة فقرات عن تأثير {topic} على حياتنا اليومية.",
      "ناقش أهمية {topic} في سياق ثقافي واجتماعي.",
    ],
  },

  MUN: {
    mcq: [
      "Which UN body has primary jurisdiction over issues like {topic}?",
      "In MUN procedure, what follows a 'motion to open the speaker's list' about {topic}?",
    ],
    short: [
      "Write a 3-sentence opening statement representing your country's position on {topic}.",
      "List two resolutions the UN has previously passed on {topic}.",
      "What does your country's foreign policy suggest about {topic}?",
    ],
    essay: [
      "Draft a 250-word position paper on {topic}, following standard MUN format.",
      "Argue for a specific course of UN action regarding {topic}. Use resolution language.",
    ],
  },
};

const GENERIC = {
  mcq: [
    "Which of the following best describes {topic}?",
    "What is the most important concept in {topic}?",
    "Which term applies to the main idea of {topic}?",
  ],
  short: [
    "Explain {topic} in 3–4 sentences using your own words.",
    "Give two examples that illustrate the concept of {topic}.",
    "Compare {topic} to another concept you have studied this term.",
    "Why is {topic} important in this subject area?",
  ],
  essay: [
    "Write a structured 300-word essay analysing {topic}.",
    "Evaluate the significance of {topic} using specific examples from your studies.",
    "Reflect on how {topic} connects to wider themes in this course.",
  ],
};

// ---- Difficulty → type distribution ------------------------------------

function buildTypeSequence(count: number, difficulty: GenerateInput["difficulty"]): QuestionType[] {
  // Deterministic: fill positions in a repeating pattern
  const patterns: Record<GenerateInput["difficulty"], QuestionType[]> = {
    easy:   ["mcq",   "mcq",   "mcq",   "short", "short"],
    medium: ["mcq",   "short", "short", "short", "essay"],
    hard:   ["short", "essay", "essay", "essay", "essay"],
  };
  const pattern = patterns[difficulty];
  const result: QuestionType[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pattern[i % pattern.length]);
  }
  return result;
}

// ---- Simple hash for deterministic index selection --------------------

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---- Public API -------------------------------------------------------

export function generateHomework(input: GenerateInput): { questions: Question[] } {
  const { section_id, subject, topic, difficulty, count, extraPrompt = "" } = input;
  const safeTopic = topic.trim() || "today's lesson";

  // Pick template bank — normalise subject to first word for loose matching
  const subjectKey = Object.keys(TEMPLATES).find(k =>
    subject.toLowerCase().startsWith(k.toLowerCase())
  );
  const bank = subjectKey ? TEMPLATES[subjectKey] : GENERIC;

  const typeSeq = buildTypeSequence(count, difficulty);
  const seed    = strHash(`${section_id}|${subject}|${safeTopic}|${difficulty}|${count}|${extraPrompt}`);

  const questions: Question[] = typeSeq.map((type, idx) => {
    const pool    = bank[type];
    const pickIdx = (seed + idx * 7) % pool.length;
    const template = pool[pickIdx];
    const text = template.replace(/\{topic\}/g, safeTopic);
    return {
      id:   `q${idx + 1}`,
      text,
      type,
    };
  });

  return { questions };
}
```

- [ ] **Step 2: Create `apps/web/lib/homework-generator.test.ts`**

```typescript
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
```

- [ ] **Step 3: Run tests to confirm generator tests pass**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npm test -- --silent 2>&1 | tail -10
```

Expected: all tests pass including the 7 new homework-generator tests (total ≥ 134 tests).

- [ ] **Step 4: Replace `apps/web/app/teacher/input/page.tsx` with full Input page**

This is a client component — all the form state lives here:

```tsx
"use client";

/**
 * Teacher · Input tab — class summary, disciplinary notes, AI homework generator.
 *
 * All state is local (React useState). Homework generation calls the
 * deterministic lib/homework-generator — no LLM round-trip in demo mode.
 */

import { useState } from "react";
import { generateHomework, type Question } from "@/lib/homework-generator";
import { MOCK_STUDENTS } from "@/lib/mock-students";

// ---- Ms Swart's section × subject list --------------------------------

type ClassOption = {
  id:       string;
  label:    string;
  section:  string;
  subject:  string;
};

const CLASS_OPTIONS: ClassOption[] = [
  { id: "10a-history-mon",   label: "10A · History · Mon P3",     section: "10A", subject: "History"   },
  { id: "10a-geography-tue", label: "10A · Geography · Tue P4",   section: "10A", subject: "Geography" },
  { id: "10a-mun-wed",       label: "10A · MUN club · Wed P5",    section: "10A", subject: "MUN"       },
  { id: "9a-history-thu",    label: "9A · History · Thu P4",      section: "9A",  subject: "History"   },
  { id: "11as-english-tue",  label: "11 AS · English · Tue P3",   section: "11 AS", subject: "English" },
  { id: "12a2-english-mon",  label: "12 A2 · English · Mon P5",   section: "12 A2", subject: "English" },
];

// Sections taught by Ms Swart (for filtering MOCK_STUDENTS)
const MY_SECTIONS = ["10A", "9A", "11 AS", "12 A2"];
const MY_STUDENTS = MOCK_STUDENTS.filter(s => MY_SECTIONS.includes(s.section_code));

// ---- Severity chip types -----------------------------------------------

type Severity = "minor" | "major" | "positive";

type StudentNote = {
  student_id:   string;
  student_name: string;
  section_code: string;
  note:         string;
  severity:     Severity;
};

// ---- Component --------------------------------------------------------

export default function TeacherInputPage() {
  // Section A
  const [selectedClass, setSelectedClass] = useState<ClassOption>(CLASS_OPTIONS[0]);

  // Section B
  const [summary, setSummary] = useState("");

  // Section C — disciplinary notes
  const [studentSearch, setStudentSearch] = useState("");
  const [notes, setNotes] = useState<StudentNote[]>([]);

  // Section D — homework generator
  const [hwCount,      setHwCount]      = useState<5 | 8 | 10>(5);
  const [hwDifficulty, setHwDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [hwExtra,      setHwExtra]      = useState("");
  const [generating,   setGenerating]   = useState(false);
  const [questions,    setQuestions]    = useState<Question[]>([]);
  const [editedQ,      setEditedQ]      = useState<Record<string, string>>({});
  const [pushed,       setPushed]       = useState(false);

  // ---- Handlers -------------------------------------------------------

  function handleClassChange(id: string) {
    const opt = CLASS_OPTIONS.find(c => c.id === id) ?? CLASS_OPTIONS[0];
    setSelectedClass(opt);
    // Reset dependent state when class changes
    setQuestions([]);
    setEditedQ({});
    setPushed(false);
  }

  function handleAddStudentNote(s: (typeof MY_STUDENTS)[number]) {
    if (notes.some(n => n.student_id === s.id)) return;
    setNotes(prev => [...prev, {
      student_id:   s.id,
      student_name: s.full_name,
      section_code: s.section_code,
      note:         "",
      severity:     "minor",
    }]);
    setStudentSearch("");
  }

  function handleNoteChange(student_id: string, note: string) {
    setNotes(prev => prev.map(n => n.student_id === student_id ? { ...n, note } : n));
  }

  function handleSeverityChange(student_id: string, severity: Severity) {
    setNotes(prev => prev.map(n => n.student_id === student_id ? { ...n, severity } : n));
  }

  function handleRemoveNote(student_id: string) {
    setNotes(prev => prev.filter(n => n.student_id !== student_id));
  }

  function handleGenerate() {
    setGenerating(true);
    setQuestions([]);
    setEditedQ({});
    setPushed(false);

    const topic = summary.trim()
      ? summary.trim().slice(0, 80).split(".")[0].trim()
      : "";

    setTimeout(() => {
      const result = generateHomework({
        section_id:  selectedClass.section,
        subject:     selectedClass.subject,
        topic,
        difficulty:  hwDifficulty,
        count:       hwCount,
        extraPrompt: hwExtra,
      });
      setQuestions(result.questions);
      setGenerating(false);
    }, 1500);
  }

  function getQuestionText(q: Question): string {
    return editedQ[q.id] !== undefined ? editedQ[q.id] : q.text;
  }

  function handlePush() {
    const studentCount = MY_STUDENTS.filter(s => s.section_code === selectedClass.section).length;
    console.log("[Teacher Input] Pushing homework to students", {
      class:    selectedClass.label,
      section:  selectedClass.section,
      subject:  selectedClass.subject,
      questions: questions.map(q => ({ id: q.id, text: getQuestionText(q), type: q.type })),
    });
    setPushed(true);
    const _ = studentCount; // used in toast below
  }

  // Filtered student search results
  const searchResults = studentSearch.trim().length >= 2
    ? MY_STUDENTS
        .filter(s =>
          s.section_code === selectedClass.section &&
          s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) &&
          !notes.some(n => n.student_id === s.id)
        )
        .slice(0, 5)
    : [];

  const sectionStudentCount = MY_STUDENTS.filter(s => s.section_code === selectedClass.section).length;

  return (
    <div className="container">
      <h1>Input data</h1>
      <p className="sub">Record this week&apos;s teaching · disciplinary notes · assign homework</p>

      {/* ---- Section A: Class picker ------------------------------------ */}
      <section className="ti-section">
        <h3 className="ti-section-head">A · Select class</h3>
        <div className="ti-select-wrap">
          <select
            className="ti-select"
            value={selectedClass.id}
            onChange={e => handleClassChange(e.target.value)}
            aria-label="Select class"
          >
            {CLASS_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ---- Section B: Class summary ----------------------------------- */}
      <section className="ti-section">
        <h3 className="ti-section-head">B · Class summary</h3>
        <label className="ti-label" htmlFor="summary-input">
          What did you teach in this class?
        </label>
        <textarea
          id="summary-input"
          className="ti-textarea"
          rows={5}
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="e.g. Covered Chapter 7 — the rise of constitutional monarchies. Worked through the Magna Carta primary source. Will revisit prerogative powers next lesson."
        />
        <button
          type="button"
          className="ti-btn ghost"
          onClick={() => console.log("[Teacher Input] Summary saved:", summary)}
        >
          Save summary
        </button>
      </section>

      {/* ---- Section C: Disciplinary notes ----------------------------- */}
      <section className="ti-section">
        <h3 className="ti-section-head">C · Disciplinary notes / observations</h3>
        <div className="ti-student-search-wrap">
          <input
            type="search"
            className="ti-search"
            placeholder="Search student in this section…"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            aria-label="Search students"
          />
          {searchResults.length > 0 && (
            <ul className="ti-search-results" role="listbox">
              {searchResults.map(s => (
                <li
                  key={s.id}
                  role="option"
                  aria-selected="false"
                  className="ti-search-result"
                  onClick={() => handleAddStudentNote(s)}
                  onKeyDown={e => e.key === "Enter" && handleAddStudentNote(s)}
                  tabIndex={0}
                >
                  {s.full_name} <span className="ti-search-section">{s.section_code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {notes.length > 0 && (
          <div className="ti-notes-list">
            {notes.map(n => (
              <div key={n.student_id} className="ti-note-row">
                <div className="ti-note-header">
                  <span className="ti-note-name">{n.student_name}</span>
                  <span className="ti-note-section">{n.section_code}</span>
                  <div className="ti-severity-chips">
                    {(["minor", "major", "positive"] as Severity[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        className={`ti-severity-chip ${sev} ${n.severity === sev ? "active" : ""}`}
                        onClick={() => handleSeverityChange(n.student_id, sev)}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ti-remove-btn"
                    onClick={() => handleRemoveNote(n.student_id)}
                    aria-label={`Remove note for ${n.student_name}`}
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  className="ti-textarea small"
                  rows={2}
                  value={n.note}
                  onChange={e => handleNoteChange(n.student_id, e.target.value)}
                  placeholder="Add a note about this student…"
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="ti-btn ghost"
          onClick={() => console.log("[Teacher Input] Notes saved:", notes)}
        >
          Save notes
        </button>
      </section>

      {/* ---- Section D: Generate + assign homework ---------------------- */}
      <section className="ti-section">
        <h3 className="ti-section-head">D · Generate + assign homework</h3>
        <p className="ti-section-sub">
          The AI generates questions based on your class summary
          {summary.trim() ? ` (topic: "${summary.trim().slice(0, 60)}…")` : " (fill in a summary above for best results)"}.
          You can edit each question before pushing to students.
        </p>

        <div className="ti-hw-controls">
          {/* Question count */}
          <div className="ti-hw-group">
            <span className="ti-hw-label">Questions</span>
            <div className="ti-chip-row">
              {([5, 8, 10] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  className={`ti-chip ${hwCount === n ? "active" : ""}`}
                  onClick={() => setHwCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="ti-hw-group">
            <span className="ti-hw-label">Difficulty</span>
            <div className="ti-chip-row">
              {(["easy", "medium", "hard"] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`ti-chip ${hwDifficulty === d ? "active" : ""}`}
                  onClick={() => setHwDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Extra prompt */}
        <label className="ti-label" htmlFor="hw-extra">
          Anything else for the AI to consider? <span className="ti-label-opt">(optional)</span>
        </label>
        <textarea
          id="hw-extra"
          className="ti-textarea small"
          rows={2}
          value={hwExtra}
          onChange={e => setHwExtra(e.target.value)}
          placeholder="e.g. Focus on primary sources. Include one Arabic-language term. Avoid multiple-choice."
        />

        <button
          type="button"
          className="ti-btn primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "AI is generating questions…" : "Generate questions"}
        </button>

        {/* Generated questions */}
        {generating && (
          <div className="ti-thinking">
            <span className="ti-thinking-spinner" aria-hidden="true" />
            AI is generating questions based on your class summary…
          </div>
        )}

        {questions.length > 0 && !generating && (
          <div className="ti-questions-card">
            <div className="ti-questions-head">
              Generated {questions.length} questions for <strong>{selectedClass.label}</strong>
            </div>
            <ol className="ti-questions-list">
              {questions.map((q, i) => (
                <li key={q.id} className="ti-question-row">
                  <span className="ti-q-type-badge">{q.type}</span>
                  <input
                    type="text"
                    className="ti-q-input"
                    value={getQuestionText(q)}
                    onChange={e => setEditedQ(prev => ({ ...prev, [q.id]: e.target.value }))}
                    aria-label={`Question ${i + 1}`}
                  />
                </li>
              ))}
            </ol>

            {pushed ? (
              <div className="ti-push-success">
                ✓ Sent to {sectionStudentCount} students in {selectedClass.section} · they will see it on their Homework tab tomorrow morning.
              </div>
            ) : (
              <div className="ti-push-actions">
                <button type="button" className="ti-btn primary" onClick={handlePush}>
                  Push to students
                </button>
                <button type="button" className="ti-btn ghost" onClick={handleGenerate}>
                  Regenerate
                </button>
                <button type="button" className="ti-btn ghost" onClick={() => { setQuestions([]); setEditedQ({}); }}>
                  Discard
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Append teacher-input CSS to `globals.css`**

Append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Teacher · Input page (.ti-*)
   ========================================================================= */
.ti-section {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ti-section-head {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}
.ti-section-sub {
  font-size: 11.5px;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.55;
}
.ti-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-ink);
}
.ti-label-opt { color: var(--color-muted); font-weight: 400; }

.ti-select-wrap { position: relative; }
.ti-select {
  width: 100%;
  max-width: 400px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-card);
  font-size: 12.5px;
  color: var(--color-ink);
  font-family: inherit;
  cursor: pointer;
}
.ti-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--color-ink);
  font-family: inherit;
  resize: vertical;
  line-height: 1.55;
  background: var(--color-card);
}
.ti-textarea.small { rows: 2; }
.ti-textarea:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }

/* Student search */
.ti-student-search-wrap { position: relative; max-width: 400px; }
.ti-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--color-ink);
  font-family: inherit;
  background: var(--color-card);
}
.ti-search:focus { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.ti-search-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  box-shadow: var(--shadow-pop);
  z-index: 10;
}
.ti-search-result {
  padding: 7px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ti-search-result:hover { background: var(--color-soft); }
.ti-search-section { font-size: 10px; color: var(--color-muted); }

/* Notes list */
.ti-notes-list { display: flex; flex-direction: column; gap: 10px; }
.ti-note-row {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ti-note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ti-note-name    { font-size: 12px; font-weight: 700; color: var(--color-ink); }
.ti-note-section { font-size: 10.5px; color: var(--color-muted); }
.ti-severity-chips { display: flex; gap: 4px; margin-left: auto; }
.ti-severity-chip {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  font-family: inherit;
  text-transform: capitalize;
  transition: background .1s, color .1s;
}
.ti-severity-chip.minor.active  { background: var(--color-warning-soft); color: var(--color-warning-text); border-color: var(--color-warning-soft-border); }
.ti-severity-chip.major.active  { background: var(--color-danger-soft);  color: var(--color-danger-text);  border-color: var(--color-danger-soft-border); }
.ti-severity-chip.positive.active { background: var(--color-success-soft-bg); color: var(--color-success-text); border-color: var(--color-success-soft); }
.ti-remove-btn {
  font-size: 11px;
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.ti-remove-btn:hover { color: var(--color-danger); background: var(--color-danger-soft); }

/* Homework generator controls */
.ti-hw-controls { display: flex; gap: 24px; flex-wrap: wrap; }
.ti-hw-group { display: flex; align-items: center; gap: 10px; }
.ti-hw-label { font-size: 11.5px; font-weight: 600; color: var(--color-ink); white-space: nowrap; }
.ti-chip-row { display: flex; gap: 4px; }
.ti-chip {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-muted);
  cursor: pointer;
  transition: background .1s, color .1s;
}
.ti-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* Thinking spinner */
.ti-thinking {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--color-muted);
  padding: 10px 0;
}
.ti-thinking-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: ti-spin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes ti-spin { to { transform: rotate(360deg); } }

/* Questions card */
.ti-questions-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}
.ti-questions-head {
  padding: 10px 14px;
  background: var(--color-soft);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-muted);
  border-bottom: 1px solid var(--color-border);
}
.ti-questions-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ti-question-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--color-border);
}
.ti-question-row:last-child { border-bottom: 0; }
.ti-q-type-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-soft);
  color: var(--color-muted);
  white-space: nowrap;
  flex-shrink: 0;
}
.ti-q-input {
  flex: 1;
  border: 1px solid transparent;
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 12px;
  font-family: inherit;
  color: var(--color-ink);
  background: transparent;
  transition: border-color .12s, background .12s;
}
.ti-q-input:hover  { background: var(--color-soft); }
.ti-q-input:focus  { outline: none; border-color: var(--color-accent); background: var(--color-card); }

.ti-push-actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: var(--color-soft);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.ti-push-success {
  padding: 12px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-success);
  background: var(--color-success-soft-bg);
  border-top: 1px solid var(--color-success-soft);
}

/* Buttons */
.ti-btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background .12s, color .12s, opacity .12s;
  border: 1px solid var(--color-border);
  white-space: nowrap;
}
.ti-btn.primary {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.ti-btn.primary:hover  { background: var(--color-accent); border-color: var(--color-accent); }
.ti-btn.primary:disabled { opacity: .5; cursor: not-allowed; }
.ti-btn.ghost {
  background: transparent;
  color: var(--color-primary);
}
.ti-btn.ghost:hover { background: var(--color-soft); }
.ti-btn.ghost:disabled { opacity: .5; cursor: not-allowed; }
```

- [ ] **Step 6: Run tsc + lint + all tests**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit 2>&1 | head -20 && npm run lint 2>&1 | tail -5 && npm test -- --silent 2>&1 | tail -10
```

Expected: no TypeScript errors, no lint errors, all tests pass (≥134).

- [ ] **Step 7: Commit**

```bash
cd /Users/eliasmouawad/dev/manhaj && git add apps/web/lib/homework-generator.ts apps/web/lib/homework-generator.test.ts apps/web/app/teacher/input/page.tsx apps/web/app/globals.css && git commit -m "$(cat <<'EOF'
/teacher/input: class picker + summary + disciplinary notes + AI homework generator

Adds full teacher input page with 4 sections (class picker, class summary,
disciplinary notes with student search, AI homework generator with deterministic
lib/homework-generator). Includes 7 vitest cases for the generator.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final verification + push

- [ ] **Step 1: Full verification suite**

```bash
cd /Users/eliasmouawad/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint 2>&1 | tail -5 && npm test --silent 2>&1 | tail -5 && npm run build 2>&1 | tail -10
```

Expected:
- tsc: no output (zero errors)
- lint: no errors/warnings
- tests: all pass (≥134 tests)
- build: "Route (app)" table printed, zero errors

- [ ] **Step 2: Push to remote**

```bash
cd /Users/eliasmouawad/dev/manhaj && git push origin main
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Add `"teacher"` to ROLES + ROUTE_FOR_ROLE | Task 1 |
| RoleSwitcher 4 pills (Admin/Teacher/Student/Parent) | Task 1 |
| Landing page 4-card role picker | Task 2 |
| Card hover: navy gradient + lift | Task 2 (CSS) |
| Teacher layout (Ms Swart, school name, AY, RoleSwitcher) | Task 3 |
| TeacherNav 2 tabs (Analyze / Input) with active state | Task 3 |
| Admin Analyze/Input tab strip | Task 4 |
| /admin/input placeholder (4 sections) | Task 4 |
| Teacher Analyze: greet hero | Task 5 |
| Teacher Analyze: 4-card KPI row | Task 5 |
| Teacher Analyze: TeacherMyWeek grid | Task 5 |
| Teacher Analyze: attendance TrendChart | Task 5 |
| Teacher Analyze: assessment table | Task 5 |
| Teacher Analyze: student spotlight | Task 5 |
| Teacher Analyze: AskManhajCard | Task 5 |
| Teacher Input: class picker dropdown | Task 6 |
| Teacher Input: class summary textarea | Task 6 |
| Teacher Input: disciplinary notes + severity chips | Task 6 |
| Teacher Input: AI homework generator (count/difficulty/extra) | Task 6 |
| Teacher Input: 1500ms fake thinking + questions reveal | Task 6 |
| Teacher Input: editable question rows | Task 6 |
| Teacher Input: Push/Regenerate/Discard actions | Task 6 |
| lib/homework-generator deterministic, subject templates | Task 6 |
| lib/homework-generator.test.ts (≥5 cases) | Task 6 |
| Tests keep passing throughout | All tasks |
| tsc + lint stay clean | All tasks |
| One commit per piece | Tasks 1–6 |

### Placeholder scan
- No TBD, TODO, "implement later", or "add appropriate error handling" patterns found.
- Every step has complete code or exact command.

### Type consistency
- `GenerateInput` defined in `lib/homework-generator.ts` Task 6 Step 1, imported in `teacher/input/page.tsx` Task 6 Step 4 — matches exactly.
- `Question` type defined in same file, used in component state — consistent.
- `TrendPoint` imported from `@/app/components/TrendChart` in teacher page — matches existing export.
- `ClassOption` type defined locally in `teacher/input/page.tsx` — used only there.
- `Severity` type defined locally — consistent across all usages.
