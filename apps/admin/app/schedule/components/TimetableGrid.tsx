"use client";

import { useMemo, useState } from "react";
import { MOCK_SLOTS, SECTIONS, DAYS, PERIODS, slotsForSection, type Slot } from "@manhaj/lib/mock-schedule";

export default function TimetableGrid() {
  const [sectionId, setSectionId] = useState("10A");
  const slots = useMemo(() => slotsForSection(MOCK_SLOTS, sectionId), [sectionId]);

  // Build [period][day] grid index for fast lookup
  const grid: Record<string, Slot | undefined> = {};
  for (const s of slots) grid[`${s.day}-${s.period}`] = s;

  return (
    <section className="sch-tt-card" aria-label="Section timetable">
      <header className="sch-tt-head">
        <h3>Timetable</h3>
        <label className="sch-tt-picker">
          <span className="sr-only">Section</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </header>
      <div className="sch-tt-grid">
        <div className="sch-tt-cnr" />
        {DAYS.map(d => <div key={d} className="sch-tt-dow">{d}</div>)}
        {PERIODS.map(p => (
          <FragmentRow key={p} period={p} grid={grid} />
        ))}
      </div>
    </section>
  );
}

function FragmentRow({ period, grid }: { period: string; grid: Record<string, Slot | undefined> }) {
  return (
    <>
      <div className="sch-tt-period">{period}</div>
      {DAYS.map(d => {
        const s = grid[`${d}-${period}`];
        if (!s) return <div key={d} className="sch-tt-cell sch-tt-empty" />;
        if (s.state === "break") {
          return <div key={d} className="sch-tt-cell sch-tt-break"><span>Break</span></div>;
        }
        if (s.state === "gap") {
          return (
            <div key={d} className="sch-tt-cell sch-tt-gap">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">UNFILLED</div>
              <div className="sch-tt-meta">{s.subject ?? "—"}</div>
            </div>
          );
        }
        if (s.state === "conflict") {
          return (
            <div key={d} className="sch-tt-cell sch-tt-conflict">
              <div className="sch-tt-tag">#{s.conflict_id}</div>
              <div className="sch-tt-sub">{s.subject}</div>
              <div className="sch-tt-meta">{s.teacher} · {s.room}</div>
            </div>
          );
        }
        return (
          <div key={d} className="sch-tt-cell sch-tt-normal">
            <div className="sch-tt-sub">{s.subject}</div>
            <div className="sch-tt-meta">{s.teacher} · {s.room}</div>
          </div>
        );
      })}
    </>
  );
}
