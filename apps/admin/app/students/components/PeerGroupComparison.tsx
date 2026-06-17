/**
 * Admin · Students · Peer-group comparison.
 *
 * Side-by-side bar chart comparing a student vs section average
 * across rubric axes. Inline fixture — Layla Al-Habsi vs 10A avg.
 */

const AXES = [
  { label: "Analytical", student: 4.4, peer: 3.7, studentPct: 88, peerPct: 74 },
  { label: "Creative",   student: 3.8, peer: 3.6, studentPct: 76, peerPct: 72 },
  { label: "Oral",       student: 4.0, peer: 3.8, studentPct: 80, peerPct: 76 },
  { label: "Written",    student: 2.8, peer: 3.5, studentPct: 56, peerPct: 70 },
  { label: "Homework",   student: 4.6, peer: 3.9, studentPct: 92, peerPct: 78 },
];

export default function PeerGroupComparison() {
  return (
    <section className="peer-card" aria-label="Peer-group comparison">
      <header className="peer-head">
        <div>
          <h3>Peer-group comparison · Layla Al-Habsi</h3>
          <p className="peer-sub">vs section average (10A) across rubric axes.</p>
        </div>
        <div className="peer-toggle">
          <span className="peer-toggle-pill active">Rubric</span>
          <span className="peer-toggle-pill">Attendance</span>
        </div>
      </header>

      <div className="peer-rows">
        {AXES.map(a => (
          <div key={a.label} className="peer-row">
            <span className="peer-axis-label">{a.label}</span>
            <div className="peer-bars">
              <div className="peer-bar-wrap">
                <div className="peer-bar-fill peer-fill-student" style={{ width: `${a.studentPct}%` }} />
              </div>
              <div className="peer-bar-wrap">
                <div className="peer-bar-fill peer-fill-peer" style={{ width: `${a.peerPct}%` }} />
              </div>
            </div>
            <span className="peer-val">{a.student} vs {a.peer}</span>
          </div>
        ))}
      </div>

      <div className="peer-legend">
        <span className="peer-legend-item">
          <span className="peer-legend-swatch peer-swatch-student" />
          Layla
        </span>
        <span className="peer-legend-item">
          <span className="peer-legend-swatch peer-swatch-peer" />
          10A avg
        </span>
      </div>
    </section>
  );
}
