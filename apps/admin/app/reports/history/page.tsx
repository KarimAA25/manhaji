import Link from "next/link";
import { getRegulatorySubmissions, type RegulatorySubmissionRow } from "@manhaj/lib/queries/reports";
import { generateHref, slugForCatalogName } from "../catalogue";

export const dynamic = "force-dynamic";

const MOCK_HISTORY: RegulatorySubmissionRow[] = [
  { id: "h1", report_name: "Annual Comprehensive Report",         regulator: "Oman MoE", period_label: "2024/25 academic year", submitted_at: "2025-07-18", submitted_by: "Dr. Patel", status: "approved", file_url: null },
  { id: "h2", report_name: "Staff Appointment Plan",              regulator: "Oman MoE", period_label: "AY 2025/26 planning",  submitted_at: "2025-06-20", submitted_by: "HR",        status: "approved", file_url: null },
  { id: "h3", report_name: "Educational Portal — data & results", regulator: "Oman MoE", period_label: "Term 1 2025/26",       submitted_at: "2025-12-15", submitted_by: "Registrar", status: "approved", file_url: null },
  { id: "h4", report_name: "Certified Bank Statement",            regulator: "Oman MoE", period_label: "H2 2025",             submitted_at: "2026-01-12", submitted_by: "Finance",   status: "submitted", file_url: null },
  { id: "h5", report_name: "Tuition-Fee Modification Request",    regulator: "Oman MoE", period_label: "2025 review",         submitted_at: "2025-09-30", submitted_by: "Dr. Patel", status: "under_review", file_url: null },
  { id: "h6", report_name: "Annual Comprehensive Report",         regulator: "Oman MoE", period_label: "2023/24 academic year", submitted_at: "2024-07-20", submitted_by: "Dr. Patel", status: "approved", file_url: null },
  { id: "h7", report_name: "Certified Bank Statement",            regulator: "Oman MoE", period_label: "H1 2025",             submitted_at: "2025-07-05", submitted_by: "Finance",   status: "approved", file_url: null },
  { id: "h8", report_name: "Staff Appointment Plan",              regulator: "Oman MoE", period_label: "AY 2024/25 planning",  submitted_at: "2024-06-18", submitted_by: "HR",        status: "approved", file_url: null },
];

const STATUS_LABEL: Record<string, string> = {
  approved: "ACCEPTED",
  submitted: "SUBMITTED",
  under_review: "UNDER REVIEW",
  rejected: "REJECTED",
  resubmit_required: "RESUBMIT",
  draft: "DRAFT",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function downloadHref(r: RegulatorySubmissionRow): string {
  return r.file_url ?? generateHref(slugForCatalogName(r.report_name));
}

export default async function ReportsHistoryPage() {
  const submissions = await getRegulatorySubmissions(200).catch(() => []);
  const rows = submissions.length > 0 ? submissions : MOCK_HISTORY;

  return (
    <div className="container">
      <div className="reg-crumb">
        <Link href="/admin/reports">Reports</Link> <span>/ Full submission history</span>
      </div>
      <h1>Submission history</h1>
      <p className="sub">Every regulatory return filed for International School of Oman, most recent first.</p>

      <div className="reg-tbl-wrap">
        <table className="reg-recent-tbl">
          <thead>
            <tr>
              <th>Report</th>
              <th>Regulator</th>
              <th>Period</th>
              <th>Submitted</th>
              <th>By</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="reg-recent-nm">{r.report_name}</td>
                <td>{r.regulator ?? "Oman MoE"}</td>
                <td>{r.period_label}</td>
                <td>{fmtDate(r.submitted_at)}</td>
                <td>{r.submitted_by ?? "—"}</td>
                <td>
                  <span className={`reg-status-chip ${r.status}`}>
                    {STATUS_LABEL[r.status] ?? r.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <a href={downloadHref(r)} className="reg-download" target="_blank" rel="noopener noreferrer">
                    Download ↓
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
