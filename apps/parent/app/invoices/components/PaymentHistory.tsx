import { formatOmr, type Payment } from "@manhaj/lib/mock-invoices";

export default function PaymentHistory({ rows }: { rows: Payment[] }) {
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="payments-card" aria-label="Payment history">
      <header className="payments-head">
        <h3>Payment history</h3>
        <p className="payments-sub">Every payment recorded · downloadable receipts.</p>
      </header>
      <div className="payments-tbl-wrap">
        <table className="payments-tbl">
          <thead>
            <tr><th>Date</th><th>For</th><th>Amount</th><th>Method</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td className="payments-when">{p.date}</td>
                <td className="payments-what"><b>{p.for}</b><small>{p.detail}</small></td>
                <td className="payments-amt">{formatOmr(p.amount)}</td>
                <td className="payments-method">{p.method}</td>
                <td><a className="payments-rec" href={p.receipt_url}>PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
