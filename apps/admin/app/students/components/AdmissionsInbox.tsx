"use client";

/**
 * Admissions inbox — applicants in review with AI scores + Approve / Hold
 * actions. Click handlers log to console (real flow lands in a future PR).
 */

import type { AdmissionRow } from "@manhaj/lib/mock-students";

const BAND_TONE: Record<AdmissionRow["ai_band"], "good" | "warn" | "neutral" | "info"> = {
  "A":  "good",
  "A-": "good",
  "B+": "info",
  "B":  "info",
  "B-": "warn",
  "—":  "neutral",
};

export default function AdmissionsInbox({ rows }: { rows: AdmissionRow[] }) {
  const inReview = rows.filter(r => r.status === "review");
  return (
    <section className="adm-card" aria-label="Admissions inbox">
      <header className="adm-head">
        <h3>Admissions inbox · {inReview.length} in review</h3>
        <p className="adm-sub">AI scores against entry criteria. Approve / hold · draft response letter included.</p>
      </header>
      <ul className="adm-list">
        {inReview.map(a => (
          <li key={a.id} className="adm-row">
            <span className="adm-nm">{a.full_name}<small>{a.target_grade}</small></span>
            <span className="adm-src">{a.source}</span>
            <span className={`adm-band chip-pill chip-${BAND_TONE[a.ai_band]}`}>{a.ai_band}</span>
            <span className="adm-actions">
              <button type="button" className="adm-btn adm-btn-approve" onClick={() => console.log("[adm] approve", a.id)}>Approve</button>
              <button type="button" className="adm-btn adm-btn-hold"    onClick={() => console.log("[adm] hold",    a.id)}>Hold</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
