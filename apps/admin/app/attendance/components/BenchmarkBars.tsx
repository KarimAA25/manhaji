import type { BenchmarkRow } from "@manhaj/lib/mock-attendance";

export default function BenchmarkBars({ rows }: { rows: BenchmarkRow[] }) {
  const max = 100;
  return (
    <section className="bench-card att-block-cohort-only" aria-label="Compared to last term + last year">
      <header className="bench-head">
        <h3>Compared to last term + last year</h3>
        <p className="bench-sub">Are we trending better or worse than ourselves?</p>
      </header>
      <div className="bench-list">
        {rows.map(r => (
          <div key={r.label} className="bench-row">
            <span className="bench-nm">{r.label}</span>
            <div className="bench-bar"><div className={`bench-fill bench-${r.tone}`} style={{ width: `${(r.pct / max) * 100}%` }} /></div>
            <span className="bench-v">{r.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
