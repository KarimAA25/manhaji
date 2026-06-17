"use client";

import { useState } from "react";
import type { RollCallRow, RollCallStatus } from "@manhaj/lib/mock-attendance";

export default function TakeAttendanceUI({ rows, sectionCode }: { rows: RollCallRow[]; sectionCode: string }) {
  const initial: Record<string, RollCallStatus | undefined> = {};
  for (const r of rows) {
    if (r.preset_flag === "medical" || r.preset_flag === "religious" || r.preset_flag === "transport") {
      initial[r.student_id] = "A";
    }
  }
  const [state, setState] = useState<Record<string, RollCallStatus | undefined>>(initial);

  function set(id: string, status: RollCallStatus) {
    setState(prev => ({ ...prev, [id]: prev[id] === status ? undefined : status }));
  }

  return (
    <section className="roll-card att-block-teacher-only" aria-label={`Take attendance · ${sectionCode} today`}>
      <header className="roll-head">
        <h3>Take attendance · {sectionCode} · P3 today</h3>
        <p className="roll-sub">Click P / L / A. Auto-fills from system flags (known medical, religious, etc.). One tap per student.</p>
      </header>
      <div className="roll-list">
        {rows.map(r => {
          const active = state[r.student_id];
          return (
            <div key={r.student_id} className="roll-row">
              <span className="roll-nm">{r.student_name}</span>
              {(["P","L","A"] as RollCallStatus[]).map(opt => (
                <button
                  key={opt} type="button"
                  className={`roll-btn roll-${opt.toLowerCase()} ${active === opt ? "active" : ""}`}
                  aria-pressed={active === opt}
                  onClick={() => set(r.student_id, opt)}
                >{opt}</button>
              ))}
              {r.preset_flag && (
                <span className="roll-preset">{r.preset_flag} · {r.preset_date}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="roll-foot"><b>Manhaj:</b> Pre-flagged absences are auto-filled from yesterday&apos;s medical / religious notes. Parents already informed.</p>
    </section>
  );
}
