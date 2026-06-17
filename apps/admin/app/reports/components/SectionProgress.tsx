import { MOCK_SECTIONS } from "@manhaj/lib/mock-reports";

function dueChip(days: number): { label: string; tone: string } {
  if (days < 1)  return { label: "Due today",   tone: "danger" };
  if (days <= 2) return { label: `${days}d left`, tone: "warn"   };
  return { label: `${days}d left`, tone: "good" };
}

export default function SectionProgress() {
  return (
    <section className="rep-sp-card" aria-label="Section progress">
      <header className="rep-sp-head">
        <h3>Section progress · drafting + review</h3>
      </header>
      <ul className="rep-sp-list" role="list">
        {MOCK_SECTIONS.map(s => {
          const draftPct  = Math.round((s.drafted  / s.target) * 100);
          const reviewPct = Math.round((s.reviewed / s.target) * 100);
          const due = dueChip(s.days_to_due);
          return (
            <li key={s.section_id} className="rep-sp-row">
              <span className="rep-sp-label">
                <strong>{s.section_label}</strong>
                <span className="rep-sp-home">{s.homeroom}</span>
              </span>
              <span className="rep-sp-bar">
                <span className="rep-sp-fill draft"  style={{ width: `${draftPct}%`  }} />
                <span className="rep-sp-fill review" style={{ width: `${reviewPct}%` }} />
              </span>
              <span className="rep-sp-meta">{s.drafted} / {s.target} drafted · {s.reviewed} reviewed</span>
              <span className={`rep-sp-chip rep-sp-chip-${due.tone}`}>{due.label}</span>
              <button type="button" className="rep-sp-btn">Ping teacher</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
