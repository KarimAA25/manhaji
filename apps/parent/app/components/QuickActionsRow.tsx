"use client";

import { useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import { useParentDash } from "../ParentDashboardClient";

export default function QuickActionsRow() {
  const { activeId } = useActiveChild();
  const dash = useParentDash();
  if (activeId !== ALL_CHILDREN_ID) return null;

  const outstanding = dash?.outstanding_total ?? 0;
  const totalLabel  = outstanding > 0 ? `OMR ${outstanding.toLocaleString()}` : "OMR 0";

  return (
    <>
      <div className="dash-divider qa-divider" aria-hidden="true">Quick actions across the household</div>
      <div className="qa-row">
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Pay household balance · {totalLabel}</div>
          <div className="qa-card-sub">{outstanding > 0 ? `${outstanding.toLocaleString()} outstanding` : "No outstanding balance"}</div>
          <button className="qa-btn primary">One-tap pay all</button>
        </div>
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Book a parent meeting</div>
          <div className="qa-card-sub">Request a slot with your child&apos;s teacher</div>
          <button className="qa-btn primary">Pick a slot</button>
        </div>
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Sync calendars</div>
          <div className="qa-card-sub">Apple / Google · one ICS feed per household</div>
          <button className="qa-btn ghost">Set up sync</button>
        </div>
      </div>
    </>
  );
}
