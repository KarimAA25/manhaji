import { IMPROVEMENT_PLAN } from "@manhaj/lib/mock-student-academic";

export default function ImprovementPlan() {
  return (
    <section className="gr-section" aria-label="Improvement plan">
      <div className="gr-section-lbl">Growth actions</div>
      <h3 className="gr-section-title">Improvement plan · three concrete actions</h3>

      <div className="gr-plan-grid">
        {IMPROVEMENT_PLAN.map(card => (
          <div key={card.id} className="gr-plan-card">
            <div className="gr-plan-icon" aria-hidden="true">
              {card.icon}
            </div>

            <h4>{card.headline}</h4>
            <p>{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
