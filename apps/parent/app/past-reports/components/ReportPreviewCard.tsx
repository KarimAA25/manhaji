import type { ArchivedReport } from "@manhaj/lib/mock-reports-archive";

export default function ReportPreviewCard({ report }: { report: ArchivedReport | null }) {
  if (!report) {
    return (
      <section className="pr-pv-card pr-pv-empty" aria-label="Latest report preview">
        <p>No latest report.</p>
      </section>
    );
  }
  const top3 = [...report.axes].sort((a, b) => b.score - a.score).slice(0, 3);
  return (
    <section className="pr-pv-card" aria-label="Latest report preview">
      <header className="pr-pv-head">
        <span className="pr-pv-tag">Latest · {report.period}</span>
        <h3>{report.child_name}</h3>
      </header>
      <p className="pr-pv-headline">{report.headline}</p>
      <div className="pr-pv-axes">
        {top3.map(a => (
          <div key={a.name} className="pr-pv-axis">
            <span className="pr-pv-axis-name">{a.name}</span>
            <span className="pr-pv-axis-bar">
              <span className="pr-pv-axis-fill" style={{ width: `${(a.score / 5) * 100}%` }} />
            </span>
            <span className="pr-pv-axis-score">{a.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
      <div className="pr-pv-actions">
        <button type="button" className="pr-pv-btn primary">Open full report</button>
        <button type="button" className="pr-pv-btn ghost">Download PDF</button>
      </div>
    </section>
  );
}
