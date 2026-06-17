/**
 * TeacherStudentInsights
 *
 * 3-card row below the TeacherStudentRoster showing:
 *  1. Top performers in History (3 names by assessment score)
 *  2. Needs attention in History (3 names by lowest assessment score)
 *  3. Submission trend this week (% of essays submitted across her classes)
 *
 * Pure server-compatible — no hooks; data is computed from props.
 */

import type { TeacherStudentRow } from "@manhaj/lib/mock-teacher-students";

interface Props {
  students: TeacherStudentRow[];
}

export default function TeacherStudentInsights({ students }: Props) {
  // Top 3 performers by last_assessment_score (descending)
  const top3 = [...students]
    .sort((a, b) => b.last_assessment_score - a.last_assessment_score)
    .slice(0, 3);

  // Bottom 3 (lowest scores — "needs attention")
  const low3 = [...students]
    .sort((a, b) => a.last_assessment_score - b.last_assessment_score)
    .slice(0, 3);

  // Submission trend: % of students who "submitted"
  const total     = students.length;
  const submitted = students.filter(s => s.submission_status === "submitted").length;
  const submittedPct = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const missing   = students.filter(s => s.submission_status === "missing").length;

  return (
    <section className="tsi-row" aria-label="Student insights">
      <h3 className="ta-section-head">My student insights</h3>
      <div className="tsi-cards">

        {/* Top performers */}
        <div className="tsi-card tsi-card-good">
          <div className="tsi-card-label">Top performers · History</div>
          <ol className="tsi-list">
            {top3.map((s, i) => (
              <li key={s.id} className="tsi-list-row">
                <span className="tsi-rank">{i + 1}</span>
                <span className="tsi-nm">{s.full_name}</span>
                <span className="tsi-sec">{s.section_code}</span>
                <span className="tsi-score tsi-score-good">{s.last_assessment_score}%</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Needs attention */}
        <div className="tsi-card tsi-card-warn">
          <div className="tsi-card-label">Needs attention · History</div>
          <ol className="tsi-list">
            {low3.map((s, i) => (
              <li key={s.id} className="tsi-list-row">
                <span className="tsi-rank">{i + 1}</span>
                <span className="tsi-nm">{s.full_name}</span>
                <span className="tsi-sec">{s.section_code}</span>
                <span className="tsi-score tsi-score-warn">{s.last_assessment_score}%</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Submission trend */}
        <div className="tsi-card tsi-card-neutral">
          <div className="tsi-card-label">Submission trend · this week</div>
          <div className="tsi-big">{submittedPct}<span className="tsi-big-suffix">%</span></div>
          <div className="tsi-trend-sub">
            essays submitted on time across {total} students
          </div>
          {missing > 0 && (
            <div className="tsi-trend-warn">
              {missing} still missing
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
