"use client";

/**
 * Balance hero card for Parent Invoices.
 *
 * Two render modes:
 *   - mode="single": one child's outstanding + due date + Pay-now CTA
 *   - mode="household": cross-child total + earliest due
 *
 * Pay-now is intentionally disabled (Phase 3 payment provider).
 */

import type { Summary } from "@manhaj/lib/summary";
import { formatOmr, type ChildInvoices, type HouseholdSnapshot } from "@manhaj/lib/mock-invoices";

type Props =
  | { mode: "single"; summary: Summary; child: ChildInvoices }
  | { mode: "household"; summary: Summary; household: HouseholdSnapshot };

export default function BalanceHero(props: Props) {
  if (props.mode === "single") {
    const c = props.child;
    return (
      <section className="balance-hero" aria-label="Balance">
        <div className="balance-left">
          <div className="balance-l">Outstanding balance</div>
          <div className="balance-v">{formatOmr(c.outstanding)}.00</div>
          <div className="balance-due">{c.outstanding > 0 ? `Due ${c.due_date}` : "Paid in full"}</div>
          <div className="balance-meta">{c.child_name}</div>
        </div>
        <div className="balance-right">
          <button type="button" className="balance-btn primary" disabled aria-disabled="true" title="Payment provider lands in Phase 3">
            Pay {formatOmr(c.outstanding)} now
          </button>
          <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] split", c.child_id)}>Split into 3 monthly</button>
          <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] download", c.child_id)}>Download statement (PDF)</button>
        </div>
      </section>
    );
  }
  const h = props.household;
  return (
    <section className="balance-hero" aria-label="Household balance">
      <div className="balance-left">
        <div className="balance-l">Household balance · all children</div>
        <div className="balance-v">{formatOmr(h.total_outstanding)}.00</div>
        <div className="balance-due">{h.total_outstanding > 0 ? `Earliest due ${h.earliest_due_date}` : "All clear"}</div>
        <div className="balance-meta">Paid this year: {formatOmr(h.paid_this_year)}</div>
      </div>
      <div className="balance-right">
        <button type="button" className="balance-btn primary" disabled aria-disabled="true" title="Payment provider lands in Phase 3">
          Pay all {formatOmr(h.total_outstanding)}
        </button>
        <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] split per child")}>Split per child</button>
        <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] download all")}>Download statements (PDFs)</button>
      </div>
    </section>
  );
}
