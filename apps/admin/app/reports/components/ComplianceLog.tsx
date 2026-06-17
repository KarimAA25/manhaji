import { MOCK_AUDIT } from "@manhaj/lib/mock-reports";

const TONE: Record<string, string> = { success: "good", warning: "warn", fail: "danger" };

export default function ComplianceLog() {
  return (
    <section className="rep-cl-card" aria-label="Compliance log">
      <header className="rep-cl-head">
        <h3>Compliance log · last {MOCK_AUDIT.length} actions</h3>
        <button type="button" className="rep-cl-export">Export per term (CSV)</button>
      </header>
      <ul className="rep-cl-list" role="list">
        {MOCK_AUDIT.map(a => (
          <li key={a.id} className={`rep-cl-row rep-cl-${TONE[a.result]}`}>
            <span className="rep-cl-ts">{a.timestamp}</span>
            <span className="rep-cl-actor">{a.actor}</span>
            <span className="rep-cl-body">
              <span className="rep-cl-action">{a.action}</span>
              <span className="rep-cl-scope">{a.scope}</span>
            </span>
            <span className={`rep-cl-chip rep-cl-chip-${TONE[a.result]}`}>{a.result}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
