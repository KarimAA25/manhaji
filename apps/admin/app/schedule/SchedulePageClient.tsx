"use client";

import { useState } from "react";

import {
  MOCK_ACTIONS, MOCK_SLOTS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM,
  scheduleKpis,
} from "@manhaj/lib/mock-schedule";
import { scheduleAdminSummary } from "@manhaj/lib/summary";
import type { TeacherDayLoad, RoomUtilRow } from "@manhaj/lib/queries/timetable";

import { AiBriefingHeader } from "@manhaj/ui";
import { BreadcrumbLensBar, type Lens } from "@manhaj/ui";
import { FilterChipRow, type Chip } from "@manhaj/ui";

import TimetableGrid      from "./components/TimetableGrid";
import ActionQueue        from "./components/ActionQueue";
import TeacherLoadHeatmap from "./components/TeacherLoadHeatmap";
import RoomUtilization    from "./components/RoomUtilization";
import CurriculumCoverage from "./components/CurriculumCoverage";
import ChangeLog          from "./components/ChangeLog";
import TeacherMyWeek      from "./components/TeacherMyWeek";
import AskManhajCard      from "./components/AskManhajCard";

// Shape of a single raw slot from getSchoolTimetable
type RawSlot = {
  id: string;
  section_id: string;
  bell_periods: unknown;
  subjects: unknown;
  teachers: unknown;
  sections: unknown;
  rooms: unknown;
};

export type GridSlot = {
  id: string;
  section_id: string;
  day: string;
  period: string;
  subject: string | null;
  teacher: string | null;
  room: string | null;
};

export type SectionOption = { id: string; label: string };

function normDay(d: string): string {
  const map: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri",
    mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri",
  };
  return map[d.toLowerCase()] ?? d;
}

function mapSlots(raw: RawSlot[]): GridSlot[] {
  return raw.map(s => {
    const b   = s.bell_periods as { period_label: string; day_of_week: string } | null;
    const sub = s.subjects     as { name_en: string } | null;
    const tch = s.teachers     as { full_name: string } | null;
    const rm  = s.rooms        as { code: string } | null;
    return {
      id:         s.id,
      section_id: s.section_id,
      day:        normDay(b?.day_of_week ?? ""),
      period:     b?.period_label ?? "",
      subject:    sub?.name_en ?? null,
      teacher:    tch?.full_name ?? null,
      room:       rm?.code ?? null,
    };
  });
}

function deriveSections(raw: RawSlot[]): SectionOption[] {
  const seen = new Map<string, string>();
  for (const s of raw) {
    const sec = s.sections as { code: string; grade_level: string | null } | null;
    if (sec && !seen.has(s.section_id)) {
      seen.set(s.section_id, sec.code);
    }
  }
  return Array.from(seen.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

type Props = {
  schoolSlots: RawSlot[];
  loads: TeacherDayLoad[];
  rooms: RoomUtilRow[];
};

export default function SchedulePageClient({ schoolSlots, loads, rooms }: Props) {
  const hasReal = schoolSlots.length > 0;

  const gridSlots    = hasReal ? mapSlots(schoolSlots) : [];
  const sectionList  = hasReal ? deriveSections(schoolSlots) : [];

  // KPIs from real data when available
  const totalSlots   = hasReal ? gridSlots.length : 230;
  const unfilled     = hasReal ? gridSlots.filter(s => !s.teacher).length : MOCK_ACTIONS.filter(a => a.kind === "gap").length;
  const conflicts    = MOCK_ACTIONS.filter(a => a.kind === "conflict").length; // no conflict detection yet

  const summary = scheduleAdminSummary(MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);
  const kpis    = scheduleKpis(MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);

  const [lens, setLens]     = useState<Lens>("principal");
  const [active, setActive] = useState<string | null>(null);

  const chips: Chip[] = [
    { key: "week",      label: "This week",                 tone: "neutral", active: active === "week"      },
    { key: "next",      label: "Next week",                 tone: "neutral", active: active === "next"      },
    { key: "unfilled",  label: `Unfilled · ${unfilled}`,    tone: "warn",    active: active === "unfilled"  },
    { key: "conflicts", label: `Conflicts · ${conflicts}`,   tone: "bad",     active: active === "conflicts" },
    { key: "subs",      label: "Subs needed · 2",           tone: "warn",    active: active === "subs"      },
    { key: "nlchange",  label: "Pending NL changes · 1",    tone: "info",    active: active === "nlchange"  },
    { key: "lab",       label: "Lab schedule",              tone: "neutral", active: active === "lab"       },
    { key: "gaps",      label: "Curriculum gaps",           tone: "neutral", active: active === "gaps"      },
  ];

  return (
    <div className="container">
      <BreadcrumbLensBar
        steps={[{ label: "School" }, { label: "HS", active: true }]}
        lens={lens}
        onLensChange={setLens}
      />

      <h1>Schedule</h1>
      <p className="sub">Section + teacher + room view of the weekly bell schedule · AY 2025–26</p>

      <AiBriefingHeader summary={summary} />

      <div className="sch-kpi-row">
        <div className="sch-kpi-card">
          <div className="sch-kpi-l">Periods scheduled</div>
          <div className="sch-kpi-v">{totalSlots}</div>
          <div className="sch-kpi-d">across {sectionList.length || 41} sections</div>
        </div>
        <div className="sch-kpi-card">
          <div className="sch-kpi-l">Unfilled periods</div>
          <div className={`sch-kpi-v${unfilled > 0 ? " sch-kpi-warn" : ""}`}>{unfilled}</div>
          <div className="sch-kpi-d">{unfilled > 0 ? "no teacher assigned" : "all covered"}</div>
        </div>
        <div className="sch-kpi-card">
          <div className="sch-kpi-l">Subs needed</div>
          <div className="sch-kpi-v sch-kpi-warn">{kpis.gaps}</div>
          <div className="sch-kpi-d">today + tomorrow</div>
        </div>
        <div className="sch-kpi-card">
          <div className="sch-kpi-l">Conflicts</div>
          <div className={`sch-kpi-v${conflicts > 0 ? " sch-kpi-bad" : ""}`}>{conflicts}</div>
          <div className="sch-kpi-d">{conflicts > 0 ? "detected" : "none detected"}</div>
        </div>
      </div>

      <FilterChipRow chips={chips} onToggle={k => setActive(prev => prev === k ? null : k)} />

      <AskManhajCard />
      <TimetableGrid slots={gridSlots.length > 0 ? gridSlots : undefined} sectionList={sectionList.length > 0 ? sectionList : undefined} />
      <ActionQueue />
      <TeacherLoadHeatmap loads={loads.length > 0 ? loads : undefined} />
      <RoomUtilization rooms={rooms.length > 0 ? rooms : undefined} />
      <CurriculumCoverage />
      <ChangeLog />
      <TeacherMyWeek />
    </div>
  );
}
