import { getCommDraftPipelineCounts, getCommTemplates, getAuditLogRecent } from "@manhaj/lib/queries/reports";
import ReportsPageClient from "./ReportsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [pipelineCounts, templates, auditLog] = await Promise.all([
    getCommDraftPipelineCounts().catch(() => ({} as Record<string, number>)),
    getCommTemplates().catch(() => []),
    getAuditLogRecent(50).catch(() => []),
  ]);
  return <ReportsPageClient pipelineCounts={pipelineCounts} templates={templates} auditLog={auditLog} />;
}
