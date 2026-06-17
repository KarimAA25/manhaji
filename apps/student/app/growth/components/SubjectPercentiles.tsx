import { LAYLA_SUBJECTS } from "@manhaj/lib/mock-student-academic";

export default function SubjectPercentiles() {
  // Only subjects that have meaningful percentile data (exclude PE for display clarity)
  const subjects = LAYLA_SUBJECTS.filter(s => s.subject !== "PE" && s.subject !== "ICT");

  return (
    <section className="gr-section" aria-label="Subject percentiles">
      <div className="gr-section-lbl">Class ranking</div>
      <h3 className="gr-section-title">Subject percentiles · where you sit in your class</h3>
      <p className="gr-section-sub">
        Each bar shows where you rank relative to your classmates (0 = bottom · 100 = top). The red marker shows your position.
      </p>

      <div className="gr-pct-list" role="list">
        {subjects.map(s => (
          <div key={s.subject} className="gr-pct-row" role="listitem">
            <span className="gr-pct-label">{s.subject}</span>

            <div
              className="gr-pct-track"
              role="img"
              aria-label={`${s.subject}: ${s.band_label}`}
            >
              {/* filled bar from 0 to student's percentile */}
              <div
                className="gr-pct-fill"
                style={{ width: `${s.percentile}%` }}
              />
              {/* marker pip at student's exact position */}
              <div
                className="gr-pct-marker"
                style={{ left: `${s.percentile}%` }}
              />
            </div>

            <div className="gr-pct-val">
              {s.percentile}
              <small>{s.band_label}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
