"use client";

/**
 * Admin · Reports tab.
 *
 * Phase 2.15: added BreadcrumbLensBar + FilterChipRow + AiBriefingHeader
 * (all present in reports-deep.html mockup, previously missing here).
 * KPI row now shows the 4-card format from the mockup:
 *   Drafts in pipeline / Awaiting review / Last batch opened / Bounces
 */

import { useState } from "react";

import {
  MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT, reportKpis,
} from "@manhaj/lib/mock-reports";
import { reportsAdminSummary } from "@manhaj/lib/summary";

import { AiBriefingHeader } from "@manhaj/ui";
import { BreadcrumbLensBar, type Lens } from "@manhaj/ui";
import { FilterChipRow, type Chip } from "@manhaj/ui";

import KpiRow               from "./components/KpiRow";
import PipelineFunnel       from "./components/PipelineFunnel";
import SectionProgress      from "./components/SectionProgress";
import ScheduleNextBatch    from "./components/ScheduleNextBatch";
import TemplatesShelf       from "./components/TemplatesShelf";
import EngagementHeatmap    from "./components/EngagementHeatmap";
import SendHistory          from "./components/SendHistory";
import DeliveryDiagnostics  from "./components/DeliveryDiagnostics";
import AbTestResults        from "./components/AbTestResults";
import DraftReview          from "./components/DraftReview";
import ComplianceLog        from "./components/ComplianceLog";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  const kpis    = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  const summary = reportsAdminSummary(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);

  const [lens, setLens]   = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const reviewCount = MOCK_PIPELINE.find(p => p.stage === "review")?.count ?? 0;
  const totalCount  = MOCK_PIPELINE.find(p => p.stage === "draft")?.count ?? 0;

  const chips: Chip[] = [
    { key: "all",        label: "All templates",               tone: "neutral", active: active === "all" },
    { key: "monthly",    label: `Monthly · ${totalCount}`,     tone: "info",    active: active === "monthly" },
    { key: "term",       label: "Term reports",                tone: "neutral", active: active === "term" },
    { key: "behaviour",  label: "Behavioural alerts",          tone: "neutral", active: active === "behaviour" },
    { key: "attendance", label: "Attendance follow-up",        tone: "neutral", active: active === "attendance" },
    { key: "fee",        label: "Fee reminders",               tone: "neutral", active: active === "fee" },
    { key: "achievement",label: "Achievement spotlights",      tone: "neutral", active: active === "achievement" },
    { key: "review",     label: `Awaiting review · ${reviewCount}`, tone: "warn", active: active === "review" },
    { key: "bounce",     label: `Bounce queue · ${kpis.bounced}`,   tone: "bad",  active: active === "bounce" },
  ];

  return (
    <div className="container">
      <BreadcrumbLensBar
        steps={[
          { label: "All reports" },
          { label: "Monthly · April 2026", active: true },
        ]}
        lens={lens}
        onLensChange={setLens}
      />

      <h1>Reports</h1>
      <p className="sub">Parent-comms pipeline · templates · engagement · compliance · AY 2025–26</p>

      <AiBriefingHeader summary={summary} />

      {/* 4-card KPI row matching the mockup */}
      <div className="rpt-kpi-row">
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-l">Drafts in pipeline</div>
          <div className="rpt-kpi-v">{totalCount}</div>
          <div className="rpt-kpi-d">monthly · April 2026</div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-l">Awaiting review</div>
          <div className={`rpt-kpi-v${reviewCount > 0 ? " rpt-kpi-warn" : ""}`}>{reviewCount}</div>
          <div className="rpt-kpi-d">across 4 sections</div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-l">Last batch · opened</div>
          <div className="rpt-kpi-v rpt-kpi-good">{kpis.open_rate}%</div>
          <div className="rpt-kpi-d">▲ +4 vs March</div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-l">Bounces · last batch</div>
          <div className={`rpt-kpi-v${kpis.bounced > 0 ? " rpt-kpi-bad" : ""}`}>{kpis.bounced}</div>
          <div className="rpt-kpi-d">3 resolved · 1 open</div>
        </div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      <KpiRow />
      <PipelineFunnel />
      <SectionProgress />
      <ScheduleNextBatch />
      <TemplatesShelf />
      <EngagementHeatmap />
      <SendHistory />
      <DeliveryDiagnostics />
      <AbTestResults />
      <DraftReview />
      <ComplianceLog />
    </div>
  );
}
