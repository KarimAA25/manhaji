import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import { getInvoicesForParent } from "@manhaj/lib/queries/invoices";
import { getParentChildren } from "@manhaj/lib/queries/parents";
import InvoicesPageClient from "./InvoicesPageClient";

export const dynamic = "force-dynamic";

export default async function ParentInvoicesPage() {
  const parentId = await getCurrentParentId().catch(() => null);
  const [dbInvoices, dbChildren] = parentId
    ? await Promise.all([
        getInvoicesForParent(parentId).catch(() => []),
        getParentChildren(parentId).catch(() => []),
      ])
    : [[], []];
  return <InvoicesPageClient dbInvoices={dbInvoices} dbChildren={dbChildren} />;
}
