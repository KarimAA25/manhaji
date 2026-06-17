/**
 * Teacher · Analyze tab — Ms Swart's personal dashboard.
 *
 * Server component. All data is from in-file mock constants;
 * Phase 4 replaces with a real RPC scoped to the teacher's identity.
 *
 * Re-uses:
 *  - TeacherMyWeek         (schedule-components/TeacherMyWeek.tsx)
 *  - TrendChart            (@manhaj/ui)
 *  - AskManhajCard         (schedule-components/AskManhajCard.tsx)
 *  - TeacherStudentRoster  (./components/TeacherStudentRoster.tsx)
 *  - TeacherStudentInsights(./components/TeacherStudentInsights.tsx)
 */

import { TrendChart, type TrendPoint } from "@manhaj/ui";
import TeacherMyWeek from "./schedule-components/TeacherMyWeek";
import AskManhajCard from "./schedule-components/AskManhajCard";
import TeacherStudentRoster from "./components/TeacherStudentRoster";
import TeacherStudentInsights from "./components/TeacherStudentInsights";
import { SWART_STUDENTS } from "@manhaj/lib/mock-teacher-students";

// Derive sorted unique sections from the students data
const SWART_SECTIONS = [...new Set(SWART_STUDENTS.map(s => s.section_code))].sort();

// ---- mock data scoped to Ms Swart ----------------------------------------

const SWART_ATT: TrendPoint[] = [
  { date: "05-01", pct: 95 }, { date: "05-02", pct: 96 }, { date: "05-05", pct: 94 },
  { date: "05-06", pct: 97 }, { date: "05-07", pct: 96 }, { date: "05-08", pct: 98 },
  { date: "05-09", pct: 95 }, { date: "05-12", pct: 94 }, { date: "05-13", pct: 96 },
  { date: "05-14", pct: 97 }, { date: "05-15", pct: 95 }, { date: "05-16", pct: 94 },
  { date: "05-19", pct: 96 }, { date: "05-20", pct: 92 }, { date: "05-21", pct: 94 },
  { date: "05-22", pct: 95 }, { date: "05-23", pct: 96 },
];

const ASSESSMENTS = [
  { section: "10A", subject: "History",   pct_submitted: 92, avg_score: 74, label: "Y10 Essay — Rise of Constitutional Monarchies" },
  { section: "10A", subject: "Geography", pct_submitted: 88, avg_score: 69, label: "Map Analysis Task · Geopolitical zones" },
  { section: "9A",  subject: "History",   pct_submitted: 96, avg_score: 81, label: "Chapter 5 Quiz · Industrial Revolution" },
  { section: "10A", subject: "MUN",       pct_submitted: 100, avg_score: 88, label: "Position Paper draft · UNSC" },
];

const SPOTLIGHT = [
  { name: "Rania Khalifa",  section: "10A", note: "EAL flag · Written rubric dropped to 2.9 · needs scaffolding support",  tone: "warn"    },
  { name: "Hala Mohsen",    section: "9A",  note: "Chronic absentee · 6 days missed · missed post-exam review session",      tone: "bad"     },
  { name: "Tariq Said",     section: "10A", note: "Steady improvement in oral participation · acknowledge publicly",          tone: "good"    },
];

// --------------------------------------------------------------------------

export default function TeacherAnalyzePage() {
  return (
    <div className="container">

      {/* Greet hero */}
      <section className="ta-greet-hero">
        <h1 className="ta-greet-name">Good morning, Ms Swart.</h1>
        <p className="ta-greet-sub">
          Today: P3 History · 10A &nbsp;·&nbsp; P5 MUN club · 10A.
          &nbsp;Yesterday: 92% submission rate on Y10 essay.
        </p>
      </section>

      {/* 4-card KPI row */}
      <div className="ta-kpi-row">
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">My periods this week</div>
          <div className="ta-kpi-v">22</div>
          <div className="ta-kpi-d">across 4 sections</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">My sections</div>
          <div className="ta-kpi-v">4</div>
          <div className="ta-kpi-d">10A · 9A · 10A MUN · 12 A2</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">Avg attendance my classes</div>
          <div className="ta-kpi-v">94%</div>
          <div className="ta-kpi-d">school avg 96%</div>
        </div>
        <div className="ta-kpi-card">
          <div className="ta-kpi-l">Pending grading</div>
          <div className="ta-kpi-v ta-kpi-warn">8</div>
          <div className="ta-kpi-d">essays · submitted yesterday</div>
        </div>
      </div>

      {/* Week grid — re-use from admin/schedule */}
      <h3 className="ta-section-head">My week</h3>
      <TeacherMyWeek />

      {/* Attendance trend */}
      <h3 className="ta-section-head">Attendance · my classes · last 17 days</h3>
      <TrendChart points={SWART_ATT} target={95} title="Attendance · Ms Swart's sections" />

      {/* Assessment table */}
      <h3 className="ta-section-head">Recent assessments</h3>
      <div className="ta-assess-card">
        <table className="ta-assess-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>Subject</th>
              <th>Assessment</th>
              <th>% submitted</th>
              <th>Avg score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ASSESSMENTS.map((a, i) => (
              <tr key={i}>
                <td className="ta-assess-section">{a.section}</td>
                <td className="ta-assess-subj">{a.subject}</td>
                <td className="ta-assess-label">{a.label}</td>
                <td>
                  <span className={`ta-assess-pct ${a.pct_submitted >= 90 ? "good" : "warn"}`}>
                    {a.pct_submitted}%
                  </span>
                </td>
                <td className="ta-assess-score">{a.avg_score}%</td>
                <td>
                  <button type="button" className="ta-assess-btn">Review drafts</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student spotlight (legacy 3-row view kept for quick scan) */}
      <h3 className="ta-section-head">Student spotlight · needs attention</h3>
      <div className="ta-spotlight-card">
        {SPOTLIGHT.map((s, i) => (
          <div key={i} className={`ta-spotlight-row ta-spotlight-${s.tone}`}>
            <div className="ta-spotlight-name">{s.name} <span className="ta-spotlight-section">{s.section}</span></div>
            <div className="ta-spotlight-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Full scoped student roster — Phase 3.2 */}
      <h3 className="ta-section-head">My students · full roster</h3>
      <TeacherStudentRoster students={SWART_STUDENTS} sections={SWART_SECTIONS} />

      {/* Subject-specific insights — Phase 3.2 */}
      <TeacherStudentInsights students={SWART_STUDENTS} />

      {/* Ask Manhaj */}
      <h3 className="ta-section-head">Ask Manhaj</h3>
      <AskManhajCard />

    </div>
  );
}
