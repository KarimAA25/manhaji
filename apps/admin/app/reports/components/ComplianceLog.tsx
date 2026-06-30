import { MOCK_AUDIT } from "@manhaj/lib/mock-reports";

const TONE: Record<string, string> = { success: "good", warning: "warn", fail: "danger" };

type DbAuditRow = { id: string; actor_label: string | null; action: string; object_kind: string | null; object_id: string | null; occurred_at: string | null };

export default function ComplianceLog({ auditLog }: { auditLog?: DbAuditRow[] }) {
  if (auditLog && auditLog.length > 0) {
    return (
      <section className="rep-cl-card" aria-label="Compliance log">
        <header className="rep-cl-head">
          <h3>Compliance log · last {auditLog.length} actions</h3>
          <button type="button" className="rep-cl-export">Export per term (CSV)</button>
        </header>
        <ul className="rep-cl-list" role="list">
          {auditLog.map(a => (
            <li key={a.id} className="rep-cl-row rep-cl-good">
              <span className="rep-cl-ts">{(a.occurred_at ?? "").slice(0, 16).replace("T", " ")}</span>
              <span className="rep-cl-actor">{a.actor_label ?? "System"}</span>
              <span className="rep-cl-body">
                <span className="rep-cl-action">{a.action}</span>
                <span className="rep-cl-scope">{a.object_kind ?? ""}{a.object_id ? ` · ${a.object_id}` : ""}</span>
              </span>
              <span className="rep-cl-chip rep-cl-chip-good">success</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }
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
