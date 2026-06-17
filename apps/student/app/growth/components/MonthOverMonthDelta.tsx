import { MOM_DELTA } from "@manhaj/lib/mock-student-academic";

const DELTA_ICON: Record<"up" | "flat" | "down", string> = {
  up:   "▲",
  flat: "—",
  down: "▼",
};

export default function MonthOverMonthDelta() {
  return (
    <section className="gr-section" aria-label="Month-over-month delta">
      <div className="gr-section-lbl">What changed</div>
      <h3 className="gr-section-title">What changed since April · month-over-month delta</h3>

      <div className="gr-delta-grid">
        {MOM_DELTA.map(group => (
          <div
            key={group.kind}
            className={`gr-delta-card ${group.kind}`}
            aria-label={`${group.label}: ${group.caption}`}
          >
            <div className="gr-delta-head">
              <div className="gr-delta-icon" aria-hidden="true">
                {DELTA_ICON[group.kind]}
              </div>
              <span className="gr-delta-label">{group.label}</span>
            </div>

            <p className="gr-delta-caption">{group.caption}</p>

            <div className="gr-delta-items" role="list">
              {group.items.map(item => (
                <div key={item.subject} className="gr-delta-item" role="listitem">
                  <span className="gr-delta-item-subj">{item.subject}</span>
                  <span className="gr-delta-item-val">{item.delta}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
