/**
 * Admin · Reports · A/B test results · subject line.
 *
 * Two-variant comparison for the T-01 monthly report subject line.
 * Winner is highlighted with a pill.
 */

const VARIANTS = [
  {
    id: "A",
    label: "A · Control",
    subject: '"April update on {{student}}"',
    openRate: 86,
    replyRate: 16,
    winner: false,
  },
  {
    id: "B",
    label: "B · Challenger",
    subject: '"How {{student}} did this month"',
    openRate: 92,
    replyRate: 21,
    winner: true,
  },
];

export default function AbTestResults() {
  return (
    <section className="ab-card" aria-label="A/B test results">
      <header className="ab-head">
        <div>
          <h3>A/B test results · subject line for T-01 monthly</h3>
          <p className="ab-sub">Split 50/50 in the April batch. Winner promoted to default for May.</p>
        </div>
      </header>

      <div className="ab-tbl-wrap">
        <table className="ab-tbl">
          <thead>
            <tr>
              <th className="ab-th-variant">Variant</th>
              <th className="ab-th-num">Open rate</th>
              <th className="ab-th-num">Reply rate</th>
              <th className="ab-th-outcome">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map(v => (
              <tr key={v.id} className={v.winner ? "ab-row-winner" : ""}>
                <td>
                  <span className="ab-variant-label">{v.label}</span>
                  <span className="ab-subject">{v.subject}</span>
                </td>
                <td className={`ab-num ${v.winner ? "ab-num-winner" : ""}`}>{v.openRate}%</td>
                <td className={`ab-num ${v.winner ? "ab-num-winner" : ""}`}>{v.replyRate}%</td>
                <td className="ab-outcome">
                  {v.winner
                    ? <span className="ab-winner-pill">▲ winner</span>
                    : <span className="ab-control-label">control</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ab-footer">
        Variant B promoted to default. <b>+6 pts open rate</b> · <b>+5 pts reply rate</b> over control.
      </p>
    </section>
  );
}
