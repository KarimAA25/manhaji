"use client";

/**
 * Parent · household mode · Quick actions row.
 *
 * Phase 2.15 — matches the "Quick actions across the household" section from
 * parent-multi-child.html: 3 action cards (pay all · book meeting · sync cals).
 * Only shown in the ALL_CHILDREN_ID household view.
 */

import { useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";

export default function QuickActionsRow() {
  const { activeId } = useActiveChild();
  if (activeId !== ALL_CHILDREN_ID) return null;

  return (
    <>
      <div className="dash-divider qa-divider" aria-hidden="true">Quick actions across the household</div>
      <div className="qa-row">
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Pay household balance · OMR 1,820</div>
          <div className="qa-card-sub">Layla OMR 750 · Omar OMR 1,070</div>
          <button className="qa-btn primary">One-tap pay all</button>
        </div>
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Book Omar&apos;s parent meeting</div>
          <div className="qa-card-sub">Ms Swart · 18 May parent-teacher evening</div>
          <button className="qa-btn primary">Pick a slot</button>
        </div>
        <div className="qa-card">
          <div className="qa-card-lbl">Action</div>
          <div className="qa-card-title">Sync all 3 calendars</div>
          <div className="qa-card-sub">Apple / Google · one ICS feed per household</div>
          <button className="qa-btn ghost">Set up sync</button>
        </div>
      </div>
    </>
  );
}
