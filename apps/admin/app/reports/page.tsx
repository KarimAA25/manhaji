import { getCommDraftPipelineCounts, getCommTemplates, getAuditLogRecent } from "@manhaj/lib/queries/reports";
import ReportsPageClient from "./ReportsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [pipelineCounts, templates, auditLog] = await Promise.all([
    getCommDraftPipelineCounts(),
    getCommTemplates(),
    getAuditLogRecent(50),
  ]);
  return <ReportsPageClient pipelineCounts={pipelineCounts} templates={templates} auditLog={auditLog} />;
}
