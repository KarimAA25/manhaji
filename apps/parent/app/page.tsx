import Link from "next/link";
import GreetHero from "./components/GreetHero";
import DashTodayStrip from "./components/DashTodayStrip";
import DashStatRow from "./components/DashStatRow";
import QuickActionsRow from "./components/QuickActionsRow";
import { ParentDashboardClient, type ParentDashData } from "./ParentDashboardClient";
import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import {
  getParentChildren,
  getAttendanceForStudents,
  getRubricAvgForStudents,
  getTodaySlotsForSections,
  getNextExamForSections,
  getCourseSelectionsForStudents,
} from "@manhaj/lib/queries/parents";
import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getInvoicesForParent } from "@manhaj/lib/queries/invoices";
import { getReportArchive } from "@manhaj/lib/queries/reports";
import { listThreadsForParent } from "@manhaj/lib/messages";

export const dynamic = "force-dynamic";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

export default async function ParentDashboard() {
  const [parentId, academicYearId] = await Promise.all([
    getCurrentParentId().catch(() => null),
    getCurrentAcademicYearId().catch(() => null),
  ]);

  const now     = new Date();
  const toStr   = now.toISOString().slice(0, 10);
  const fromStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayDow     = DAYS[now.getDay()];
  const currentTime  = now.toISOString().slice(11, 16); // "HH:MM" UTC

  const [dbChildren, invoices, reportArchive, threads] = parentId
    ? await Promise.all([
        getParentChildren(parentId).catch(() => []),
        getInvoicesForParent(parentId).catch(() => []),
        getReportArchive({ parentId }).catch(() => []),
        listThreadsForParent().catch(() => []),
      ])
    : [[], [], [], []];

  const studentIds = dbChildren.map(c => c.student_id);
  const sectionIds = dbChildren.map(c => c.section_id).filter((id): id is string => id != null);

  const [attList, rubricList, todaySlots, nextExams, courseSelections] =
    studentIds.length > 0
      ? await Promise.all([
          getAttendanceForStudents(studentIds, fromStr, toStr).catch(() => []),
          getRubricAvgForStudents(studentIds).catch(() => []),
          sectionIds.length > 0 && academicYearId
            ? getTodaySlotsForSections(sectionIds, academicYearId, todayDow, currentTime).catch(() => ({}))
            : Promise.resolve({}),
          sectionIds.length > 0
            ? getNextExamForSections(sectionIds, toStr).catch(() => ({}))
            : Promise.resolve({}),
          academicYearId
            ? getCourseSelectionsForStudents(studentIds, academicYearId).catch(() => ({}))
            : Promise.resolve({}),
        ])
      : [[], [], {}, {}, {}];

  // Invoice summary
  const unpaid = invoices.filter(i => i.status !== "paid");
  const outstandingTotal = unpaid.reduce((s, i) => s + i.amount_owed_aed, 0);
  const nextDue = [...unpaid].sort((a, b) =>
    (a.due_on ?? "").localeCompare(b.due_on ?? "")
  )[0];
  const nextDueLabel = nextDue
    ? `due ${new Date(nextDue.due_on!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : null;

  // Messages
  const unreadCount       = threads.filter(t => t.unread).length;
  const latestThreadFrom  = threads[0]?.from_label ?? null;
  const openThreadCount   = unreadCount;

  // Per-child stats
  const by_child: ParentDashData["by_child"] = {};
  for (const c of dbChildren) {
    const att      = attList.find(a => a.student_id === c.student_id);
    const rubric   = rubricList.find(r => r.student_id === c.student_id);
    const slot     = c.section_id ? (todaySlots as Record<string, unknown>)[c.section_id] : null;
    const exam     = c.section_id ? (nextExams as Record<string, unknown>)[c.section_id]  : null;
    const cs       = (courseSelections as Record<string, unknown>)[c.student_id] ?? null;
    by_child[c.student_id] = {
      student_id:       c.student_id,
      att_pct:          att?.pct ?? 0,
      att_absences:     att?.absences ?? 0,
      rubric_avg:       rubric?.avg ?? 0,
      today_slot:       (slot ?? null) as ParentDashData["by_child"][string]["today_slot"],
      next_exam:        (exam ?? null) as ParentDashData["by_child"][string]["next_exam"],
      course_selection: (cs   ?? null) as ParentDashData["by_child"][string]["course_selection"],
    };
  }

  const dashData: ParentDashData = {
    outstanding_total:  outstandingTotal,
    next_due_date:      nextDue?.due_on ?? null,
    next_due_label:     nextDueLabel,
    report_count:       reportArchive.length,
    unread_count:       unreadCount,
    latest_thread_from: latestThreadFrom,
    open_thread_count:  openThreadCount,
    by_child,
  };

  // 2×2 invoice card
  const invoiceCardBig   = outstandingTotal > 0 ? `OMR ${outstandingTotal.toLocaleString()}` : "All paid";
  const invoiceCardTrend = nextDue
    ? `${nextDueLabel} · ${nextDue.what_for ?? "balance"}`
    : "no outstanding invoices";
  const invoiceCardTone  = outstandingTotal > 0 ? " warn" : "";
  const paidTotal        = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount_owed_aed, 0);

  // 2×2 reports card
  const reportCount     = reportArchive.length;
  const lastReportLabel = reportArchive[0]?.generated_at
    ? new Date(reportArchive[0].generated_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  // 2×2 course selection card — household view: first child with a form
  const firstCs = dbChildren
    .map(c => ({ child: c, cs: (by_child[c.student_id]?.course_selection) }))
    .find(x => x.cs != null);
  const csStatus     = firstCs?.cs?.status ?? null;
  const csPicksCount = firstCs?.cs?.picks_count ?? 0;
  const csSubmitted  = firstCs?.cs?.submitted_at
    ? new Date(firstCs.cs.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;
  const csLabel = csStatus === "submitted" || csStatus === "locked"
    ? "Submitted"
    : csStatus === "draft"
    ? "In progress"
    : "Not started";

  // 2×2 messages card
  const msgBig   = unreadCount > 0 ? unreadCount : threads.length > 0 ? threads.length : 0;
  const msgLabel = unreadCount > 0 ? "new" : "total";
  const msgFrom  = latestThreadFrom ? `from ${latestThreadFrom}` : "no messages yet";
  const lastReply = threads[0]?.last_activity_at
    ? new Date(threads[0].last_activity_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;

  return (
    <ParentDashboardClient data={dashData}>
      <div className="container">
        <GreetHero />
        <DashTodayStrip />
        <DashStatRow />
        <QuickActionsRow />

        <div className="dash-divider" aria-hidden="true">Jump into a tab</div>

        <div className="sd-card-grid">
          <Link href="/courses" className="sd-card">
            <div className="sd-card-head">
              <span className="sd-card-label">Course Selection</span>
              <span className="sd-card-arrow" aria-hidden="true">→</span>
            </div>
            <div className="sd-card-big">{csLabel}</div>
            <div className={`sd-card-trend${csStatus === "submitted" || csStatus === "locked" ? " up" : ""}`}>
              {csSubmitted ? `${csSubmitted} · submitted` : csStatus === "draft" ? "draft in progress" : "no form yet"}
            </div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Electives picked</span><b>{csPicksCount > 0 ? csPicksCount : "—"}</b></div>
              <div className="sd-card-row"><span>Status</span><b>{csStatus ?? "—"}</b></div>
            </div>
          </Link>

          <Link href="/past-reports" className="sd-card">
            <div className="sd-card-head">
              <span className="sd-card-label">Past Reports</span>
              <span className="sd-card-arrow" aria-hidden="true">→</span>
            </div>
            <div className="sd-card-big">{reportCount > 0 ? reportCount : "—"}</div>
            <div className="sd-card-trend">archive · since Sept 2025</div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Last generated</span><b>{lastReportLabel ?? "—"}</b></div>
              <div className="sd-card-row"><span>Total available</span><b>{reportCount > 0 ? reportCount : "—"}</b></div>
            </div>
          </Link>

          <Link href="/invoices" className="sd-card">
            <div className="sd-card-head">
              <span className="sd-card-label">Invoices</span>
              <span className="sd-card-arrow" aria-hidden="true">→</span>
            </div>
            <div className={`sd-card-big${invoiceCardTone}`}>{invoiceCardBig}</div>
            <div className={`sd-card-trend${invoiceCardTone}`}>{invoiceCardTrend}</div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Paid this year</span><b>OMR {paidTotal.toLocaleString()}</b></div>
              <div className="sd-card-row"><span>Unpaid invoices</span><b>{unpaid.length}</b></div>
            </div>
          </Link>

          <Link href="/messages" className="sd-card">
            <div className="sd-card-head">
              <span className="sd-card-label">Messages</span>
              <span className="sd-card-arrow" aria-hidden="true">→</span>
            </div>
            <div className="sd-card-big">
              {msgBig}{" "}
              <span style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600 }}>{msgLabel}</span>
            </div>
            <div className="sd-card-trend">{msgFrom}</div>
            <div className="sd-card-rows">
              <div className="sd-card-row">
                <span>Last activity</span>
                <b>{lastReply ?? "—"}</b>
              </div>
              <div className="sd-card-row">
                <span>Unread threads</span>
                <b>{unreadCount > 0 ? unreadCount : "none"}</b>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ParentDashboardClient>
  );
}
