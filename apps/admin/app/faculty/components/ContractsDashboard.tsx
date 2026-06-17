"use client";

import { MOCK_TEACHERS, contractGroups } from "@manhaj/lib/mock-faculty";

export default function ContractsDashboard() {
  const groups = contractGroups(MOCK_TEACHERS);
  const accentMap: Record<string, string> = {
    "expiring-3m": "fac-ctr-card exp3",
    "expiring-6m": "fac-ctr-card exp6",
    "renewal-rec": "fac-ctr-card renew",
  };

  return (
    <section className="fac-ctr-section" aria-label="Contracts dashboard">
      <header className="fac-section-head">
        <h3>Contracts dashboard</h3>
        <p className="fac-section-sub">Contracts expiring soon and renewal recommendations this cycle.</p>
      </header>
      <div className="fac-ctr-grid">
        {groups.map(g => (
          <div key={g.key} className={accentMap[g.key] ?? "fac-ctr-card"}>
            <div className="fac-ctr-count">{g.teachers.length}</div>
            <div className="fac-ctr-label">{g.label}</div>
            <ul className="fac-ctr-names">
              {g.teachers.map(t => (
                <li key={t.id}>{t.full_name}</li>
              ))}
              {g.teachers.length === 0 && (
                <li className="fac-ctr-none">None this cycle</li>
              )}
            </ul>
            <button type="button" className="fac-ctr-btn">Review contracts</button>
          </div>
        ))}
      </div>
    </section>
  );
}
