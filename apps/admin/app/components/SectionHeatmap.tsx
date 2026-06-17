"use client";

/**
 * Section × subject heatmap.
 *
 * Receives the full filtered set of sections, subjects, and load rows from the
 * parent server component. Filters happen client-side (grade-band dropdown);
 * data is small enough (~1.3k cells max) that filtering in-memory beats a
 * server round-trip per filter change.
 *
 * Gap detection: HS sections (grade 9-12) that DON'T have one of the mandatory
 * subjects (En, Ma, Ar, IS) scheduled get a red 'gap' cell with a value of 0.
 * Lower grades are not gap-checked here because their compulsory list is more
 * fluid; that's a future polish.
 */

import { useMemo, useState } from "react";
import type { Section, Subject, LoadCell } from "@manhaj/lib/data";

const MANDATORY_HS_SUBJECTS = ["En", "Ma", "Ar", "IS"] as const;

const DEPT_ORDER = [
  "Arabic", "English", "French", "Social-Arabic", "Social-English",
  "Math", "Science", "Recreational", "Assessment", "Unknown",
];

function bandClass(v: number): string {
  if (v <= 0) return "empty";
  if (v <= 2) return "h1c";
  if (v <= 4) return "h2c";
  if (v <= 6) return "h3c";
  return "h4c";
}

function inGradeBand(section: Section, band: string): boolean {
  if (band === "all") return true;
  const g = section.grade_level ?? "";
  if (band === "unmapped") return !section.grade_level;
  if (band === "kg") return g.startsWith("KG");
  if (band === "primary") return ["1","2","3","4","5","6","1-2","3-4","5-6"].includes(g);
  if (band === "middle") return g === "7" || g === "8";
  if (band === "hs") return ["9","10","11","12"].includes(g);
  return true;
}

export default function SectionHeatmap({
  sections, subjects, load,
}: { sections: Section[]; subjects: Subject[]; load: LoadCell[] }) {
  // Default to high-school view — the most actionable single filter for principals
  // (per design critique P1 #4). Users can broaden via the dropdown.
  const [band, setBand] = useState<string>("hs");

  // Sort subjects by department (declared order) then by code
  const subjectsSorted = useMemo(() => {
    return [...subjects].sort((a, b) => {
      const da = DEPT_ORDER.indexOf(a.department);
      const db = DEPT_ORDER.indexOf(b.department);
      if (da !== db) return (da === -1 ? 99 : da) - (db === -1 ? 99 : db);
      return a.code.localeCompare(b.code);
    });
  }, [subjects]);

  // Build the cellMap: section_id → subject_id → weekly_periods (sum)
  const cellMap = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const r of load) {
      const sub = m.get(r.section_id) ?? new Map<string, number>();
      sub.set(r.subject_id, (sub.get(r.subject_id) ?? 0) + r.weekly_periods);
      m.set(r.section_id, sub);
    }
    return m;
  }, [load]);

  // Filtered sections + insert dept-divider columns
  const filteredSections = useMemo(() => {
    return sections.filter(s => inGradeBand(s, band)).sort((a, b) => {
      // Group KG → Primary → Middle → HS, then by code within each
      const order = (s: Section) => {
        const g = s.grade_level ?? "";
        if (!g) return 99;  // unmapped at the end
        if (g.startsWith("KG")) return 0;
        if (["1","2","3","4","5","6","1-2","3-4","5-6"].includes(g)) return 1;
        if (g === "7" || g === "8") return 2;
        return 3;
      };
      const oa = order(a), ob = order(b);
      if (oa !== ob) return oa - ob;
      return a.code.localeCompare(b.code);
    });
  }, [sections, band]);

  // Columns to show: only subjects that someone has scheduled in the filtered sections
  const visibleSubjects = useMemo(() => {
    const seen = new Set<string>();
    for (const s of filteredSections) {
      const sub = cellMap.get(s.id);
      if (!sub) continue;
      for (const k of sub.keys()) seen.add(k);
    }
    return subjectsSorted.filter(s => seen.has(s.id));
  }, [subjectsSorted, filteredSections, cellMap]);

  // Grid template: 90px for the label column, then 1fr per subject column
  const gridTemplate = `90px repeat(${visibleSubjects.length}, minmax(24px, 1fr))`;

  const gapCount = useMemo(() => {
    let n = 0;
    for (const s of filteredSections) {
      if (!["9","10","11","12"].includes(s.grade_level ?? "")) continue;
      const sub = cellMap.get(s.id);
      for (const code of MANDATORY_HS_SUBJECTS) {
        const subj = subjects.find(x => x.code === code);
        if (!subj) continue;
        const v = sub?.get(subj.id) ?? 0;
        if (v === 0) n++;
      }
    }
    return n;
  }, [filteredSections, cellMap, subjects]);

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-label">Section × subject coverage</div>
      <div className="card-title">
        Weekly periods scheduled per section · darker = more · red = gap (HS mandatory subject not scheduled)
      </div>

      <div className="filter-bar">
        <select value={band} onChange={e => setBand(e.target.value)}>
          <option value="all">All grades</option>
          <option value="kg">KG only</option>
          <option value="primary">Primary (G1–G6)</option>
          <option value="middle">Middle (G7–G8)</option>
          <option value="hs">High school (G9–G12)</option>
          <option value="unmapped">Unmapped only</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
          {filteredSections.length} sections × {visibleSubjects.length} subjects · {gapCount} HS gap{gapCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="heat-grid">
        {/* Header row */}
        <div className="heat-row" style={{ gridTemplateColumns: gridTemplate }}>
          <div />
          {visibleSubjects.map(s => (
            <div key={s.id} className="heat-hdr" title={`${s.name_en} · ${s.department}`}>{s.code}</div>
          ))}
        </div>

        {/* Data rows */}
        {filteredSections.map(s => (
          <div key={s.id} className="heat-row" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="heat-label" title={s.grade_level ?? "unmapped"}>{s.code}</div>
            {visibleSubjects.map(subj => {
              const v = cellMap.get(s.id)?.get(subj.id) ?? 0;
              const isHs = ["9","10","11","12"].includes(s.grade_level ?? "");
              const isMandatory = MANDATORY_HS_SUBJECTS.includes(subj.code as typeof MANDATORY_HS_SUBJECTS[number]);
              const isGap = v === 0 && isHs && isMandatory;
              const cls = isGap ? "gap" : bandClass(v);
              const label = v > 0 ? String(v) : (isGap ? "✕" : "·");
              return (
                <div
                  key={subj.id}
                  className={`heat-cell ${cls}`}
                  title={`${s.code} × ${subj.name_en}: ${v}/wk${isGap ? " (mandatory — not scheduled)" : ""}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="heat-legend">
        <span className="sw" style={{ background: "#FAFCFE", border: "1px dashed #E5EAF0" }} /> Not scheduled
        <span className="sw" style={{ background: "#C5D2E2" }} /> 1–2/wk
        <span className="sw" style={{ background: "#7B9AC2" }} /> 3–4/wk
        <span className="sw" style={{ background: "#3D5A80" }} /> 5–6/wk
        <span className="sw" style={{ background: "#0B2545" }} /> 7+/wk
        <span className="sw" style={{ background: "#FED7D7" }} /> Gap (HS mandatory missing)
      </div>
    </div>
  );
}
