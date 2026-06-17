import type { SectionWeekRow } from "@manhaj/lib/mock-attendance";

export default function SectionHeatStrip({ rows }: { rows: SectionWeekRow[] }) {
  return (
    <section className="strip-card att-block-cohort-only" aria-label="Section heat-strip · this week">
      <header className="strip-head">
        <h3>Section heat-strip · this week</h3>
        <p className="strip-sub">Each bar = one section. Green=good, amber=watch, red=gap.</p>
      </header>
      <div className="strip-list">
        {rows.map(r => (
          <div key={r.section_code} className="strip-row">
            <span className="strip-label">{r.section_code}</span>
            <div className="strip-bars" aria-label={`${r.section_code} ${r.week_pct}%`}>
              {r.days.map((d, i) => (
                <span key={i} className={`strip-bar bar-${d}`} />
              ))}
            </div>
            <span className={`strip-pct ${r.week_pct < 90 ? "is-bad" : ""}`}>{r.week_pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
