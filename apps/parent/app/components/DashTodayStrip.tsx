"use client";

import { getActiveChild, useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import { useParentDash } from "../ParentDashboardClient";

export default function DashTodayStrip() {
  const { activeId, children } = useActiveChild();
  const dash = useParentDash();
  const isHousehold = activeId === ALL_CHILDREN_ID;
  const child = getActiveChild(activeId, children);

  // ── "Right now" column ──────────────────────────────────────────────────
  let rightNowBody: React.ReactNode;
  if (isHousehold) {
    const inSchool = children.filter(c => dash?.by_child[c.id]?.today_slot).length;
    rightNowBody = inSchool > 0
      ? <>{inSchool} of {children.length} children in class<small>
          {children
            .filter(c => dash?.by_child[c.id]?.today_slot)
            .map(c => {
              const slot = dash!.by_child[c.id].today_slot!;
              return `${c.full_name.split(" ")[0]}: ${slot.period} ${slot.subject}`;
            })
            .join(" · ")}
        </small></>
      : <>{children.length} children<small>no classes found for today</small></>;
  } else if (child && dash?.by_child[child.id]?.today_slot) {
    const slot = dash.by_child[child.id].today_slot!;
    rightNowBody = <>{slot.period} · {slot.subject}<small>{slot.room ? `${slot.room} · ` : ""}{slot.teacher ?? ""} · {slot.start}–{slot.end}</small></>;
  } else {
    rightNowBody = <>—<small>no class data for today</small></>;
  }

  // ── "Next exam" column ──────────────────────────────────────────────────
  let nextExamBody: React.ReactNode;
  if (!isHousehold && child && dash?.by_child[child.id]?.next_exam) {
    const exam = dash.by_child[child.id].next_exam!;
    const daysLabel = exam.days_until === 0 ? "today" : exam.days_until === 1 ? "tomorrow" : `${exam.days_until}d`;
    nextExamBody = <>{exam.subject} · {daysLabel}<small>{exam.held_on}</small></>;
  } else if (isHousehold) {
    // Find earliest exam across all children
    const exams = children
      .map(c => dash?.by_child[c.id]?.next_exam)
      .filter(Boolean);
    const earliest = exams.sort((a, b) => (a!.days_until - b!.days_until))[0];
    nextExamBody = earliest
      ? <>{earliest.subject} · {earliest.days_until}d<small>{earliest.held_on}</small></>
      : <>—<small>no upcoming exams</small></>;
  } else {
    nextExamBody = <>—<small>no upcoming exams</small></>;
  }

  // ── "Action needed" column ───────────────────────────────────────────────
  let actionBody: React.ReactNode;
  if (dash && dash.outstanding_total > 0) {
    actionBody = <>Invoice · OMR {dash.outstanding_total.toLocaleString()}<small>{dash.next_due_label ?? ""}</small></>;
  } else {
    actionBody = <>No actions needed<small>all invoices paid</small></>;
  }
  const actionTone = dash && dash.outstanding_total > 0 ? " warn" : "";

  const childName = isHousehold ? "Household" : (child?.full_name.split(" ")[0] ?? "Child");

  return (
    <div className="today-strip cols-3" aria-label="Today snapshot">
      <div>
        <div className="today-strip-col-label">
          {isHousehold ? "Household right now" : `${childName} right now`}
        </div>
        <div className="today-strip-col-body">{rightNowBody}</div>
      </div>

      <div className="today-strip-divider">
        <div className="today-strip-col-label">Next exam</div>
        <div className="today-strip-col-body">{nextExamBody}</div>
      </div>

      <div className="today-strip-divider">
        <div className="today-strip-col-label">Action needed</div>
        <div className={`today-strip-col-body${actionTone}`}>{actionBody}</div>
      </div>
    </div>
  );
}
