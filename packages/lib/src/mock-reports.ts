/**
 * Manhaj Phase 2.7 demo fixture — synthetic parent-comms pipeline state for
 * the Admin Reports tab. Mirrors a future RPC return so swap is one import.
 */

export type PipelineStage = "draft" | "review" | "ready" | "sent" | "opened" | "replied" | "bounced";

export type PipelineStat = { stage: PipelineStage; count: number; label: string };

export type SectionReport = {
  section_id:    string;
  section_label: string;
  homeroom:      string;
  drafted:       number;
  reviewed:      number;
  target:        number;
  next_due:      string;
  days_to_due:   number;
};

export type Template = {
  id:          string;
  name:        string;
  category:    "Monthly" | "Term" | "Behavioural" | "Attendance" | "Fee" | "Achievement";
  icon:        string;
  last_used:   string;
  usage_count: number;
};

export type HeatmapRow = { section_id: string; section_label: string; by_month: number[] };

export type AuditEntry = {
  id:        string;
  timestamp: string;
  actor:     string;
  action:    string;
  scope:     string;
  result:    "success" | "warning" | "fail";
};

export const MOCK_PIPELINE: PipelineStat[] = [
  { stage: "draft",    count: 246, label: "Drafted"   },
  { stage: "review",   count: 188, label: "In review" },
  { stage: "ready",    count: 156, label: "Ready"     },
  { stage: "sent",     count: 421, label: "Sent"      },
  { stage: "opened",   count: 391, label: "Opened"    },
  { stage: "replied",  count: 161, label: "Replied"   },
  { stage: "bounced",  count:   4, label: "Bounced"   },
];

export const MOCK_SECTIONS: SectionReport[] = [
  { section_id: "10A", section_label: "10A · HS",      homeroom: "Ms Khan",   drafted: 24, reviewed: 18, target: 28, next_due: "2026-05-30", days_to_due: 3 },
  { section_id: "10B", section_label: "10B · HS",      homeroom: "Mr Faisal", drafted: 22, reviewed: 14, target: 26, next_due: "2026-05-30", days_to_due: 3 },
  { section_id: "9A",  section_label: "9A · HS",       homeroom: "Ms Aida",   drafted: 19, reviewed:  6, target: 25, next_due: "2026-05-29", days_to_due: 2 },
  { section_id: "9B",  section_label: "9B · MS",       homeroom: "Mr Omar",   drafted: 12, reviewed:  4, target: 24, next_due: "2026-05-28", days_to_due: 1 },
  { section_id: "7B",  section_label: "7B · MS",       homeroom: "Mr Khaled", drafted: 22, reviewed: 12, target: 22, next_due: "2026-06-02", days_to_due: 6 },
  { section_id: "KG2", section_label: "KG2 · Primary", homeroom: "Ms Layla",  drafted: 20, reviewed:  4, target: 20, next_due: "2026-05-27", days_to_due: 0 },
];

export const MOCK_TEMPLATES: Template[] = [
  { id: "mp-y10",  name: "Monthly progress · Y10",   category: "Monthly",     icon: "📊", last_used: "2026-05-22", usage_count: 142 },
  { id: "tr-y9",   name: "Term review · Y9",         category: "Term",        icon: "📝", last_used: "2026-04-30", usage_count:  89 },
  { id: "be-1",    name: "Behavioural follow-up",     category: "Behavioural", icon: "🧭", last_used: "2026-05-19", usage_count:  41 },
  { id: "at-1",    name: "Attendance warning",        category: "Attendance",  icon: "📅", last_used: "2026-05-24", usage_count:  67 },
  { id: "fe-1",    name: "Fee reminder · Term 2",    category: "Fee",         icon: "💳", last_used: "2026-05-15", usage_count:  53 },
  { id: "ac-1",    name: "Achievement spotlight",    category: "Achievement", icon: "🏆", last_used: "2026-05-12", usage_count:  29 },
];

export const HEATMAP_MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

export const MOCK_HEATMAP: HeatmapRow[] = [
  { section_id: "10A", section_label: "10A", by_month: [78, 82, 85, 80, 87, 91, 88, 92, 93] },
  { section_id: "10B", section_label: "10B", by_month: [72, 78, 80, 75, 81, 84, 86, 88, 90] },
  { section_id: "9A",  section_label: "9A",  by_month: [68, 71, 75, 70, 76, 80, 83, 85, 87] },
  { section_id: "9B",  section_label: "9B",  by_month: [62, 65, 68, 64, 70, 73, 76, 80, 82] },
  { section_id: "7B",  section_label: "7B",  by_month: [55, 60, 64, 60, 66, 70, 73, 76, 79] },
  { section_id: "KG2", section_label: "KG2", by_month: [88, 90, 92, 91, 93, 94, 95, 95, 96] },
];

export const MOCK_AUDIT: AuditEntry[] = [
  { id: "AU-5", timestamp: "2026-05-25 09:14", actor: "Ms Khan",   action: "Sent 28 Y10 monthly reports",                scope: "Parent comms · contact data",      result: "success" },
  { id: "AU-4", timestamp: "2026-05-24 16:38", actor: "Principal", action: "Approved Y10 monthly report batch",          scope: "Parent comms · review workflow",   result: "success" },
  { id: "AU-3", timestamp: "2026-05-22 11:02", actor: "System",    action: "4 reports bounced · invalid contact",        scope: "Parent comms · contact data",      result: "warning" },
  { id: "AU-2", timestamp: "2026-05-21 14:10", actor: "Mr Faisal", action: "Drafted 22 Y10B monthly reports",            scope: "Parent comms · authoring",         result: "success" },
  { id: "AU-1", timestamp: "2026-05-19 08:55", actor: "Principal", action: "Exported PDPL compliance log for Term 1",    scope: "Compliance · regulator export",    result: "success" },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function reportKpis(
  pipeline: PipelineStat[], sections: SectionReport[], _audit: AuditEntry[],
) {
  const byStage = Object.fromEntries(pipeline.map(p => [p.stage, p.count]));
  const sent     = byStage["sent"]    ?? 0;
  const opened   = byStage["opened"]  ?? 0;
  const replied  = byStage["replied"] ?? 0;
  const bounced  = byStage["bounced"] ?? 0;
  const draftedTotal  = sections.reduce((s, x) => s + x.drafted,  0);
  const reviewedTotal = sections.reduce((s, x) => s + x.reviewed, 0);
  const targetTotal   = sections.reduce((s, x) => s + x.target,   0);
  const ready = Math.max(0, targetTotal - draftedTotal + reviewedTotal); // descriptive only
  return {
    drafted:      draftedTotal,
    in_review:    Math.max(0, draftedTotal - reviewedTotal),
    ready,
    sent_count:   sent,
    open_rate:    sent === 0 ? 0 : Math.round((opened  / sent) * 100),
    reply_rate:   sent === 0 ? 0 : Math.round((replied / sent) * 100),
    bounced,
  };
}

export function sectionsAtRisk(sections: SectionReport[]): SectionReport[] {
  return sections.filter(s => s.days_to_due < 1);
}
