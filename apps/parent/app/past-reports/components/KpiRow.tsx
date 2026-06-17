import { archiveKpis, type ArchivedReport } from "@manhaj/lib/mock-reports-archive";

export default function KpiRow({ reports }: { reports: ArchivedReport[] }) {
  const k = archiveKpis(reports);
  const pills = [
    { label: "Total reports", value: `${k.total}`,   tone: "good" },
    { label: "Monthly",        value: `${k.monthly}`, tone: "good" },
    { label: "Term",           value: `${k.term}`,    tone: "good" },
  ];
  return (
    <section className="pr-kpi-row" aria-label="Archive KPIs">
      {pills.map(p => (
        <div key={p.label} className={`pr-kpi pr-kpi-${p.tone}`}>
          <div className="pr-kpi-value">{p.value}</div>
          <div className="pr-kpi-label">{p.label}</div>
        </div>
      ))}
    </section>
  );
}
