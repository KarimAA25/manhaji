import { MOCK_ARCHIVE, archiveForChild, latestReport } from "@manhaj/lib/mock-reports-archive";

const ICONS: Record<string, string> = { monthly: "📄", term: "📚" };

const LAYLA_ID = "layla-al-habsi";

export default function StudentReportArchive() {
  const reports = archiveForChild(MOCK_ARCHIVE, LAYLA_ID);
  const latest  = latestReport(MOCK_ARCHIVE, LAYLA_ID);
  if (!latest) return null;
  const top3 = [...latest.axes].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <>
      <section className="pr-pv-card" aria-label="Latest report preview">
        <header className="pr-pv-head">
          <span className="pr-pv-tag">Latest · {latest.period}</span>
          <h3>{latest.child_name}</h3>
        </header>
        <p className="pr-pv-headline">{latest.headline}</p>
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
        <p className="pr-pv-compare"><strong>vs previous month:</strong> +0.1 Academic · +0.1 Effort · stable Behaviour</p>
        <div className="pr-pv-actions">
          <button type="button" className="pr-pv-btn primary">Open full report</button>
        </div>
      </section>

      <section className="pr-tl-card" aria-label="Reports timeline">
        <h3 className="pr-tl-group-head">All my reports · {reports.length}</h3>
        <ul className="pr-tl-list" role="list">
          {reports.map(r => (
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
      </section>
    </>
  );
}
