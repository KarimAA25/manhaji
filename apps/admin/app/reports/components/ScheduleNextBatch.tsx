/**
 * Admin · Reports · Schedule next batch card.
 *
 * Shows the upcoming send window, recipient count, draft-not-ready
 * count, and action buttons.
 */

export default function ScheduleNextBatch() {
  return (
    <section className="snb-card" aria-label="Schedule next batch">
      <header className="snb-head">
        <div>
          <h3>Schedule next batch</h3>
          <p className="snb-sub">Define when this batch sends · who reviews · which template.</p>
        </div>
        <div className="snb-toggle">
          <span className="snb-toggle-pill active">Manual</span>
          <span className="snb-toggle-pill">Recurring</span>
        </div>
      </header>

      <div className="snb-box">
        <div className="snb-fields">
          <div className="snb-field">
            <div className="snb-field-label">Template</div>
            <div className="snb-field-value">T-01 · Monthly parent report</div>
          </div>
          <div className="snb-field">
            <div className="snb-field-label">Recipients</div>
            <div className="snb-field-value">684 parents · HS + MS + Primary</div>
          </div>
          <div className="snb-field">
            <div className="snb-field-label">Send window</div>
            <div className="snb-field-value">Monthly · <b>Fri 28 May · 16:00 Muscat</b></div>
          </div>
          <div className="snb-field">
            <div className="snb-field-label">Drafts not ready</div>
            <div className="snb-field-value snb-field-warn">28 awaiting teacher review</div>
          </div>
          <div className="snb-field">
            <div className="snb-field-label">Language</div>
            <div className="snb-field-value">Auto (parent preference)</div>
          </div>
          <div className="snb-field">
            <div className="snb-field-label">Reply-to</div>
            <div className="snb-field-value">section.teacher@iso.edu.om</div>
          </div>
        </div>

        <div className="snb-actions">
          <button type="button" className="snb-btn snb-btn-ghost">Save as draft</button>
          <button type="button" className="snb-btn snb-btn-ghost">Preview one</button>
          <button type="button" className="snb-btn snb-btn-ghost">Customize</button>
          <button type="button" className="snb-btn snb-btn-primary">Confirm schedule</button>
        </div>
      </div>
    </section>
  );
}
