/**
 * Parent Dashboard.
 *
 * Phase 2.11: rebuilt to match parent-persona.html mockup.
 * Layout: greet hero → today strip (3 col) → 4-card KPI row → divider → 2×2 sd-card grid.
 *
 * All blocks below the greet hero are client components (they read useActiveChild()).
 */

import Link from "next/link";
import GreetHero from "./components/GreetHero";
import DashTodayStrip from "./components/DashTodayStrip";
import DashStatRow from "./components/DashStatRow";
import QuickActionsRow from "./components/QuickActionsRow";

export const dynamic = "force-dynamic";

export default function ParentDashboard() {
  return (
    <div className="container">
      {/* Hero greeting — monthly narrative + chips + actions */}
      <GreetHero />

      {/* Today snapshot strip — 3 columns */}
      <DashTodayStrip />

      {/* KPI row — 4 cards */}
      <DashStatRow />

      {/* Quick actions — household mode only */}
      <QuickActionsRow />

      {/* Divider */}
      <div className="dash-divider" aria-hidden="true">Jump into a tab</div>

      {/* 2×2 summary card grid */}
      <div className="sd-card-grid">
        <Link href="/courses" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Course Selection</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">Submitted</div>
          <div className="sd-card-trend up">26 Jan · Layla&apos;s electives confirmed for 26/27</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Electives picked</span><b>5</b></div>
            <div className="sd-card-row"><span>School to review by</span><b>29 Jan</b></div>
          </div>
        </Link>

        <Link href="/past-reports" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Past Reports</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">8</div>
          <div className="sd-card-trend">archive · since Sept 2025</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Last opened</span><b>March 2026</b></div>
            <div className="sd-card-row"><span>Term reports</span><b>3 available</b></div>
          </div>
        </Link>

        <Link href="/invoices" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Invoices</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">OMR 750</div>
          <div className="sd-card-trend warn">due 25 May · Term 2 balance</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Paid this year</span><b>OMR 3,750</b></div>
            <div className="sd-card-row"><span>Next invoice</span><b>July (Term 3)</b></div>
          </div>
        </Link>

        <Link href="/messages" className="sd-card">
          <div className="sd-card-head">
            <span className="sd-card-label">Messages</span>
            <span className="sd-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="sd-card-big">2 <span style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600 }}>new</span></div>
          <div className="sd-card-trend">from Ms Swart · Finance office</div>
          <div className="sd-card-rows">
            <div className="sd-card-row"><span>Last reply</span><b>14 May</b></div>
            <div className="sd-card-row"><span>Open thread</span><b>1</b></div>
          </div>
        </Link>
      </div>
    </div>
  );
}
