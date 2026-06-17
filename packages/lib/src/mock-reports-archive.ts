/**
 * Manhaj Phase 2.9 demo fixture — 11 archived reports per child (3 children).
 * 9 monthly (Sep 2025 → May 2026) + 2 term (Term 1, Term 2) = 11 × 3 = 33.
 * Mirrors a future RPC return.
 */

export type ReportType = "monthly" | "term";

export type ArchivedReport = {
  id:          string;
  child_id:    string;
  child_name:  string;
  period:      string;
  type:        ReportType;
  date:        string;
  headline:    string;
  axes:        Array<{ name: string; score: number; trend: "up" | "flat" | "down" }>;
  prev_summary?: string;
};

const CHILDREN: Array<{ id: string; name: string }> = [
  { id: "layla-al-habsi",  name: "Layla Al-Habsi"  },
  { id: "omar-al-habsi",   name: "Omar Al-Habsi"   },
  { id: "yasmin-al-habsi", name: "Yasmin Al-Habsi" },
];

const MONTHS: Array<{ period: string; date: string }> = [
  { period: "September 2025", date: "2025-09-28" },
  { period: "October 2025",   date: "2025-10-28" },
  { period: "November 2025",  date: "2025-11-28" },
  { period: "December 2025",  date: "2025-12-19" },
  { period: "January 2026",   date: "2026-01-28" },
  { period: "February 2026",  date: "2026-02-26" },
  { period: "March 2026",     date: "2026-03-28" },
  { period: "April 2026",     date: "2026-04-28" },
  { period: "May 2026",       date: "2026-05-28" },
];

const TERMS: Array<{ period: string; date: string }> = [
  { period: "Term 1 · 2025-26", date: "2025-12-15" },
  { period: "Term 2 · 2025-26", date: "2026-04-04" },
];

const LAYLA_HEADLINES: string[] = [
  "Strong start. English + History above target. Maths effort climbing.",
  "Solid month. MUN debate runner-up. Chemistry needs more lab time.",
  "Best month yet — top of class in English. Maths still mid-pack.",
  "Term 1 wrap: 5 of 7 subjects above target. Two areas to focus on.",
  "Energetic return. Effort + Communication scores at 6-month highs.",
  "Mid-term: Maths jumped from 3 → 4. Behaviour exemplary.",
  "Strong narrative essay (89/100). Lab work catching up to peers.",
  "Layla had a strong April. Highlights to celebrate, two areas to support.",
  "May mid-term week complete. Holding line on all 6 axes.",
];

const OMAR_HEADLINES: string[] = [
  "Bedding in well. PE + ICT strong. Reading volume still light.",
  "Football team selection — first 11. Maths quiz needs prep.",
  "Mixed month. Strong in clubs, slipping on homework hand-ins.",
  "Term 1 wrap: behaviour incident, recovery plan in place.",
  "January reset. 3 of 4 catch-up packs complete.",
  "Strong recovery month. Behaviour back to baseline.",
  "Maths confidence growing — first 80+ score this year.",
  "April steady. Watch homework consistency over May.",
  "End-of-year prep: 1 alert open · re-engagement plan agreed.",
];

const YASMIN_HEADLINES: string[] = [
  "Settled into KG2 routines. Phonics + Numeracy on track.",
  "Confident with peers. Music recital next week.",
  "Strong reading progress. 14 sight words secure.",
  "Term 1 wrap: meeting expectations across all areas.",
  "Loves the new art project. Building scissor confidence.",
  "Big personality on stage — spring concert second-verse soloist.",
  "Numeracy jump: counting to 30 secure.",
  "April: First independent reading. Family proud.",
  "Spring concert highlight. Strong year-end trajectory.",
];

function axesFor(childId: string, monthIndex: number): ArchivedReport["axes"] {
  // Layla's progression — improving over time.
  const base = childId === "layla-al-habsi"
    ? [3.6, 3.8, 4.0, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5]
    : childId === "omar-al-habsi"
    ? [3.2, 3.0, 2.9, 2.7, 3.0, 3.2, 3.4, 3.5, 3.6]
    : [4.2, 4.3, 4.3, 4.4, 4.5, 4.5, 4.6, 4.7, 4.7];
  const score = base[Math.min(monthIndex, base.length - 1)];
  const prev  = base[Math.max(0, monthIndex - 1)];
  const trend: "up" | "flat" | "down" =
    score > prev ? "up" : score < prev ? "down" : "flat";
  return [
    { name: "Academic",      score: round(score),       trend },
    { name: "Effort",        score: round(score + 0.2), trend },
    { name: "Behaviour",     score: round(score + 0.3), trend: "flat" },
    { name: "Collaboration", score: round(score + 0.1), trend },
    { name: "Communication", score: round(score),       trend },
    { name: "Self-direction",score: round(score - 0.1), trend },
  ];
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/* build reports                                                               */
/* -------------------------------------------------------------------------- */

function buildReports(): ArchivedReport[] {
  const out: ArchivedReport[] = [];
  for (const c of CHILDREN) {
    const headlines = c.id === "layla-al-habsi"  ? LAYLA_HEADLINES
                    : c.id === "omar-al-habsi"   ? OMAR_HEADLINES
                    : YASMIN_HEADLINES;
    for (let i = 0; i < MONTHS.length; i++) {
      const m = MONTHS[i];
      out.push({
        id:         `${c.id}-${m.period.toLowerCase().replace(/\s+/g, "-")}`,
        child_id:   c.id,
        child_name: c.name,
        period:     m.period,
        type:       "monthly",
        date:       m.date,
        headline:   headlines[i],
        axes:       axesFor(c.id, i),
      });
    }
    for (const t of TERMS) {
      out.push({
        id:         `${c.id}-${t.period.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        child_id:   c.id,
        child_name: c.name,
        period:     t.period,
        type:       "term",
        date:       t.date,
        headline:   c.id === "layla-al-habsi"
                      ? "Term snapshot: 5 of 7 subjects above target. Two areas to focus on."
                      : c.id === "omar-al-habsi"
                      ? "Term snapshot: behaviour incident closed. Re-engagement plan in place."
                      : "Term snapshot: meeting expectations across all KG2 areas.",
        axes:       axesFor(c.id, c.id === "layla-al-habsi" ? 7 : 4),
      });
    }
  }
  return out;
}

export const MOCK_ARCHIVE: ArchivedReport[] = buildReports();

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function archiveForChild(reports: ArchivedReport[], childId: string): ArchivedReport[] {
  if (childId === "all") return reports;
  return reports.filter(r => r.child_id === childId);
}

export function archiveKpis(reports: ArchivedReport[]) {
  return {
    total:   reports.length,
    monthly: reports.filter(r => r.type === "monthly").length,
    term:    reports.filter(r => r.type === "term").length,
  };
}

export function latestReport(reports: ArchivedReport[], childId?: string): ArchivedReport | null {
  const scope = childId ? reports.filter(r => r.child_id === childId) : reports;
  if (scope.length === 0) return null;
  return [...scope].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function reportsByChild(reports: ArchivedReport[]): Map<string, ArchivedReport[]> {
  const m = new Map<string, ArchivedReport[]>();
  for (const r of reports) {
    if (!m.has(r.child_id)) m.set(r.child_id, []);
    m.get(r.child_id)!.push(r);
  }
  // Sort each child's list newest-first
  for (const list of m.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return m;
}
