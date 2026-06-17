"use client";

import { formatOmr, type ChildInvoices } from "@manhaj/lib/mock-invoices";
import { DEMO_CHILDREN, useActiveChild } from "@manhaj/lib/child";

export default function HouseholdRows({ rows }: { rows: ChildInvoices[] }) {
  const { setActive } = useActiveChild();
  return (
    <section className="houserows-card" aria-label="Per child invoices">
      <header className="houserows-head">
        <h3>Per child</h3>
        <p className="houserows-sub">Tap a row to drill into that child&apos;s full invoice tab.</p>
      </header>
      <div className="houserows-list">
        {rows.map(r => {
          const meta = DEMO_CHILDREN.find(c => c.id === r.child_id);
          const isPaid = r.outstanding === 0;
          return (
            <button
              key={r.child_id}
              type="button"
              className="houserows-row"
              onClick={() => setActive(r.child_id)}
            >
              <span className="houserows-av" aria-hidden="true">{meta?.initial ?? "?"}</span>
              <span className="houserows-nm">{r.child_name}<small>{meta?.grade_label}</small></span>
              <span className="houserows-amt">
                {formatOmr(r.outstanding)}
                <small>of {formatOmr(r.installments.find(i => i.status === "partial")?.total ?? r.installments.find(i => i.status !== "paid")?.total ?? 0)}</small>
              </span>
              <span>
                {isPaid
                  ? <span className="chip-pill chip-good" style={{ cursor: "default" }}>paid in full</span>
                  : <span className="chip-pill chip-warn" style={{ cursor: "default" }}>due {r.due_date}</span>}
              </span>
              <span className="houserows-open">Open →</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
