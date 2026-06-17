import type { SubjectMiss } from "@manhaj/lib/mock-attendance";

export default function SubjectCorrelation({ rows }: { rows: SubjectMiss[] }) {
  const max = rows.length > 0 ? Math.max(...rows.map(r => r.hours_missed)) : 1;
  return (
    <section className="subjcorr-card att-block-cohort-only" aria-label="Subject correlation · absences by subject">
      <header className="subjcorr-head">
        <h3>Subject correlation · absences by subject</h3>
        <p className="subjcorr-sub">Where missed lessons cluster. Useful for catch-up planning.</p>
      </header>
      <div className="subjcorr-list">
        {rows.map(r => (
          <div key={r.subject} className="subjcorr-row">
            <span className="subjcorr-nm">{r.subject}</span>
            <div className="subjcorr-bar"><div className="subjcorr-fill" style={{ width: `${(r.hours_missed / max) * 100}%` }} /></div>
            <span className="subjcorr-v">{r.hours_missed} hrs</span>
          </div>
        ))}
      </div>
    </section>
  );
}
