/**
 * Admin · Reports · Delivery diagnostics · open bounces.
 *
 * Table of bounced/problematic sends with AI-suggested follow-up actions.
 */

const DIAGNOSTICS = [
  {
    id: 1,
    email: "nasser.family@hotmail.com",
    reason: "Hard bounce — mailbox does not exist",
    student: "Mariam Nasser (11 AS)",
    tone: "bounce",
    resolved: false,
    suggestion: "Back-up contact on file — schedule a phone follow-up, then update the parent contact record.",
    actions: ["Schedule call", "Mark resolved"],
  },
  {
    id: 2,
    email: "al-hashemi.dad@gmail.com",
    reason: "Soft bounce — mailbox full",
    student: "Tariq Al-Hashemi (10B)",
    tone: "fixed",
    resolved: true,
    suggestion: "Re-sent successfully on 21 May.",
    actions: ["View thread"],
  },
  {
    id: 3,
    email: "khalid.r.parent@yahoo.com",
    reason: "Marked as spam by recipient",
    student: "Khalid Rashid (12 A2)",
    tone: "spam",
    resolved: false,
    suggestion: "Check subject-line template — T-04 has a 6% spam-mark rate this term. Consider re-phrasing.",
    actions: ["Review template", "Re-send"],
  },
];

export default function DeliveryDiagnostics() {
  const open = DIAGNOSTICS.filter(d => !d.resolved);

  return (
    <section className="diag-card" aria-label="Delivery diagnostics">
      <header className="diag-head">
        <div>
          <h3>Delivery diagnostics · open bounces</h3>
          <p className="diag-sub">Auto-tracks bounces. Manhaj suggests next steps · you confirm.</p>
        </div>
        <div className="diag-toggle">
          <span className="diag-toggle-pill active">Open · {open.length}</span>
          <span className="diag-toggle-pill">Resolved</span>
          <span className="diag-toggle-pill">All</span>
        </div>
      </header>

      <div className="diag-list">
        {DIAGNOSTICS.map(d => (
          <div
            key={d.id}
            className={`diag-row diag-row-${d.tone} ${d.resolved ? "diag-row-resolved" : ""}`}
          >
            <div className="diag-body">
              <div className="diag-email"><b>{d.email}</b> — {d.reason}</div>
              <div className="diag-student">Recipient: parent of {d.student}</div>
              <div className="diag-ai">
                <b>Manhaj:</b> {d.suggestion}
              </div>
            </div>
            <div className="diag-actions">
              {d.actions.map(a => (
                <button
                  key={a}
                  type="button"
                  className={`diag-btn ${a.includes("call") || a.includes("send") ? "diag-btn-primary" : "diag-btn-ghost"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
