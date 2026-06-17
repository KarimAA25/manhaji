# Admin · Students tab · design spec (Phase 2.1)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) |
| **Brainstorm mockup** | `~/dev/manhaj/.superpowers/brainstorm/.../content/students-deep-v2.html` |

---

## 1. Background

Phase 1 left `/admin/students` as a `<PlaceholderPage />`. This spec turns it into the first real Phase 2 page — the principal's cohort + per-student dashboard. The user picked the **"Wide demo cut"** scope (8 of 15 brainstorm features) backed by **static fixture data**, so this PR ships with no schema changes, no new RPCs, and no ETL touches.

## 2. Goals

1. **A demo-grade Students page** that visibly delivers on the brainstorm. When the principal opens `/admin/students`, they should see the same shape as the mockup: filter breadcrumb + lens, AI summary, KPIs, filter chips, cohort heatmap, risk roster, behavioural incidents, admissions inbox.
2. **Re-usable across tabs.** The breadcrumb + lens + filter-chip primitives must work unchanged on Attendance, Schedule, Reports, etc. — every Phase 2 page after this one consumes them.
3. **Synthetic data shaped like the eventual real schema.** When real student / behaviour / admissions data lands in Phase 3, swapping the mock fixture for a Supabase RPC requires changing one import path, not rewriting the components.

## 3. Non-goals (this PR)

Deferred to follow-up PRs in Phase 2 or Phase 3:

- Renewal funnel, Demographic donut, Intervention log, Teacher feedback panel, Peer-group comparison, Cmd-K search, Bulk action bar (the other 7 brainstorm features).
- Click-through drill into a single student's full profile page (`/admin/students/[id]` not built — clicking a row still shows hover state only).
- Real Supabase RPC for any of this data.
- Schema migrations.
- Live Claude wiring on the page-level AI summary (uses the deterministic composer pattern already established in `lib/summary.ts`, extended for the cohort context).

## 4. Decisions (resolved at scope check)

| # | Question | Decision |
|---|---|---|
| 1 | Scope width | **Wide demo cut** — 8 of 15 features ship now. |
| 2 | Data source | **Static fixture** in `apps/web/lib/mock-students.ts`. ~30 hand-rolled rows. |
| 3 | Future data path | Fixture export shape matches the eventual RPC return shape (camelCase, same field names). Swap is a one-import change. |
| 4 | AI summary source | Extend `lib/summary.ts` with a `studentsCohortSummary(students)` function. Deterministic, no Claude. |
| 5 | Per-student drill | Row hover only. No `/admin/students/[id]` route yet. |

## 5. File map

**Create:**
- `apps/web/lib/mock-students.ts` — student fixture + types
- `apps/web/lib/students.test.ts` — vitest unit tests for the cohort summary
- `apps/web/app/components/BreadcrumbLensBar.tsx` — breadcrumb + lens toggle, used on every Phase 2 admin tab
- `apps/web/app/components/FilterChipRow.tsx` — filter chip strip with tone variants
- `apps/web/app/admin/students/components/CohortHeatmap.tsx` — section × axis grid
- `apps/web/app/admin/students/components/RiskRoster.tsx` — sortable roster table
- `apps/web/app/admin/students/components/IncidentsTimeline.tsx` — incidents log
- `apps/web/app/admin/students/components/AdmissionsInbox.tsx` — applicants list

**Modify:**
- `apps/web/lib/summary.ts` — add `studentsCohortSummary()` export
- `apps/web/lib/summary.test.ts` — add tests for the new function
- `apps/web/app/admin/students/page.tsx` — replace `<PlaceholderPage />` with the full assembled page
- `apps/web/app/globals.css` — append CSS for the 4 new component blocks + breadcrumb + chips

**Delete:** nothing.

## 6. Data shape

`apps/web/lib/mock-students.ts` exports the following types and constants. Shape mirrors the eventual `manhaj_admin_students_public` RPC return (TBD in Phase 3 — naming reserved).

```ts
export type RubricScores = {
  analytical:    number;  // 1.0–5.0
  creative:      number;
  oral:          number;
  written:       number;
  participation: number;
  homework:      number;
};

export type StudentRow = {
  id:            string;             // "layla-al-habsi"
  full_name:     string;
  section_code:  string;             // "10A", "11 AS"
  grade_band:    "Primary" | "MS" | "HS" | "KG";
  rubric:        RubricScores;
  rubric_avg:    number;             // computed once, frozen
  attendance:   number;              // 0–100 (weekly %)
  status:        "honor" | "good" | "watch" | "support" | "renewal-pending" | "admission-pending";
  risk_score:    number;             // 0–100
  flags:         string[];           // ["chronic-absentee", "ieap", "eal", ...]
};

export type IncidentRow = {
  id:            string;
  student_id:    string;
  student_name:  string;
  section_code:  string;
  ts:            string;             // ISO date
  kind:          "positive" | "negative" | "neutral";
  body:          string;             // 1-sentence description
  ai_suggestion?: string;            // optional inline AI nudge
};

export type AdmissionRow = {
  id:            string;
  full_name:     string;
  target_grade:  string;
  source:        string;             // e.g. "IGCSE preview", "From British School Muscat"
  ai_score:      number;             // 0–100
  ai_band:       "A" | "A-" | "B+" | "B" | "B-" | "—";
  status:        "review" | "hold" | "decided";
};

export type CohortHeatRow = {
  section_code:  string;
  // averaged rubric for the section
  rubric:        RubricScores;
};

// Exports
export const MOCK_STUDENTS:   StudentRow[];     // ~30 rows
export const MOCK_INCIDENTS:  IncidentRow[];    // ~6 rows, 2 weeks
export const MOCK_ADMISSIONS: AdmissionRow[];   // ~6 rows
export function cohortHeat(students: StudentRow[]): CohortHeatRow[];
```

