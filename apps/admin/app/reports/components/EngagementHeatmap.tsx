import { MOCK_HEATMAP, HEATMAP_MONTHS } from "@manhaj/lib/mock-reports";

function tone(pct: number): string {
  if (pct >= 90) return "eh-4";
  if (pct >= 80) return "eh-3";
  if (pct >= 70) return "eh-2";
  if (pct >= 60) return "eh-1";
  return "eh-0";
}

export default function EngagementHeatmap() {
  return (
    <section className="rep-eh-card" aria-label="Engagement heatmap">
      <header className="rep-eh-head">
        <h3>Engagement · open rate % by section × month</h3>
        <p className="rep-eh-sub">Last 9 months of AY 2025–26. Hotter = higher open rate.</p>
      </header>
      <div className="rep-eh-grid">
        <div className="rep-eh-cnr" />
        {HEATMAP_MONTHS.map(m => <div key={m} className="rep-eh-dow">{m}</div>)}
        {MOCK_HEATMAP.map(r => (
          <Row key={r.section_id} r={r} />
        ))}
      </div>
      <div className="rep-eh-legend">
        <span>0%</span>
        <span className="rep-eh-sw eh-0" />
        <span className="rep-eh-sw eh-1" />
        <span className="rep-eh-sw eh-2" />
        <span className="rep-eh-sw eh-3" />
        <span className="rep-eh-sw eh-4" />
        <span>100%</span>
      </div>
    </section>
  );
}

function Row({ r }: { r: { section_id: string; section_label: string; by_month: number[] } }) {
  return (
    <>
      <div className="rep-eh-name">{r.section_label}</div>
      {r.by_month.map((v, i) => (
        <div key={i} className={`rep-eh-cell ${tone(v)}`}>{v}</div>
      ))}
    </>
  );
}
