"use client";

/**
 * Admin · Faculty tab — Phase 3.1 deep-dive rebuild.
 *
 * Matches the maximalist pattern of /admin/students, /admin/reports, /admin/schedule.
 * Uses mock-faculty.ts fixture for all rich blocks; the live Supabase KPI overlay
 * (getDashboardData) is removed here for visual consistency — see Phase 4 for the
 * live RPC swap.
 *
 * Block order:
 *  1. BreadcrumbLensBar
 *  2. AiBriefingHeader (facultyAdminSummary)
 *  3. FilterChipRow (dept chips)
 *  4. 4-card KPI row
 *  5. DepartmentBreakdown
 *  6. FacultyRoster
 *  7. TeacherLoadHeatmap (re-used from /admin/schedule)
 *  8. ContractsDashboard
 *  9. OnboardingFunnel
 * 10. PerformanceComposite
 * 11. FacultyAskManhaj
 */

import { useState } from "react";

import {
  MOCK_TEACHERS,
  MOCK_DEPARTMENTS,
  MOCK_ONBOARDING_PIPELINE,
  facultyKpis,
} from "@manhaj/lib/mock-faculty";
import { facultyAdminSummary } from "@manhaj/lib/summary";

import { AiBriefingHeader } from "@manhaj/ui";
import { BreadcrumbLensBar, type Lens } from "@manhaj/ui";
import { FilterChipRow, type Chip } from "@manhaj/ui";

import DepartmentBreakdown  from "./components/DepartmentBreakdown";
import FacultyRoster        from "./components/FacultyRoster";
import ContractsDashboard   from "./components/ContractsDashboard";
import OnboardingFunnel     from "./components/OnboardingFunnel";
import PerformanceComposite from "./components/PerformanceComposite";
import FacultyAskManhaj     from "./components/FacultyAskManhaj";

// TeacherLoadHeatmap is re-used from /admin/schedule (reads MOCK_TEACHER_LOADS internally)
import TeacherLoadHeatmap   from "../schedule/components/TeacherLoadHeatmap";

export const dynamic = "force-dynamic";

export default function AdminFacultyPage() {
  const kpis    = facultyKpis(MOCK_TEACHERS);
  const summary = facultyAdminSummary(MOCK_TEACHERS, MOCK_DEPARTMENTS, MOCK_ONBOARDING_PIPELINE);

  const [lens, setLens]   = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const overCount   = MOCK_TEACHERS.filter(t => t.status === "over").length;
  const exp3Count   = MOCK_TEACHERS.filter(t => t.contract_status === "expiring-3m").length;

  const chips: Chip[] = [
    { key: "all",        label: "All departments",          tone: "neutral", active: active === "all" },
    { key: "math",       label: "Mathematics",              tone: "neutral", active: active === "math" },
    { key: "sciences",   label: "Sciences",                 tone: "neutral", active: active === "sciences" },
    { key: "languages",  label: "Languages",                tone: "neutral", active: active === "languages" },
    { key: "humanities", label: "Humanities",               tone: "neutral", active: active === "humanities" },
    { key: "arts",       label: "Arts",                     tone: "neutral", active: active === "arts" },
    { key: "pe",         label: "PE",                       tone: "neutral", active: active === "pe" },
    { key: "primary",    label: "Primary",                  tone: "neutral", active: active === "primary" },
    { key: "kg",         label: "KG",                       tone: "neutral", active: active === "kg" },
    { key: "over",       label: `Over capacity · ${overCount}`,    tone: "bad",     active: active === "over" },
    { key: "contracts",  label: `Contracts due · ${exp3Count}`,    tone: "warn",    active: active === "contracts" },
  ];

  return (
    <div className="container">
      <BreadcrumbLensBar
        steps={[
          { label: "School" },
          { label: "All staff", active: true },
        ]}
        lens={lens}
        onLensChange={setLens}
      />

      <h1>Faculty</h1>
      <p className="sub">
        Teacher load · contracts · hiring pipeline · dept performance · AY 2025–26
      </p>

      <AiBriefingHeader summary={summary} />

      {/* 4-card KPI row */}
      <div className="fac-kpi-row">
        <div className="fac-kpi-card">
          <div className="fac-kpi-l">Total teachers</div>
          <div className="fac-kpi-v">{kpis.total}</div>
          <div className="fac-kpi-d">across 9 departments</div>
        </div>
        <div className="fac-kpi-card">
          <div className="fac-kpi-l">Over capacity</div>
          <div className={`fac-kpi-v${kpis.over_capacity > 0 ? " fac-kpi-bad" : " fac-kpi-good"}`}>
            {kpis.over_capacity}
          </div>
          <div className="fac-kpi-d">
            {kpis.over_capacity > 0 ? "needs redistribution" : "all within cap"}
          </div>
        </div>
        <div className="fac-kpi-card">
          <div className="fac-kpi-l">Vacancies</div>
          <div className={`fac-kpi-v${kpis.vacancies > 0 ? " fac-kpi-warn" : ""}`}>
            {kpis.vacancies}
          </div>
          <div className="fac-kpi-d">open roles this cycle</div>
        </div>
        <div className="fac-kpi-card">
          <div className="fac-kpi-l">Avg load utilisation</div>
          <div className={`fac-kpi-v${kpis.avg_util >= 85 ? " fac-kpi-good" : kpis.avg_util < 70 ? " fac-kpi-warn" : ""}`}>
            {kpis.avg_util}%
          </div>
          <div className="fac-kpi-d">of 28-period cap</div>
        </div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      <DepartmentBreakdown />
      <FacultyRoster />
      <TeacherLoadHeatmap />
      <ContractsDashboard />
      <OnboardingFunnel />
      <PerformanceComposite />
      <FacultyAskManhaj />
    </div>
  );
}
