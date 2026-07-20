import { internalReports, generateHref } from "../catalogue";

const ICONS: Record<string, string> = {
  "enrolment-by-grade": "📋",
  "attendance-summary": "📅",
  "staff-roster": "👤",
  "demographic-breakdown": "🌍",
};

export default function GenerateReportGrid() {
  const tiles = internalReports();
  return (
    <section aria-label="Internal reports">
      <div className="reg-section-head">
        <span className="reg-section-label">Internal reports</span>
        <span className="reg-section-hint">Visual summaries · school leadership (not filed)</span>
      </div>

      <div className="reg-gen-grid">
        {tiles.map(t => (
          <a
            key={t.slug}
            href={generateHref(t.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="reg-gen-tile reg-gen-tile-link"
          >
            <div className="reg-gen-icon">{ICONS[t.slug] ?? "📊"}</div>
            <div className="reg-gen-title">{t.titleEn}</div>
            <div className="reg-gen-desc">{t.summary}</div>
            <div className="reg-gen-foot">
              <span className="reg-gen-last">Charts &amp; summary</span>
              <span className="reg-gen-open">View report →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
