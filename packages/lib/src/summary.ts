/**
 * Deterministic summary composer for the persona Dashboard headers.
 *
 * Pure function: takes DashboardData + persona (+ optional child id for the
 * parent persona later) and returns a 4-part summary object that the
 * <AiBriefingHeader /> renders.
 *
 * Phase 3 will replace the bodies of admin/student/parent composers with
 * Claude calls (Layer-2 prompt cache per docs/prompt_caching_spec.md) — the
 * exported signature stays the same.
 */

import type { DashboardData } from "./data";
import type { StudentRow, IncidentRow, AdmissionRow } from "./mock-students";
import type {
  DailyPoint, CauseCard, SectionWeekRow, ChronicRow, AttendanceKpis,
} from "./mock-attendance";
import type { ActionItem, TeacherLoad, CurriculumRow } from "./mock-schedule";
import type { PipelineStat, SectionReport, AuditEntry } from "./mock-reports";
import type { FacultyTeacher, Department, OnboardingStage } from "./mock-faculty";

export type Persona = "admin" | "student" | "parent";

export type Summary = {
  /** One-sentence anchor that goes in the H1 of the briefing card. */
  headline: string;
  /** Brief "today" line — typically 1 sentence. */
  today: string;
  /** Brief "this week" line. */
  this_week: string;
  /** Brief "this month" line. */
  this_month: string;
  /** Optional CTA suggestion (e.g. "Open Section Mapping"). */
  ai_suggested_action?: string;
};

