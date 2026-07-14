import { getRegulatorySubmissions, getRegulatoryUpcoming } from "@manhaj/lib/queries/reports";
import RegulatorReportingClient from "./RegulatorReportingClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [submissions, upcoming] = await Promise.all([
    getRegulatorySubmissions(10).catch(() => []),
    getRegulatoryUpcoming().catch(() => []),
  ]);
  return <RegulatorReportingClient submissions={submissions} upcoming={upcoming} />;
}
