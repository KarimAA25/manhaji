/**
 * Admin · Students · Bulk parent comms preview card.
 *
 * Empty-state card shown when no rows are selected in the roster.
 * Describes what bulk-send will look like once rows are checked.
 * (Actual bulk send is post-MVP; this renders the preview state only.)
 */

export default function BulkParentComms() {
  return (
    <section className="bulk-card" aria-label="Bulk parent comms">
      <header className="bulk-head">
        <div>
          <h3>Bulk parent comms · when rows are selected</h3>
          <p className="bulk-sub">
            Select rows in the Roster above to send a bulk message.
            Uses the 17-template catalogue — drafts are AI-composed and editable before send.
          </p>
        </div>
      </header>

      <div className="bulk-empty">
        <div className="bulk-empty-icon" aria-hidden="true">☐</div>
        <p className="bulk-empty-title">No students selected</p>
        <p className="bulk-empty-hint">
          Check one or more rows in the Roster above. An action bar will appear here
          with template picker, recipient list, and a &ldquo;Generate drafts&rdquo; button.
        </p>
      </div>

      {/* Preview of what the bar looks like once rows are checked */}
      <div className="bulk-preview-bar" aria-label="Preview action bar">
        <span className="bulk-preview-count">e.g. 5 students selected</span>
        <div className="bulk-preview-actions">
          <span className="bulk-btn bulk-btn-ghost">Draft comms template</span>
          <span className="bulk-btn bulk-btn-ghost">Export CSV</span>
          <span className="bulk-btn bulk-btn-ghost">Schedule meetings</span>
          <span className="bulk-btn bulk-btn-primary">Generate drafts</span>
        </div>
      </div>
    </section>
  );
}
