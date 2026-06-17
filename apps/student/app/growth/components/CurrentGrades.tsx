import { LAYLA_SUBJECTS } from "@manhaj/lib/mock-student-academic";

export default function CurrentGrades() {
  return (
    <section className="gr-section" aria-label="Subject performance — current grades">
      <div className="gr-section-lbl">Subject performance</div>
      <h3 className="gr-section-title">Current grades · IGCSE curriculum</h3>

      <div className="gr-perf-grid">
        {LAYLA_SUBJECTS.map(s => (
          <div
            key={s.subject}
            className={`gr-perf-card${s.flag ? " flagged" : ""}`}
          >
            {s.flag && (
              <span className="gr-perf-flag-badge" aria-label="Needs attention">
                Attention
              </span>
            )}

            <div className="gr-perf-subj">{s.subject}</div>

            <div className="gr-perf-grade" aria-label={`Grade ${s.grade}`}>
              {s.grade}
            </div>

            <div
              className={`gr-perf-trend ${s.trend}`}
              aria-label={`Trend: ${s.trend}`}
            >
              {s.trend === "up"   && "▲"}
              {s.trend === "down" && "▼"}
              {s.trend === "flat" && "—"}
              {" "}
              {s.delta_text.replace(/^[▲▼—]\s*/, "")}
            </div>

            <div className="gr-perf-band">
              Class avg <b>{s.class_avg}</b> · {s.band_label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
