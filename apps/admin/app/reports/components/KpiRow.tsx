import { reportKpis, MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT } from "@manhaj/lib/mock-reports";
import type { PipelineStat } from "@manhaj/lib/mock-reports";
import type { SectionDraftRow } from "@manhaj/lib/queries/reports";

type Props = {
  pipeline?: PipelineStat[];
  sectionProgress?: SectionDraftRow[];
};

export default function KpiRow({ pipeline, sectionProgress }: Props) {
  let k: ReturnType<typeof reportKpis>;

  if (pipeline && pipeline.some(p => p.count > 0)) {
    const get = (stage: string) => pipeline.find(p => p.stage === stage)?.count ?? 0;
    const sent = get("sent"), opened = get("opened"), replied = get("replied");
    const drafted  = sectionProgress ? sectionProgress.reduce((s, r) => s + r.drafted,  0) : get("draft");
    const reviewed = sectionProgress ? sectionProgress.reduce((s, r) => s + r.reviewed, 0) : 0;
    k = {
      drafted,
      in_review:  get("review") || Math.max(0, drafted - reviewed),
      ready:      get("ready"),
      sent_count: sent,
      open_rate:  sent > 0 ? Math.round((opened  / sent) * 100) : 0,
      reply_rate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
      bounced:    get("bounced"),
    };
  } else {
    k = reportKpis(MOCK_PIPELINE, MOCK_SECTIONS, MOCK_AUDIT);
  }

  const pills = [
    { label: "Drafted",                          value: `${k.drafted}`,    tone: "good"   },
    { label: "In review",                        value: `${k.in_review}`,  tone: "warn"   },
    { label: "Ready to send",                    value: `${k.ready}`,      tone: "good"   },
    { label: "Sent · opens / replies",           value: `${k.sent_count}`, tone: "good",
      sub: `${k.open_rate}% opened · ${k.reply_rate}% replied` },
    { label: "Bounces",                          value: `${k.bounced}`,    tone: k.bounced > 0 ? "danger" : "good" },
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
