import { PLACEMENT_TIERS } from "@manhaj/lib/mock-student-academic";

export default function UniversityPlacementSignal() {
  return (
    <section className="gr-section" aria-label="University placement signal">
      <div className="gr-section-lbl">University placement</div>
      <h3 className="gr-section-title">University placement signal · early indicator</h3>

      <div className="gr-uni-wrap">
        <p className="gr-uni-subhead">
          Where students with Layla&apos;s profile (10 A/A-range subjects, top-quartile
          English + History) have landed historically. Indicative bands — not predictions.
        </p>

        <div className="gr-uni-tiers" role="list">
          {PLACEMENT_TIERS.map(tier => (
            <div key={tier.name} className="gr-uni-tier" role="listitem">
              <div className="gr-uni-tier-head">
                <span className="gr-uni-tier-name">{tier.name}</span>
                <span className="gr-uni-tier-pct-label">
                  {tier.band_pct}% of similar profiles
                </span>
              </div>

              <div className="gr-uni-bar-track" aria-label={`${tier.band_pct}%`}>
                <div
                  className="gr-uni-bar-fill"
                  style={{ width: `${tier.band_pct}%` }}
                />
              </div>

              <div className="gr-uni-unis" aria-label="Example universities">
                {tier.example_universities.map(u => (
                  <span key={u}>{u}</span>
                ))}
              </div>

              <p className="gr-uni-footnote">
                Based on {tier.similar_profiles_n.toLocaleString()} similar profiles
              </p>
            </div>
          ))}
        </div>

        <p className="gr-uni-disclaimer">
          Updated 2 May 2026 · refreshed monthly · indicative only · early career-counsellor
          discussion in Year 11. Past placement patterns are not guarantees of future outcomes.
        </p>
      </div>
    </section>
  );
}
