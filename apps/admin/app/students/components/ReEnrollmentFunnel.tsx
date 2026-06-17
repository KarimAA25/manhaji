/**
 * Admin · Students · Re-enrollment funnel · AY 26/27.
 *
 * Stages: enrolled → invited → confirmed → payment collected → pending.
 * Numbers are reasonable for a school with ~238 enrolled.
 */

const STAGES = [
  { label: "Enrolled this term",  count: 238, pct: 100, tone: "primary" },
  { label: "Invited to renew",    count: 232, pct:  97, tone: "primary" },
  { label: "Opened invite",       count: 210, pct:  88, tone: "primary" },
  { label: "Confirmed",           count: 204, pct:  86, tone: "primary" },
  { label: "Payment collected",   count: 170, pct:  71, tone: "primary" },
  { label: "Pending / withdrawn",  count:  34, pct:  14, tone: "danger"  },
];

export default function ReEnrollmentFunnel() {
  return (
    <section className="reen-card" aria-label="Re-enrollment funnel">
      <header className="reen-head">
        <div>
          <h3>Re-enrollment funnel · AY 26/27</h3>
          <p className="reen-sub">Last touch dates available on click. Nudge non-responders in bulk.</p>
        </div>
        <div className="reen-toggle">
          <span className="reen-toggle-pill active">HS</span>
          <span className="reen-toggle-pill">MS</span>
          <span className="reen-toggle-pill">Primary</span>
        </div>
      </header>

      <div className="reen-funnel">
        {STAGES.map(s => (
          <div key={s.label} className="reen-stage">
            <span className="reen-stage-label">{s.label}</span>
            <div className="reen-bar-wrap">
              <div
                className={`reen-bar-fill reen-bar-${s.tone}`}
                style={{ width: `${s.pct}%` }}
              >
                {s.count}
              </div>
            </div>
            <span className="reen-stage-pct">{s.pct}%</span>
          </div>
        ))}
      </div>

      <p className="reen-footer">
        <b>34 families</b> have not yet confirmed — bulk nudge available via the Bulk parent comms card below.
      </p>
    </section>
  );
}
