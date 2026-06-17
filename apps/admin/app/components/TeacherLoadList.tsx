"use client";

/**
 * Teacher load distribution panel with client-side filters.
 *
 * Receives the full sorted teacher list from the server component, then
 * applies dept + status filters in-memory and renders the visible subset.
 * No URL-search-param plumbing yet — filter state is per-mount. Add SSR
 * filter persistence in a follow-up if it becomes worth it.
 */

import { useMemo, useState } from "react";
import type { Teacher } from "@manhaj/lib/data";

const STATUS_OPTIONS: Array<{ v: string; l: string }> = [
  { v: "all",   l: "All status" },
  { v: "over",  l: "Over capacity (slack < 0)" },
  { v: "full",  l: "At capacity (slack = 0)" },
  { v: "ok",    l: "Healthy (slack 1–4)" },
  { v: "under", l: "Under-utilised (slack > 4)" },
];

export default function TeacherLoadList({ teachers }: { teachers: Teacher[] }) {
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  // Distinct departments observed in the data, sorted with stable ordering
  const deptOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const t of teachers) seen.add(t.department);
    return ["all", ...Array.from(seen).sort()];
  }, [teachers]);

  const filtered = useMemo(() => {
    return teachers.filter(t => {
      if (dept !== "all" && t.department !== dept) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  }, [teachers, dept, status]);

  // Show up to 30 — beyond that we clip + show count. Could add a "show all"
  // toggle later if 30 is consistently too few.
  const visible = filtered.slice(0, 30);
  const maxScale = Math.max(...filtered.map(t => Math.max(t.assigned, t.cap)), 35);

  const overCount = filtered.filter(t => t.status === "over").length;
  const slackCount = filtered.filter(t => t.status === "under").length;
  const aiSrc = filtered.find(t => t.status === "over")?.full_name ?? "—";
  const aiDst = [...filtered].filter(t => t.status === "under")
    .sort((a, b) => b.slack - a.slack)[0]?.full_name ?? "—";

  return (
    <div className="card">
      <div className="card-label">Teacher load distribution</div>
      <div className="card-title">
        Weekly periods · assigned vs cap · sorted by variance
      </div>

      <div className="filter-bar">
        <select value={dept} onChange={e => setDept(e.target.value)}>
          {deptOptions.map(d => (
            <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>
          ))}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
          {filtered.length === teachers.length
            ? `${teachers.length} teachers`
            : `${filtered.length} of ${teachers.length} teachers`}
          {overCount > 0 && ` · ${overCount} over-cap`}
          {slackCount > 0 && ` · ${slackCount} with slack`}
        </span>
      </div>

      <div>
        {visible.length === 0 ? (
          <div style={{ padding: "20px 0", fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
            No teachers match the current filters.
          </div>
        ) : (
          visible.map(t => {
            const fillPct = Math.min(100, (100 * t.assigned) / Math.max(1, maxScale));
            const cls = t.status === "over" ? "over" : t.status === "full" ? "full" : t.status === "under" ? "under" : "ok";
            return (
              <div key={t.id} className="bar-row">
                <div className="name">
                  <span>
                    {t.full_name} ·{" "}
                    <span style={{ color: "var(--muted)", fontWeight: 400 }}>
                      {t.primary_subject_text || ""}
                    </span>
                  </span>
                  <span>{t.assigned} / {t.cap} max</span>
                </div>
                <div className="bar-track">
                  <div className={`bar-fill ${cls}`} style={{ width: `${fillPct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > visible.length && (
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
          + {filtered.length - visible.length} more (filter further to see them)
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
        <b style={{ color: "var(--ink)" }}>AI suggestion (preview):</b> rebalance{" "}
        <b>{aiSrc}</b>&apos;s overflow into <b>{aiDst}</b>&apos;s slack would bring all
        teachers within ±10% of mean.{" "}
        <span className="pill" style={{ marginLeft: 6 }}>Simulate →</span>
      </div>
    </div>
  );
}
