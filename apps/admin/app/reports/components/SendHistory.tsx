/**
 * Admin · Reports · Send history · last 6 months.
 *
 * Table showing recent batches with sent / open rate / bounces.
 */

const HISTORY = [
  { when: "20 May",  batch: "Attendance follow-up", template: "T-05", sent: 14,  openPct: 84, bounces: 0, openTone: "good" },
  { when: "15 May",  batch: "Achievement spotlight", template: "T-12", sent: 38,  openPct: 96, bounces: 0, openTone: "good" },
  { when: "3 May",   batch: "April monthly report",  template: "T-01", sent: 684, openPct: 89, bounces: 4, openTone: "good" },
  { when: "2 Apr",   batch: "March monthly report",  template: "T-01", sent: 678, openPct: 85, bounces: 7, openTone: "good" },
  { when: "20 Mar",  batch: "Term 2 report card",    template: "T-02", sent: 696, openPct: 92, bounces: 2, openTone: "good" },
  { when: "1 Mar",   batch: "February monthly",      template: "T-01", sent: 671, openPct: 81, bounces: 6, openTone: "warn" },
];

export default function SendHistory() {
  return (
    <section className="shist-card" aria-label="Send history · last 6 months">
      <header className="shist-head">
        <div>
          <h3>Send history · last 6 months</h3>
          <p className="shist-sub">Every batch with its open + reply + bounce rate. Drill in for the per-recipient log.</p>
        </div>
        <div className="shist-toggle">
          <span className="shist-toggle-pill active">All</span>
          <span className="shist-toggle-pill">Monthly</span>
          <span className="shist-toggle-pill">Term</span>
        </div>
      </header>

      <div className="shist-tbl-wrap">
        <table className="shist-tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>Batch</th>
              <th className="shist-num">Sent</th>
              <th className="shist-num">Open rate</th>
              <th className="shist-num">Bounces</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h, i) => (
              <tr key={i}>
                <td className="shist-when">{h.when}</td>
                <td>
                  <span className="shist-batch-name">{h.batch}</span>
                  <span className="shist-tpl-id">{h.template}</span>
                </td>
                <td className="shist-num">{h.sent.toLocaleString()}</td>
                <td className={`shist-num shist-open-${h.openTone}`}>{h.openPct}%</td>
                <td className={`shist-num ${h.bounces > 0 ? "shist-bounce-warn" : "shist-bounce-ok"}`}>
                  {h.bounces}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
