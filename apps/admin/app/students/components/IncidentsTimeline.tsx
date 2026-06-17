/**
 * Behavioural-incidents timeline for the Admin Students tab.
 *
 * Sorted newest first. Each entry: colored dot + date + student name +
 * section + body + optional inline AI suggestion in a soft-blue card.
 */

import type { IncidentRow } from "@manhaj/lib/mock-students";

const DOT: Record<IncidentRow["kind"], string> = {
  positive: "incidents-dot pos",
  negative: "incidents-dot neg",
  neutral:  "incidents-dot neutral",
};

function formatDay(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month}`;
}

export default function IncidentsTimeline({ incidents }: { incidents: IncidentRow[] }) {
  const sorted = [...incidents].sort((a, b) => b.ts.localeCompare(a.ts));
  return (
    <section className="incidents-card" aria-label="Behavioural incidents · last 14 days">
      <header className="incidents-head">
        <h3>Behavioural incidents · last 14 days</h3>
        <p className="incidents-sub">Positive + negative events. Threshold triggers AI suggestion.</p>
      </header>
      <ol className="incidents-tl">
        {sorted.map(i => (
          <li key={i.id} className="incidents-tl-row">
            <span className={DOT[i.kind]} aria-hidden="true" />
            <div className="incidents-tl-body">
              <div className="incidents-tl-date">{formatDay(i.ts)}</div>
              <div className="incidents-tl-text">
                <b>{i.student_name}</b> <span className="incidents-tl-section">({i.section_code})</span> · {i.body}
              </div>
              {i.ai_suggestion && (
                <div className="incidents-tl-ai"><b>Manhaj:</b> {i.ai_suggestion}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
