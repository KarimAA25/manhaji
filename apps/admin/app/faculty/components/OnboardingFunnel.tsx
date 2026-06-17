"use client";

import { MOCK_ONBOARDING_PIPELINE } from "@manhaj/lib/mock-faculty";

export default function OnboardingFunnel() {
  const max = MOCK_ONBOARDING_PIPELINE[0]?.count ?? 1;

  return (
    <section className="fac-onb-card" aria-label="Hiring pipeline">
      <header className="fac-section-head">
        <h3>Hiring pipeline · this cycle</h3>
        <p className="fac-section-sub">Applicants through to hired — track each stage of the onboarding funnel.</p>
      </header>
      <div className="fac-onb-funnel">
        {MOCK_ONBOARDING_PIPELINE.map((s, i) => {
          const pct = Math.round((s.count / max) * 100);
          return (
            <div key={s.stage} className="fac-onb-stage">
              <div className="fac-onb-meta">
                <span className="fac-onb-name">{s.stage}</span>
                <span className="fac-onb-count">{s.count}</span>
              </div>
              <div className="fac-onb-bar-wrap">
                <div
                  className={`fac-onb-bar fac-onb-bar-${i}`}
                  style={{ width: `${pct}%` }}
                  role="meter"
                  aria-valuenow={s.count}
                  aria-valuemax={max}
                  aria-label={`${s.stage}: ${s.count}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="fac-onb-footer">
        <button type="button" className="fac-ghost-btn">+ Add candidate</button>
        <span className="fac-onb-note">Last updated: today</span>
      </div>
    </section>
  );
}
