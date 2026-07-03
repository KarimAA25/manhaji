"use client";

import { MOCK_DEPARTMENTS } from "@manhaj/lib/mock-faculty";
import type { TeacherWithLoad } from "@manhaj/lib/queries/teachers";

type DeptRow = {
  id: string;
  label: string;
  head: string;
  teacher_count: number;
  avg_load: number;
  over_capacity_count: number;
  with_slack_count: number;
};

function computeFromTeachers(teachers: TeacherWithLoad[]): DeptRow[] {
  const map = new Map<string, TeacherWithLoad[]>();
  for (const t of teachers) {
    const key = t.primary_dept ?? "Other";
    const arr = map.get(key) ?? [];
    arr.push(t);
    map.set(key, arr);
  }
  return Array.from(map.entries()).map(([dept, list]) => {
    const cap = 28;
    const overCount  = list.filter(t => (t.weekly_period_assigned ?? 0) > (t.weekly_period_cap ?? cap)).length;
    const slackCount = list.filter(t => (t.weekly_period_assigned ?? 0) < (t.weekly_period_cap ?? cap) * 0.7).length;
    const avgLoad    = list.length > 0
      ? Math.round(list.reduce((s, t) => s + (t.weekly_period_assigned ?? 0), 0) / list.length)
      : 0;
    return {
      id: dept,
      label: dept,
      head: "—",
      teacher_count: list.length,
      avg_load: avgLoad,
      over_capacity_count: overCount,
      with_slack_count: slackCount,
    };
  }).sort((a, b) => b.teacher_count - a.teacher_count);
}

export default function DepartmentBreakdown({ teachers }: { teachers?: TeacherWithLoad[] }) {
  const rows: DeptRow[] = teachers && teachers.length > 0
    ? computeFromTeachers(teachers)
    : MOCK_DEPARTMENTS;

  const maxLoad = Math.max(...rows.map(d => d.avg_load), 1);

  return (
    <section className="fac-dept-card" aria-label="Department breakdown">
      <header className="fac-section-head">
        <h3>Department breakdown · {rows.length} departments</h3>
        <p className="fac-section-sub">Teacher count · avg load · capacity status per department.</p>
      </header>
      <div className="fac-dept-list">
        {rows.map(dept => (
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
