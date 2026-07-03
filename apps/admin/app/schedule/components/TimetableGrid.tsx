"use client";

import { useMemo, useState } from "react";
import { MOCK_SLOTS, SECTIONS, DAYS, PERIODS, slotsForSection, type Slot } from "@manhaj/lib/mock-schedule";
import type { GridSlot, SectionOption } from "../SchedulePageClient";

type Props = {
  slots?: GridSlot[];
  sectionList?: SectionOption[];
};

export default function TimetableGrid({ slots, sectionList }: Props) {
  const useReal     = !!slots && slots.length > 0;
  const sections    = useReal ? (sectionList ?? []) : SECTIONS.map(s => ({ id: s.id, label: s.label }));
  const firstId     = sections[0]?.id ?? "10A";
  const [sectionId, setSectionId] = useState(firstId);

  const grid = useMemo(() => {
    const map: Record<string, GridSlot | Slot | undefined> = {};
    if (useReal) {
      for (const s of slots!.filter(s => s.section_id === sectionId)) {
        map[`${s.day}-${s.period}`] = s;
      }
    } else {
      for (const s of slotsForSection(MOCK_SLOTS, sectionId)) {
        map[`${s.day}-${s.period}`] = s;
      }
    }
    return map;
  }, [sectionId, slots, useReal]);

  // Derive days + periods from DB data when available
  const days    = useReal
    ? [...new Set(slots!.map(s => s.day))].filter(Boolean)
    : DAYS;
  const periods = useReal
    ? [...new Set(slots!.map(s => s.period))].filter(Boolean).sort()
    : PERIODS;

  return (
    <section className="sch-tt-card" aria-label="Section timetable">
      <header className="sch-tt-head">
        <h3>Timetable</h3>
        <label className="sch-tt-picker">
          <span className="sr-only">Section</span>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)}>
            {sections.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </header>
      <div className="sch-tt-grid">
        <div className="sch-tt-cnr" />
        {days.map(d => <div key={d} className="sch-tt-dow">{d}</div>)}
        {periods.map(p => (
          <PeriodRow key={p} period={p} days={days} grid={grid} />
        ))}
      </div>
    </section>
  );
}

function PeriodRow({ period, days, grid }: { period: string; days: string[]; grid: Record<string, GridSlot | Slot | undefined> }) {
  return (
    <>
      <div className="sch-tt-period">{period}</div>
      {days.map(d => {
        const s = grid[`${d}-${period}`];
        if (!s) return <div key={d} className="sch-tt-cell sch-tt-empty" />;

        // Mock slot with state
        if ("state" in s) {
          if (s.state === "break") return <div key={d} className="sch-tt-cell sch-tt-break"><span>Break</span></div>;
          if (s.state === "gap") return (
            <div key={d} className="sch-tt-cell sch-tt-gap">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">UNFILLED</div>
              <div className="sch-tt-meta">{s.subject ?? "—"}</div>
            </div>
          );
          if (s.state === "conflict") return (
            <div key={d} className="sch-tt-cell sch-tt-conflict">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">{s.subject}</div>
              <div className="sch-tt-meta">{s.teacher} · {s.room}</div>
            </div>
          );
        }

        // DB slot (or normal mock)
        const subject = s.subject ?? "—";
        const teacher = s.teacher ?? "—";
        const room    = "room" in s ? s.room : null;
        const isUnfilled = !s.teacher;

        return (
          <div key={d} className={`sch-tt-cell ${isUnfilled ? "sch-tt-gap" : "sch-tt-normal"}`}>
            <div className="sch-tt-sub">{subject}</div>
            <div className="sch-tt-meta">{teacher}{room ? ` · ${room}` : ""}</div>
          </div>
        );
      })}
    </>
  );
}
