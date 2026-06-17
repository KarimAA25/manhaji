import { formatOmr, type Installment } from "@manhaj/lib/mock-invoices";

export default function FeeBreakdown({ installment }: { installment: Installment }) {
  const total = installment.total;
  const outstanding = total - installment.paid;
  return (
    <section className="feebreakdown-card" aria-label={`Fee breakdown · ${installment.label}`}>
      <header className="feebreakdown-head">
        <h3>What&apos;s in this term&apos;s invoice</h3>
        <p className="feebreakdown-sub">{installment.label} · line items. Some are optional and can be opted out.</p>
      </header>
      <ul className="feebreakdown-list">
        {installment.lines.map((line, i) => (
          <li key={i} className="feebreakdown-row">
            <span className="feebreakdown-nm">{line.label}{line.note && <small>{line.note}</small>}</span>
            <span className="feebreakdown-v">{formatOmr(line.amount)}</span>
            <span className={`feebreakdown-status feebreakdown-status-${line.status}`}>{line.status}</span>
          </li>
        ))}
        <li className="feebreakdown-row feebreakdown-total">
          <span className="feebreakdown-nm" style={{ fontWeight: 800 }}>{installment.label} total</span>
          <span className="feebreakdown-v" style={{ fontSize: 14 }}>{formatOmr(total)}</span>
          <span className="feebreakdown-status feebreakdown-status-due">
            {outstanding > 0 ? `${formatOmr(outstanding)} outstanding` : "fully paid"}
          </span>
        </li>
      </ul>
    </section>
  );
}
