import { MOCK_GOALS, AXIS_LABELS } from "@manhaj/lib/mock-growth";

const STATUS_LABEL: Record<string, string> = { "on-track": "ON TRACK", "behind": "BEHIND", "done": "DONE" };

export default function GoalsList() {
  return (
    <section className="gr-goals-card" aria-label="Goals">
      <header className="gr-goals-head">
        <h3>My goals · this month</h3>
        <p className="gr-goals-sub">Set with your advisor at the start of term · updated weekly.</p>
      </header>
      <ul className="gr-goals-list" role="list">
        {MOCK_GOALS.map(g => {
          const axis = AXIS_LABELS.find(a => a.key === g.axis);
          return (
            <li key={g.id} className={`gr-goal-row gr-goal-${g.status}`}>
              <span className="gr-goal-tag">{axis?.label ?? g.axis}</span>
              <div className="gr-goal-body">
                <h4>{g.title}</h4>
                <p>{g.detail}</p>
                <div className="gr-goal-bar"><span className="gr-goal-fill" style={{ width: `${g.progress}%` }} /></div>
              </div>
              <div className="gr-goal-side">
                <span className={`gr-goal-chip gr-goal-chip-${g.status}`}>{STATUS_LABEL[g.status]}</span>
                <span className="gr-goal-when">Updated {g.last_update}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