export function composeSummary(persona: Persona, data: DashboardData): Summary {
  switch (persona) {
    case "admin":   return adminSummary(data);
    case "student": return studentSummary(data);
    case "parent":  return parentSummary(data);
  }
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

function adminSummary(data: DashboardData): Summary {
  const s = data.stats;
  const headlineBits: string[] = [];

  if (s.unmapped_sections > 0) {
    headlineBits.push(`${s.unmapped_sections} sections to map`);
  }
  if (s.over_capacity > 0) {
    headlineBits.push(`${s.over_capacity} teacher${s.over_capacity === 1 ? "" : "s"} over capacity`);
  }
  if (s.vacant_roles > 0) {
    headlineBits.push(`${s.vacant_roles} unfilled role${s.vacant_roles === 1 ? "" : "s"}`);
  }
  if (s.under_utilised > 0) {
    headlineBits.push(`${s.under_utilised} with slack to redistribute`);
  }

  const headline = headlineBits.length === 0
    ? "Plan is balanced — no flags this morning."
    : `${headlineBits.join(" · ")}.`;

  const today = s.unmapped_sections > 0
    ? `${s.unmapped_sections} sections awaiting confirmation today.`
    : s.over_capacity > 0
      ? `${s.over_capacity} teacher${s.over_capacity === 1 ? "" : "s"} over capacity today.`
      : "Nothing urgent flagged for today.";

  const this_week = s.n_load > 0
    ? `${s.n_load} weekly assignments across ${s.n_sections} sections.`
    : "Workbook has not been ingested yet.";

  const utilisation = s.total_cap > 0
    ? Math.round((100 * s.total_assigned) / s.total_cap)
    : 0;
  const this_month = `Load utilisation ${utilisation}% across ${s.n_teachers} teachers.`;

  const ai_suggested_action = s.unmapped_sections > 0
    ? "Open Section Mapping to confirm the high-school AS / A2 rows first."
    : undefined;

  return { headline, today, this_week, this_month, ai_suggested_action };
}

/* -------------------------------------------------------------------------- */
/* Student                                                                     */
/* -------------------------------------------------------------------------- */

function studentSummary(_data: DashboardData): Summary {
  // Phase 1 ships static student data (no student-specific feed yet). Phase 2
  // will pass real homework + schedule counts into this function.
  return {
    headline: "Good morning — here's where you stand.",
    today: "Your next class starts soon. Check My Schedule for what to bring.",
    this_week: "A few items due — open Homework to see them.",
    this_month: "Your rubric trends sit in My Growth — keep building.",
  };
}

/* -------------------------------------------------------------------------- */
/* Parent                                                                      */
/* -------------------------------------------------------------------------- */

function parentSummary(_data: DashboardData): Summary {
  return {
    headline: "Here's what to celebrate, what to support.",
    today: "Check the Today strip for what your child is doing right now.",
    this_week: "Upcoming exams and any school messages are highlighted below.",
    this_month: "Open the latest monthly report for the full rubric write-up.",
  };
}

/* -------------------------------------------------------------------------- */
/* Cohort summary for Admin Students tab                                       */
/* -------------------------------------------------------------------------- */

/**
 * Cohort-level summary for the Admin Students tab.
 *
 * Rule-based composition. Phase 3 will wrap a Claude call around the same
 * signature; this implementation gives us the exact shape that endpoint
 * has to return.
 */
export function studentsCohortSummary(
  students:   StudentRow[],
  incidents:  IncidentRow[],
  admissions: AdmissionRow[],
): Summary {
  const supportCount  = students.filter(s => s.status === "support").length;
  const watchCount    = students.filter(s => s.status === "watch").length;
  const renewalCount  = students.filter(s => s.status === "renewal-pending").length;
  const admissionsInReview = admissions.filter(a => a.status === "review").length;
  const total         = students.filter(s => s.status !== "admission-pending").length;

  // headline priority: support > admissions > renewal > steady
  let headline: string;
  if (supportCount > 0) {
    headline = `${supportCount} student${supportCount === 1 ? "" : "s"} flagged for support · ${watchCount} on the watchlist.`;
  } else if (admissionsInReview > 0) {
    headline = `${admissionsInReview} admission${admissionsInReview === 1 ? "" : "s"} in review.`;
  } else if (renewalCount > 0) {
    headline = `${renewalCount} re-enrollment${renewalCount === 1 ? "" : "s"} pending.`;
  } else {
    const sectionsCount = new Set(students.filter(s => s.section_code !== "—").map(s => s.section_code)).size;
    headline = `Cohort steady — ${total} students across ${sectionsCount} sections.`;
  }

  // today: name 1-2 high-risk students if any
  const highRisk = students.filter(s => s.risk_score >= 65);
  const today = highRisk.length === 0
    ? "No urgent risk flags today."
    : highRisk.length <= 2
      ? `${highRisk.map(s => s.full_name).join(" and ")} flagged at high risk today.`
      : `${highRisk.length} students at high risk today.`;

  // this_week: count incidents in the last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = incidents.filter(i => new Date(i.ts).getTime() >= sevenDaysAgo);
  const this_week = recent.length === 0
    ? "No new behavioural incidents this week."
    : `${recent.length} behavioural incident${recent.length === 1 ? "" : "s"} this week.`;

  // this_month: composite avg from fixture (delta is static placeholder until time-series lands)
  const realStudents = students.filter(s => s.status !== "admission-pending");
  const composite = realStudents.length === 0
    ? 0
    : Number((realStudents.reduce((sum, s) => sum + s.rubric_avg, 0) / realStudents.length).toFixed(1));
  const this_month = `Rubric composite ${composite} / 5 ▲ +0.18 vs last month.`;

  // ai_suggested_action: top-risk callout
  let ai_suggested_action: string | undefined;
  if (highRisk.length > 0) {
    const top = [...highRisk].sort((a, b) => b.risk_score - a.risk_score)[0];
    ai_suggested_action = `Open ${top.full_name}'s intervention log — risk score ${top.risk_score}.`;
  }

  return { headline, today, this_week, this_month, ai_suggested_action };
}

/* -------------------------------------------------------------------------- */
/* Cohort summary for Admin Attendance tab                                     */
/* -------------------------------------------------------------------------- */

/**
 * Cohort-level summary for the Admin Attendance tab.
 *
 * Rule-based composition. Phase 3 will wrap a Claude call around the same
 * signature; this implementation gives us the exact shape that endpoint
 * has to return.
 */
export function attendanceCohortSummary(
  daily:    DailyPoint[],
  causes:   CauseCard[],
  sections: SectionWeekRow[],
  chronic:  ChronicRow[],
  kpis:     AttendanceKpis,
): Summary {
  // Worst section: any section with week_pct < 90
  const worst = [...sections].sort((a, b) => a.week_pct - b.week_pct)[0];
  const highConfidenceCause = causes.find(c => c.confidence === "high");

  let headline: string;
  if (worst && worst.week_pct < 90) {
    const causeBit = highConfidenceCause ? ` · likely cause: ${highConfidenceCause.title.toLowerCase()}` : "";
    headline = `${worst.section_code} at ${worst.week_pct}%${causeBit}.`;
  } else {
    headline = `Attendance steady at ${kpis.this_week_pct.toFixed(1)}% — all sections on track.`;
  }

  const today = `${kpis.late_today_count} late arrivals today · ${kpis.sub_coverage} substitute coverage slot${kpis.sub_coverage === 1 ? "" : "s"} open.`;

  const this_week = `${chronic.length} chronic absentee${chronic.length === 1 ? "" : "s"} flagged · Monday dip pattern persists.`;

  const target = 95;
  const this_month = `Composite ${kpis.this_week_pct.toFixed(1)}% vs ${target}% target (+${(kpis.this_week_pct - target).toFixed(1)} pts).`;

  const ai_suggested_action = (worst && worst.week_pct < 90)
    ? `Review ${worst.section_code} parent comms before Friday — five chronic absences this week.`
    : undefined;

  return { headline, today, this_week, this_month, ai_suggested_action };
}

/* -------------------------------------------------------------------------- */
/* Invoice summary for Parent Invoices tab                                     */
/* -------------------------------------------------------------------------- */

import type { ChildInvoices, HouseholdSnapshot } from "./mock-invoices";
import { ALL_CHILDREN_ID, type ChildId } from "./child";
import { formatOmr } from "./mock-invoices";

export function invoiceParentSummary(
  rows:      ChildInvoices[],
  activeId:  ChildId,
  household: HouseholdSnapshot,
): Summary {
  if (activeId === ALL_CHILDREN_ID) {
    const total = household.total_outstanding;
    if (total === 0) {
      return {
        headline:   "All household invoices clear.",
        today:      "No outstanding balances.",
        this_week:  "Pay all → one tap covers every child.",
        this_month: `Next invoice across the household: ${household.next_invoice_label}.`,
      };
    }
    const childCount = rows.filter(r => r.outstanding > 0).length;
    return {
      headline:   `Household balance ${formatOmr(total)} due across ${childCount} children.`,
      today:      `Earliest due ${household.earliest_due_date}.`,
      this_week:  "Pay all → one tap covers every child.",
      this_month: `Next invoice across the household: ${household.next_invoice_label}.`,
      ai_suggested_action: `Pay the ${formatOmr(total)} household balance · or split per child.`,
    };
  }

  const child = rows.find(r => r.child_id === activeId);
  if (!child) {
    return {
      headline:   "No invoice data for this child.",
      today:      "",
      this_week:  "",
      this_month: "",
    };
  }

  if (child.outstanding === 0) {
    return {
      headline:   "All clear — paid in full.",
      today:      "No outstanding balance.",
      this_week:  "Bank transfers usually clear in 1-2 days.",
      this_month: "Next invoice goes out 1 July (Term 3).",
    };
  }

  const partial = child.installments.find(i => i.status === "partial");
  const todayLine = partial
    ? `Term ${partial.term} partial · ${formatOmr(partial.paid)} of ${formatOmr(partial.total)} paid.`
    : `Outstanding: ${formatOmr(child.outstanding)}.`;

  return {
    headline:   `${formatOmr(child.outstanding)} outstanding · due ${child.due_date}.`,
    today:      todayLine,
    this_week:  "Bank transfers usually clear in 1-2 days.",
    this_month: "Next invoice goes out 1 July (Term 3).",
    ai_suggested_action: `Pay ${formatOmr(child.outstanding)} now · or split into 3 monthly chunks.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Schedule summary for Admin Schedule tab                                     */
/* -------------------------------------------------------------------------- */

export function scheduleAdminSummary(
  actions: ActionItem[],
  loads:   TeacherLoad[],
  curriculum: CurriculumRow[],
): Summary {
  const conflicts = actions.filter(a => a.kind === "conflict");
  const gaps      = actions.filter(a => a.kind === "gap");
  const overloaded = loads.filter(l => Object.values(l.by_day).some(n => n > 5));
  const curTotal  = curriculum.reduce((s, r) => s + r.current_hr, 0);
  const tgtTotal  = curriculum.reduce((s, r) => s + r.target_hr,  0);
  const curPct    = tgtTotal === 0 ? 100 : Math.round((curTotal / tgtTotal) * 100);

  const parts: string[] = [];
  if (gaps.length > 0)      parts.push(`${gaps.length} unfilled period${gaps.length > 1 ? "s" : ""}`);
  if (conflicts.length > 0) parts.push(`${conflicts.length} room conflict${conflicts.length > 1 ? "s" : ""}`);

  const headline = parts.length === 0
    ? "Schedule clean — no conflicts or gaps this week."
    : `This week: ${parts.join(" · ")}.`;

  const firstConflict = conflicts[0];
  const firstGap      = gaps[0];
  const suggestedAction = firstConflict
    ? `Resolve conflict: ${firstConflict.subject ?? "room booking"} · ${firstConflict.when} · ${firstConflict.section}`
    : firstGap
    ? `Fill gap: ${firstGap.subject ?? "period"} · ${firstGap.when} · ${firstGap.section}`
    : "Review curriculum coverage before end of term.";

  return {
    headline,
    today:      `${actions.length} action item${actions.length !== 1 ? "s" : ""} in the queue — gaps and conflicts to resolve.`,
    this_week:  gaps.length > 0 ? `${gaps.length} unfilled period${gaps.length > 1 ? "s" : ""} across the timetable.` : "All periods filled this week.",
    this_month: `Curriculum coverage at ${curPct}% · ${overloaded.length > 0 ? `${overloaded.length} teacher${overloaded.length > 1 ? "s" : ""} over capacity` : "no teacher over capacity"}.`,
    ai_suggested_action: suggestedAction,
  };
}

/* -------------------------------------------------------------------------- */
/* Reports summary for Admin Reports tab                                       */
/* -------------------------------------------------------------------------- */

export function reportsAdminSummary(
  pipeline: PipelineStat[],
  sections: SectionReport[],
  audit:    AuditEntry[],
): Summary {
  const byStage  = Object.fromEntries(pipeline.map(p => [p.stage, p.count]));
  const total    = byStage["draft"]   ?? 0;
  const review   = byStage["review"]  ?? 0;
  const ready    = byStage["ready"]   ?? 0;
  const sent     = byStage["sent"]    ?? 0;
  const opened   = byStage["opened"]  ?? 0;
  const bounced  = byStage["bounced"] ?? 0;
  const openRate = sent === 0 ? 0 : Math.round((opened / sent) * 100);
  // "at risk" = sections where fewer than 80% of target drafts are reviewed
  const atRisk   = sections.filter(s => s.target > 0 && (s.reviewed / s.target) < 0.8);
  const recentBounce = audit.find(a => a.result === "warning");

  const headline = review > 0
    ? `${total} reports in pipeline · ${review} awaiting teacher review.`
    : `${total} reports in pipeline · ${ready} ready to send.`;

  return {
    headline,
    today:      review > 0
      ? `${review} draft${review > 1 ? "s" : ""} awaiting review across ${atRisk.length > 0 ? atRisk.length : "multiple"} sections.`
      : "All drafts approved and ready.",
    this_week:  sent > 0
      ? `Last batch: ${openRate}% open rate · ${bounced} bounce${bounced !== 1 ? "s" : ""}.`
      : `${ready} reports ready — scheduled to send Friday at 4pm.`,
    this_month: `${atRisk.length > 0 ? `${atRisk.length} section${atRisk.length > 1 ? "s" : ""} below 80% review completion. ` : "All sections on track. "}April batch: 89% open rate.`,
    ai_suggested_action: atRisk.length > 0
      ? `Nudge ${atRisk[0].section_label} (${atRisk[0].homeroom}) to finish ${atRisk[0].target - atRisk[0].reviewed} outstanding reviews.`
      : recentBounce
      ? `Review bounce queue: ${recentBounce.action}`
      : "Schedule next batch send for Friday 4pm.",
  };
}

/* -------------------------------------------------------------------------- */
/* Faculty summary for Admin Faculty tab                                       */
/* -------------------------------------------------------------------------- */

/**
 * Cohort-level summary for the Admin Faculty tab.
 *
 * Rule-based composition. Phase 4 will swap the body for a Claude call that
 * compares year-over-year load trends; the exported signature stays the same.
 */
export function facultyAdminSummary(
  teachers:   FacultyTeacher[],
  depts:      Department[],
  pipeline:   OnboardingStage[],
): Summary {
  const over      = teachers.filter(t => t.status === "over").length;
  const under     = teachers.filter(t => t.status === "under").length;
  const total     = teachers.length;
  const expiring3 = teachers.filter(t => t.contract_status === "expiring-3m").length;
  const expiring6 = teachers.filter(t => t.contract_status === "expiring-6m").length;
  const hired     = pipeline.find(p => p.stage === "Hired")?.count ?? 0;
  const offered   = pipeline.find(p => p.stage === "Offered")?.count ?? 0;

  // avg load utilisation across all teachers (cap = 28 periods/wk)
  const avgUtil = total === 0
    ? 0
    : Math.round(teachers.reduce((s, t) => s + t.periods_per_week, 0) / (total * 28) * 100);

  // most overloaded dept
  const worstDept = [...depts].sort((a, b) => b.over_capacity_count - a.over_capacity_count)[0];

  let headline: string;
  if (over > 0) {
    headline = `${over} teacher${over === 1 ? "" : "s"} over capacity · avg load utilisation ${avgUtil}%.`;
  } else if (expiring3 > 0) {
    headline = `${expiring3} contract${expiring3 === 1 ? "" : "s"} expiring within 3 months — review needed.`;
  } else {
    headline = `Faculty balanced at ${avgUtil}% load utilisation across ${total} teachers.`;
  }

  const today = over > 0
    ? `${worstDept.label} leads with ${worstDept.over_capacity_count} over-capacity teacher${worstDept.over_capacity_count === 1 ? "" : "s"}.`
    : "No over-capacity flags today.";

  const this_week = under > 0
    ? `${under} teacher${under === 1 ? "" : "s"} with spare capacity — consider load redistribution.`
    : "Load distribution balanced across all departments.";

  const this_month = expiring3 + expiring6 > 0
    ? `${expiring3 + expiring6} contracts require attention · ${hired} new hire${hired === 1 ? "" : "s"} this cycle.`
    : `All contracts up to date · ${offered} offer${offered === 1 ? "" : "s"} pending acceptance.`;

  const ai_suggested_action = over > 0
    ? `Redistribute ${Math.abs(under)} slack periods from ${worstDept.label} to relieve over-capacity teachers.`
    : expiring3 > 0
    ? `Open Contracts dashboard — ${expiring3} renewal${expiring3 === 1 ? "" : "s"} expire within 90 days.`
    : undefined;

  return { headline, today, this_week, this_month, ai_suggested_action };
}
