import { formatOmr, type Installment } from "@manhaj/lib/mock-invoices";

const PILL_LABEL: Record<Installment["status"], string> = {
  paid:      "PAID IN FULL",
  partial:   "PARTIALLY PAID",
  scheduled: "SCHEDULED",
};

export default function InstallmentCards({ rows }: { rows: Installment[] }) {
  return (
    <section className="installments-card" aria-label="Installment plan">
      <header className="installments-head">
        <h3>Installment plan · AY 2025–26</h3>
        <p className="installments-sub">Three terms. Tap a card to see the line items.</p>
      </header>
      <div className="installments-grid">
        {rows.map(r => (
          <div key={r.id} className={`installments-tile inst-${r.status}`}>
            <div className="installments-head-row">
              <span className="installments-term">{r.label}</span>
              <span className="installments-period">{r.period}</span>
            </div>
            <div className="installments-amt">{formatOmr(r.total)}</div>
            <div className="installments-when">
              {r.status === "paid"      && `Paid · ${r.due_date}`}
              {r.status === "partial"   && `${formatOmr(r.total - r.paid)} outstanding · due ${r.due_date}`}
              {r.status === "scheduled" && `Invoice goes out ${r.due_date}`}
            </div>
            <span className={`installments-pill inst-pill-${r.status}`}>{PILL_LABEL[r.status]}</span>
            <a className="installments-receipt" href="#">
              {r.status === "paid"      ? "Receipt · PDF" : r.status === "partial" ? `View payments · ${r.lines.filter(l => l.status === "paid").length}` : "Set up auto-pay"}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
