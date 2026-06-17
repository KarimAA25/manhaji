"use client";

import { MOCK_DEPARTMENTS } from "@manhaj/lib/mock-faculty";

export default function DepartmentBreakdown() {
  const maxLoad = Math.max(...MOCK_DEPARTMENTS.map(d => d.avg_load));
  return (
    <section className="fac-dept-card" aria-label="Department breakdown">
      <header className="fac-section-head">
        <h3>Department breakdown · 9 departments</h3>
        <p className="fac-section-sub">Teacher count · avg load · capacity status per department.</p>
      </header>
      <div className="fac-dept-list">
        {MOCK_DEPARTMENTS.map(dept => (
          <div key={dept.id} className="fac-dept-row">
            <div className="fac-dept-name">
              <span className="fac-dept-label">{dept.label}</span>
              <span className="fac-dept-head">{dept.head}</span>
            </div>
            <div className="fac-dept-count">
              <span className="fac-dept-n">{dept.teacher_count}</span>
              <span className="fac-dept-n-label">teachers</span>
            </div>
            <div className="fac-dept-bar-wrap">
              <div
                className="fac-dept-bar"
                style={{ width: `${Math.round((dept.avg_load / maxLoad) * 100)}%` }}
                title={`Avg load: ${dept.avg_load} periods/wk`}
              />
              <span className="fac-dept-bar-val">{dept.avg_load} p/wk</span>
            </div>
            <div className="fac-dept-pills">
              {dept.over_capacity_count > 0 && (
                <span className="fac-pill over">{dept.over_capacity_count} over</span>
              )}
              {dept.with_slack_count > 0 && (
                <span className="fac-pill slack">{dept.with_slack_count} slack</span>
              )}
              {dept.over_capacity_count === 0 && (
                <span className="fac-pill ok">balanced</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
