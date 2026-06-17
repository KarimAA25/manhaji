"use client";

/**
 * Parent · Invoices tab.
 *
 * Child-aware rendering driven by useActiveChild(). Both household + single
 * views render all 6 blocks (matches the brainstorm-mockup deep-dive).
 * Household mode aggregates installments + payments across all children and
 * tags each row with the child's first name so the source is visible.
 */

import { useActiveChild, ALL_CHILDREN_ID, getActiveChild } from "@manhaj/lib/child";
import {
  MOCK_INVOICES, householdSnapshot, type Installment, type Payment,
} from "@manhaj/lib/mock-invoices";
import { invoiceParentSummary } from "@manhaj/lib/summary";

import InvoiceAlert      from "./components/InvoiceAlert";
import BalanceHero       from "./components/BalanceHero";
import InstallmentCards  from "./components/InstallmentCards";
import FeeBreakdown      from "./components/FeeBreakdown";
import PaymentHistory    from "./components/PaymentHistory";
import HouseholdRows     from "./components/HouseholdRows";

/** First-name only — used to compactly tag aggregated rows in household mode. */
function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

export default function ParentInvoicesPage() {
  const { activeId } = useActiveChild();
  const household = householdSnapshot(MOCK_INVOICES);
  const summary = invoiceParentSummary(MOCK_INVOICES, activeId, household);

  if (activeId === ALL_CHILDREN_ID) {
    // Aggregate across all children. Tag each row with the child's first name
    // so the parent can still see at a glance which kid each item belongs to.
    const allInstallments: Installment[] = MOCK_INVOICES.flatMap(c =>
      c.installments.map(i => ({ ...i, label: `${i.label} · ${firstName(c.child_name)}` })),
    );
    const allPayments: Payment[] = MOCK_INVOICES.flatMap(c =>
      c.payments.map(p => ({ ...p, for: `${p.for} · ${firstName(c.child_name)}` })),
    );
    const mostUrgent: Installment =
      allInstallments.find(i => i.status === "partial") ??
      allInstallments.find(i => i.status === "scheduled") ??
      allInstallments[0];

    return (
      <div className="container">
        <h1>Invoices</h1>
        <p className="sub">Household view · AY 2025–26</p>

        <InvoiceAlert summary={summary} />
        <BalanceHero mode="household" summary={summary} household={household} />
        <InstallmentCards rows={allInstallments} />
        <FeeBreakdown installment={mostUrgent} />
        <PaymentHistory rows={allPayments} />
        <HouseholdRows rows={MOCK_INVOICES} />
      </div>
    );
  }

  const child = getActiveChild(activeId);
  const row   = MOCK_INVOICES.find(r => r.child_id === activeId);

  if (!child || !row) {
    return (
      <div className="container">
        <h1>Invoices</h1>
        <p className="sub">No invoice data for this child.</p>
      </div>
    );
  }

  // Pick the most-urgent installment for the fee breakdown: partial first, otherwise next scheduled.
  const focused = row.installments.find(i => i.status === "partial")
              ?? row.installments.find(i => i.status === "scheduled")
              ?? row.installments[0];

  return (
    <div className="container">
      <h1>Invoices · {row.child_name}</h1>
      <p className="sub">{child.grade_label} · AY 2025–26</p>

      <InvoiceAlert summary={summary} />
      <BalanceHero mode="single" summary={summary} child={row} />
      <InstallmentCards rows={row.installments} />
      <FeeBreakdown installment={focused} />
      <PaymentHistory rows={row.payments} />
    </div>
  );
}
