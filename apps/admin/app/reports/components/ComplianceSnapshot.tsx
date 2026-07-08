type ComplianceTile = {
  category: string;
  status: string;
  tone: "good" | "warn" | "bad";
  description: string;
};

const TILES: ComplianceTile[] = [
  {
    category: "Curriculum alignment",
    status: "● Aligned",
    tone: "good",
    description: "All grades · last audit 28 Mar",
  },
  {
    category: "Teacher licensing",
    status: "▲ 2 expiring soon",
    tone: "warn",
    description: "Both renewals due before 30 Jun",
  },
  {
    category: "Safeguarding training",
    status: "● 100% complete",
    tone: "good",
    description: "All 69 staff certified this year",
  },
  {
    category: "Health & safety audit",
    status: "● Passed",
    tone: "good",
    description: "Last inspection 13 Feb · next due Sep 2026",
  },
];

export default function ComplianceSnapshot() {
  return (
    <section aria-label="Compliance snapshot">
      <div className="reg-section-head">
        <span className="reg-section-label">Compliance snapshot</span>
        <span className="reg-section-hint">Live · refreshed daily</span>
      </div>

      <div className="reg-compliance-grid">
        {TILES.map(t => (
          <div key={t.category} className="reg-compliance-tile">
            <div className="reg-compliance-cat">{t.category}</div>
            <div className={`reg-compliance-status ${t.tone}`}>{t.status}</div>
            <div className="reg-compliance-desc">{t.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
