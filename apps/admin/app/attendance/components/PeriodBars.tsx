import type { PeriodAvg } from "@manhaj/lib/mock-attendance";

export default function PeriodBars({ rows }: { rows: PeriodAvg[] }) {
  const max = 100;
  return (
    <section className="periodbars-card att-block-cohort-only" aria-label="Period-of-day pattern · last 30 days">
      <header className="periodbars-head">
        <h3>Period-of-day pattern · last 30 days</h3>
        <p className="periodbars-sub">P1 and P7 absorb most absences. Useful for scheduling.</p>
      </header>
      <div className="periodbars-row">
        {rows.map(r => {
          const height = ((r.pct - 85) / (max - 85)) * 100;
          return (
            <div key={r.period} className="periodbars-col">
              <div className="periodbars-val">{r.pct}%</div>
              <div className="periodbars-bar" style={{ height: `${Math.max(8, height)}%` }} />
              <div className="periodbars-l">P{r.period}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
