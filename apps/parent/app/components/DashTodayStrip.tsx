"use client";

/**
 * Phase 2.11 — Parent dashboard "Today snapshot" strip.
 *
 * 3 columns: Layla right now / Next exam / Action needed.
 * When household view is active, the "right now" column shows a summary
 * for all children rather than a single child's class.
 */

import { getActiveChild, useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";

export default function DashTodayStrip() {
  const { activeId } = useActiveChild();
  const child = getActiveChild(activeId);
  const isHousehold = activeId === ALL_CHILDREN_ID;
  const name = child?.full_name.split(" ")[0] ?? "Household";

  return (
    <div className="today-strip cols-3" aria-label="Today snapshot">
      {/* Col 1 — current lesson / household summary */}
      <div>
        <div className="today-strip-col-label">
          {isHousehold ? "Household right now" : `${name} right now`}
        </div>
        {isHousehold ? (
          <div className="today-strip-col-body">
            3 children in school
            <small>Layla: P3 Maths · Omar: P2 Science · Yasmin: Art</small>
          </div>
        ) : (
          <div className="today-strip-col-body">
            P3 · Mathematics
            <small>R201 · Mr Faisal · 10:00 – 10:50</small>
          </div>
        )}
      </div>

      {/* Col 2 — next exam */}
      <div className="today-strip-divider">
        <div className="today-strip-col-label">Next exam</div>
        <div className="today-strip-col-body">
          Chemistry mid-term · 12d
          <small>P3 on 12 May · 50-question paper</small>
        </div>
      </div>

      {/* Col 3 — action needed */}
      <div className="today-strip-divider">
        <div className="today-strip-col-label">Action needed</div>
        <div className="today-strip-col-body warn">
          Term 2 invoice due 25 May
          <small>OMR 1,250 · partial paid OMR 500</small>
        </div>
      </div>
    </div>
  );
}
