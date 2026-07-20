/**
 * Report catalogue — the single source of truth for what each report is and
 * how it should be generated. Pure data + helpers (no DB, no server-only
 * imports) so it can be shared by client components AND the /reports/generate
 * route handler.
 *
 * Oman MoE only for now (no other-regulator entity switcher). The MoE returns
 * are driven by the research catalogue in
 * docs/research/oman-regulatory-reporting/report-catalogue-2026-07.md.
 *
 * Report kinds:
 *   - "r1"             the flagship Annual Comprehensive Report (Art. 49) —
 *                      a full document filled from students / results / staff.
 *   - "data-plug"      a titled document populated from live data (roster /
 *                      results export style).
 *   - "needs-template" a labelled state: the official form/template exists only
 *                      with the school or the bank (§5 of the research), so we
 *                      render the data we hold + a data-request note, never a
 *                      silently-dead button.
 *   - "internal"       an internal (non-ministry) report — rendered in a
 *                      visual charts/summary layout, not the formal doc style.
 */

export type ReportCategory = "moe" | "internal";
export type ReportKind = "r1" | "data-plug" | "needs-template" | "internal";

export type ReportDef = {
  slug: string;
  titleEn: string;
  titleAr?: string;
  category: ReportCategory;
  kind: ReportKind;
  /** Who the return goes to (MoE returns only). */
  recipient?: string;
  /** Cadence / deadline note. */
  cadence?: string;
  /** Article / form reference. */
  formRef?: string;
  /** One-line description of what the document contains / covers. */
  summary: string;
  /** For needs-template: what only the school/bank can supply (§5). */
  needsNote?: string;
};

export const REPORTS_GENERATE_BASE = "/admin/reports/generate";
export const REPORTS_HISTORY_PATH = "/admin/reports/history";
export const SCHOOL_NAME_FALLBACK = "International School of Oman";

// ---------------------------------------------------------------------------
// The catalogue
// ---------------------------------------------------------------------------

