"use client";

import { useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import { MOCK_ARCHIVE, archiveForChild, latestReport } from "@manhaj/lib/mock-reports-archive";
import { useMemo } from "react";

import KpiRow             from "./components/KpiRow";
import ReportTimeline     from "./components/ReportTimeline";
import ReportPreviewCard  from "./components/ReportPreviewCard";

export default function PastReportsClient() {
  const { activeId } = useActiveChild();
  const scoped  = useMemo(() => archiveForChild(MOCK_ARCHIVE, activeId), [activeId]);
  const latest  = useMemo(
    () => latestReport(MOCK_ARCHIVE, activeId === ALL_CHILDREN_ID ? undefined : activeId),
    [activeId],
  );

  return (
    <div className="container">
      <h1>Past Reports</h1>
      <p className="sub">
        {activeId === ALL_CHILDREN_ID
          ? "Archive across all children · AY 2025–26"
          : `Archive for ${latest?.child_name ?? "child"} · AY 2025–26`}
      </p>

      <KpiRow reports={scoped} />
      <ReportPreviewCard report={latest} />
      <ReportTimeline reports={scoped} />
    </div>
  );
}
