"use client";

import { useMemo, useState } from "react";

import { MOCK_TEACHERS } from "@manhaj/lib/mock-faculty";
import type { TeacherStatus, ContractStatus } from "@manhaj/lib/mock-faculty";
import type { TeacherWithLoad } from "@manhaj/lib/queries/teachers";

const SHOW_DEFAULT = 10;

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

function loadStatus(t: TeacherWithLoad): TeacherStatus {
  const assigned = t.weekly_period_assigned ?? 0;
  const cap = t.weekly_period_cap ?? 28;
  if (assigned > cap) return "over";
  if (assigned < cap * 0.7) return "under";
  return "ok";
}

const STATUS_OPTIONS: Array<{ value: "all" | TeacherStatus; label: string }> = [
  { value: "all",   label: "All statuses" },
  { value: "over",  label: "Over cap" },
  { value: "ok",    label: "OK" },
  { value: "under", label: "Slack" },
];

export default function FacultyRoster({ teachers }: { teachers?: TeacherWithLoad[] }) {
  const [nameQ,   setNameQ]   = useState("");
  const [deptF,   setDeptF]   = useState("all");
  const [subjF,   setSubjF]   = useState("all");
  const [statusF, setStatusF] = useState<"all" | TeacherStatus>("all");
  const [expanded, setExpanded] = useState(false);

  const depts = useMemo(
    () => [...new Set((teachers ?? []).map(t => t.primary_dept).filter((d): d is string => !!d))].sort(),
    [teachers],
  );
  const subjects = useMemo(
    () => [...new Set((teachers ?? []).map(t => t.primary_subject_text).filter((s): s is string => !!s))].sort(),
    [teachers],
  );

  const filtered = useMemo(
    () => (teachers ?? []).filter(t => {
      if (nameQ && !t.full_name.toLowerCase().includes(nameQ.trim().toLowerCase())) return false;
      if (deptF   !== "all" && t.primary_dept !== deptF) return false;
      if (subjF   !== "all" && t.primary_subject_text !== subjF) return false;
      if (statusF !== "all" && loadStatus(t) !== statusF) return false;
      return true;
    }),
    [teachers, nameQ, deptF, subjF, statusF],
  );

  const hasFilters = nameQ !== "" || deptF !== "all" || subjF !== "all" || statusF !== "all";

  function clearFilters() {
    setNameQ("");
    setDeptF("all");
    setSubjF("all");
    setStatusF("all");
  }

  if (teachers && teachers.length > 0) {
    const visible = expanded ? filtered : filtered.slice(0, SHOW_DEFAULT);
    return (
      <section className="fac-roster-card" aria-label="Faculty roster">
        <header className="fac-section-head">
          <h3>Faculty roster · {teachers.length} teachers</h3>
          <p className="fac-section-sub">Name · department · primary subject · periods per week · load status.</p>
        </header>
        <div className="fac-filter-row" role="group" aria-label="Filter roster">
          <input
            type="search"
            className="fac-filter-input"
            placeholder="Filter by name…"
            aria-label="Filter by name"
            value={nameQ}
            onChange={e => setNameQ(e.target.value)}
          />
          <select
            className="fac-filter-select"
            aria-label="Filter by department"
            value={deptF}
            onChange={e => setDeptF(e.target.value)}
          >
            <option value="all">All departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="fac-filter-select"
            aria-label="Filter by subject"
            value={subjF}
            onChange={e => setSubjF(e.target.value)}
          >
            <option value="all">All subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="fac-filter-select"
            aria-label="Filter by load status"
            value={statusF}
            onChange={e => setStatusF(e.target.value as "all" | TeacherStatus)}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button type="button" className="fac-link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
        <div className="fac-roster-wrap">
          <table className="fac-roster-tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Primary subject</th>
                <th className="fac-tbl-num">Periods/wk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => (
                <tr key={t.id}>
                  <td className="fac-tbl-name">{t.full_name}</td>
                  <td className="fac-tbl-dept">{t.primary_dept ?? "—"}</td>
                  <td className="fac-tbl-subj">{t.primary_subject_text ?? "—"}</td>
                  <td className="fac-tbl-num">{t.weekly_period_assigned ?? "—"}</td>
                  <td><StatusPill status={loadStatus(t)} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="fac-roster-empty">
                    No teachers match the current filters.{" "}
                    <button type="button" className="fac-link-btn" onClick={clearFilters}>Clear filters</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="fac-roster-footer">
          {filtered.length > SHOW_DEFAULT ? (
            expanded ? (
              <>
                Showing all {filtered.length} of {teachers.length} teachers ·{" "}
                <button type="button" className="fac-link-btn" onClick={() => setExpanded(false)}>
                  Show top {SHOW_DEFAULT}
                </button>
              </>
            ) : (
              <>
                Showing top {SHOW_DEFAULT} of {filtered.length} teachers ·{" "}
                <button type="button" className="fac-link-btn" onClick={() => setExpanded(true)}>
                  Expand full list ({filtered.length})
                </button>
              </>
            )
          ) : (
            <>{filtered.length} of {teachers.length} teachers shown</>
          )}
        </div>
      </section>
    );
  }
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
