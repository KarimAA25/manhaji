# Admin · Students tab · Implementation Plan (Phase 2.1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the `/admin/students` placeholder into the demo-grade page from the brainstorm. 8 of 15 features. Synthetic data.

**Architecture:** Static fixture in `lib/mock-students.ts` → deterministic cohort summary composer → 4 feature components (CohortHeatmap, RiskRoster, IncidentsTimeline, AdmissionsInbox) + 2 shared primitives (BreadcrumbLensBar, FilterChipRow) → assembled in `app/admin/students/page.tsx`.

**Tech Stack:** Next.js 16 App Router (server components by default; client only where lens toggle needs state) · vitest for `lib/` units · existing design tokens · no schema changes.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-admin-students-tab.md`](../specs/2026-05-27-admin-students-tab.md)

---

## File map

**Create:**
- `apps/web/lib/mock-students.ts`
- `apps/web/lib/students.test.ts`
- `apps/web/app/components/BreadcrumbLensBar.tsx`
- `apps/web/app/components/FilterChipRow.tsx`
- `apps/web/app/admin/students/components/CohortHeatmap.tsx`
- `apps/web/app/admin/students/components/RiskRoster.tsx`
- `apps/web/app/admin/students/components/IncidentsTimeline.tsx`
- `apps/web/app/admin/students/components/AdmissionsInbox.tsx`

**Modify:**
- `apps/web/lib/summary.ts` — add `studentsCohortSummary()`
- `apps/web/lib/summary.test.ts` — add tests for the new export
- `apps/web/app/admin/students/page.tsx` — replace placeholder
- `apps/web/app/globals.css` — append CSS for the new component blocks

---

## Task 1 — Mock students fixture + types

**Files:**
- Create: `apps/web/lib/mock-students.ts`

- [ ] **Step 1: Write `mock-students.ts`** — types + 30-student fixture + 6 incidents + 6 admissions + `cohortHeat()` helper.

```ts
/**
 * Manhaj Phase-2 demo fixture: synthetic student / incident / admission rows
 * for the Admin Students tab.
 *
 * The shape mirrors the eventual `manhaj_admin_students_public` RPC return
 * (Phase 3). Replacing this fixture with a real RPC is a one-import change.
 */

export type RubricScores = {
  analytical:    number;
  creative:      number;
  oral:          number;
  written:       number;
  participation: number;
  homework:      number;
};

export type StudentStatus =
  | "honor" | "good" | "watch" | "support"
  | "renewal-pending" | "admission-pending";

export type StudentRow = {
  id:           string;
  full_name:    string;
  section_code: string;
  grade_band:   "Primary" | "MS" | "HS" | "KG";
  rubric:       RubricScores;
  rubric_avg:   number;
  attendance:   number;
  status:       StudentStatus;
  risk_score:   number;
  flags:        string[];
};

export type IncidentRow = {
  id:             string;
  student_id:     string;
  student_name:   string;
  section_code:   string;
  ts:             string;
  kind:           "positive" | "negative" | "neutral";
  body:           string;
  ai_suggestion?: string;
};

export type AdmissionRow = {
  id:           string;
  full_name:    string;
  target_grade: string;
  source:       string;
  ai_score:     number;
  ai_band:      "A" | "A-" | "B+" | "B" | "B-" | "—";
  status:       "review" | "hold" | "decided";
};

export type CohortHeatRow = {
  section_code: string;
  rubric:       RubricScores;
};

function avg(r: RubricScores): number {
  return (
    r.analytical + r.creative + r.oral + r.written + r.participation + r.homework
  ) / 6;
}

function s(
  id: string, full_name: string, section_code: string, grade_band: StudentRow["grade_band"],
  rubric: RubricScores, attendance: number, status: StudentStatus, risk_score: number, flags: string[] = [],
): StudentRow {
  return {
    id, full_name, section_code, grade_band, rubric,
    rubric_avg: Number(avg(rubric).toFixed(2)),
    attendance, status, risk_score, flags,
  };
}

