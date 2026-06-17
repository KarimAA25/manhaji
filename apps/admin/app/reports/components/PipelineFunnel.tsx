import { MOCK_PIPELINE } from "@manhaj/lib/mock-reports";

export default function PipelineFunnel() {
  const max = Math.max(...MOCK_PIPELINE.map(p => p.count));
  return (
    <section className="rep-pf-card" aria-label="Send pipeline">
      <header className="rep-pf-head">
        <h3>Send pipeline</h3>
        <p className="rep-pf-sub">Drafts → review → ready → sent → opened → replied → bounced.</p>
      </header>
      <ul className="rep-pf-list" role="list">
        {MOCK_PIPELINE.map(p => {
          const pct = max === 0 ? 0 : Math.round((p.count / max) * 100);
          return (
            <li key={p.stage} className={`rep-pf-row rep-pf-${p.stage}`}>
              <span className="rep-pf-label">{p.label}</span>
              <span className="rep-pf-bar">
                <span className="rep-pf-fill" style={{ width: `${pct}%` }} />
              </span>
              <span className="rep-pf-count">{p.count}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
