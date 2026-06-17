"use client";

/**
 * Sortable risk-scored roster table for the Admin Students tab.
 *
 * Default sort: by risk descending. The header toggle switches between
 * By risk / By rubric / By attendance / A-Z. Synthetic admission-pending
 * rows are excluded — they show up in <AdmissionsInbox /> instead.
 */

import { useMemo, useState } from "react";
import type { StudentRow } from "@manhaj/lib/mock-students";

type SortMode = "risk" | "rubric" | "absence" | "az";

const STATUS_TONE: Record<StudentRow["status"], "good" | "warn" | "bad" | "info" | "neutral"> = {
  honor: "good",
  good:  "neutral",
  watch: "warn",
  support: "bad",
  "renewal-pending": "warn",
  "admission-pending": "info",
};

function riskFillClass(score: number): string {
  if (score >= 60) return "rb-high";
  if (score >= 35) return "rb-med";
  return "rb-low";
}

export default function RiskRoster({ students, emptyMessage }: { students: StudentRow[]; emptyMessage?: string }) {
  const [sort, setSort] = useState<SortMode>("risk");

  const rows = useMemo(() => {
    const enrolled = students.filter(s => s.status !== "admission-pending");
    const copy = [...enrolled];
    switch (sort) {
      case "risk":    copy.sort((a, b) => b.risk_score - a.risk_score); break;
      case "rubric":  copy.sort((a, b) => b.rubric_avg - a.rubric_avg); break;
      case "absence": copy.sort((a, b) => a.attendance - b.attendance); break;
      case "az":      copy.sort((a, b) => a.full_name.localeCompare(b.full_name)); break;
    }
    return copy;
  }, [students, sort]);

  return (
    <section className="rr-card" aria-label="Roster · risk-scored">
      <header className="rr-head">
        <div>
          <h3>Roster · risk-scored</h3>
          <p className="rr-sub">Risk = composite of rubric trend + attendance + behaviour + fee status.</p>
        </div>
        <div className="rr-toggle" role="tablist" aria-label="Sort by">
          {([
            ["risk",    "By risk"],
            ["rubric",  "By rubric"],
            ["absence", "By absence"],
            ["az",      "A–Z"],
          ] as Array<[SortMode, string]>).map(([k, label]) => (
            <button
              key={k} type="button" role="tab"
              aria-selected={sort === k}
              onClick={() => setSort(k)}
              className={`rr-toggle-pill ${sort === k ? "active" : ""}`}
            >{label}</button>
          ))}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="ssf-empty">{emptyMessage ?? "No students match the current filter."}</p>
      ) : (
        <div className="rr-tbl-wrap">
          <table className="rr-tbl">
            <thead>
              <tr>
                <th>Student</th><th>Section</th><th>Rubric</th><th>Attendance</th><th>Risk</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}>
                  <td className="rr-nm">{s.full_name}</td>
                  <td>{s.section_code}</td>
                  <td>{s.rubric_avg.toFixed(1)}</td>
                  <td>{s.attendance}%</td>
                  <td>
                    <span className="rr-risk-wrap" aria-label={`risk ${s.risk_score}`}>
                      <span className="rr-risk-bar"><span className={`rr-risk-fill ${riskFillClass(s.risk_score)}`} style={{ width: `${Math.min(100, s.risk_score)}%` }} /></span>
                      {s.risk_score}
                    </span>
                  </td>
                  <td>
                    <span className={`chip-pill chip-${STATUS_TONE[s.status]}`} style={{ cursor: "default" }}>
                      {s.status === "renewal-pending" ? "renew?" : s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
