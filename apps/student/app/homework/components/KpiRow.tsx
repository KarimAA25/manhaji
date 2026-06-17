import { homeworkKpis, MOCK_HOMEWORK } from "@manhaj/lib/mock-homework";

export default function KpiRow() {
  const k = homeworkKpis(MOCK_HOMEWORK);
  const pills = [
    { label: "Overdue",        value: `${k.overdue}`,        tone: k.overdue > 0 ? "danger" : "good" },
    { label: "Due in 24h",     value: `${k.due_soon}`,       tone: "warn" },
    { label: "In progress",    value: `${k.in_progress}`,    tone: "good" },
    { label: "Done · 7 days",  value: `${k.done_this_week}`, tone: "good" },
  ];
  return (
    <section className="hw-kpi-row" aria-label="Homework KPIs">
      {pills.map(p => (
        <div key={p.label} className={`hw-kpi hw-kpi-${p.tone}`}>
          <div className="hw-kpi-value">{p.value}</div>
          <div className="hw-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
