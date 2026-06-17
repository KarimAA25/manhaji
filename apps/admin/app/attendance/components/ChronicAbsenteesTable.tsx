"use client";

import { useMemo, useState } from "react";
import type { ChronicRow } from "@manhaj/lib/mock-attendance";

type Sort = "missed" | "section" | "cause";

const STATUS_CHIP: Record<ChronicRow["status"], "bad" | "warn" | "info" | "neutral"> = {
  support: "bad", watch: "warn", excused: "info", contact: "warn",
};

const STATUS_LABEL: Record<ChronicRow["status"], string> = {
  support: "support", watch: "watch", excused: "excused", contact: "contact",
};

export default function ChronicAbsenteesTable({ rows }: { rows: ChronicRow[] }) {
  const [sort, setSort] = useState<Sort>("missed");
  const sorted = useMemo(() => {
    const c = [...rows];
    switch (sort) {
      case "missed":  c.sort((a, b) => b.days_missed - a.days_missed); break;
      case "section": c.sort((a, b) => a.section_code.localeCompare(b.section_code)); break;
      case "cause":   c.sort((a, b) => a.cause.localeCompare(b.cause)); break;
    }
    return c;
  }, [rows, sort]);
  const maxMiss = Math.max(...rows.map(r => r.days_missed), 1);

  return (
    <section className="chronic-card att-block-cohort-only" aria-label="Chronic absentees · this term">
      <header className="chronic-head">
        <div>
          <h3>Chronic absentees · this term</h3>
          <p className="chronic-sub">Students with &gt; 5 days missed. Sort by missed-days, section, or cause.</p>
        </div>
        <div className="chronic-toggle" role="tablist">
          {([["missed","By missed"],["section","By section"],["cause","By cause"]] as Array<[Sort,string]>).map(([k,l]) => (
            <button key={k} type="button" role="tab" aria-selected={sort===k} onClick={() => setSort(k)}
              className={`chronic-pill ${sort===k ? "active" : ""}`}>{l}</button>
          ))}
        </div>
      </header>
      <div className="chronic-tbl-wrap">
        <table className="chronic-tbl">
          <thead>
            <tr><th>Student</th><th>Section</th><th>Missed</th><th>Pattern</th><th>Cause (AI)</th><th>Status</th></tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.student_id}>
                <td className="chronic-nm">{r.student_name}</td>
                <td>{r.section_code}</td>
                <td>
                  <span className="chronic-miss-bar"><span className="chronic-miss-fill" style={{ width: `${(r.days_missed / maxMiss) * 100}%` }} /></span>
                  {" "}{r.days_missed}d
                </td>
                <td>{r.pattern}</td>
                <td>{r.cause}</td>
                <td>
                  <span className={`chip-pill chip-${STATUS_CHIP[r.status]}`} style={{ cursor: "default" }}>{STATUS_LABEL[r.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
