/**
 * Admin Dashboard — AI briefing + 5 per-tab summary cards.
 *
 * Phase 3.2: Sections card moved to Admin Input. Dashboard now shows
 * Faculty · Students · Attendance · Schedule · Reports.
 *
 * Server component. Phase 3 swaps mock data for live RPCs — component shape
 * stays identical.
 */

import { getDashboardData } from "@manhaj/lib/data";
import { composeSummary } from "@manhaj/lib/summary";
import { AiBriefingHeader, TabSummaryCard, type TabSummary } from "@manhaj/ui";
import { MOCK_STUDENTS } from "@manhaj/lib/mock-students";
import { ATT_KPIS, ATT_CHRONIC, ATT_SECTIONS } from "@manhaj/lib/mock-attendance";
import { MOCK_ACTIONS } from "@manhaj/lib/mock-schedule";
import { MOCK_PIPELINE, MOCK_SECTIONS as RPT_SECTIONS } from "@manhaj/lib/mock-reports";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const summary = composeSummary("admin", data);
  const s = data.stats;
  const util = s.total_cap > 0 ? Math.round((100 * s.total_assigned) / s.total_cap) : 0;

  // Compute student stats from mock
  const enrolled = MOCK_STUDENTS.filter(st => st.status !== "admission-pending").length;
  const flagged  = MOCK_STUDENTS.filter(st => st.status === "support" || st.status === "watch").length;

  // Worst attendance section
  const worstSection = [...ATT_SECTIONS].sort((a, b) => a.week_pct - b.week_pct)[0];
  const chronicCount = ATT_CHRONIC.length;

  // Schedule conflicts + gaps
  const conflicts = MOCK_ACTIONS.filter(a => a.kind === "conflict").length;
  const gaps      = MOCK_ACTIONS.filter(a => a.kind === "gap").length;

  // Reports pipeline
  const sentCount   = MOCK_PIPELINE.find(p => p.stage === "sent")?.count ?? 0;
  const openedCount = MOCK_PIPELINE.find(p => p.stage === "opened")?.count ?? 0;
  const openRate    = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
  const urgentRpt   = RPT_SECTIONS.filter(r => r.days_to_due <= 1).length;

  const cards: TabSummary[] = [
    {
      label: "Faculty",
      href: "/faculty",
      big: String(s.n_teachers),
      big_suffix: "teachers",
      trend: s.over_capacity > 0
        ? { text: `▲ ${s.over_capacity} over capacity`, tone: "down" }
        : { text: "All within capacity", tone: "up" },
      rows: [
        { label: "Load utilisation", value: `${util}%` },
        { label: "With slack",       value: String(s.under_utilised) },
      ],
    },
    {
      label: "Students",
      href: "/students",
      big: String(enrolled),
      trend: flagged > 0
        ? { text: `▲ ${flagged} flagged for support`, tone: "down" }
        : { text: "All on track", tone: "up" },
      rows: [
        { label: "HS roster",          value: String(MOCK_STUDENTS.filter(st => st.grade_band === "HS" && st.status !== "admission-pending").length) },
        { label: "Course-sel done",    value: "14" },
      ],
    },
    {
      label: "Attendance",
      href: "/attendance",
      big: `${ATT_KPIS.this_week_pct}`,
      big_suffix: "%",
      trend: { text: "— flat vs last week", tone: "flat" },
      rows: [
        { label: `${worstSection?.section_code ?? "10B"} hotspot`, value: `${worstSection?.week_pct ?? 87}%` },
        { label: "Chronic absentees",  value: String(chronicCount) },
      ],
    },
    {
      label: "Schedule",
      href: "/schedule",
      big: String(conflicts + gaps),
      trend: (conflicts + gaps) > 0
        ? { text: `▲ ${conflicts} conflict${conflicts !== 1 ? "s" : ""} · ${gaps} gap${gaps !== 1 ? "s" : ""}`, tone: "down" }
        : { text: "No conflicts", tone: "up" },
      rows: [
        { label: "Sub-needed today",  value: String(ATT_KPIS.sub_coverage) },
        { label: "Next free period",  value: "P5 Tue" },
      ],
    },
    {
      label: "Reports",
      href: "/reports",
      big: String(sentCount),
      trend: { text: `▲ ${openRate}% opened this cycle`, tone: "up" },
      rows: [
        { label: "Urgent (≤1 day)",  value: urgentRpt > 0 ? String(urgentRpt) : "None" },
        { label: "Next batch",        value: `${RPT_SECTIONS[0]?.days_to_due ?? 3}d` },
      ],
    },
  ];

  return (
    <div className="container">
      <h1>Good morning, Principal.</h1>
      <p className="sub">Dashboard · AY {process.env.ACADEMIC_YEAR}</p>

      <AiBriefingHeader summary={summary} />

      <div className="tab-summary-grid">
        {cards.map(c => <TabSummaryCard key={c.label} summary={c} />)}
      </div>
    </div>
  );
}