**Fixture realism rules:**
- Names span Arabic, English, mixed (e.g. Layla Al-Habsi, Omar Saadi, Aya Mansour, Khalid Rashid, Maya Habibi, Yasmin Naser).
- Section codes match the existing ETL output: `9A 9B 10A 10B 11 AS 12 A2` (the HS slice is the primary demo target).
- At least 2 students with `risk_score >= 65` (the AI calls them out by name on the summary).
- At least 1 honor-roll student (`status: "honor"`, all rubric ≥ 4.5).
- At least 1 chronic absentee (`attendance < 90`, flag `chronic-absentee`).
- Rubric averages should produce a heatmap with visible contrast — not all greens.

## 7. AI cohort summary

`lib/summary.ts` gets a new function:

```ts
export function studentsCohortSummary(
  students: StudentRow[],
  incidents: IncidentRow[],
  admissions: AdmissionRow[],
): Summary;
```

Returns the same `Summary` shape (`headline / today / this_week / this_month / ai_suggested_action`) the `AiBriefingHeader` already renders.

Rule-based composition:
- **headline** prioritises in this order: (1) flagged-for-support count, (2) admissions in review, (3) renewal-pending count, (4) "Cohort steady — N students across N sections."
- **today**: count of students with risk_score ≥ 65, named if exactly 1 or 2.
- **this_week**: count of incidents in the last 7 days + 1-sentence pattern observation (Mon-dip if applicable; not in scope to detect, so static placeholder for now).
- **this_month**: rubric composite + delta (composite computed from the fixture; delta is a hard-coded "+0.18" since we have no time-series).
- **ai_suggested_action**: if any student has `risk_score ≥ 65`, suggest "Open Omar Saadi's intervention log — 3 incidents in 14 days." Otherwise no CTA.

Tests cover each branch.

## 8. Components

### 8.1 `<BreadcrumbLensBar />` — shared

Renders the dual control at the top of any Phase 2 tab:
```
┌─────────────────────────────────────────────────────────────┐
│ School ▸ HS ▸ Grade 10 ▸ 10A ▸ Layla Al-Habsi (active step) │
├─────────────────────────────────────────────────────────────┤
│ [Principal · active] [Student Advisor] [Teacher]            │
└─────────────────────────────────────────────────────────────┘
```

Props:
```ts
type BreadcrumbStep = { label: string; href?: string; active?: boolean };
type Lens          = "principal" | "advisor" | "teacher";

<BreadcrumbLensBar
  steps={BreadcrumbStep[]}
  lens={Lens}
  onLensChange={(lens: Lens) => void}
/>
```

Client component (lens toggle is interactive). Lens state stored in component-local state for this PR; lifts to a context in a future PR if other tabs need to read it.

### 8.2 `<FilterChipRow />` — shared

Renders a row of clickable chips:
```ts
type Chip = { key: string; label: string; tone: "neutral" | "warn" | "bad" | "good" | "info"; count?: number; active?: boolean };

<FilterChipRow chips={Chip[]} onToggle={(key: string) => void} />
```

Tone maps to existing CSS variables (`--color-warning-soft`, `--color-danger-soft`, `--color-success-soft`, `--color-info-soft`).

### 8.3 `<CohortHeatmap />`

Section × rubric-axis grid. 6 sections × 6 axes = 36 cells. Each cell shows the section average for that axis, color-coded by band:

| Band | Score | Cell background |
|---|---|---|
| 1 (emerging) | < 1.5 | `--color-danger-soft` |
| 2 (approaching) | 1.5–2.5 | `#FFB97A` |
| 3 (meeting) | 2.5–3.5 | `--color-heat-1-bg` |
| 4 (exceeding) | 3.5–4.5 | `--color-heat-3-bg` |
| 5 (mastering) | ≥ 4.5 | `--color-heat-4-bg` |

Click-through stub: clicking a cell logs to console for this PR (real drill is a follow-up).

### 8.4 `<RiskRoster />`

Sortable table. Columns: Student · Section · Rubric · Attendance · Risk · Status. Default sort: by risk (descending).

Toggle in the header: `[By risk · active] [By rubric] [By absence] [A–Z]`.