export const MOCK_STUDENTS: StudentRow[] = [
  // 10A — mid-pack
  s("layla-al-habsi",   "Layla Al-Habsi",   "10A", "HS", { analytical: 4.4, creative: 3.8, oral: 4.0, written: 2.8, participation: 4.2, homework: 4.6 }, 97, "honor",  14, ["ieap"]),
  s("aya-mansour",      "Aya Mansour",      "10A", "HS", { analytical: 4.7, creative: 4.5, oral: 4.6, written: 4.5, participation: 4.7, homework: 4.8 }, 99, "honor",   8),
  s("khalil-al-mansoor","Khalil Al-Mansoor","10A", "HS", { analytical: 3.8, creative: 3.4, oral: 3.6, written: 3.2, participation: 3.5, homework: 3.7 }, 95, "good",   22),
  s("rania-khalifa",    "Rania Khalifa",    "10A", "HS", { analytical: 3.5, creative: 3.0, oral: 3.2, written: 2.9, participation: 3.6, homework: 3.4 }, 89, "watch",  41, ["eal"]),
  s("tariq-said",       "Tariq Said",       "10A", "HS", { analytical: 4.0, creative: 3.6, oral: 3.8, written: 3.4, participation: 3.9, homework: 4.1 }, 96, "good",   18),

  // 10B — softer numbers
  s("maya-habibi",      "Maya Habibi",      "10B", "HS", { analytical: 3.5, creative: 3.3, oral: 3.5, written: 3.1, participation: 3.4, homework: 3.6 }, 87, "watch",  48, ["chronic-absentee"]),
  s("faisal-bilal",     "Faisal Bilal",     "10B", "HS", { analytical: 3.2, creative: 2.9, oral: 3.0, written: 2.8, participation: 3.1, homework: 3.3 }, 93, "good",   34, ["eal"]),
  s("noura-saleh",      "Noura Saleh",      "10B", "HS", { analytical: 3.9, creative: 3.7, oral: 3.8, written: 3.5, participation: 3.8, homework: 4.0 }, 96, "good",   20),
  s("hassan-omar",      "Hassan Omar",      "10B", "HS", { analytical: 3.4, creative: 3.0, oral: 3.1, written: 2.7, participation: 3.3, homework: 3.5 }, 92, "good",   29),
  s("dana-rashid",      "Dana Rashid",      "10B", "HS", { analytical: 3.6, creative: 3.5, oral: 3.7, written: 3.3, participation: 3.6, homework: 3.7 }, 94, "good",   24),

  // 11 AS — exam-track
  s("omar-saadi",       "Omar Saadi",       "11 AS", "HS", { analytical: 2.8, creative: 2.6, oral: 2.7, written: 2.4, participation: 2.5, homework: 2.6 }, 82, "support", 78, ["chronic-absentee"]),
  s("yasmin-naser",     "Yasmin Naser",     "11 AS", "HS", { analytical: 3.2, creative: 3.0, oral: 3.1, written: 2.8, participation: 3.0, homework: 3.1 }, 88, "watch",  51, ["chronic-absentee"]),
  s("mariam-nasser",    "Mariam Nasser",    "11 AS", "HS", { analytical: 4.5, creative: 4.0, oral: 4.2, written: 3.8, participation: 4.3, homework: 4.5 }, 98, "honor",  10),
  s("hamad-al-busaidi", "Hamad Al-Busaidi", "11 AS", "HS", { analytical: 4.6, creative: 4.1, oral: 4.2, written: 3.9, participation: 4.4, homework: 4.5 }, 97, "honor",  12),
  s("layla-al-rashid",  "Layla Al-Rashid",  "11 AS", "HS", { analytical: 3.7, creative: 3.5, oral: 3.6, written: 3.4, participation: 3.7, homework: 3.8 }, 94, "good",   26),

  // 12 A2 — most senior
  s("khalid-rashid",    "Khalid Rashid",    "12 A2", "HS", { analytical: 3.2, creative: 3.0, oral: 3.1, written: 2.9, participation: 3.0, homework: 3.2 }, 91, "renewal-pending", 65),
  s("aisha-mohamed",    "Aisha Mohamed",    "12 A2", "HS", { analytical: 4.7, creative: 4.4, oral: 4.5, written: 4.2, participation: 4.6, homework: 4.7 }, 99, "honor",   8),
  s("samir-ali",        "Samir Ali",        "12 A2", "HS", { analytical: 4.5, creative: 4.0, oral: 4.3, written: 4.1, participation: 4.4, homework: 4.5 }, 97, "honor",  12),
  s("noor-suleiman",    "Noor Suleiman",    "12 A2", "HS", { analytical: 4.0, creative: 3.8, oral: 4.0, written: 3.7, participation: 4.0, homework: 4.1 }, 96, "good",   22),

  // 9A — younger band
  s("ahmed-jaber",      "Ahmed Jaber",      "9A", "HS", { analytical: 4.1, creative: 3.7, oral: 3.9, written: 3.6, participation: 4.0, homework: 4.2 }, 96, "good",   20),
  s("fatima-shamsi",    "Fatima Shamsi",    "9A", "HS", { analytical: 4.4, creative: 4.0, oral: 4.1, written: 4.0, participation: 4.3, homework: 4.5 }, 98, "honor",  10),
  s("yousef-al-amri",   "Yousef Al-Amri",   "9A", "HS", { analytical: 3.6, creative: 3.4, oral: 3.5, written: 3.2, participation: 3.5, homework: 3.7 }, 93, "good",   28),
  s("hala-mohsen",      "Hala Mohsen",      "9A", "HS", { analytical: 3.0, creative: 2.8, oral: 2.9, written: 2.6, participation: 2.9, homework: 3.0 }, 84, "support", 71, ["chronic-absentee", "eal"]),

  // 9B
  s("zayd-al-hashimi",  "Zayd Al-Hashimi",  "9B", "HS", { analytical: 3.9, creative: 3.6, oral: 3.7, written: 3.4, participation: 3.7, homework: 3.9 }, 95, "good",   23),
  s("mona-khalil",      "Mona Khalil",      "9B", "HS", { analytical: 4.6, creative: 4.3, oral: 4.4, written: 4.1, participation: 4.5, homework: 4.6 }, 99, "honor",   9),
  s("rashid-al-saadi",  "Rashid Al-Saadi",  "9B", "HS", { analytical: 3.3, creative: 3.0, oral: 3.1, written: 2.8, participation: 3.0, homework: 3.2 }, 90, "watch",   46),
  s("salwa-ibrahim",    "Salwa Ibrahim",    "9B", "HS", { analytical: 3.7, creative: 3.4, oral: 3.5, written: 3.3, participation: 3.6, homework: 3.8 }, 94, "good",   25),

  // A couple of admission-pending placeholders (also listed in MOCK_ADMISSIONS)
  s("sara-khoury",      "Sara Khoury",      "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
  s("faisal-al-mawla",  "Faisal Al-Mawla",  "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
  s("hannah-rizwan",    "Hannah Rizwan",    "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
];

export const MOCK_INCIDENTS: IncidentRow[] = [
  { id: "i1", student_id: "khalid-rashid", student_name: "Khalid Rashid", section_code: "12 A2", ts: "2026-05-22T09:14:00Z", kind: "negative",
    body: "Third incident in 2 weeks (late + disruptive · Maths).",
    ai_suggestion: "3 incidents in 14 days — propose a check-in. Schedule meeting · draft parent note." },
  { id: "i2", student_id: "layla-al-habsi", student_name: "Layla Al-Habsi", section_code: "10A", ts: "2026-05-20T13:00:00Z", kind: "positive",
    body: "MUN finalist · positive citation from Ms Swart." },
  { id: "i3", student_id: "omar-saadi", student_name: "Omar Saadi", section_code: "11 AS", ts: "2026-05-17T10:30:00Z", kind: "neutral",
    body: "Meeting with student advisor · re-engagement plan agreed." },
  { id: "i4", student_id: "hala-mohsen", student_name: "Hala Mohsen", section_code: "9A", ts: "2026-05-15T08:45:00Z", kind: "negative",
    body: "Two consecutive unexplained absences." },
  { id: "i5", student_id: "aya-mansour", student_name: "Aya Mansour", section_code: "10A", ts: "2026-05-12T11:00:00Z", kind: "positive",
    body: "Top of class on the chemistry equilibrium unit test." },
  { id: "i6", student_id: "rania-khalifa", student_name: "Rania Khalifa", section_code: "10A", ts: "2026-05-10T14:20:00Z", kind: "negative",
    body: "Written-Arabic essay score dipped below 3.0 for the second month." },
];

export const MOCK_ADMISSIONS: AdmissionRow[] = [
  { id: "a1", full_name: "Sara Khoury",     target_grade: "G9 applicant",  source: "IGCSE preview · score 84/100",      ai_score: 84, ai_band: "A",  status: "review" },
  { id: "a2", full_name: "Faisal Al-Mawla", target_grade: "G10 transfer",  source: "From British School Muscat",         ai_score: 76, ai_band: "B+", status: "review" },
  { id: "a3", full_name: "Hannah Rizwan",   target_grade: "G11 applicant", source: "Awaiting transcript",                ai_score: 0,  ai_band: "—",  status: "hold" },
  { id: "a4", full_name: "Tariq Hashemi",   target_grade: "G9 applicant",  source: "IGCSE preview · score 72/100",      ai_score: 72, ai_band: "B+", status: "review" },
  { id: "a5", full_name: "Yara Al-Sabah",   target_grade: "G10 applicant", source: "From American School Doha",          ai_score: 81, ai_band: "A-", status: "review" },
  { id: "a6", full_name: "Maya Yousef",     target_grade: "G12 transfer",  source: "From IB DP track · Beirut",          ai_score: 88, ai_band: "A",  status: "review" },
];

/**
 * Compute the per-section rubric averages used by the cohort heatmap.
 * Drops the synthetic admission-pending rows (no real rubric scores).
 */
export function cohortHeat(students: StudentRow[]): CohortHeatRow[] {
  const buckets = new Map<string, StudentRow[]>();
  for (const s of students) {
    if (s.section_code === "—") continue;
    const arr = buckets.get(s.section_code) ?? [];
    arr.push(s);
    buckets.set(s.section_code, arr);
  }
  const result: CohortHeatRow[] = [];
  for (const [section_code, rows] of buckets) {
    const n = rows.length;
    const sum: RubricScores = { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 };
    for (const r of rows) {
      sum.analytical    += r.rubric.analytical;
      sum.creative      += r.rubric.creative;
      sum.oral          += r.rubric.oral;
      sum.written       += r.rubric.written;
      sum.participation += r.rubric.participation;
      sum.homework      += r.rubric.homework;
    }
    result.push({
      section_code,
      rubric: {
        analytical:    Number((sum.analytical    / n).toFixed(2)),
        creative:      Number((sum.creative      / n).toFixed(2)),
        oral:          Number((sum.oral          / n).toFixed(2)),
        written:       Number((sum.written       / n).toFixed(2)),
        participation: Number((sum.participation / n).toFixed(2)),
        homework:      Number((sum.homework      / n).toFixed(2)),
      },
    });
  }
  // Sort by section_code for stable output
  result.sort((a, b) => a.section_code.localeCompare(b.section_code));
  return result;
}
```

- [ ] **Step 2: Create the test file `apps/web/lib/students.test.ts`** with assertions covering: fixture has ≥30 students, at least 1 honor, at least 1 support, at least 1 chronic-absentee, cohortHeat returns one row per non-admission section, all returned averages are 0–5.

```ts
import { describe, expect, it } from "vitest";
import { MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS, cohortHeat } from "./mock-students";

describe("mock-students fixture", () => {
  it("has at least 30 rows", () => {
    expect(MOCK_STUDENTS.length).toBeGreaterThanOrEqual(30);
  });
  it("has at least one honor-roll student", () => {
    expect(MOCK_STUDENTS.some(s => s.status === "honor")).toBe(true);
  });
  it("has at least one support student", () => {
    expect(MOCK_STUDENTS.some(s => s.status === "support")).toBe(true);
  });
  it("has at least one chronic-absentee flag", () => {
    expect(MOCK_STUDENTS.some(s => s.flags.includes("chronic-absentee"))).toBe(true);
  });
  it("has at least 6 incidents", () => {
    expect(MOCK_INCIDENTS.length).toBeGreaterThanOrEqual(6);
  });
  it("has at least 6 admissions in the inbox", () => {
    expect(MOCK_ADMISSIONS.length).toBeGreaterThanOrEqual(6);
  });
});

describe("cohortHeat", () => {
  it("returns one row per non-admission section", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    expect(heat.length).toBeGreaterThan(0);
    expect(heat.every(h => h.section_code !== "—")).toBe(true);
  });
  it("returns rubric averages in 0..5 inclusive", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    for (const h of heat) {
      for (const score of Object.values(h.rubric)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(5);
      }
    }
  });
  it("is sorted by section_code", () => {
    const heat = cohortHeat(MOCK_STUDENTS);
    const sorted = [...heat].sort((a, b) => a.section_code.localeCompare(b.section_code));
    expect(heat.map(h => h.section_code)).toEqual(sorted.map(h => h.section_code));
  });
});
```

- [ ] **Step 3: Run tests** — expect 9 new tests pass (added to existing 17, so 26 total).

```bash
cd ~/dev/manhaj/apps/web && npm test
```

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/mock-students.ts apps/web/lib/students.test.ts && git commit -m "lib/mock-students: 30-row fixture + 6 incidents + 6 admissions + cohortHeat()"
```

---

## Task 2 — Extend `lib/summary.ts` with `studentsCohortSummary`

**Files:**
- Modify: `apps/web/lib/summary.ts`
- Modify: `apps/web/lib/summary.test.ts`

- [ ] **Step 1: Write failing tests first** — append to `summary.test.ts`:

```ts
import {
  MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS,
} from "./mock-students";
import { studentsCohortSummary } from "./summary";

describe("studentsCohortSummary", () => {
  it("returns a Summary with all 4 required fields", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    expect(s.headline).toBeTruthy();
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });

  it("headline mentions support count when students need support", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, [], []);
    expect(s.headline.toLowerCase()).toMatch(/support|flagged/);
  });

  it("ai_suggested_action surfaces a named high-risk student", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    // At least one student in the fixture has risk_score >= 65 (Omar Saadi 78, Hala Mohsen 71, Khalid Rashid 65).
    expect(s.ai_suggested_action).toBeTruthy();
    expect(s.ai_suggested_action!.toLowerCase()).toMatch(/omar|hala|khalid/);
  });

  it("today field counts incidents in the last 7 days", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    expect(s.today).toMatch(/incident|risk/i);
  });

  it("no CTA when there are no high-risk students", () => {
    const safe = MOCK_STUDENTS.map(s => ({ ...s, risk_score: 10 }));
    const s = studentsCohortSummary(safe, [], []);
    expect(s.ai_suggested_action).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests, confirm new ones fail** (`Cannot find studentsCohortSummary`).

- [ ] **Step 3: Add the export** to `apps/web/lib/summary.ts`:

```ts
import type { StudentRow, IncidentRow, AdmissionRow } from "./mock-students";

// ... existing exports stay unchanged ...

/**
 * Cohort-level summary for the Admin Students tab.
 *
 * Rule-based composition. Phase 3 will wrap a Claude call around the same
 * signature; this implementation gives us the exact shape that endpoint
 * has to return.
 */
export function studentsCohortSummary(
  students:   StudentRow[],
  incidents:  IncidentRow[],
  admissions: AdmissionRow[],
): Summary {
  const supportCount  = students.filter(s => s.status === "support").length;
  const watchCount    = students.filter(s => s.status === "watch").length;
  const renewalCount  = students.filter(s => s.status === "renewal-pending").length;
  const admissionsInReview = admissions.filter(a => a.status === "review").length;
  const total         = students.filter(s => s.status !== "admission-pending").length;

  // headline priority: support > admissions > renewal > steady
  let headline: string;
  if (supportCount > 0) {
    headline = `${supportCount} student${supportCount === 1 ? "" : "s"} flagged for support · ${watchCount} on the watchlist.`;
  } else if (admissionsInReview > 0) {
    headline = `${admissionsInReview} admission${admissionsInReview === 1 ? "" : "s"} in review.`;
  } else if (renewalCount > 0) {
    headline = `${renewalCount} re-enrollment${renewalCount === 1 ? "" : "s"} pending.`;
  } else {
    const sectionsCount = new Set(students.filter(s => s.section_code !== "—").map(s => s.section_code)).size;
    headline = `Cohort steady — ${total} students across ${sectionsCount} sections.`;
  }

  // today: name 1-2 high-risk students if any
  const highRisk = students.filter(s => s.risk_score >= 65);
  const today = highRisk.length === 0
    ? "No urgent risk flags today."
    : highRisk.length <= 2
      ? `${highRisk.map(s => s.full_name).join(" and ")} flagged at high risk today.`
      : `${highRisk.length} students at high risk today.`;

  // this_week: count incidents in the last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = incidents.filter(i => new Date(i.ts).getTime() >= sevenDaysAgo);
  const this_week = recent.length === 0
    ? "No new behavioural incidents this week."
    : `${recent.length} behavioural incident${recent.length === 1 ? "" : "s"} this week.`;

  // this_month: composite avg from fixture (delta is static placeholder until time-series lands)
  const realStudents = students.filter(s => s.status !== "admission-pending");
  const composite = realStudents.length === 0
    ? 0
    : Number((realStudents.reduce((sum, s) => sum + s.rubric_avg, 0) / realStudents.length).toFixed(1));
  const this_month = `Rubric composite ${composite} / 5 ▲ +0.18 vs last month.`;

  // ai_suggested_action: top-risk callout
  let ai_suggested_action: string | undefined;
  if (highRisk.length > 0) {
    const top = [...highRisk].sort((a, b) => b.risk_score - a.risk_score)[0];
    ai_suggested_action = `Open ${top.full_name}'s intervention log — risk score ${top.risk_score}.`;
  }

  return { headline, today, this_week, this_month, ai_suggested_action };
}
```

- [ ] **Step 4: Run tests, all green** (26 total — 17 existing + 9 students fixture + new summary ones).

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/summary.ts apps/web/lib/summary.test.ts && git commit -m "lib/summary: add studentsCohortSummary for Admin Students tab"
```

---

## Task 3 — Shared primitives: `<BreadcrumbLensBar />` + `<FilterChipRow />`

**Files:**
- Create: `apps/web/app/components/BreadcrumbLensBar.tsx`
- Create: `apps/web/app/components/FilterChipRow.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Create `BreadcrumbLensBar.tsx`**

```tsx
"use client";

/**
 * Breadcrumb + lens-toggle bar used at the top of every Phase 2 admin tab.
 *
 * The breadcrumb is a static visual chain (steps[].active marks the current
 * step). The lens toggle is interactive — three pills (Principal / Student
 * Advisor / Teacher) — and calls onLensChange.
 */

export type BreadcrumbStep = { label: string; href?: string; active?: boolean };
export type Lens = "principal" | "advisor" | "teacher";

const LENS_LABELS: Record<Lens, string> = {
  principal: "Principal",
  advisor:   "Student Advisor",
  teacher:   "Teacher",
};

export default function BreadcrumbLensBar({
  steps, lens, onLensChange,
}: {
  steps:        BreadcrumbStep[];
  lens:         Lens;
  onLensChange: (next: Lens) => void;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="bclens-crumb">
        {steps.map((step, i) => (
          <span key={`${i}-${step.label}`} className="bclens-crumb-row">
            {i > 0 && <span className="bclens-crumb-arrow" aria-hidden="true">▸</span>}
            <span className={`bclens-step ${step.active ? "active" : ""}`}>{step.label}</span>
          </span>
        ))}
      </nav>
      <div role="tablist" aria-label="Switch lens" className="bclens-lens">
        {(["principal", "advisor", "teacher"] as Lens[]).map(l => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={l === lens}
            onClick={() => onLensChange(l)}
            className={`bclens-lens-pill ${l === lens ? "active" : ""}`}
          >
            {LENS_LABELS[l]}
          </button>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `FilterChipRow.tsx`**

```tsx
"use client";

/**
 * Horizontal strip of clickable filter chips. Active chips have a darker
 * background + outline. Tones map to existing token-driven soft palette.
 */

export type ChipTone = "neutral" | "warn" | "bad" | "good" | "info";

export type Chip = {
  key:    string;
  label:  string;
  tone:   ChipTone;
  active?: boolean;
};

export default function FilterChipRow({
  chips, onToggle,
}: {
  chips:    Chip[];
  onToggle: (key: string) => void;
}) {
  return (
    <div role="toolbar" aria-label="Filters" className="chip-row">
      {chips.map(chip => (
        <button
          key={chip.key}
          type="button"
          aria-pressed={chip.active ?? false}
          onClick={() => onToggle(chip.key)}
          className={`chip-pill chip-${chip.tone} ${chip.active ? "active" : ""}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Append CSS to `globals.css`** (before the `@media (prefers-reduced-motion: reduce)` block):

```css
/* =========================================================================
   Breadcrumb + lens bar — Phase 2 admin tabs
   ========================================================================= */
.bclens-crumb {
  display: flex; align-items: center; gap: 6px;
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 8px 12px;
  font-size: 12px; flex-wrap: wrap; margin-bottom: 10px;
}
.bclens-crumb-row { display: inline-flex; align-items: center; gap: 6px; }
.bclens-crumb-arrow { color: var(--color-muted); font-size: 10px; }
.bclens-step {
  background: var(--color-soft); color: var(--color-ink);
  padding: 4px 10px; border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
}
.bclens-step.active { background: var(--color-primary); color: #fff; }

.bclens-lens {
  display: flex; gap: 4px; background: var(--color-surface-subtle);
  border: 1px solid var(--color-border); padding: 4px;
  border-radius: var(--radius-lg); margin: 0 0 14px; width: fit-content;
}
.bclens-lens-pill {
  padding: 6px 14px; font-size: 11.5px;
  font-weight: var(--font-weight-semibold); color: var(--color-muted);
  border-radius: var(--radius-md);
  background: transparent; border: 0; cursor: pointer; font-family: inherit;
}
.bclens-lens-pill:hover { color: var(--color-ink); }
.bclens-lens-pill.active {
  background: var(--color-primary); color: #fff;
}
.bclens-lens-pill:focus-visible {
  outline: 2px solid var(--color-accent); outline-offset: 2px;
}

/* =========================================================================
   Filter chip row — shared
   ========================================================================= */
.chip-row {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 10px 12px;
  margin-bottom: var(--space-3);
  display: flex; gap: 6px; flex-wrap: wrap;
}
.chip-pill {
  font-size: 10.5px; padding: 4px 10px; border-radius: var(--radius-2xl);
  font-weight: var(--font-weight-semibold); cursor: pointer;
  border: 1px solid transparent;
  background: var(--color-surface-subtle); color: var(--color-muted);
  font-family: inherit;
}
.chip-warn    { background: var(--color-warning-soft);  color: var(--color-warning-text); }
.chip-bad     { background: var(--color-danger-soft);   color: var(--color-danger-text); }
.chip-good    { background: var(--color-success-soft);  color: var(--color-success-text); }
.chip-info    { background: var(--color-info-soft);     color: var(--color-info-text); }
.chip-neutral { background: var(--color-surface-subtle); color: var(--color-muted); border-color: var(--color-border); }
.chip-pill.active { outline: 2px solid var(--color-ink); outline-offset: -1px; }
.chip-pill:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

- [ ] **Step 4: Verify** — `tsc --noEmit`, `npm run lint`, `npm run build` all clean.

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/components/BreadcrumbLensBar.tsx apps/web/app/components/FilterChipRow.tsx apps/web/app/globals.css && git commit -m "Shared primitives: BreadcrumbLensBar + FilterChipRow + CSS"
```

---

## Task 4 — `<CohortHeatmap />`

**Files:**
- Create: `apps/web/app/admin/students/components/CohortHeatmap.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Component**

```tsx
"use client";

/**
 * Section × rubric-axis grid. Each cell shows that section's rubric avg
 * for the axis, color-banded 1..5. Click logs to console (drill-down lands
 * in a future PR).
 */

import type { CohortHeatRow, RubricScores } from "@/lib/mock-students";

const AXES: Array<{ key: keyof RubricScores; label: string }> = [
  { key: "analytical",    label: "Anal"     },
  { key: "creative",      label: "Creative" },
  { key: "oral",          label: "Oral"     },
  { key: "written",       label: "Written"  },
  { key: "participation", label: "Partic"   },
  { key: "homework",      label: "HW"       },
];

function bandClass(score: number): string {
  if (score < 1.5) return "ch-1";
  if (score < 2.5) return "ch-2";
  if (score < 3.5) return "ch-3";
  if (score < 4.5) return "ch-4";
  return "ch-5";
}

export default function CohortHeatmap({ rows }: { rows: CohortHeatRow[] }) {
  return (
    <section className="ch-card" aria-label="Cohort heatmap · section by rubric axis">
      <header className="ch-head">
        <h3>Cohort heatmap · section × rubric axis</h3>
        <p className="ch-sub">Spot which axes lag in which sections. Click a cell to drill down.</p>
      </header>
      <div className="ch-grid">
        <div className="ch-corner" />
        {AXES.map(a => <div key={a.key} className="ch-col-head">{a.label}</div>)}
        {rows.map(row => (
          <>
            <div key={`${row.section_code}-rh`} className="ch-row-head">{row.section_code}</div>
            {AXES.map(a => {
              const v = row.rubric[a.key];
              return (
                <button
                  key={`${row.section_code}-${a.key}`}
                  type="button"
                  className={`ch-cell ${bandClass(v)}`}
                  aria-label={`${row.section_code} ${a.label} ${v.toFixed(1)}`}
                  onClick={() => console.log("[heatmap]", row.section_code, a.key, v)}
                >
                  {v.toFixed(1)}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: CSS** — append to `globals.css`:

```css
/* =========================================================================
   Admin Students · Cohort heatmap
   ========================================================================= */
.ch-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.ch-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.ch-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.ch-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.ch-grid {
  display: grid; grid-template-columns: 80px repeat(6, 1fr);
  gap: 3px; font-size: 9.5px;
}
.ch-corner { /* empty top-left */ }
.ch-col-head, .ch-row-head {
  padding: 4px 6px; font-weight: var(--font-weight-bold);
  font-size: 8.5px; text-transform: uppercase; letter-spacing: .03em;
  color: var(--color-muted); text-align: center;
}
.ch-row-head { font-size: 10px; color: var(--color-ink); text-align: left; display: flex; align-items: center; }
.ch-cell {
  height: 26px; border: 0; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: var(--font-weight-bold); font-size: 10px;
  font-family: inherit; cursor: pointer;
}
.ch-cell.ch-1 { background: var(--color-danger-soft); color: var(--color-danger-text); }
.ch-cell.ch-2 { background: #FFB97A; color: #7B341E; }
.ch-cell.ch-3 { background: var(--color-heat-1-bg); color: var(--color-heat-1-text); }
.ch-cell.ch-4 { background: var(--color-heat-3-bg); }
.ch-cell.ch-5 { background: var(--color-heat-4-bg); }
.ch-cell:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

- [ ] **Step 3: Verify** — `tsc + lint + build` clean.

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students/components/CohortHeatmap.tsx apps/web/app/globals.css && git commit -m "CohortHeatmap: section × rubric-axis grid"
```

---

## Task 5 — `<RiskRoster />` table

**Files:**
- Create: `apps/web/app/admin/students/components/RiskRoster.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Component**

```tsx
"use client";

/**
 * Sortable risk-scored roster table for the Admin Students tab.
 *
 * Default sort: by risk descending. The header toggle switches between
 * By risk / By rubric / By attendance / A-Z. Synthetic admission-pending
 * rows are excluded — they show up in <AdmissionsInbox /> instead.
 */

import { useMemo, useState } from "react";
import type { StudentRow } from "@/lib/mock-students";

type SortMode = "risk" | "rubric" | "absence" | "az";

const STATUS_TONE: Record<StudentRow["status"], "good" | "warn" | "bad" | "info" | "neutral"> = {
  honor: "good",
  good:  "neutral",
  watch: "warn",
  support: "bad",
  "renewal-pending": "warn",
  "admission-pending": "info",
};

function riskFillClass(score: number): string {
  if (score >= 60) return "rb-high";
  if (score >= 35) return "rb-med";
  return "rb-low";
}

export default function RiskRoster({ students }: { students: StudentRow[] }) {
  const [sort, setSort] = useState<SortMode>("risk");

  const rows = useMemo(() => {
    const enrolled = students.filter(s => s.status !== "admission-pending");
    const copy = [...enrolled];
    switch (sort) {
      case "risk":    copy.sort((a, b) => b.risk_score - a.risk_score); break;
      case "rubric":  copy.sort((a, b) => b.rubric_avg - a.rubric_avg); break;
      case "absence": copy.sort((a, b) => a.attendance - b.attendance); break;
      case "az":      copy.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
    }
    return copy;
  }, [students, sort]);

  return (
    <section className="rr-card" aria-label="Roster · risk-scored">
      <header className="rr-head">
        <div>
          <h3>Roster · risk-scored</h3>
          <p className="rr-sub">Risk = composite of rubric trend + attendance + behaviour + fee status.</p>
        </div>
        <div className="rr-toggle" role="tablist" aria-label="Sort by">
          {([
            ["risk",    "By risk"],
            ["rubric",  "By rubric"],
            ["absence", "By absence"],
            ["az",      "A–Z"],
          ] as Array<[SortMode, string]>).map(([k, label]) => (
            <button
              key={k} type="button" role="tab"
              aria-selected={sort === k}
              onClick={() => setSort(k)}
              className={`rr-toggle-pill ${sort === k ? "active" : ""}`}
            >{label}</button>
          ))}
        </div>
      </header>

      <div className="rr-tbl-wrap">
        <table className="rr-tbl">
          <thead>
            <tr>
              <th>Student</th><th>Section</th><th>Rubric</th><th>Attendance</th><th>Risk</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id}>
                <td className="rr-nm">{s.full_name}</td>
                <td>{s.section_code}</td>
                <td>{s.rubric_avg.toFixed(1)}</td>
                <td>{s.attendance}%</td>
                <td>
                  <span className="rr-risk-wrap" aria-label={`risk ${s.risk_score}`}>
                    <span className="rr-risk-bar"><span className={`rr-risk-fill ${riskFillClass(s.risk_score)}`} style={{ width: `${Math.min(100, s.risk_score)}%` }} /></span>
                    {s.risk_score}
                  </span>
                </td>
                <td>
                  <span className={`chip-pill chip-${STATUS_TONE[s.status]}`} style={{ cursor: "default" }}>
                    {s.status === "renewal-pending" ? "renew?" : s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: CSS** — append to `globals.css`:

```css
/* =========================================================================
   Admin Students · Risk roster
   ========================================================================= */
.rr-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.rr-head {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px;
  gap: 12px; flex-wrap: wrap;
}
.rr-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rr-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }

.rr-toggle {
  display: flex; gap: 3px; background: var(--color-surface-subtle);
  border: 1px solid var(--color-border); padding: 2px; border-radius: var(--radius-md);
}
.rr-toggle-pill {
  padding: 3px 10px; border-radius: var(--radius-sm); border: 0;
  background: transparent; color: var(--color-muted);
  font-size: 10px; font-weight: var(--font-weight-semibold);
  font-family: inherit; cursor: pointer;
}
.rr-toggle-pill.active { background: var(--color-primary); color: #fff; }

.rr-tbl-wrap { overflow-x: auto; }
.rr-tbl { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 560px; }
.rr-tbl th, .rr-tbl td { padding: 8px 10px; border-bottom: 1px dashed var(--color-border); text-align: left; }
.rr-tbl th {
  background: var(--color-surface-subtle); font-size: 9.5px;
  text-transform: uppercase; letter-spacing: .04em;
  color: var(--color-muted); font-weight: var(--font-weight-bold);
}
.rr-nm { font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rr-risk-wrap { display: inline-flex; align-items: center; gap: 8px; }
.rr-risk-bar  { width: 80px; height: 8px; background: var(--color-soft); border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; }
.rr-risk-fill { height: 100%; display: block; }
.rb-low  { background: var(--color-success); }
.rb-med  { background: var(--color-warn); }
.rb-high { background: var(--color-danger); }
```

- [ ] **Step 3: Verify** — tsc/lint/build clean.

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students/components/RiskRoster.tsx apps/web/app/globals.css && git commit -m "RiskRoster: sortable risk-scored roster table"
```

---

## Task 6 — `<IncidentsTimeline />`

**Files:**
- Create: `apps/web/app/admin/students/components/IncidentsTimeline.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Component**

```tsx
/**
 * Behavioural-incidents timeline for the Admin Students tab.
 *
 * Sorted newest first. Each entry: colored dot + date + student name +
 * section + body + optional inline AI suggestion in a soft-blue card.
 */

import type { IncidentRow } from "@/lib/mock-students";

const DOT: Record<IncidentRow["kind"], string> = {
  positive: "incidents-dot pos",
  negative: "incidents-dot neg",
  neutral:  "incidents-dot neutral",
};

function formatDay(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month}`;
}

export default function IncidentsTimeline({ incidents }: { incidents: IncidentRow[] }) {
  const sorted = [...incidents].sort((a, b) => b.ts.localeCompare(a.ts));
  return (
    <section className="incidents-card" aria-label="Behavioural incidents · last 14 days">
      <header className="incidents-head">
        <h3>Behavioural incidents · last 14 days</h3>
        <p className="incidents-sub">Positive + negative events. Threshold triggers AI suggestion.</p>
      </header>
      <ol className="incidents-tl">
        {sorted.map(i => (
          <li key={i.id} className="incidents-tl-row">
            <span className={DOT[i.kind]} aria-hidden="true" />
            <div className="incidents-tl-body">
              <div className="incidents-tl-date">{formatDay(i.ts)}</div>
              <div className="incidents-tl-text">
                <b>{i.student_name}</b> <span className="incidents-tl-section">({i.section_code})</span> · {i.body}
              </div>
              {i.ai_suggestion && (
                <div className="incidents-tl-ai"><b>Manhaj:</b> {i.ai_suggestion}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: CSS** — append to `globals.css`:

```css
/* =========================================================================
   Admin Students · Incidents timeline
   ========================================================================= */
.incidents-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.incidents-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.incidents-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.incidents-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.incidents-tl { list-style: none; padding: 0; margin: 0; position: relative; padding-left: 18px; }
.incidents-tl::before {
  content: ""; position: absolute; left: 4px; top: 4px; bottom: 4px;
  width: 2px; background: var(--color-border);
}
.incidents-tl-row { position: relative; padding-bottom: 12px; }
.incidents-dot {
  position: absolute; left: -16px; top: 4px;
  width: 10px; height: 10px; border-radius: 50%; display: inline-block;
}
.incidents-dot.pos     { background: var(--color-success); }
.incidents-dot.neg     { background: var(--color-danger); }
.incidents-dot.neutral { background: var(--color-accent); }
.incidents-tl-date {
  font-size: 9.5px; color: var(--color-muted);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase; letter-spacing: .04em;
}
.incidents-tl-text { font-size: 11.5px; color: var(--color-ink); line-height: 1.5; margin-top: 2px; }
.incidents-tl-section { color: var(--color-muted); font-weight: 500; }
.incidents-tl-ai {
  background: var(--color-info-soft); color: var(--color-info-text);
  padding: 6px 10px; border-radius: var(--radius-sm); font-size: 10.5px;
  margin-top: 6px; line-height: 1.5;
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students/components/IncidentsTimeline.tsx apps/web/app/globals.css && git commit -m "IncidentsTimeline: behavioural events with inline AI suggestions"
```

---

## Task 7 — `<AdmissionsInbox />`

**Files:**
- Create: `apps/web/app/admin/students/components/AdmissionsInbox.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Component**

```tsx
"use client";

/**
 * Admissions inbox — applicants in review with AI scores + Approve / Hold
 * actions. Click handlers log to console (real flow lands in a future PR).
 */

import type { AdmissionRow } from "@/lib/mock-students";

const BAND_TONE: Record<AdmissionRow["ai_band"], "good" | "warn" | "neutral" | "info"> = {
  "A":  "good",
  "A-": "good",
  "B+": "info",
  "B":  "info",
  "B-": "warn",
  "—":  "neutral",
};

export default function AdmissionsInbox({ rows }: { rows: AdmissionRow[] }) {
  const inReview = rows.filter(r => r.status === "review");
  return (
    <section className="adm-card" aria-label="Admissions inbox">
      <header className="adm-head">
        <h3>Admissions inbox · {inReview.length} in review</h3>
        <p className="adm-sub">AI scores against entry criteria. Approve / hold · draft response letter included.</p>
      </header>
      <ul className="adm-list">
        {inReview.map(a => (
          <li key={a.id} className="adm-row">
            <span className="adm-nm">{a.full_name}<small>{a.target_grade}</small></span>
            <span className="adm-src">{a.source}</span>
            <span className={`adm-band chip-pill chip-${BAND_TONE[a.ai_band]}`}>{a.ai_band}</span>
            <span className="adm-actions">
              <button type="button" className="adm-btn adm-btn-approve" onClick={() => console.log("[adm] approve", a.id)}>Approve</button>
              <button type="button" className="adm-btn adm-btn-hold"    onClick={() => console.log("[adm] hold",    a.id)}>Hold</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: CSS** — append to `globals.css`:

```css
/* =========================================================================
   Admin Students · Admissions inbox
   ========================================================================= */
.adm-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.adm-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.adm-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.adm-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.adm-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.adm-row {
  display: grid; grid-template-columns: 1.5fr 1fr 50px 130px;
  gap: 10px; align-items: center; padding: 8px 10px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-card); font-size: 11px;
}
.adm-nm { font-weight: var(--font-weight-bold); color: var(--color-ink); display: flex; flex-direction: column; }
.adm-nm small { font-weight: 400; color: var(--color-muted); font-size: 9.5px; margin-top: 2px; }
.adm-src { color: var(--color-muted); font-size: 10.5px; }
.adm-band { text-align: center; font-weight: var(--font-weight-bold); cursor: default; }
.adm-actions { display: flex; gap: 4px; justify-content: flex-end; }
.adm-btn {
  padding: 4px 10px; font-size: 9.5px; font-weight: var(--font-weight-bold);
  border-radius: var(--radius-sm); cursor: pointer; border: 0; font-family: inherit;
}
.adm-btn-approve { background: var(--color-success-soft); color: var(--color-success-text); }
.adm-btn-hold    { background: var(--color-warning-soft); color: var(--color-warning-text); }
.adm-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
@media (max-width: 700px) {
  .adm-row { grid-template-columns: 1fr; gap: 6px; }
}
```

- [ ] **Step 3: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students/components/AdmissionsInbox.tsx apps/web/app/globals.css && git commit -m "AdmissionsInbox: applicant list with AI score + Approve/Hold"
```

---

## Task 8 — Page assembly

**Files:**
- Modify: `apps/web/app/admin/students/page.tsx` (replace placeholder)
- Modify: `apps/web/app/globals.css` (one small block for KPI row)

- [ ] **Step 1: Replace `page.tsx`**

```tsx
"use client";

/**
 * Admin · Students tab.
 *
 * Phase 2 wide demo cut. Renders the 8 features from the brainstorm against
 * synthetic data from lib/mock-students. The remaining 7 features (renewal
 * funnel, demographic donut, intervention log, teacher feedback, peer
 * comparison, Cmd-K, bulk actions) are tracked in the spec as deferred.
 */

import { useState } from "react";

import {
  MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS, cohortHeat,
} from "@/lib/mock-students";
import { studentsCohortSummary } from "@/lib/summary";

import AiBriefingHeader from "../../components/AiBriefingHeader";
import BreadcrumbLensBar, { type Lens } from "../../components/BreadcrumbLensBar";
import FilterChipRow, { type Chip } from "../../components/FilterChipRow";

import CohortHeatmap        from "./components/CohortHeatmap";
import RiskRoster           from "./components/RiskRoster";
import IncidentsTimeline    from "./components/IncidentsTimeline";
import AdmissionsInbox      from "./components/AdmissionsInbox";

export default function AdminStudentsPage() {
  const students   = MOCK_STUDENTS;
  const incidents  = MOCK_INCIDENTS;
  const admissions = MOCK_ADMISSIONS;
  const summary    = studentsCohortSummary(students, incidents, admissions);
  const cohort     = cohortHeat(students);

  const [lens, setLens] = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const enrolled = students.filter(s => s.status !== "admission-pending");
  const total       = enrolled.length;
  const rubricAvg   = (enrolled.reduce((s, x) => s + x.rubric_avg, 0) / total).toFixed(1);
  const renewing    = enrolled.filter(s => s.status === "renewal-pending").length;
  const attAvg      = (enrolled.reduce((s, x) => s + x.attendance, 0) / total).toFixed(1);

  const chips: Chip[] = [
    { key: "flagged",   label: `Flagged · ${enrolled.filter(s => s.status === "support" || s.status === "watch").length}`, tone: "warn",    active: active === "flagged" },
    { key: "renewal",   label: `Renewal pending · ${renewing}`,                                                              tone: "bad",     active: active === "renewal" },
    { key: "admission", label: `Admissions · ${admissions.filter(a => a.status === "review").length}`,                       tone: "info",    active: active === "admission" },
    { key: "honor",     label: `Honor roll · ${enrolled.filter(s => s.status === "honor").length}`,                          tone: "good",    active: active === "honor" },
    { key: "chronic",   label: `Chronic absentee · ${enrolled.filter(s => s.flags.includes("chronic-absentee")).length}`,    tone: "neutral", active: active === "chronic" },
    { key: "fee",       label: `Fee overdue · 0`,                                                                            tone: "neutral", active: active === "fee" },
    { key: "new",       label: `New this term · 0`,                                                                          tone: "neutral", active: active === "new" },
    { key: "eal",       label: `EAL · ${enrolled.filter(s => s.flags.includes("eal")).length}`,                              tone: "neutral", active: active === "eal" },
    { key: "ieap",      label: `IEP · ${enrolled.filter(s => s.flags.includes("ieap")).length}`,                             tone: "neutral", active: active === "ieap" },
  ];

  return (
    <div className="container">
      <BreadcrumbLensBar
        steps={[
          { label: "School" },
          { label: "HS", active: true },
        ]}
        lens={lens}
        onLensChange={setLens}
      />

      <AiBriefingHeader summary={summary} />

      <div className="stu-stat-row">
        <div className="stu-stat-card"><div className="stu-stat-l">Enrolled</div><div className="stu-stat-v">{total}</div><div className="stu-stat-d">across {new Set(enrolled.map(s => s.section_code)).size} sections</div></div>
        <div className="stu-stat-card"><div className="stu-stat-l">Rubric avg</div><div className="stu-stat-v">{rubricAvg}</div><div className="stu-stat-d">composite</div></div>
        <div className="stu-stat-card"><div className="stu-stat-l">Renewal rate</div><div className="stu-stat-v">{Math.round(100 * (1 - renewing / total))}<span className="stu-stat-suffix">%</span></div><div className="stu-stat-d">{renewing} pending</div></div>
        <div className="stu-stat-card"><div className="stu-stat-l">Avg attendance</div><div className="stu-stat-v">{attAvg}<span className="stu-stat-suffix">%</span></div><div className="stu-stat-d">{enrolled.filter(s => s.flags.includes("chronic-absentee")).length} chronic</div></div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      <CohortHeatmap rows={cohort} />
      <RiskRoster students={students} />
      <IncidentsTimeline incidents={incidents} />
      <AdmissionsInbox rows={admissions} />
    </div>
  );
}
```

- [ ] **Step 2: Append KPI-row CSS** to `globals.css`:

```css
/* =========================================================================
   Admin Students · KPI row (scoped to this page; reuse later by promoting)
   ========================================================================= */
.stu-stat-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  margin-bottom: var(--space-3);
}
@media (max-width: 700px) { .stu-stat-row { grid-template-columns: repeat(2, 1fr); } }
.stu-stat-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 10px 12px;
}
.stu-stat-l { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.stu-stat-v { font-size: 20px; font-weight: var(--font-weight-black); color: var(--color-primary); line-height: 1.1; margin-top: 4px; }
.stu-stat-suffix { font-size: 13px; color: var(--color-muted); font-weight: var(--font-weight-semibold); }
.stu-stat-d { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
```

- [ ] **Step 3: Verify** — `tsc + lint + build` clean. Build should still show `/admin/students` as a route (now dynamic because of `useState`).

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/students/page.tsx apps/web/app/globals.css && git commit -m "/admin/students: real page assembly · 8 features wired to mock fixture"
```

---

## Task 9 — Verification + push + memory

**Files:** none modified beyond what's already committed.

- [ ] **Step 1: Full test pass**
```bash
cd ~/dev/manhaj/apps/web && npm test
```
Expect: 26 tests pass (17 prior + 6 mock-students fixture + 3 cohortHeat + 5 studentsCohortSummary; some may overlap).

- [ ] **Step 2: tsc + lint + build**
```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -30
```
Expect: clean. `/admin/students` listed in the route output.

- [ ] **Step 3: Visual smoke (desktop + mobile)** — open `http://localhost:3033/admin/students` with the dev server running.

Desktop checks:
- Breadcrumb (School ▸ HS) + lens toggle (Principal / Student Advisor / Teacher) at the top.
- Navy AI briefing card with the support count headline and an `Open Omar Saadi's intervention log · risk score 78.` CTA.
- 4 KPI cards (Enrolled / Rubric avg / Renewal rate / Avg attendance) with derived values.
- 9 filter chips with counts.
- Cohort heatmap shows 6 sections × 6 axes, no all-greens (Omar's 11 AS row mostly red/amber on written).
- Risk roster sorted by risk descending — Omar Saadi top with risk score 78.
- Behavioural incidents timeline ordered newest-first.
- Admissions inbox with 5 applicants in review (4 not on hold).

Mobile checks (375 px):
- No horizontal scroll on the page itself. Heatmap + roster scroll internally.

- [ ] **Step 4: Push**
```bash
cd ~/dev/manhaj && git push origin main
```

- [ ] **Step 5: Update memory** — prepend to `~/.claude/projects/-Users-eliasmouawad-Library-CloudStorage-OneDrive-Personal/memory/project_school_ops_decisions.md`:

```markdown
## 2026-05-27 — Phase 2.1 shipped (Admin · Students tab live)

- Spec: `docs/superpowers/specs/2026-05-27-admin-students-tab.md`
- Plan: `docs/superpowers/plans/2026-05-27-admin-students-tab.md`
- 8 of 15 brainstorm features (Wide demo cut). Synthetic data via `lib/mock-students.ts` (30 rows + 6 incidents + 6 admissions). Shape mirrors the future RPC return.
- New shared primitives: `<BreadcrumbLensBar />`, `<FilterChipRow />` — re-used by every following Phase 2 tab.
- New scoped components: `<CohortHeatmap />`, `<RiskRoster />`, `<IncidentsTimeline />`, `<AdmissionsInbox />`.
- `lib/summary.ts` gains `studentsCohortSummary()` with rule-based composition + 5 unit tests.

### Deferred to Phase 2 follow-up PRs (still in scope before Phase 3)
Renewal funnel · demographic donut · intervention log (per-student) · teacher feedback panel · peer-group comparison · Cmd-K quick search · bulk-action selection bar · `/admin/students/[id]` drill-down route.

### Next
Phase 2.2 — Admin · Attendance (port the Tier 0 demo to Tier 1, add the trend chart with axis-anchored target marker).
```

---

## Self-review

| Spec section | Plan task |
|---|---|
| §5 mock fixture | Task 1 |
| §7 studentsCohortSummary | Task 2 |
| §8.1-8.2 shared primitives | Task 3 |
| §8.3 CohortHeatmap | Task 4 |
| §8.4 RiskRoster | Task 5 |
| §8.5 IncidentsTimeline | Task 6 |
| §8.6 AdmissionsInbox | Task 7 |
| §9 page assembly + KPI row + chip wiring | Task 8 |
| §10 acceptance criteria | Task 9 |

All 8 deferred features (§3 non-goals) intentionally not in any task — they're a follow-up PR.

Type consistency: `StudentRow`, `IncidentRow`, `AdmissionRow`, `CohortHeatRow`, `RubricScores`, `Lens`, `Chip` named identically across files. `Summary` shape unchanged from Phase 1 (`studentsCohortSummary` reuses the existing type).

No "TBD" / placeholder language. Every code block is complete.
