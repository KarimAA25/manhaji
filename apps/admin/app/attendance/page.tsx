"use client";

import { useState } from "react";

import {
  ATT_DAILY, ATT_EVENTS, ATT_DOW, ATT_PERIODS, ATT_CAUSES, ATT_SECTIONS,
  ATT_SUBJECTS, ATT_CHRONIC, ATT_BENCHMARK, ATT_CAL_OMAR, ATT_LESSONS,
  ATT_DRAFT_OMAR, ATT_ROLL_10A, ATT_KPIS,
} from "@manhaj/lib/mock-attendance";
import { attendanceCohortSummary } from "@manhaj/lib/summary";

import { AiBriefingHeader } from "@manhaj/ui";
import { BreadcrumbLensBar, type Lens } from "@manhaj/ui";
import { FilterChipRow, type Chip } from "@manhaj/ui";
import { TrendChart } from "@manhaj/ui";

import DayOfWeekHeatmap        from "./components/DayOfWeekHeatmap";
import PeriodBars              from "./components/PeriodBars";
import AiCausesCards           from "./components/AiCausesCards";
import SectionHeatStrip        from "./components/SectionHeatStrip";
import SubjectCorrelation      from "./components/SubjectCorrelation";
import ChronicAbsenteesTable   from "./components/ChronicAbsenteesTable";
import BenchmarkBars           from "./components/BenchmarkBars";
import PerStudentCalendarHeat  from "./components/PerStudentCalendarHeat";
import LessonsMissedList       from "./components/LessonsMissedList";
import ReEngagementDraft       from "./components/ReEngagementDraft";
import TakeAttendanceUI        from "./components/TakeAttendanceUI";

export default function AdminAttendancePage() {
  const summary = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
  const [lens, setLens] = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const chips: Chip[] = [
    { key: "today",     label: "Today",                              tone: "neutral", active: active === "today" },
    { key: "week",      label: "This week",                          tone: "neutral", active: active === "week"  },
    { key: "month",     label: "This month",                         tone: "neutral", active: active === "month" },
    { key: "chronic",   label: `Chronic · ${ATT_KPIS.chronic_count}`, tone: "warn",    active: active === "chronic" },
    { key: "late",      label: `Late · ${ATT_KPIS.late_today_count}`, tone: "warn",    active: active === "late" },
    { key: "unexcused", label: "Unexcused · 7",                      tone: "bad",     active: active === "unexcused" },
    { key: "medical",   label: "Medical · 12",                       tone: "info",    active: active === "medical" },
    { key: "religious", label: "Religious / cultural · 3",           tone: "neutral", active: active === "religious" },
    { key: "transport", label: "Transport · 2",                      tone: "neutral", active: active === "transport" },
  ];

  return (
    <div className={`container att-page lens-${lens}`}>
      <BreadcrumbLensBar
        steps={[{ label: "School" }, { label: "HS", active: true }]}
        lens={lens}
        onLensChange={setLens}
      />

      <AiBriefingHeader summary={summary} />

      <div className="att-kpi-row">
        <div className="att-kpi-card"><div className="att-kpi-l">This week</div><div className="att-kpi-v">{ATT_KPIS.this_week_pct.toFixed(1)}<span className="att-kpi-suffix">%</span></div><div className="att-kpi-d">— flat vs last</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Chronic absentees</div><div className="att-kpi-v att-kpi-bad">{ATT_KPIS.chronic_count}</div><div className="att-kpi-d">▲ +2 since April</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Late arrivals today</div><div className="att-kpi-v att-kpi-warn">{ATT_KPIS.late_today_count}</div><div className="att-kpi-d">across 8 sections</div></div>
        <div className="att-kpi-card"><div className="att-kpi-l">Sub coverage needed</div><div className="att-kpi-v att-kpi-warn">{ATT_KPIS.sub_coverage}</div><div className="att-kpi-d">today + tomorrow</div></div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      {/* Cohort lens blocks (Principal default) */}
      <div className="att-block-cohort-only">
        <TrendChart points={ATT_DAILY} markers={ATT_EVENTS} target={95} title="Attendance trend · last 30 school days" />
      </div>
      <DayOfWeekHeatmap rows={ATT_DOW} />
      <PeriodBars rows={ATT_PERIODS} />
      <AiCausesCards rows={ATT_CAUSES} />
      <SectionHeatStrip rows={ATT_SECTIONS} />
      <SubjectCorrelation rows={ATT_SUBJECTS} />
      <ChronicAbsenteesTable rows={ATT_CHRONIC} />
      <BenchmarkBars rows={ATT_BENCHMARK} />

      {/* Advisor lens — per-student drill */}
      <PerStudentCalendarHeat weeks={ATT_CAL_OMAR} studentName="Omar Saadi" sectionCode="11 AS" />
      <LessonsMissedList rows={ATT_LESSONS} studentName="Omar" />
      <ReEngagementDraft draft={ATT_DRAFT_OMAR} />

      {/* Teacher lens — roll call */}
      <TakeAttendanceUI rows={ATT_ROLL_10A} sectionCode="10A" />
    </div>
  );
}