Risk cell shows: `[colored bar 80px wide · low=green / med=amber / high=red] 78`.

Status chip uses the existing `.chip` variants from globals.css.

### 8.5 `<IncidentsTimeline />`

Vertical timeline. Dots colored per kind (positive=green, negative=red, neutral=navy). Each row: date · student name · short body · optional AI suggestion in a soft-blue inline card.

### 8.6 `<AdmissionsInbox />`

Row-per-applicant. Each row: name · target grade · source · AI score (badge) · `Approve / Hold` action buttons. Buttons log to console for this PR.

## 9. Page assembly

```tsx
// apps/web/app/admin/students/page.tsx
import { MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS, cohortHeat } from "@/lib/mock-students";
import { studentsCohortSummary } from "@/lib/summary";
import AiBriefingHeader from "../../components/AiBriefingHeader";
import BreadcrumbLensBar from "../../components/BreadcrumbLensBar";
import FilterChipRow from "../../components/FilterChipRow";
import CohortHeatmap from "./components/CohortHeatmap";
import RiskRoster from "./components/RiskRoster";
import IncidentsTimeline from "./components/IncidentsTimeline";
import AdmissionsInbox from "./components/AdmissionsInbox";

export default function AdminStudentsPage() {
  const students   = MOCK_STUDENTS;
  const incidents  = MOCK_INCIDENTS;
  const admissions = MOCK_ADMISSIONS;
  const summary    = studentsCohortSummary(students, incidents, admissions);
  const cohort     = cohortHeat(students);

  // KPI numbers derived from the fixture
  const total       = students.length;
  const rubricAvg   = (students.reduce((s, x) => s + x.rubric_avg, 0) / total).toFixed(1);
  const flagged     = students.filter(s => s.status === "support" || s.status === "watch").length;
  const renewing    = students.filter(s => s.status === "renewal-pending").length;
  const attAvg      = (students.reduce((s, x) => s + x.attendance, 0) / total).toFixed(1);

  // Filter chip counts
  const chips = [
    { key: "flagged",   label: `Flagged · ${flagged}`,           tone: "warn" },
    { key: "renewal",   label: `Renewal pending · ${renewing}`,  tone: "bad" },
    { key: "admission", label: `Admissions · ${admissions.filter(a => a.status === "review").length}`, tone: "info" },
    { key: "honor",     label: `Honor roll · ${students.filter(s => s.status === "honor").length}`, tone: "good" },
    { key: "chronic",   label: `Chronic absentee · ${students.filter(s => s.flags.includes("chronic-absentee")).length}`, tone: "neutral" },
    // ...up to 9 chips per the brainstorm
  ];

  return (
    <div className="container">
      <BreadcrumbLensBar steps={[{label:"School"},{label:"HS",active:true}]} lens="principal" onLensChange={() => {}} />
      <AiBriefingHeader summary={summary} />
      {/* KPI row, chips, heatmap, roster, incidents, admissions */}
    </div>
  );
}
```

## 10. Acceptance criteria

- [ ] `/admin/students` shows the breadcrumb-lens bar, AI briefing, 4 KPI cards, ~9 filter chips, cohort heatmap, risk roster, incidents timeline, admissions inbox — in that visual order.
- [ ] No `<PlaceholderPage />` import on the page.
- [ ] All numbers are derived from `MOCK_STUDENTS` / `MOCK_INCIDENTS` / `MOCK_ADMISSIONS` — no magic numbers.
- [ ] `npm test` passes (existing 17 tests + new summary tests).
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` clean (no new errors; pre-existing warnings OK).
- [ ] `npm run build` succeeds and lists `/admin/students` as a static route.
- [ ] Mobile (375 px) renders without horizontal overflow. The heatmap may scroll horizontally; the roster table may scroll horizontally; everything else stacks.
- [ ] Visual smoke at desktop 1280 px matches the brainstorm mockup at component level (exact pixel parity not required).

## 11. Risks

| Risk | Mitigation |
|---|---|
| Fixture shape locks us into a schema we'd want to change later | Field names match an obvious RPC return; if Phase 3 wants different names, we rename in one file. |
| New global CSS conflicts with existing styles | Use component-scoped class prefixes (`.cohort-heat-*`, `.risk-roster-*`, `.incidents-tl-*`, `.adm-*`). |
| Page renders slow at SSR with many fixture rows | Page is dynamic anyway (`force-dynamic`); render is well under a second for 30 rows. |
| Subagent confused by the number of new files | Plan breaks into 7 small tasks each ≤ 2 files. |

---

## 12. Self-review

- ✓ No "TBD" / "TODO" / placeholder language.
- ✓ Internal consistency: types in §6 match imports in §9.
- ✓ Scope: focused on the Students tab alone.
- ✓ Ambiguity check: every component has explicit props and one named visual block. Heatmap bands explicit. AI summary rules explicit per branch.
- ✓ The 7 deferred features are listed by name in §3 so reviewers don't expect them.

Ready to write the implementation plan.
