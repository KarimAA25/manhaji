/**
 * Admin · Students · Intervention log · per-student timeline.
 *
 * Shows what interventions have been tried for a given student,
 * by whom, and whether they are open or closed.
 */

const INTERVENTIONS = [
  {
    id: 1,
    date: "17 May",
    status: "open",
    kind: "neg" as const,
    title: "Tutoring assigned",
    body: "Twice-weekly maths with Mr Saab.",
    detail: "Attended 1/4 sessions so far.",
  },
  {
    id: 2,
    date: "12 May",
    status: "open",
    kind: "neg" as const,
    title: "Parent call",
    body: "Ms Swart left voicemail for Mr Saadi.",
    detail: "No callback yet.",
  },
  {
    id: 3,
    date: "2 May",
    status: "closed",
    kind: "pos" as const,
    title: "IEP review",
    body: "Extended-time accommodation activated for exams.",
    detail: "Agreed in committee meeting.",
  },
  {
    id: 4,
    date: "24 Apr",
    status: "closed",
    kind: "neutral" as const,
    title: "Homeroom check-in",
    body: "Weekly 10-min check-in with form tutor.",
    detail: "Running since week 8.",
  },
];

export default function InterventionLog() {
  const open   = INTERVENTIONS.filter(i => i.status === "open");
  const closed = INTERVENTIONS.filter(i => i.status === "closed");

  return (
    <section className="intv-card" aria-label="Intervention log">
      <header className="intv-head">
        <div>
          <h3>Intervention log · Omar Saadi (11 AS)</h3>
          <p className="intv-sub">What&apos;s been tried · by whom · outcome. Open items at top.</p>
        </div>
        <div className="intv-toggle">
          <span className="intv-toggle-pill active">Open · {open.length}</span>
          <span className="intv-toggle-pill">All · {INTERVENTIONS.length}</span>
        </div>
      </header>

      <ol className="intv-tl">
        {INTERVENTIONS.map(i => (
          <li key={i.id} className="intv-tl-row">
            <span className={`intv-dot intv-dot-${i.kind}`} aria-hidden="true" />
            <div className="intv-tl-body">
              <div className="intv-tl-date">
                {i.date}
                {" · "}
                <span className={`intv-status intv-status-${i.status}`}>{i.status}</span>
              </div>
              <div className="intv-tl-text">
                <b>{i.title}</b> — {i.body}{" "}
                <span className="intv-detail">{i.detail}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="intv-closed-label">
        {closed.length} closed · {open.length} open items need follow-up
      </div>
    </section>
  );
}
