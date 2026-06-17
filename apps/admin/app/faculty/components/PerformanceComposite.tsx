"use client";

import { MOCK_PERFORMANCE, biggestDelta } from "@manhaj/lib/mock-faculty";

export default function PerformanceComposite() {
  const best = biggestDelta(MOCK_PERFORMANCE);
  const maxVal = 5; // rubric max

  return (
    <section className="fac-perf-card" aria-label="Performance composite">
      <header className="fac-section-head">
        <h3>Performance composite · this term vs last</h3>
        <p className="fac-section-sub">
          Dept-level rubric composite scores (0–5).{" "}
          {best && (
            <>
              Biggest delta:{" "}
              <strong>{best.dept_label}</strong>{" "}
              ({best.last_term.toFixed(1)} → {best.this_term.toFixed(1)}{" "}
              {best.this_term >= best.last_term ? "▲" : "▼"})
            </>
          )}
        </p>
      </header>
      <div className="fac-perf-grid">
        {MOCK_PERFORMANCE.map(row => {
          const delta = row.this_term - row.last_term;
          const improved = delta > 0;
          const declined = delta < 0;
          return (
            <div
              key={row.dept_id}
              className={`fac-perf-row${improved ? " fac-perf-up" : declined ? " fac-perf-dn" : ""}`}
            >
              <div className="fac-perf-dept">{row.dept_label}</div>
              <div className="fac-perf-bars">
                {/* Last term */}
                <div className="fac-perf-bar-group">
                  <div className="fac-perf-bar-lbl">Last</div>
                  <div className="fac-perf-track">
                    <div
                      className="fac-perf-fill fac-perf-fill-last"
                      style={{ width: `${(row.last_term / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="fac-perf-val">{row.last_term.toFixed(1)}</span>
                </div>
                {/* This term */}
                <div className="fac-perf-bar-group">
                  <div className="fac-perf-bar-lbl">Now</div>
                  <div className="fac-perf-track">
                    <div
                      className="fac-perf-fill fac-perf-fill-now"
                      style={{ width: `${(row.this_term / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="fac-perf-val">{row.this_term.toFixed(1)}</span>
                </div>
              </div>
              <div className="fac-perf-delta">
                {delta === 0 ? "–" : `${improved ? "+" : ""}${delta.toFixed(1)}`}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
