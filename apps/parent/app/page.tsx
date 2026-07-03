import Link from "next/link";
import GreetHero from "./components/GreetHero";
import DashTodayStrip from "./components/DashTodayStrip";
import DashStatRow from "./components/DashStatRow";
import QuickActionsRow from "./components/QuickActionsRow";
import { ParentDashboardClient, type ParentDashData } from "./ParentDashboardClient";
import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import { getParentChildren, getAttendanceForStudents, getRubricAvgForStudents } from "@manhaj/lib/queries/parents";
import { getInvoicesForParent } from "@manhaj/lib/queries/invoices";
import { getReportArchive } from "@manhaj/lib/queries/reports";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const parentId = await getCurrentParentId().catch(() => null);

  const today   = new Date();
  const toStr   = today.toISOString().slice(0, 10);
  const fromStr = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [dbChildren, invoices, reportArchive] = parentId
    ? await Promise.all([
        getParentChildren(parentId).catch(() => []),
        getInvoicesForParent(parentId).catch(() => []),
        getReportArchive({ parentId }).catch(() => []),
      ])
    : [[], [], []];

  const studentIds = dbChildren.map(c => c.student_id);

  const [attList, rubricList] = studentIds.length > 0
    ? await Promise.all([
        getAttendanceForStudents(studentIds, fromStr, toStr).catch(() => []),
        getRubricAvgForStudents(studentIds).catch(() => []),
      ])
    : [[], []];

  // Invoice summary
  const unpaid = invoices.filter(i => i.status !== "paid");
  const outstandingTotal = unpaid.reduce((s, i) => s + i.amount_owed_aed, 0);
  const nextDue = [...unpaid].sort((a, b) =>
    (a.due_on ?? "").localeCompare(b.due_on ?? "")
  )[0];
  const nextDueDate  = nextDue?.due_on ?? null;
  const nextDueLabel = nextDue ? `due ${nextDue.due_on?.slice(5).replace("-", " ") ?? ""}` : null;

  // Per-child stats map
  const by_child: ParentDashData["by_child"] = {};
  for (const c of dbChildren) {
    const att    = attList.find(a => a.student_id === c.student_id);
    const rubric = rubricList.find(r => r.student_id === c.student_id);
    by_child[c.student_id] = {
      student_id:   c.student_id,
      att_pct:      att?.pct ?? 0,
      att_absences: att?.absences ?? 0,
      rubric_avg:   rubric?.avg ?? 0,
    };
  }

  const dashData: ParentDashData = {
    outstanding_total: outstandingTotal,
    next_due_date:     nextDueDate,
    next_due_label:    nextDueLabel,
    report_count:      reportArchive.length,
    by_child,
  };

  // Invoice card summary
  const invoiceCardBig    = outstandingTotal > 0 ? `OMR ${outstandingTotal.toLocaleString()}` : "All paid";
  const invoiceCardTrend  = nextDue ? `due ${nextDue.due_on} · ${nextDue.what_for ?? "balance"}` : "no outstanding invoices";
  const invoiceCardTone   = outstandingTotal > 0 ? " warn" : "";
  const paidTotal         = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount_owed_aed, 0);

  // Reports card summary
  const reportCount = reportArchive.length;
  const lastReport  = reportArchive[0];
  const lastReportLabel = lastReport?.generated_at
    ? new Date(lastReport.generated_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "March 2026";

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
            <div className="sd-card-big">Submitted</div>
            <div className="sd-card-trend up">26 Jan · electives confirmed for 26/27</div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Electives picked</span><b>5</b></div>
              <div className="sd-card-row"><span>School to review by</span><b>29 Jan</b></div>
            </div>
          </Link>

          <Link href="/past-reports" className="sd-card">
            <div className="sd-card-head">
              <span className="sd-card-label">Past Reports</span>
              <span className="sd-card-arrow" aria-hidden="true">→</span>
            </div>
            <div className="sd-card-big">{reportCount > 0 ? reportCount : 8}</div>
            <div className="sd-card-trend">archive · since Sept 2025</div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Last generated</span><b>{lastReportLabel}</b></div>
              <div className="sd-card-row"><span>Total reports</span><b>{reportCount > 0 ? `${reportCount} available` : "3 available"}</b></div>
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
            <div className="sd-card-big">2 <span style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600 }}>new</span></div>
            <div className="sd-card-trend">from school</div>
            <div className="sd-card-rows">
              <div className="sd-card-row"><span>Last reply</span><b>14 May</b></div>
              <div className="sd-card-row"><span>Open thread</span><b>1</b></div>
            </div>
          </Link>
        </div>
      </div>
    </ParentDashboardClient>
  );
}
