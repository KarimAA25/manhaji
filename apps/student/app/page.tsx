/**
 * Student Dashboard.
 *
 * Phase 2.11: rebuilt to match student-dashboard-v2.html mockup.
 * Layout: greet hero → today strip (2 col) → 4-card KPI row → divider → 2×2 sd-card grid.
 *
 * All data is drawn from MOCK_HOMEWORK and MOCK_STUDENT_SCHEDULE.
 */

import Link from "next/link";
import { MOCK_HOMEWORK } from "@manhaj/lib/mock-homework";
import { DEMO_DAY, MOCK_PERIODS, periodsForDay } from "@manhaj/lib/mock-student-schedule";

export const dynamic = "force-dynamic";

// Find today's schedule
const todayAll = periodsForDay(MOCK_PERIODS, DEMO_DAY);
const todaySchedule = todayAll.filter(p => p.state == null);
const p3Today = todaySchedule.find(p => p.period === "P3");
const p4Today = todaySchedule.find(p => p.period === "P4");

// Count homework due this week
const hwDueCount = MOCK_HOMEWORK.filter(h =>
  h.status === "due-today" || h.status === "not-started" || h.status === "in-progress" || h.status === "overdue"
).length;
const hwOverdue = MOCK_HOMEWORK.filter(h => h.status === "overdue");

export default function StudentDashboard() {
  return (
    <div className="container">
      {/* Hero greeting — monthly narrative */}
      <section className="greet-hero" aria-label="Monthly briefing">
        <div className="greet-hero-label">April 2026 · monthly</div>
        <h1>Layla, here&apos;s how April went.</h1>
        <p className="greet-hero-sub">Three things you did well, one to build, two ideas for May.</p>

        <div className="greet-hero-narrative">
          You had <b>a strong April overall</b>, with notable progress in <b>Chemistry</b> and <b>Mathematics</b> —
          your work on equilibrium problems showed real depth and you were top of class on the unit test.
          Your oral-communication rubric climbed from 3.4 to 4.0, the third month in a row going up,
          supported by your engagement in MUN prep.<br /><br />
          The one to build: <span className="greet-build">written Arabic</span>. Your score dipped below 3.0 for the
          second month; Ms Khadija prepared a 3-week scaffold pack — you can move this back above 3.5 in May.
          <div className="greet-hero-byline">
            Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026
          </div>
        </div>

        <div className="greet-hero-chips">
          <span>★ Top of class · Chemistry</span>
          <span>▲ Oral 3.4 → 4.0 over 3 months</span>
          <span>● MUN finalist citation</span>
          <span>Attendance 97% · 1 absence</span>
        </div>

        <div className="greet-hero-actions">
          <button className="greet-btn">Read the full report</button>
          <button className="greet-btn">Compare to March</button>
          <button className="greet-btn primary">Open my scaffold pack</button>
        </div>
      </section>

      {/* Today strip — 2 columns */}
      <div className="today-strip" aria-label="Today snapshot">
        <div>
          <div className="today-strip-col-label">Right now · P3 starts in 6 min</div>
          <div className="today-strip-col-body">
            {p3Today ? `${p3Today.subject} · ${p3Today.room ?? ""} · ${p3Today.teacher ?? ""}` : "Mathematics · R201 · Mr Faisal"}
            <small>
              {p3Today?.bring
                ? `Bring ${p3Today.bring.join(", ")}. Limits review for tomorrow's test.`
                : "Bring calculator + chapter 7 textbook. Limits review for tomorrow's test."}
            </small>
          </div>
        </div>
        <div className="today-strip-divider">
          <div className="today-strip-col-label">Next exam</div>
          <div className="today-strip-col-body">
            Chemistry mid-term · 12d
            <small>P3 on 12 May · Lab 1 · 50-question paper · revision pack ready</small>
          </div>
        </div>
      </div>

      {/* KPI row — 4 cards */}
      <div className="dash-stat-row" aria-label="Dashboard KPIs">
        <div className="dash-stat-card">
          <div className="dash-stat-l">Due this week</div>
          <div className="dash-stat-v warn">{hwDueCount}</div>
          <div className="dash-stat-d">
            {hwOverdue.length > 0 ? `${hwOverdue.length} overdue` : "next: tomorrow"}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Rubric this month</div>
          <div className="dash-stat-v good">4.1</div>
          <div className="dash-stat-d">▲ +0.22 vs last month</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Attendance</div>
          <div className="dash-stat-v good">97%</div>
          <div className="dash-stat-d">1 absence (medical)</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-l">Honor citations</div>
          <div className="dash-stat-v good">3</div>
          <div className="dash-stat-d">this month</div>
        </div>
      </div>

      {/* Divider */}
      <div className="dash-divider" aria-hidden="true">Jump into a tab</div>

      {/* 2×2 summary card grid */}
      <div className="sd-card-grid">
        <Link href="/schedule" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">My Schedule</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">
            {p3Today ? `P3 · ${p3Today.subject}` : "P3 · Maths"}
          </div>
          <div className="sd-card-trend">
            {p3Today
              ? `starts ${p3Today.start} · ${p3Today.room ?? ""} · ${p3Today.teacher ?? ""}`
              : "starts 10:00 · R201 · Mr Faisal"}
          </div>
          <div className="sd-card-rows">
            <div className="sd-card-row">
              <span>Next</span>
              <b>{p4Today ? `P4 · ${p4Today.subject}` : "P4 · Physics"}</b>
            </div>
            <div className="sd-card-row"><span>Today total</span><b>{todaySchedule.length} classes</b></div>
          </div>
        </Link>

        <Link href="/homework" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Homework</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">{hwDueCount}</div>
          <div className="sd-card-trend warn">
            {hwOverdue.length > 0
              ? `▲ ${hwOverdue.length} overdue · check today`
              : "▲ 1 due tomorrow · stay on track"}
          </div>
          <div className="sd-card-rows">
            {MOCK_HOMEWORK.slice(0, 2).map(h => (
              <div key={h.id} className="sd-card-row">
                <span>{h.subject}</span>
                <b style={h.status === "overdue" ? { color: "var(--color-danger)" } : undefined}>
                  {h.status === "overdue" ? `overdue` : h.due.slice(5, 10)}
                </b>
              </div>
            ))}
          </div>
        </Link>

        <Link href="/past-reports" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Past Reports</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">8</div>
          <div className="sd-card-trend">archive of previous months</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Last opened</span><b>March 2026</b></div>
            <div className="sd-card-row"><span>Available</span><b>Sept &apos;25 → now</b></div>
          </div>
        </Link>

        <Link href="/growth" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">My Growth</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">4.1<span style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600 }}> / 5</span></div>
          <div className="sd-card-trend up">▲ 3 months rising</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Strongest</span><b>Homework 4.6</b></div>
            <div className="sd-card-row"><span>Building</span><b>Written 2.8</b></div>
          </div>
        </Link>
      </div>
    </div>
  );
}
