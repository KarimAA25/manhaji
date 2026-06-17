"use client";

import type { LessonMissed } from "@manhaj/lib/mock-attendance";

export default function LessonsMissedList({ rows, studentName }: { rows: LessonMissed[]; studentName: string }) {
  return (
    <section className="lessons-card att-block-advisor-only" aria-label={`What ${studentName} missed`}>
      <header className="lessons-head">
        <h3>What {studentName} missed · last 14 school days</h3>
        <p className="lessons-sub">Lessons missed during absences. Click to send Manhaj-generated catch-up pack.</p>
      </header>
      <ul className="lessons-list">
        {rows.map((l, i) => (
          <li key={i} className="lessons-row">
            <span className="lessons-date">{l.date.slice(5)}</span>
            <span className="lessons-body">
              <b>{l.period} · {l.subject}</b>{" "}<small>{l.teacher} · {l.note}</small>
            </span>
            <button type="button" className="lessons-action" onClick={() => console.log("[catch-up]", l)}>▸ catch-up pack</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
