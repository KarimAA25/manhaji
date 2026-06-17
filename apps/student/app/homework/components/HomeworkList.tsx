import { groupByStatus, relativeDue, MOCK_HOMEWORK, type HomeworkItem } from "@manhaj/lib/mock-homework";

const STATUS_LABEL: Record<HomeworkItem["status"], string> = {
  "overdue":     "OVERDUE",
  "due-today":   "DUE TODAY",
  "not-started": "NOT STARTED",
  "in-progress": "IN PROGRESS",
  "done":        "DONE",
};

export default function HomeworkList() {
  const groups = groupByStatus(MOCK_HOMEWORK);
  return (
    <section className="hw-list-card" aria-label="Homework list">
      <header className="hw-list-head">
        <h3>To do · {MOCK_HOMEWORK.length} items</h3>
      </header>
      {groups.map(g => (
        <div key={g.key} className={`hw-group hw-group-${g.key}`}>
          <div className="hw-group-label">{g.label} · {g.items.length}</div>
          <ul className="hw-group-list" role="list">
            {g.items.map(h => (
              <li key={h.id} className={`hw-row hw-row-${h.status}`}>
                <span className="hw-row-subj">{h.subject}</span>
                <span className="hw-row-body">
                  <span className="hw-row-title">{h.title}</span>
                  {h.ai_estimate && <span className="hw-row-ai">{h.ai_estimate}</span>}
                </span>
                <span className="hw-row-due">{relativeDue(h.due)}</span>
                <span className={`hw-row-status hw-row-status-${h.status}`}>{STATUS_LABEL[h.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
