import type { RegulatorySubmissionRow } from "@manhaj/lib/queries/reports";

const MOCK_SUBMISSIONS: RegulatorySubmissionRow[] = [
  { id: "m1", report_name: "Term 2 attendance summary",        regulator: "Oman MoE", period_label: "1 Jan – 28 Mar 2026",    submitted_at: "2026-04-30", submitted_by: "Dr. Patel", status: "approved",  file_url: null },
  { id: "m2", report_name: "Q1 incident & safeguarding return",regulator: "Oman MoE", period_label: "1 Jan – 31 Mar 2026",    submitted_at: "2026-04-15", submitted_by: "Ms. Salwa", status: "approved",  file_url: null },
  { id: "m3", report_name: "Staffing change notice — new hire",regulator: "Oman MoE", period_label: "15 Apr 2026",            submitted_at: "2026-04-16", submitted_by: "HR",        status: "approved",  file_url: null },
  { id: "m4", report_name: "Term 1 attendance summary",        regulator: "Oman MoE", period_label: "1 Sep – 19 Dec 2025",   submitted_at: "2026-01-10", submitted_by: "Dr. Patel", status: "approved",  file_url: null },
  { id: "m5", report_name: "Annual enrolment declaration",     regulator: "Oman MoE", period_label: "2025/26 academic year", submitted_at: "2025-10-05", submitted_by: "Dr. Patel", status: "approved",  file_url: null },
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

export default function RecentSubmissionsTable({
  submissions,
}: {
  submissions: RegulatorySubmissionRow[];
}) {
  const rows = submissions.length > 0 ? submissions : MOCK_SUBMISSIONS;

  return (
    <section aria-label="Recent submissions">
      <div className="reg-section-head">
        <span className="reg-section-label">Recent submissions</span>
        <button className="reg-history-link">View full history →</button>
      </div>

      <div className="reg-tbl-wrap">
        <table className="reg-recent-tbl">
          <thead>
            <tr>
              <th>Report</th>
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
                <td>{r.period_label}</td>
                <td>{fmtDate(r.submitted_at)}</td>
                <td>{r.submitted_by ?? "—"}</td>
                <td>
                  <span className={`reg-status-chip ${r.status}`}>
                    {STATUS_LABEL[r.status] ?? r.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {r.file_url
                    ? <a href={r.file_url} className="reg-download" target="_blank" rel="noopener noreferrer">Download ↓</a>
                    : <span className="reg-download" style={{ opacity: 0.35 }}>Download ↓</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
