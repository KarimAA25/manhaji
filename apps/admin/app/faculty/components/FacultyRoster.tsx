"use client";

import { MOCK_TEACHERS } from "@manhaj/lib/mock-faculty";
import type { TeacherStatus, ContractStatus } from "@manhaj/lib/mock-faculty";

function StatusPill({ status }: { status: TeacherStatus }) {
  const map: Record<TeacherStatus, { label: string; cls: string }> = {
    over:  { label: "Over cap",  cls: "fac-pill over" },
    ok:    { label: "OK",        cls: "fac-pill ok" },
    under: { label: "Slack",     cls: "fac-pill slack" },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

function ContractBadge({ status }: { status: ContractStatus }) {
  const map: Record<ContractStatus, { label: string; cls: string }> = {
    "active":       { label: "Active",      cls: "fac-badge active" },
    "expiring-3m":  { label: "Exp. 3m",     cls: "fac-badge exp3" },
    "expiring-6m":  { label: "Exp. 6m",     cls: "fac-badge exp6" },
    "renewal-rec":  { label: "Renew rec.",  cls: "fac-badge renew" },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

export default function FacultyRoster() {
  return (
    <section className="fac-roster-card" aria-label="Faculty roster">
      <header className="fac-section-head">
        <h3>Faculty roster · 25 of 69 teachers shown</h3>
        <p className="fac-section-sub">Name · department · sections · periods per week · load status · contract.</p>
      </header>
      <div className="fac-roster-wrap">
        <table className="fac-roster-tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Primary subject</th>
              <th className="fac-tbl-num">Sections</th>
              <th className="fac-tbl-num">Periods/wk</th>
              <th>Status</th>
              <th>Contract</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TEACHERS.map(t => (
              <tr key={t.id}>
                <td className="fac-tbl-name">{t.full_name}</td>
                <td className="fac-tbl-dept">{t.dept_id.charAt(0).toUpperCase() + t.dept_id.slice(1)}</td>
                <td className="fac-tbl-subj">{t.primary_subject}</td>
                <td className="fac-tbl-num">{t.sections}</td>
                <td className="fac-tbl-num">{t.periods_per_week}</td>
                <td><StatusPill status={t.status} /></td>
                <td><ContractBadge status={t.contract_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fac-roster-footer">
        Showing 25 representative teachers · <button type="button" className="fac-link-btn">View all 69</button>
      </div>
    </section>
  );
}
