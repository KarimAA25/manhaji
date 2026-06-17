import { MOCK_ACTIONS } from "@manhaj/lib/mock-schedule";

export default function ActionQueue() {
  return (
    <section className="sch-aq-card" aria-label="Action queue">
      <header className="sch-aq-head">
        <h3>Action queue · {MOCK_ACTIONS.length} items</h3>
        <p className="sch-aq-sub">Conflicts + unfilled periods · AI-suggested fix per row.</p>
      </header>
      <ul className="sch-aq-list" role="list">
        {MOCK_ACTIONS.map(a => (
          <li key={a.id} className={`sch-aq-row sch-aq-${a.kind}`}>
            <span className="sch-aq-tag">#{a.id}</span>
            <span className="sch-aq-body">
              <span className="sch-aq-title">
                {a.section} · {a.when} · <em>{a.subject ?? "—"}</em>
              </span>
              <span className="sch-aq-fix"><strong>AI:</strong> {a.ai_fix}</span>
            </span>
            <span className="sch-aq-actions">
              <button type="button" className="sch-aq-btn primary">Accept fix</button>
              <button type="button" className="sch-aq-btn ghost">Dismiss</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
