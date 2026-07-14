type ReportTile = {
  icon: string;
  title: string;
  description: string;
  last_gen: string;
  formats: string[];
};

const REPORT_TILES: ReportTile[] = [
  {
    icon: "📋",
    title: "Enrolment by grade",
    description: "Live headcount per grade with bilingual labels and gender breakdown.",
    last_gen: "14 May",
    formats: ["PDF", "CSV"],
  },
  {
    icon: "📅",
    title: "Attendance summary",
    description: "Daily, weekly, or term · per student or aggregated · regulator-required cuts.",
    last_gen: "2 May",
    formats: ["PDF", "XLSX"],
  },
  {
    icon: "👤",
    title: "Staff roster & licences",
    description: "Teaching staff with licence numbers, expiry dates, qualifications, contract type.",
    last_gen: "29 Apr",
    formats: ["PDF", "XLSX"],
  },
  {
    icon: "🌍",
    title: "Demographic breakdown",
    description: "Nationality, language, special-needs flags · in MoE-standard categories.",
    last_gen: "14 Apr",
    formats: ["PDF", "CSV"],
  },
  {
    icon: "🛡️",
    title: "Safeguarding & incidents",
    description: "Logged incidents with response actions · redacted for student privacy.",
    last_gen: "30 Apr",
    formats: ["PDF"],
  },
  {
    icon: "📚",
    title: "Curriculum alignment",
    description: "Subjects taught vs MoE curriculum framework · gaps highlighted.",
    last_gen: "28 Mar",
    formats: ["PDF"],
  },
];

export default function GenerateReportGrid({ regulator }: { regulator: string }) {
  return (
    <section aria-label="Generate a report">
      <div className="reg-section-head">
        <span className="reg-section-label">Generate a report</span>
        <span className="reg-section-hint">Pre-formatted for {regulator}</span>
      </div>

      <div className="reg-gen-grid">
        {REPORT_TILES.map(t => (
          <div key={t.title} className="reg-gen-tile">
            <div className="reg-gen-icon">{t.icon}</div>
            <div className="reg-gen-title">{t.title}</div>
            <div className="reg-gen-desc">{t.description}</div>
            <div className="reg-gen-foot">
              <span className="reg-gen-last">Last gen {t.last_gen}</span>
              <div className="reg-gen-formats">
                {t.formats.map(f => (
                  <button key={f} className="reg-format-tag">{f}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
