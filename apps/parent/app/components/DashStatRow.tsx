"use client";

/**
 * Phase 2.11 — Parent dashboard 4-card KPI row.
 *
 * Cards: Rubric this month / Attendance / Outstanding balance / School messages.
 * When household view is active, shows aggregated household stats.
 */

import { getActiveChild, useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";

export default function DashStatRow() {
  const { activeId } = useActiveChild();
  const isHousehold = activeId === ALL_CHILDREN_ID;

  if (isHousehold) {
    return (
      <div className="dash-stat-row" aria-label="Household KPIs">
        <div className="dash-stat-card">
          <div className="dash-stat-l">Avg rubric · all children</div>
          <div className="dash-stat-v good">3.8</div>
          <div className="dash-stat-d">across Layla, Omar, Yasmin</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Attendance · household</div>
          <div className="dash-stat-v good">96%</div>
          <div className="dash-stat-d">2 absences this month</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Outstanding balance</div>
          <div className="dash-stat-v warn">OMR 750</div>
          <div className="dash-stat-d">due 25 May</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">School messages</div>
          <div className="dash-stat-v bad">4</div>
          <div className="dash-stat-d">unread across children</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-stat-row" aria-label="Dashboard KPIs">
      <div className="dash-stat-card">
        <div className="dash-stat-l">Rubric this month</div>
        <div className="dash-stat-v good">4.1</div>
        <div className="dash-stat-d">▲ +0.22 vs last month</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">Attendance</div>
        <div className="dash-stat-v good">97%</div>
        <div className="dash-stat-d">1 medical absence</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">Outstanding balance</div>
        <div className="dash-stat-v warn">OMR 750</div>
        <div className="dash-stat-d">due 25 May</div>
      </div>
      <div className="dash-stat-card">
        <div className="dash-stat-l">School messages</div>
        <div className="dash-stat-v bad">2</div>
        <div className="dash-stat-d">unread</div>
      </div>
    </div>
  );
}
