/**
 * Admin · Schedule · Change log · last 7 days.
 *
 * Timeline of schedule edits — who, what, when — with an
 * "Undo" ghost button per row.
 */

const CHANGES = [
  {
    id: 1,
    when: "22 May · 10:14",
    actor: "Principal · manual",
    body: "Ms Khadija · Arabic moved from Wed P2 → Wed P5 (10A).",
    reason: "Personal leave Wed AM, swap with Ms Swart.",
    canUndo: true,
  },
  {
    id: 2,
    when: "21 May · 16:02",
    actor: "Principal · AI",
    body: "NL request: \"Avoid Maths in P7 for Grade 9.\" Applied to 9A + 9B — 4 cells moved.",
    reason: null,
    canUndo: true,
  },
  {
    id: 3,
    when: "20 May · 09:48",
    actor: "HoD Maths · sub engine",
    body: "Sub assigned: Mr Hassan covered P4 Mon Maths (Mr Mohamad out).",
    reason: null,
    canUndo: false,
  },
  {
    id: 4,
    when: "19 May · 11:20",
    actor: "Facilities · manual",
    body: "Room change: 11 AS Chemistry P3 Tue moved from Lab 2 → Lab 1 (Lab 2 deep clean).",
    reason: null,
    canUndo: false,
  },
];

export default function ChangeLog() {
  return (
    <section className="clog-card" aria-label="Change log · last 7 days">
      <header className="clog-head">
        <div>
          <h3>Change log · last 7 days</h3>
          <p className="clog-sub">Every schedule edit, who made it, and what changed. Roll back per row.</p>
        </div>
        <div className="clog-toggle">
          <span className="clog-toggle-pill active">All</span>
          <span className="clog-toggle-pill">NL-driven</span>
          <span className="clog-toggle-pill">Manual</span>
        </div>
      </header>

      <ol className="clog-list">
        {CHANGES.map(c => (
          <li key={c.id} className="clog-row">
            <span className="clog-when">{c.when}</span>
            <span className="clog-body">
              {c.body}
              {c.reason && <span className="clog-reason"> {c.reason}</span>}
              <span className="clog-actor"> — {c.actor}</span>
            </span>
            {c.canUndo && (
              <button type="button" className="clog-undo" aria-label="Undo this change">
                Undo
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
