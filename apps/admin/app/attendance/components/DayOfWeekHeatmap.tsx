import type { DayOfWeekRow } from "@manhaj/lib/mock-attendance";

function band(pct: number): string {
  if (pct < 92) return "att-1";
  if (pct < 95) return "att-2";
  if (pct < 97) return "att-3";
  return "att-4";
}

export default function DayOfWeekHeatmap({ rows }: { rows: DayOfWeekRow[] }) {
  return (
    <section className="dow-card att-block-cohort-only" aria-label="Day-of-week pattern · last 6 weeks">
      <header className="dow-head">
        <h3>Day-of-week pattern · last 6 weeks</h3>
        <p className="dow-sub">Spot the chronic Monday dip and Friday catch-up.</p>
      </header>
      <div className="dow-grid">
        <div />
        <div className="dow-col-head">Mon</div>
        <div className="dow-col-head">Tue</div>
        <div className="dow-col-head">Wed</div>
        <div className="dow-col-head">Thu</div>
        <div className="dow-col-head">Fri</div>
        {rows.map(r => (
          <>
            <div key={`${r.week_label}-rh`} className="dow-row-head">{r.week_label}</div>
            {(["mon","tue","wed","thu","fri"] as const).map(d => {
              const v = r[d];
              return <div key={`${r.week_label}-${d}`} className={`dow-cell ${band(v)}`}>{v}</div>;
            })}
          </>
        ))}
      </div>
    </section>
  );
}
