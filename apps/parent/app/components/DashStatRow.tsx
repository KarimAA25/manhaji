"use client";

import { getActiveChild, useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import { useParentDash } from "../ParentDashboardClient";

export default function DashStatRow() {
  const { activeId, children } = useActiveChild();
  const dash = useParentDash();
  const isHousehold = activeId === ALL_CHILDREN_ID;

  // Invoice balance — always parent-level
  const outstandingFmt = dash
    ? `OMR ${dash.outstanding_total.toLocaleString()}`
    : "OMR 750";
  const balanceDue = dash?.next_due_label ?? "due 25 May";

  if (isHousehold) {
    // Household aggregate: average rubric + attendance across all children
    const childStats = dash ? Object.values(dash.by_child) : [];
    const avgRubric = childStats.length > 0
      ? (childStats.reduce((s, c) => s + c.rubric_avg, 0) / childStats.length).toFixed(1)
      : "3.8";
    const avgAtt = childStats.length > 0
      ? Math.round(childStats.reduce((s, c) => s + c.att_pct, 0) / childStats.length)
      : 96;
    const totalAbsences = childStats.reduce((s, c) => s + c.att_absences, 0);

    return (
      <div className="dash-stat-row" aria-label="Household KPIs">
        <div className="dash-stat-card">
          <div className="dash-stat-l">Avg rubric · all children</div>
          <div className="dash-stat-v good">{avgRubric}</div>
          <div className="dash-stat-d">across {children.length} children</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Attendance · household</div>
          <div className="dash-stat-v good">{avgAtt}%</div>
          <div className="dash-stat-d">{totalAbsences > 0 ? `${totalAbsences} absences this month` : "no absences"}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Outstanding balance</div>
          <div className={`dash-stat-v${dash && dash.outstanding_total > 0 ? " warn" : ""}`}>{outstandingFmt}</div>
          <div className="dash-stat-d">{balanceDue}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">School messages</div>
          <div className={`dash-stat-v${(dash?.unread_count ?? 0) > 0 ? " bad" : ""}`}>{dash?.unread_count ?? 0}</div>
          <div className="dash-stat-d">unread across children</div>
        </div>
      </div>
    );
  }

  // Single-child view
  const child = getActiveChild(activeId, children);
  const stat = child && dash ? dash.by_child[child.id] : null;
  const rubric   = stat?.rubric_avg   ? stat.rubric_avg.toFixed(1)   : "4.1";
  const attPct   = stat?.att_pct      ? `${stat.att_pct}%`           : "97%";
  const absences = stat?.att_absences ?? 1;

  return (
    <div className="dash-stat-row" aria-label="Dashboard KPIs">
      <div className="dash-stat-card">
        <div className="dash-stat-l">Rubric this month</div>
        <div className="dash-stat-v good">{rubric}</div>
        <div className="dash-stat-d">latest month average</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">Attendance</div>
        <div className="dash-stat-v good">{attPct}</div>
        <div className="dash-stat-d">{absences === 0 ? "no absences" : `${absences} absence${absences === 1 ? "" : "s"}`}</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">Outstanding balance</div>
        <div className={`dash-stat-v${dash && dash.outstanding_total > 0 ? " warn" : ""}`}>{outstandingFmt}</div>
        <div className="dash-stat-d">{balanceDue}</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">School messages</div>
        <div className={`dash-stat-v${(dash?.unread_count ?? 0) > 0 ? " bad" : ""}`}>{dash?.unread_count ?? 0}</div>
        <div className="dash-stat-d">unread</div>
      </div>
    </div>
  );
}
