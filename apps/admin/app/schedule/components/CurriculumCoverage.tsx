import { MOCK_CURRICULUM } from "@manhaj/lib/mock-schedule";

export default function CurriculumCoverage() {
  return (
    <section className="sch-cc-card" aria-label="Curriculum coverage">
      <header className="sch-cc-head">
        <h3>Curriculum coverage · hours / week vs IGCSE minimum</h3>
      </header>
      <ul className="sch-cc-list" role="list">
        {MOCK_CURRICULUM.map(r => {
          const pct = Math.min(100, Math.round((r.current_hr / r.target_hr) * 100));
          const under = r.current_hr < r.target_hr;
          return (
            <li key={r.subject} className="sch-cc-row">
              <span className="sch-cc-label">{r.subject}</span>
              <span className="sch-cc-bar">
                <span className={`sch-cc-fill ${under ? "under" : ""}`} style={{ width: `${pct}%` }} />
              </span>
              <span className={`sch-cc-meta ${under ? "under" : ""}`}>
                {r.current_hr} / {r.target_hr} h
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
