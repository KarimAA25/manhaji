import type { ArchivedReport } from "@manhaj/lib/mock-reports-archive";
import { reportsByChild } from "@manhaj/lib/mock-reports-archive";

const ICONS: Record<string, string> = { monthly: "📄", term: "📚" };

export default function ReportTimeline({ reports }: { reports: ArchivedReport[] }) {
  const groups = reportsByChild(reports);
  if (groups.size === 0) {
    return (
      <section className="pr-tl-card" aria-label="Reports timeline">
        <p className="pr-tl-empty">No reports for the current filter.</p>
      </section>
    );
  }
  return (
    <section className="pr-tl-card" aria-label="Reports timeline">
      {Array.from(groups.entries()).map(([childId, rows]) => (
        <div key={childId} className="pr-tl-group">
          <h3 className="pr-tl-group-head">{rows[0].child_name}</h3>
          <ul className="pr-tl-list" role="list">
            {rows.map(r => (
              <li key={r.id} className={`pr-tl-row pr-tl-row-${r.type}`}>
                <span className="pr-tl-ic" aria-hidden>{ICONS[r.type]}</span>
                <span className="pr-tl-body">
                  <span className="pr-tl-period">{r.period}</span>
                  <span className="pr-tl-headline">{r.headline}</span>
                </span>
                <span className={`pr-tl-type pr-tl-type-${r.type}`}>{r.type.toUpperCase()}</span>
                <button type="button" className="pr-tl-open">Open</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
