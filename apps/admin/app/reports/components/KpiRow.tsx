import { reportKpis, MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT } from "@manhaj/lib/mock-reports";

export default function KpiRow() {
  const k = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  const pills = [
    { label: "Drafted",        value: `${k.drafted}`,   tone: "good" },
    { label: "In review",      value: `${k.in_review}`, tone: "warn" },
    { label: "Ready to send",  value: `${k.ready}`,     tone: "good" },
    { label: "Sent · opens / replies",
      value: `${k.sent_count}`,
      tone: "good",
      sub: `${k.open_rate}% opened · ${k.reply_rate}% replied` },
    { label: "Bounces",        value: `${k.bounced}`,   tone: k.bounced > 0 ? "danger" : "good" },
  ];
  return (
    <section className="rep-kpi-row" aria-label="Reports KPIs">
      {pills.map(p => (
        <div key={p.label} className={`rep-kpi rep-kpi-${p.tone}`}>
          <div className="rep-kpi-value">{p.value}</div>
          <div className="rep-kpi-label">{p.label}</div>
          {p.sub && <div className="rep-kpi-sub">{p.sub}</div>}
        </div>
      ))}
    </section>
  );
}
