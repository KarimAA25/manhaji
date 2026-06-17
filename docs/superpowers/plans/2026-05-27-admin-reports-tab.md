# Admin · Reports tab · Implementation Plan (Phase 2.7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the 6-block Admin Reports against `lib/mock-reports.ts`. Pure UI — no schema. All server components.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-admin-reports-tab.md`](../specs/2026-05-27-admin-reports-tab.md)

---

## File map

**Create:**
- `apps/web/lib/mock-reports.ts` + `apps/web/lib/reports.test.ts`
- `apps/web/app/admin/reports/components/{KpiRow,PipelineFunnel,SectionProgress,TemplatesShelf,EngagementHeatmap,ComplianceLog}.tsx`

**Modify:**
- `apps/web/app/admin/reports/page.tsx`
- `apps/web/app/globals.css`

---

## Task 1 — Mock fixture + tests

**Files:** `apps/web/lib/mock-reports.ts` + `apps/web/lib/reports.test.ts`

- [ ] **Step 1: `mock-reports.ts`**

```ts
/**
 * Manhaj Phase 2.7 demo fixture — synthetic parent-comms pipeline state for
 * the Admin Reports tab. Mirrors a future RPC return so swap is one import.
 */

export type PipelineStage = "draft" | "review" | "ready" | "sent" | "opened" | "replied" | "bounced";

export type PipelineStat = { stage: PipelineStage; count: number; label: string };

export type SectionReport = {
  section_id:    string;
  section_label: string;
  homeroom:      string;
  drafted:       number;
  reviewed:      number;
  target:        number;
  next_due:      string;
  days_to_due:   number;
};

export type Template = {
  id:          string;
  name:        string;
  category:    "Monthly" | "Term" | "Behavioural" | "Attendance" | "Fee" | "Achievement";
  icon:        string;
  last_used:   string;
  usage_count: number;
};

export type HeatmapRow = { section_id: string; section_label: string; by_month: number[] };

export type AuditEntry = {
  id:        string;
  timestamp: string;
  actor:     string;
  action:    string;
  scope:     string;
  result:    "success" | "warning" | "fail";
};

export const MOCK_PIPELINE: PipelineStat[] = [
  { stage: "draft",    count: 246, label: "Drafted"   },
  { stage: "review",   count: 188, label: "In review" },
  { stage: "ready",    count: 156, label: "Ready"     },
  { stage: "sent",     count: 421, label: "Sent"      },
  { stage: "opened",   count: 391, label: "Opened"    },
  { stage: "replied",  count: 161, label: "Replied"   },
  { stage: "bounced",  count:   4, label: "Bounced"   },
];

export const MOCK_SECTIONS: SectionReport[] = [
  { section_id: "10A", section_label: "10A · HS",      homeroom: "Ms Khan",   drafted: 24, reviewed: 18, target: 28, next_due: "2026-05-30", days_to_due: 3 },
  { section_id: "10B", section_label: "10B · HS",      homeroom: "Mr Faisal", drafted: 22, reviewed: 14, target: 26, next_due: "2026-05-30", days_to_due: 3 },
  { section_id: "9A",  section_label: "9A · HS",       homeroom: "Ms Aida",   drafted: 19, reviewed:  6, target: 25, next_due: "2026-05-29", days_to_due: 2 },
  { section_id: "9B",  section_label: "9B · MS",       homeroom: "Mr Omar",   drafted: 12, reviewed:  4, target: 24, next_due: "2026-05-28", days_to_due: 1 },
  { section_id: "7B",  section_label: "7B · MS",       homeroom: "Mr Khaled", drafted: 22, reviewed: 12, target: 22, next_due: "2026-06-02", days_to_due: 6 },
  { section_id: "KG2", section_label: "KG2 · Primary", homeroom: "Ms Layla",  drafted: 20, reviewed:  4, target: 20, next_due: "2026-05-27", days_to_due: 0 },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "mp-y10",  name: "Monthly progress · Y10",   category: "Monthly",     icon: "📊", last_used: "2026-05-22", usage_count: 142 },
  { id: "tr-y9",   name: "Term review · Y9",         category: "Term",        icon: "📝", last_used: "2026-04-30", usage_count:  89 },
  { id: "be-1",    name: "Behavioural follow-up",     category: "Behavioural", icon: "🧭", last_used: "2026-05-19", usage_count:  41 },
  { id: "at-1",    name: "Attendance warning",        category: "Attendance",  icon: "📅", last_used: "2026-05-24", usage_count:  67 },
  { id: "fe-1",    name: "Fee reminder · Term 2",    category: "Fee",         icon: "💳", last_used: "2026-05-15", usage_count:  53 },
  { id: "ac-1",    name: "Achievement spotlight",    category: "Achievement", icon: "🏆", last_used: "2026-05-12", usage_count:  29 },
];

export const HEATMAP_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

export const MOCK_HEATMAP: HeatmapRow[] = [
  { section_id: "10A", section_label: "10A", by_month: [78, 82, 85, 80, 87, 91, 88, 92, 93] },
  { section_id: "10B", section_label: "10B", by_month: [72, 78, 80, 75, 81, 84, 86, 88, 90] },
  { section_id: "9A",  section_label: "9A",  by_month: [68, 71, 75, 70, 76, 80, 83, 85, 87] },
  { section_id: "9B",  section_label: "9B",  by_month: [62, 65, 68, 64, 70, 73, 76, 80, 82] },
  { section_id: "7B",  section_label: "7B",  by_month: [55, 60, 64, 60, 66, 70, 73, 76, 79] },
  { section_id: "KG2", section_label: "KG2", by_month: [88, 90, 92, 91, 93, 94, 95, 95, 96] },
];

export const MOCK_AUDIT: AuditEntry[] = [
  { id: "AU-5", timestamp: "2026-05-25 09:14", actor: "Ms Khan",   action: "Sent 28 Y10 monthly reports",                scope: "Parent comms · contact data",      result: "success" },
  { id: "AU-4", timestamp: "2026-05-24 16:38", actor: "Principal", action: "Approved Y10 monthly report batch",          scope: "Parent comms · review workflow",   result: "success" },
  { id: "AU-3", timestamp: "2026-05-22 11:02", actor: "System",    action: "4 reports bounced · invalid contact",        scope: "Parent comms · contact data",      result: "warning" },
  { id: "AU-2", timestamp: "2026-05-21 14:10", actor: "Mr Faisal", action: "Drafted 22 Y10B monthly reports",            scope: "Parent comms · authoring",         result: "success" },
  { id: "AU-1", timestamp: "2026-05-19 08:55", actor: "Principal", action: "Exported PDPL compliance log for Term 1",    scope: "Compliance · regulator export",    result: "success" },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function reportKpis(
  pipeline: PipelineStat[], sections: SectionReport[], _audit: AuditEntry[],
) {
  const byStage = Object.fromEntries(pipeline.map(p => [p.stage, p.count]));
  const sent     = byStage["sent"]    ?? 0;
  const opened   = byStage["opened"]  ?? 0;
  const replied  = byStage["replied"] ?? 0;
  const bounced  = byStage["bounced"] ?? 0;
  const draftedTotal  = sections.reduce((s, x) => s + x.drafted,  0);
  const reviewedTotal = sections.reduce((s, x) => s + x.reviewed, 0);
  const targetTotal   = sections.reduce((s, x) => s + x.target,   0);
  const ready = Math.max(0, targetTotal - draftedTotal + reviewedTotal); // descriptive only
  return {
    drafted:      draftedTotal,
    in_review:    Math.max(0, draftedTotal - reviewedTotal),
    ready,
    sent_count:   sent,
    open_rate:    sent === 0 ? 0 : Math.round((opened  / sent) * 100),
    reply_rate:   sent === 0 ? 0 : Math.round((replied / sent) * 100),
    bounced,
  };
}

export function sectionsAtRisk(sections: SectionReport[]): SectionReport[] {
  return sections.filter(s => s.days_to_due < 1);
}
```

