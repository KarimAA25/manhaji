import { scheduleKpis, MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM } from "@manhaj/lib/mock-schedule";

export default function KpiRow() {
  const k = scheduleKpis(MOCK_SLOTS, MOCK_ACTIONS, MOCK_TEACHER_LOADS, MOCK_CURRICULUM);
  const pills = [
    { label: "Periods covered",      value: `${k.coverage_pct}%`, tone: k.coverage_pct >= 95 ? "good" : "warn" },
    { label: "Open conflicts",       value: `${k.conflicts}`,     tone: k.conflicts === 0 ? "good" : "danger" },
    { label: "Unfilled periods",     value: `${k.gaps}`,          tone: k.gaps === 0 ? "good" : "warn" },
    { label: "Teacher load avg/max", value: `${k.avg_load} / ${k.max_load}`, tone: k.max_load > 28 ? "warn" : "good" },
    { label: "Curriculum coverage",  value: `${k.curriculum_pct}%`, tone: k.curriculum_pct >= 95 ? "good" : "warn" },
  ];
  return (
    <section className="sch-kpi-row" aria-label="Schedule KPIs">
      {pills.map(p => (
        <div key={p.label} className={`sch-kpi sch-kpi-${p.tone}`}>
          <div className="sch-kpi-value">{p.value}</div>
          <div className="sch-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
