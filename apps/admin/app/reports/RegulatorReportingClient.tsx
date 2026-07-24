"use client";

import type { RegulatorySubmissionRow, RegulatoryUpcomingRow } from "@manhaj/lib/queries/reports";
import UpcomingSubmissions  from "./components/UpcomingSubmissions";
import GenerateReportGrid   from "./components/GenerateReportGrid";
import RecentSubmissionsTable from "./components/RecentSubmissionsTable";
import ComplianceSnapshot   from "./components/ComplianceSnapshot";

const SCHOOL_NAME = "International School of Oman";

export default function RegulatorReportingClient({
  submissions,
  upcoming,
}: {
  submissions: RegulatorySubmissionRow[];
  upcoming: RegulatoryUpcomingRow[];
}) {
  return (
    <div className="container">
      <h1>Regulator Reporting</h1>
      <p className="sub">
        Official Oman MoE returns generated from your live data — audit-ready, print to PDF, filed on the ministry&rsquo;s own channel.
      </p>

      {/* Oman-only context strip (no regulator switcher — Oman MoE for now) */}
      <div className="reg-tabs-row">
        <span className="reg-scope-chip">Oman · Ministry of Education</span>
        <span className="reg-tabs-hint">
          Showing reports for <b>{SCHOOL_NAME}</b> · all data refreshed today
        </span>
      </div>

      <UpcomingSubmissions upcoming={upcoming} />
      <GenerateReportGrid />
      <RecentSubmissionsTable submissions={submissions} />
      <ComplianceSnapshot />
    </div>
  );
}
