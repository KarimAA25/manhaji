import type { CauseCard } from "@manhaj/lib/mock-attendance";

export default function AiCausesCards({ rows }: { rows: CauseCard[] }) {
  return (
    <section className="aicauses-card att-block-cohort-only" aria-label="AI-attributed causes · this week">
      <header className="aicauses-head">
        <h3>AI-attributed causes · this week</h3>
        <p className="aicauses-sub">Manhaj clusters absences by likely cause. Confidence stamped per row.</p>
      </header>
      <div className="aicauses-grid">
        {rows.map(c => (
          <div key={c.id} className="aicauses-item">
            <div className="aicauses-h">
              <span className="aicauses-title">{c.title}</span>
              <span className={`aicauses-conf c-${c.confidence}`}>{c.confidence}</span>
            </div>
            <p className="aicauses-body">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
