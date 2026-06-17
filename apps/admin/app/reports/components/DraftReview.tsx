/**
 * Admin · Reports · Draft review card.
 *
 * Preview of an AI-composed draft for a specific student + batch.
 * Approve / Edit / Reject actions.
 */

export default function DraftReview() {
  return (
    <section className="dr-card" aria-label="Draft review">
      <header className="dr-head">
        <div>
          <h3>Draft review · Layla Al-Habsi · April monthly</h3>
          <p className="dr-sub">
            AI-drafted from rubric + grades + behaviour. Edit before approve.
            Co-sign with section teacher.
          </p>
        </div>
        <div className="dr-toggle">
          <span className="dr-toggle-pill active">EN</span>
          <span className="dr-toggle-pill">AR</span>
        </div>
      </header>

      <div className="dr-editor">
        <div className="dr-meta">
          <span>Template: <b>T-01 · Monthly parent report</b></span>
          <span>Drafted: <b>Manhaj · 2026-05-22 09:14</b></span>
          <span>Reviewer: <b>Ms Sandra Swart</b></span>
        </div>

        <div className="dr-body">
          <p className="dr-line">Dear Mr Al-Habsi,</p>
          <p className="dr-line">
            Layla had a <b>strong April</b> overall, with notable progress in{" "}
            <b>Chemistry</b> and <b>Mathematics</b> — her work on equilibrium problems
            showed real conceptual depth and she scored top of class on the unit test.
            Her oral-communication rubric score climbed from 3.4 to 4.0 this month,
            the third consecutive monthly gain.
          </p>
          <p className="dr-line">
            We continue to flag <b>written Arabic</b> as an area to build — this is the
            second month her written-expression score dipped below 3.0. A 3-week scaffold
            pack is ready for Layla to start at her own pace.
          </p>
          <p className="dr-line">
            Best regards,<br />
            Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026
          </p>
        </div>

        <div className="dr-summary">
          <span className="dr-summary-tag dr-summary-tag-strong">▲ Oral comm +0.6</span>
          <span className="dr-summary-tag dr-summary-tag-strong">▲ Maths top of class</span>
          <span className="dr-summary-tag dr-summary-tag-build">▼ Written Arabic build area</span>
        </div>

        <div className="dr-actions">
          <button type="button" className="dr-btn dr-btn-ghost">Edit</button>
          <button type="button" className="dr-btn dr-btn-ghost">Regenerate</button>
          <button type="button" className="dr-btn dr-btn-ghost">Compare to last month</button>
          <button type="button" className="dr-btn dr-btn-danger">Hold</button>
          <button type="button" className="dr-btn dr-btn-primary">Approve · queue for batch</button>
        </div>
      </div>
    </section>
  );
}
