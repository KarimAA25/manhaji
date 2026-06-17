"use client";

/**
 * Section × rubric-axis grid. Each cell shows that section's rubric avg
 * for the axis, color-banded 1..5. Click logs to console (drill-down lands
 * in a future PR).
 */

import type { CohortHeatRow, RubricScores } from "@manhaj/lib/mock-students";

const AXES: Array<{ key: keyof RubricScores; label: string }> = [
  { key: "analytical",    label: "Anal"     },
  { key: "creative",      label: "Creative" },
  { key: "oral",          label: "Oral"     },
  { key: "written",       label: "Written"  },
  { key: "participation", label: "Partic"   },
  { key: "homework",      label: "HW"       },
];

function bandClass(score: number): string {
  if (score < 1.5) return "ch-1";
  if (score < 2.5) return "ch-2";
  if (score < 3.5) return "ch-3";
  if (score < 4.5) return "ch-4";
  return "ch-5";
}

export default function CohortHeatmap({ rows }: { rows: CohortHeatRow[] }) {
  return (
    <section className="ch-card" aria-label="Cohort heatmap · section by rubric axis">
      <header className="ch-head">
        <h3>Cohort heatmap · section × rubric axis</h3>
        <p className="ch-sub">Spot which axes lag in which sections. Click a cell to drill down.</p>
      </header>
      <div className="ch-grid">
        <div className="ch-corner" />
        {AXES.map(a => <div key={a.key} className="ch-col-head">{a.label}</div>)}
        {rows.map(row => (
          <>
            <div key={`${row.section_code}-rh`} className="ch-row-head">{row.section_code}</div>
            {AXES.map(a => {
              const v = row.rubric[a.key];
              return (
                <button
                  key={`${row.section_code}-${a.key}`}
                  type="button"
                  className={`ch-cell ${bandClass(v)}`}
                  aria-label={`${row.section_code} ${a.label} ${v.toFixed(1)}`}
                  onClick={() => console.log("[heatmap]", row.section_code, a.key, v)}
                >
                  {v.toFixed(1)}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </section>
  );
}
