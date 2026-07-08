"use client";

import { useState } from "react";
import type { RegulatorySubmissionRow, RegulatoryUpcomingRow } from "@manhaj/lib/queries/reports";
import UpcomingSubmissions  from "./components/UpcomingSubmissions";
import GenerateReportGrid   from "./components/GenerateReportGrid";
import RecentSubmissionsTable from "./components/RecentSubmissionsTable";
import ComplianceSnapshot   from "./components/ComplianceSnapshot";

const REGULATORS = ["Oman MoE", "KHDA", "ADEK", "SPEA"] as const;
type Regulator = typeof REGULATORS[number];

const SCHOOL_NAME = "International School of Oman";

export default function RegulatorReportingClient({
  submissions,
  upcoming,
}: {
  submissions: RegulatorySubmissionRow[];
  upcoming: RegulatoryUpcomingRow[];
}) {
  const [regulator, setRegulator] = useState<Regulator>("Oman MoE");

  return (
    <div className="container">
      <h1>Regulator Reporting</h1>
      <p className="sub">One-click exports in the format each regulator expects — pre-filled from your live data, audit-ready, signed PDF on submit.</p>

      {/* Regulator tab row */}
      <div className="reg-tabs-row">
        <div className="reg-tabs">
          {REGULATORS.map(r => (
            <button
              key={r}
              className={`reg-tab${regulator === r ? " active" : ""}`}
              onClick={() => setRegulator(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="reg-tabs-hint">
          Showing reports for <b>{SCHOOL_NAME}</b> · all data refreshed today
        </span>
      </div>

      {/* AI briefing */}
      <div className="reg-banner">
        <div className="reg-banner-avatar">M</div>
        <div className="reg-banner-body">
          <div className="reg-banner-title">
            3 reports due in the next 30 days, 1 needs attention now.
          </div>
          <div className="reg-banner-detail">
            Term 3 attendance summary (due 30 June) is 92% ready — staffing roster needs 3 missing licence numbers.
          </div>
          <div className="reg-banner-by">Drafted by Manhaj AI · refreshed today at 8:30 AM</div>
        </div>
      </div>

      <UpcomingSubmissions regulator={regulator} upcoming={upcoming} />
      <GenerateReportGrid regulator={regulator} />
      <RecentSubmissionsTable submissions={submissions} />
      <ComplianceSnapshot />
    </div>
  );
}
