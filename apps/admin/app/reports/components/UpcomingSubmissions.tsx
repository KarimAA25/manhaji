import type { RegulatoryUpcomingRow } from "@manhaj/lib/queries/reports";

type Urgency = "urgent" | "soon" | "upcoming";

type UpcomingItem = {
  id: string;
  title: string;
  form: string;
  description: string;
  due_label: string;
  urgency: Urgency;
  primary_action: string;
  secondary_action: string;
};

const MOCK_UPCOMING: UpcomingItem[] = [
  {
    id: "m1",
    title: "Q2 Incident & safeguarding return",
    form: "Form MoE-SG-04",
    description: "covers 1 Mar – 31 May 2026 · 4 incidents logged this quarter",
    due_label: "DUE IN 6 DAYS",
    urgency: "urgent",
    primary_action: "Generate & submit",
    secondary_action: "Review draft",
  },
  {
    id: "m2",
    title: "Term 3 attendance summary",
    form: "Form MoE-ATT-T3",
    description: "grades KG1 — G12 · pre-filled from daily attendance data",
    due_label: "DUE 30 JUNE",
    urgency: "soon",
    primary_action: "Generate",
    secondary_action: "Review draft",
  },
  {
    id: "m3",
    title: "Annual staffing & licensing roster",
    form: "Form MoE-STF-AN",
    description: "69 staff · 2 missing licence numbers (Ms. Ream · Mr. Hassan) — can fix",
    due_label: "DUE 15 JULY",
    urgency: "upcoming",
    primary_action: "Generate",
    secondary_action: "Fix & preview",
  },
];

function dbToItem(r: RegulatoryUpcomingRow): UpcomingItem {
  return {
    id: r.id,
    title: r.name,
    form: r.template_ref ?? "",
    description: r.description ?? r.deadline_cadence ?? "",
    due_label: r.deadline_cadence ?? "—",
    urgency: "upcoming",
    primary_action: "Generate",
    secondary_action: "Review draft",
  };
}

export default function UpcomingSubmissions({
  regulator,
  upcoming,
}: {
  regulator: string;
  upcoming: RegulatoryUpcomingRow[];
}) {
  const items: UpcomingItem[] = upcoming.length > 0
    ? upcoming.map(dbToItem)
    : MOCK_UPCOMING;

  return (
    <section aria-label="Upcoming submissions">
      <div className="reg-section-head">
        <span className="reg-section-label">Upcoming submissions</span>
        <span className="reg-section-hint">Next 90 days · {regulator}</span>
      </div>

      {items.map(item => (
        <div key={item.id} className="reg-upcoming-row">
          <div className="reg-upcoming-body">
            <div className="reg-upcoming-title">{item.title}</div>
            <div className="reg-upcoming-desc">
              {item.form && <span className="reg-upcoming-form">{item.form} · </span>}
              {item.description}
            </div>
          </div>
          <div className="reg-upcoming-right">
            <span className={`reg-badge ${item.urgency}`}>{item.due_label}</span>
            <div className="reg-upcoming-btns">
              <button className="reg-btn">{item.secondary_action}</button>
              <button className="reg-btn primary">{item.primary_action}</button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