export const REPORT_DEFS: ReportDef[] = [
  // --- Oman MoE recurring returns (research §2A) ---------------------------
  {
    slug: "r1-annual-comprehensive",
    titleEn: "Annual Comprehensive Report",
    titleAr: "التقرير الشامل عن سير الدراسة",
    category: "moe",
    kind: "r1",
    recipient: "DGPS / Governorate Education Directorate",
    cadence: "Annual · due ≤30 days after academic-year end",
    formRef: "MD 287/2017 · Art. 49",
    summary:
      "Student statistics & results, teaching/admin staff roster with qualifications, professional-development programmes and activities — the flagship recurring MoE return.",
  },
  {
    slug: "r2-portal-data-results",
    titleEn: "Educational Portal — data & results export",
    titleAr: "قيد البيانات والنتائج في البوابة التعليمية",
    category: "moe",
    kind: "data-plug",
    recipient: "MoE Educational Portal (re-key / upload)",
    cadence: "Continuous · results per term",
    formRef: "MD 287/2017 · Art. 38",
    summary:
      "Clean roster + results export shaped for re-keying into the Educational Portal. The portal's exact field spec is only visible from the school's own portal account.",
  },
  {
    slug: "r4-staff-appointment-plan",
    titleEn: "Staff Appointment Plan",
    titleAr: "خطة تعيين الهيئتين التدريسية والإدارية",
    category: "moe",
    kind: "data-plug",
    recipient: "DGPS / Governorate Education Directorate",
    cadence: "Annual · ≥60 days before year start",
    formRef: "MD 287/2017 · Art. 62",
    summary:
      "Teaching & administrative roster with subjects and employment status — the data backbone of the annual appointment plan.",
  },
  {
    slug: "r3-bank-statement",
    titleEn: "Certified Bank Statement",
    titleAr: "كشف حساب معتمد من المصرف",
    category: "moe",
    kind: "needs-template",
    recipient: "DGPS",
    cadence: "Every 6 months",
    formRef: "MD 287/2017 · Art. 46",
    summary: "A bank-certified statement of the school's account.",
    needsNote:
      "This document is issued and stamped by the school's bank — Manhaji can't generate it. Use this as a calendar reminder and attach the bank's certified statement when filing.",
  },
  {
    slug: "r6-license-renewal",
    titleEn: "School Licence Renewal",
    titleAr: "طلب تجديد ترخيص مدرسة",
    category: "moe",
    kind: "needs-template",
    recipient: "DGPS Licensing",
    cadence: "Every 3 years · ≥4 months before expiry",
    formRef: "MD 287/2017 · Art. 25",
    summary: "The official licence-renewal application on the MoE form.",
    needsNote:
      "The renewal form (MoE forms library) and the school's licence metadata — licence number, category, expiry, bank-guarantee ref — aren't in Manhaji yet. See the data request (§5) for the blank form and last licence.",
  },
  {
    slug: "r7-fee-modification",
    titleEn: "Tuition-Fee Modification Request",
    titleAr: "طلب تعديل الرسوم الدراسية",
    category: "moe",
    kind: "needs-template",
    recipient: "MoE via DGPS window",
    cadence: "On change · within a DGPS circular window",
    formRef: "gov.om service card",
    summary: "The windowed fee-modification request with justification file.",
    needsNote:
      "Filed only in a DGPS circular window with a documented justification pack. The official form fields aren't public — attach the MoE form and the school's last fee-approval decision (§5).",
  },
  {
    slug: "incident-safeguarding",
    titleEn: "Incident & Safeguarding Return",
    titleAr: "تقرير الحوادث وحماية الطلبة",
    category: "moe",
    kind: "needs-template",
    recipient: "MoE",
    cadence: "Per governorate circular",
    formRef: "Safety register · Arts. 100–102",
    summary: "A summary of logged incidents and safeguarding actions.",
    needsNote:
      "Manhaji doesn't yet hold a safety/incident/drill log (a known schema gap — research §2C). Add the incident-log module, or attach the school's own safeguarding register when filing.",
  },

  // --- Internal (non-ministry) reports — visual layout --------------------
  {
    slug: "enrolment-by-grade",
    titleEn: "Enrolment by grade",
    category: "internal",
    kind: "internal",
    summary: "Live headcount per grade with a gender breakdown.",
  },
  {
    slug: "attendance-summary",
    titleEn: "Attendance summary",
    category: "internal",
    kind: "internal",
    summary: "Attendance rate by grade band — term to date.",
  },
  {
    slug: "staff-roster",
    titleEn: "Staff & department mix",
    category: "internal",
    kind: "internal",
    summary: "Teaching staff by department, with load and status.",
  },
  {
    slug: "demographic-breakdown",
    titleEn: "Demographic breakdown",
    category: "internal",
    kind: "internal",
    summary: "Gender split and grade-band distribution across the school.",
  },
];

const BY_SLUG = new Map(REPORT_DEFS.map((d) => [d.slug, d]));

export function getReportDef(slug: string): ReportDef | null {
  return BY_SLUG.get(slug) ?? null;
}

export function moeReturns(): ReportDef[] {
  return REPORT_DEFS.filter((d) => d.category === "moe");
}

export function internalReports(): ReportDef[] {
  return REPORT_DEFS.filter((d) => d.category === "internal");
}

/** URL for the printable generated document of a report. */
export function generateHref(slug: string): string {
  return `${REPORTS_GENERATE_BASE}/${slug}`;
}

/**
 * Best-effort slug for a live `regulatory_report_catalog` row when the DB
 * drives the Upcoming list. Matches on keywords; falls back to a normalised
 * slug so the generate route always resolves to *something* (a titled
 * data-plug document) rather than a dead button.
 */
export function slugForCatalogName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("comprehensive") || n.includes("annual report") || n.includes("شامل"))
    return "r1-annual-comprehensive";
  if (n.includes("portal") || n.includes("بوابة")) return "r2-portal-data-results";
  if (n.includes("appointment") || n.includes("staffing") || n.includes("تعيين"))
    return "r4-staff-appointment-plan";
  if (n.includes("bank") || n.includes("مصرف")) return "r3-bank-statement";
  if (n.includes("licen") || n.includes("ترخيص")) return "r6-license-renewal";
  if (n.includes("fee") || n.includes("رسوم")) return "r7-fee-modification";
  if (n.includes("incident") || n.includes("safeguard") || n.includes("حوادث"))
    return "incident-safeguarding";
  if (n.includes("enrol")) return "enrolment-by-grade";
  if (n.includes("attendance")) return "attendance-summary";
  return (
    "catalog-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
  );
}
