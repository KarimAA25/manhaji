/**
 * Admin · Students · Demographic breakdown.
 *
 * Shows year-group and gender distribution using inline fixtures
 * (nationality/language split is not in mock-students, so we use
 * reasonable stand-in numbers).
 */

const YEAR_GROUPS = [
  { name: "Grade 9",  count: 52, pct: 22 },
  { name: "Grade 10", count: 68, pct: 29 },
  { name: "Grade 11", count: 58, pct: 24 },
  { name: "Grade 12", count: 60, pct: 25 },
];

const GENDER = [
  { name: "Female",     pct: 52, count: 124 },
  { name: "Male",       pct: 48, count: 114 },
];

const NEW_VS_RETURNING = [
  { name: "Returning",  pct: 88, count: 210 },
  { name: "New",        pct: 12, count: 28  },
];

export default function DemographicBreakdown() {
  return (
    <section className="demo-card" aria-label="Demographic breakdown">
      <header className="demo-head">
        <div>
          <h3>Demographic breakdown</h3>
          <p className="demo-sub">Year-group, gender split, and new-vs-returning · exportable CSV</p>
        </div>
      </header>

      <div className="demo-groups">
        {/* Year groups */}
        <div className="demo-group">
          <div className="demo-group-label">By year group</div>
          {YEAR_GROUPS.map(g => (
            <div key={g.name} className="demo-bar-row">
              <span className="demo-bar-name">{g.name}</span>
              <div className="demo-bar-track">
                <div className="demo-bar-fill" style={{ width: `${g.pct}%` }} />
              </div>
              <span className="demo-bar-val">{g.count} · {g.pct}%</span>
            </div>
          ))}
        </div>

        {/* Gender */}
        <div className="demo-group">
          <div className="demo-group-label">By gender</div>
          {GENDER.map(g => (
            <div key={g.name} className="demo-bar-row">
              <span className="demo-bar-name">{g.name}</span>
              <div className="demo-bar-track">
                <div className="demo-bar-fill demo-bar-fill-alt" style={{ width: `${g.pct}%` }} />
              </div>
              <span className="demo-bar-val">{g.count} · {g.pct}%</span>
            </div>
          ))}
        </div>

        {/* New vs returning */}
        <div className="demo-group">
          <div className="demo-group-label">New vs returning</div>
          {NEW_VS_RETURNING.map(g => (
            <div key={g.name} className="demo-bar-row">
              <span className="demo-bar-name">{g.name}</span>
              <div className="demo-bar-track">
                <div className="demo-bar-fill" style={{ width: `${g.pct}%` }} />
              </div>
              <span className="demo-bar-val">{g.count} · {g.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
