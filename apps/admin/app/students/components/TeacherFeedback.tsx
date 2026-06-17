/**
 * Admin · Students · Teacher feedback panel.
 *
 * Shows per-subject teacher quotes for a specific student.
 * Inline fixture — Layla Al-Habsi as the demo subject (matches mockup).
 */

const QUOTES = [
  {
    id: 1,
    teacher: "Ms Swart",
    subject: "English",
    tag: "effort",
    quote: "Strong analytical voice, MUN-ready. Could push harder on essay structure.",
  },
  {
    id: 2,
    teacher: "Mr Saab",
    subject: "Mathematics",
    tag: "effort",
    quote: "Top of class on calculus. Confident with stretch problems.",
  },
  {
    id: 3,
    teacher: "Ms Khadija",
    subject: "Arabic",
    tag: "communication",
    quote: "Spoken Arabic excellent, written essay structure is the build area this month.",
  },
  {
    id: 4,
    teacher: "Dr Salim",
    subject: "Chemistry",
    tag: "effort",
    quote: "Equilibrium intuition was the breakthrough this term.",
  },
];

const TAG_TONE: Record<string, string> = {
  effort:        "tf-tag-effort",
  behaviour:     "tf-tag-behaviour",
  communication: "tf-tag-comm",
};

export default function TeacherFeedback() {
  return (
    <section className="tf-card" aria-label="Teacher feedback">
      <header className="tf-head">
        <div>
          <h3>Teacher feedback · this term · Layla Al-Habsi</h3>
          <p className="tf-sub">AI condenses comments from each teacher. Useful before a parent meeting.</p>
        </div>
        <div className="tf-toggle">
          <span className="tf-toggle-pill active">All teachers</span>
          <span className="tf-toggle-pill">HoD only</span>
        </div>
      </header>

      <div className="tf-quotes">
        {QUOTES.map(q => (
          <div key={q.id} className="tf-quote">
            <div className="tf-quote-who">
              {q.teacher} · {q.subject}
              <span className={`tf-tag ${TAG_TONE[q.tag] ?? ""}`}>{q.tag}</span>
            </div>
            <p className="tf-quote-body">&ldquo;{q.quote}&rdquo;</p>
          </div>
        ))}
      </div>

      <div className="tf-ai-summary">
        <b>Manhaj (summary):</b> Confident, articulate, MUN-track. Written Arabic structure is the
        consistent build area cited by 2/4 teachers.
      </div>
    </section>
  );
}