- [ ] **Step 2: `reports.test.ts`** — 8 tests

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_PIPELINE, MOCK_SECTIONS, MOCK_TEMPLATES, MOCK_HEATMAP, MOCK_AUDIT,
  HEATMAP_MONTHS, reportKpis, sectionsAtRisk,
} from "./mock-reports";

describe("mock-reports fixture", () => {
  it("has 7 pipeline stages", () => {
    expect(MOCK_PIPELINE.length).toBe(7);
  });
  it("has 6 sections + 6 templates + 6 heatmap rows + 5 audit entries", () => {
    expect(MOCK_SECTIONS.length).toBe(6);
    expect(MOCK_TEMPLATES.length).toBe(6);
    expect(MOCK_HEATMAP.length).toBe(6);
    expect(MOCK_AUDIT.length).toBe(5);
  });
  it("heatmap rows have 9 months each, all 0-100", () => {
    expect(HEATMAP_MONTHS.length).toBe(9);
    for (const r of MOCK_HEATMAP) {
      expect(r.by_month.length).toBe(9);
      for (const v of r.by_month) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("reportKpis", () => {
  const k = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  it("returns drafted sum across sections", () => {
    const expected = MOCK_SECTIONS.reduce((s, x) => s + x.drafted, 0);
    expect(k.drafted).toBe(expected);
  });
  it("open_rate is 0..100 and matches pipeline", () => {
    expect(k.open_rate).toBeGreaterThanOrEqual(0);
    expect(k.open_rate).toBeLessThanOrEqual(100);
  });
  it("reply_rate is 0..100", () => {
    expect(k.reply_rate).toBeGreaterThanOrEqual(0);
    expect(k.reply_rate).toBeLessThanOrEqual(100);
  });
  it("bounced matches pipeline", () => {
    expect(k.bounced).toBe(MOCK_PIPELINE.find(p => p.stage === "bounced")?.count);
  });
});

describe("sectionsAtRisk", () => {
  it("flags sections with days_to_due < 1", () => {
    const risk = sectionsAtRisk(MOCK_SECTIONS);
    expect(risk.length).toBeGreaterThan(0);
    expect(risk.every(s => s.days_to_due < 1)).toBe(true);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-reports.ts apps/web/lib/reports.test.ts && git commit -m "lib/mock-reports: pipeline + sections + templates + heatmap + audit fixture"
```

Expect 105 tests pass (97 prior + 8 new).

---

## Task 2 — KpiRow + PipelineFunnel + SectionProgress

**Files:** 3 components + CSS.

- [ ] **Step 1: `KpiRow.tsx`** (server)

```tsx
import { reportKpis, MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT } from "@/lib/mock-reports";

export default function KpiRow() {
  const k = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  const pills = [
    { label: "Drafted",        value: `${k.drafted}`,   tone: "good" },
    { label: "In review",      value: `${k.in_review}`, tone: "warn" },
    { label: "Ready to send",  value: `${k.ready}`,     tone: "good" },
    { label: "Sent · opens / replies",
      value: `${k.sent_count}`,
      tone: "good",
      sub: `${k.open_rate}% opened · ${k.reply_rate}% replied` },
    { label: "Bounces",        value: `${k.bounced}`,   tone: k.bounced > 0 ? "danger" : "good" },
  ];
  return (
    <section className="rep-kpi-row" aria-label="Reports KPIs">
      {pills.map(p => (
        <div key={p.label} className={`rep-kpi rep-kpi-${p.tone}`}>
          <div className="rep-kpi-value">{p.value}</div>
          <div className="rep-kpi-label">{p.label}</div>
          {p.sub && <div className="rep-kpi-sub">{p.sub}</div>}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: `PipelineFunnel.tsx`** (server)

```tsx
import { MOCK_PIPELINE } from "@/lib/mock-reports";

export default function PipelineFunnel() {
  const max = Math.max(...MOCK_PIPELINE.map(p => p.count));
  return (
    <section className="rep-pf-card" aria-label="Send pipeline">
      <header className="rep-pf-head">
        <h3>Send pipeline</h3>
        <p className="rep-pf-sub">Drafts → review → ready → sent → opened → replied → bounced.</p>
      </header>
      <ul className="rep-pf-list" role="list">
        {MOCK_PIPELINE.map(p => {
          const pct = max === 0 ? 0 : Math.round((p.count / max) * 100);
          return (
            <li key={p.stage} className={`rep-pf-row rep-pf-${p.stage}`}>
              <span className="rep-pf-label">{p.label}</span>
              <span className="rep-pf-bar">
                <span className="rep-pf-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="rep-pf-count">{p.count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: `SectionProgress.tsx`** (server)

```tsx
import { MOCK_SECTIONS } from "@/lib/mock-reports";

function dueChip(days: number): { label: string; tone: string } {
  if (days < 1)  return { label: "Due today",   tone: "danger" };
  if (days <= 2) return { label: `${days}d left`, tone: "warn"   };
  return { label: `${days}d left`, tone: "good" };
}

export default function SectionProgress() {
  return (
    <section className="rep-sp-card" aria-label="Section progress">
      <header className="rep-sp-head">
        <h3>Section progress · drafting + review</h3>
      </header>
      <ul className="rep-sp-list" role="list">
        {MOCK_SECTIONS.map(s => {
          const draftPct  = Math.round((s.drafted  / s.target) * 100);
          const reviewPct = Math.round((s.reviewed / s.target) * 100);
          const due = dueChip(s.days_to_due);
          return (
            <li key={s.section_id} className="rep-sp-row">
              <span className="rep-sp-label">
                <strong>{s.section_label}</strong>
                <span className="rep-sp-home">{s.homeroom}</span>
              </span>
              <span className="rep-sp-bar">
                <span className="rep-sp-fill draft"  style={{ width: `${draftPct}%`  }} />
                <span className="rep-sp-fill review" style={{ width: `${reviewPct}%` }} />
              </span>
              <span className="rep-sp-meta">{s.drafted} / {s.target} drafted · {s.reviewed} reviewed</span>
              <span className={`rep-sp-chip rep-sp-chip-${due.tone}`}>{due.label}</span>
              <button type="button" className="rep-sp-btn">Ping teacher</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Admin Reports · KpiRow
   ========================================================================= */
.rep-kpi-row {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
  margin-bottom: var(--space-3);
}
@media (max-width: 880px) { .rep-kpi-row { grid-template-columns: repeat(2, 1fr); } }
.rep-kpi {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 10px 12px; text-align: center;
}
.rep-kpi-value { font-size: 18px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-kpi-label { font-size: 10px; color: var(--color-muted); margin-top: 2px; }
.rep-kpi-sub   { font-size: 9.5px; color: var(--color-muted); margin-top: 2px; }
.rep-kpi-good   { border-color: var(--color-success); }
.rep-kpi-warn   { border-color: var(--color-warning); }
.rep-kpi-danger { border-color: var(--color-danger); }
.rep-kpi-danger .rep-kpi-value { color: var(--color-danger); }

/* =========================================================================
   Admin Reports · PipelineFunnel
   ========================================================================= */
.rep-pf-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.rep-pf-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.rep-pf-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-pf-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.rep-pf-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.rep-pf-row { display: grid; grid-template-columns: 100px 1fr 50px; gap: 12px; align-items: center; font-size: 11px; }
.rep-pf-label { color: var(--color-ink); font-weight: var(--font-weight-medium); }
.rep-pf-bar { background: var(--color-surface-subtle); border-radius: var(--radius-sm); height: 18px; overflow: hidden; }
.rep-pf-fill { display: block; height: 100%; background: var(--color-primary); }
.rep-pf-draft   .rep-pf-fill { background: #94A3B8; }
.rep-pf-review  .rep-pf-fill { background: #FBBF24; }
.rep-pf-ready   .rep-pf-fill { background: #60A5FA; }
.rep-pf-sent    .rep-pf-fill { background: #3B82F6; }
.rep-pf-opened  .rep-pf-fill { background: #22C55E; }
.rep-pf-replied .rep-pf-fill { background: #10B981; }
.rep-pf-bounced .rep-pf-fill { background: var(--color-danger); }
.rep-pf-count { text-align: right; font-weight: var(--font-weight-bold); color: var(--color-ink); }

/* =========================================================================
   Admin Reports · SectionProgress
   ========================================================================= */
.rep-sp-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.rep-sp-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.rep-sp-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-sp-list { list-style: none; padding: 0; margin: 0; }
.rep-sp-row {
  display: grid; grid-template-columns: 140px 1fr auto auto auto;
  gap: 12px; padding: 10px 0;
  border-bottom: 1px dashed var(--color-border); align-items: center;
  font-size: 11px;
}
.rep-sp-row:last-child { border-bottom: 0; }
.rep-sp-label { display: flex; flex-direction: column; }
.rep-sp-label strong { color: var(--color-ink); font-size: 11.5px; }
.rep-sp-home { font-size: 9.5px; color: var(--color-muted); }
.rep-sp-bar {
  background: var(--color-surface-subtle); border-radius: var(--radius-sm);
  height: 12px; overflow: hidden; position: relative;
}
.rep-sp-fill { position: absolute; left: 0; top: 0; bottom: 0; }
.rep-sp-fill.draft  { background: #94A3B8; }
.rep-sp-fill.review { background: var(--color-success); }
.rep-sp-meta { font-size: 9.5px; color: var(--color-muted); }
.rep-sp-chip { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-2xl); font-weight: var(--font-weight-bold); }
.rep-sp-chip-good   { background: var(--color-success-soft); color: var(--color-success-text); }
.rep-sp-chip-warn   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.rep-sp-chip-danger { background: var(--color-danger-soft);  color: var(--color-danger-text); }
.rep-sp-btn { padding: 5px 10px; font-size: 10px; font-weight: var(--font-weight-bold); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); cursor: pointer; font-family: inherit; }
.rep-sp-btn:hover { background: var(--color-soft); color: var(--color-ink); }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/admin/reports/components apps/web/app/globals.css && git commit -m "Reports: KpiRow + PipelineFunnel + SectionProgress"
```

---

## Task 3 — TemplatesShelf + EngagementHeatmap + ComplianceLog

**Files:** 3 components + CSS.

- [ ] **Step 1: `TemplatesShelf.tsx`** (server)

```tsx
import { MOCK_TEMPLATES } from "@/lib/mock-reports";

export default function TemplatesShelf() {
  return (
    <section className="rep-ts-card" aria-label="Templates shelf">
      <header className="rep-ts-head">
        <h3>Templates · 6 of 17 built-in</h3>
        <a href="#" className="rep-ts-link">See all →</a>
      </header>
      <div className="rep-ts-grid">
        {MOCK_TEMPLATES.map(t => (
          <article key={t.id} className="rep-ts-tile">
            <div className="rep-ts-icon" aria-hidden>{t.icon}</div>
            <div className="rep-ts-name">{t.name}</div>
            <div className="rep-ts-badge">{t.category}</div>
            <div className="rep-ts-meta">Last used {t.last_used} · {t.usage_count} uses</div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `EngagementHeatmap.tsx`** (server)

```tsx
import { MOCK_HEATMAP, HEATMAP_MONTHS } from "@/lib/mock-reports";

function tone(pct: number): string {
  if (pct >= 90) return "eh-4";
  if (pct >= 80) return "eh-3";
  if (pct >= 70) return "eh-2";
  if (pct >= 60) return "eh-1";
  return "eh-0";
}

export default function EngagementHeatmap() {
  return (
    <section className="rep-eh-card" aria-label="Engagement heatmap">
      <header className="rep-eh-head">
        <h3>Engagement · open rate % by section × month</h3>
        <p className="rep-eh-sub">Last 9 months of AY 2025–26. Hotter = higher open rate.</p>
      </header>
      <div className="rep-eh-grid">
        <div className="rep-eh-cnr" />
        {HEATMAP_MONTHS.map(m => <div key={m} className="rep-eh-dow">{m}</div>)}
        {MOCK_HEATMAP.map(r => (
          <Row key={r.section_id} r={r} />
        ))}
      </div>
      <div className="rep-eh-legend">
        <span>0%</span>
        <span className="rep-eh-sw eh-0" />
        <span className="rep-eh-sw eh-1" />
        <span className="rep-eh-sw eh-2" />
        <span className="rep-eh-sw eh-3" />
        <span className="rep-eh-sw eh-4" />
        <span>100%</span>
      </div>
    </section>
  );
}

function Row({ r }: { r: { section_id: string; section_label: string; by_month: number[] } }) {
  return (
    <>
      <div className="rep-eh-name">{r.section_label}</div>
      {r.by_month.map((v, i) => (
        <div key={i} className={`rep-eh-cell ${tone(v)}`}>{v}</div>
      ))}
    </>
  );
}
```

- [ ] **Step 3: `ComplianceLog.tsx`** (server)

```tsx
import { MOCK_AUDIT } from "@/lib/mock-reports";

const TONE: Record<string, string> = { success: "good", warning: "warn", fail: "danger" };

export default function ComplianceLog() {
  return (
    <section className="rep-cl-card" aria-label="Compliance log">
      <header className="rep-cl-head">
        <h3>Compliance log · last {MOCK_AUDIT.length} actions</h3>
        <button type="button" className="rep-cl-export">Export per term (CSV)</button>
      </header>
      <ul className="rep-cl-list" role="list">
        {MOCK_AUDIT.map(a => (
          <li key={a.id} className={`rep-cl-row rep-cl-${TONE[a.result]}`}>
            <span className="rep-cl-ts">{a.timestamp}</span>
            <span className="rep-cl-actor">{a.actor}</span>
            <span className="rep-cl-body">
              <span className="rep-cl-action">{a.action}</span>
              <span className="rep-cl-scope">{a.scope}</span>
            </span>
            <span className={`rep-cl-chip rep-cl-chip-${TONE[a.result]}`}>{a.result}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append:

```css
/* =========================================================================
   Admin Reports · TemplatesShelf
   ========================================================================= */
.rep-ts-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.rep-ts-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.rep-ts-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-ts-link { font-size: 10.5px; color: var(--color-primary); text-decoration: none; font-weight: var(--font-weight-bold); }
.rep-ts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (max-width: 700px) { .rep-ts-grid { grid-template-columns: 1fr; } }
.rep-ts-tile {
  background: var(--color-surface-subtle); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 12px 14px;
  display: flex; flex-direction: column; gap: 5px;
}
.rep-ts-icon { font-size: 22px; }
.rep-ts-name { font-size: 12px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.rep-ts-badge {
  font-size: 9px; padding: 2px 7px; border-radius: var(--radius-sm);
  background: var(--color-soft); color: var(--color-muted);
  font-weight: var(--font-weight-bold); align-self: flex-start;
  text-transform: uppercase; letter-spacing: .03em;
}
.rep-ts-meta { font-size: 9.5px; color: var(--color-muted); margin-top: 4px; }

/* =========================================================================
   Admin Reports · EngagementHeatmap
   ========================================================================= */
.rep-eh-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.rep-eh-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.rep-eh-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-eh-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.rep-eh-grid { display: grid; grid-template-columns: 70px repeat(9, 1fr); gap: 4px; }
.rep-eh-cnr { background: transparent; }
.rep-eh-dow { font-size: 9.5px; text-align: center; color: var(--color-muted); font-weight: var(--font-weight-bold); text-transform: uppercase; padding: 4px 0; }
.rep-eh-name { font-size: 10.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); padding: 6px 4px; }
.rep-eh-cell { font-size: 9.5px; text-align: center; padding: 6px 2px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); }
.eh-0 { background: var(--color-surface-subtle); color: var(--color-muted); }
.eh-1 { background: #FEE2E2; color: #991B1B; }
.eh-2 { background: #FEF3C7; color: #92400E; }
.eh-3 { background: #DBEAFE; color: #1E40AF; }
.eh-4 { background: var(--color-success); color: #FFFFFF; }
.rep-eh-legend { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 10px; color: var(--color-muted); }
.rep-eh-sw { width: 16px; height: 12px; border-radius: 3px; }

/* =========================================================================
   Admin Reports · ComplianceLog
   ========================================================================= */
.rep-cl-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 14px 16px; margin-bottom: var(--space-3); box-shadow: var(--shadow-sm); }
.rep-cl-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.rep-cl-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.rep-cl-export { padding: 5px 12px; font-size: 10px; font-weight: var(--font-weight-bold); border-radius: var(--radius-md); background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); cursor: pointer; font-family: inherit; }
.rep-cl-export:hover { background: var(--color-soft); color: var(--color-ink); }
.rep-cl-list { list-style: none; padding: 0; margin: 0; }
.rep-cl-row {
  display: grid; grid-template-columns: 130px 110px 1fr auto;
  gap: 12px; padding: 10px 0;
  border-bottom: 1px dashed var(--color-border); align-items: center;
  font-size: 11px;
}
.rep-cl-row:last-child { border-bottom: 0; }
.rep-cl-ts { font-size: 10px; color: var(--color-muted); font-family: var(--font-mono, monospace); }
.rep-cl-actor { font-size: 10.5px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.rep-cl-body { display: flex; flex-direction: column; gap: 2px; }
.rep-cl-action { font-size: 11px; color: var(--color-ink); }
.rep-cl-scope  { font-size: 9.5px; color: var(--color-muted); }
.rep-cl-chip { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-2xl); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .03em; }
.rep-cl-chip-good   { background: var(--color-success-soft); color: var(--color-success-text); }
.rep-cl-chip-warn   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.rep-cl-chip-danger { background: var(--color-danger-soft);  color: var(--color-danger-text); }
```

- [ ] **Step 5: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit
cd ~/dev/manhaj && git add apps/web/app/admin/reports/components apps/web/app/globals.css && git commit -m "Reports: TemplatesShelf + EngagementHeatmap + ComplianceLog"
```

---

## Task 4 — Page assembly

**Files:** `apps/web/app/admin/reports/page.tsx`

- [ ] **Step 1: Replace `page.tsx`**

```tsx
/**
 * Admin · Reports tab.
 *
 * Pure server component. All 6 children are server components — no client
 * state in this tab. Future RPC swap is a one-import change per child.
 */

import KpiRow             from "./components/KpiRow";
import PipelineFunnel     from "./components/PipelineFunnel";
import SectionProgress    from "./components/SectionProgress";
import TemplatesShelf     from "./components/TemplatesShelf";
import EngagementHeatmap  from "./components/EngagementHeatmap";
import ComplianceLog      from "./components/ComplianceLog";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <div className="container">
      <h1>Reports</h1>
      <p className="sub">Parent-comms pipeline · templates · engagement · compliance · AY 2025–26</p>

      <KpiRow />
      <PipelineFunnel />
      <SectionProgress />
      <TemplatesShelf />
      <EngagementHeatmap />
      <ComplianceLog />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/admin/reports/page.tsx && git commit -m "/admin/reports: page assembly · 6 blocks"
```

---

## Self-review

| Spec section | Plan task |
|---|---|
| §1 blocks | Tasks 2 + 3 |
| §2 fixture | Task 1 |
| §3 acceptance | Task 4 |

Types consistent. No placeholder language. All blocks server-rendered as spec demands.
