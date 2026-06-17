/**
 * AI alert banner for the Parent Invoices tab.
 *
 * Renders the cohort/household summary headline + suggested action with
 * the Manhaj attribution chip. Server component.
 */

import type { Summary } from "@manhaj/lib/summary";

export default function InvoiceAlert({ summary }: { summary: Summary }) {
  return (
    <aside className="invoice-alert" role="status" aria-label="Invoice summary">
      <span className="invoice-alert-tag">Manhaj</span>
      <span className="invoice-alert-body">
        <b>{summary.headline}</b>
        {summary.ai_suggested_action && <> {summary.ai_suggested_action}</>}
      </span>
    </aside>
  );
}
