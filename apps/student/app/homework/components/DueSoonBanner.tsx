import { mostUrgent, relativeDue, MOCK_HOMEWORK } from "@manhaj/lib/mock-homework";

export default function DueSoonBanner() {
  const item = mostUrgent(MOCK_HOMEWORK);
  if (!item) {
    return (
      <section className="hw-due-card hw-due-empty" aria-label="Up next">
        <p><strong>You&apos;re all caught up.</strong> Next item due tomorrow.</p>
      </section>
    );
  }
  return (
    <section className={`hw-due-card hw-due-${item.status}`} aria-label="Most urgent homework">
      <div className="hw-due-head">
        <span className="hw-due-tag">{item.subject}</span>
        <span className="hw-due-status">{item.status === "overdue" ? `OVERDUE · ${relativeDue(item.due)}` : `Due ${relativeDue(item.due)}`}</span>
      </div>
      <h3 className="hw-due-title">{item.title}</h3>
      <p className="hw-due-ai"><strong>AI:</strong> {item.ai_estimate}</p>
      <div className="hw-due-actions">
        <button type="button" className="hw-due-btn primary">Mark done</button>
        {item.catch_up_pack && <button type="button" className="hw-due-btn ghost">Open catch-up pack</button>}
      </div>
    </section>
  );
}
