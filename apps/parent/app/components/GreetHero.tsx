"use client";

/**
 * Phase 2.11 — Parent dashboard greeting hero.
 *
 * Shows the monthly narrative card from the parent-persona.html mockup:
 *   greet-label / headline / sub / narrative + byline / chips / actions
 *
 * When the "All children" household view is active, the component shows
 * an aggregated household headline rather than a child-specific one.
 */

import type { ReactNode } from "react";
import {
  getActiveChild, useActiveChild, ALL_CHILDREN_ID,
} from "@manhaj/lib/child";
import { useParentDash } from "../ParentDashboardClient";

export default function GreetHero() {
  const { activeId, children } = useActiveChild();
  const child = getActiveChild(activeId, children);
  const dash  = useParentDash();
  const isHousehold = activeId === ALL_CHILDREN_ID;

  if (isHousehold) {
    const childData = children.map(c => {
      const stat = dash?.by_child[c.id];
      const rubricLabel = stat?.rubric_avg ? `Rubric ${stat.rubric_avg.toFixed(1)}` : null;
      const attLabel    = stat?.att_pct    ? `Att ${stat.att_pct}%`                 : null;
      return {
        id:      c.id,
        initial: c.initial,
        name:    c.full_name.split(" ")[0],
        grade:   c.grade_label,
        line:    null as ReactNode,
        chips:   [
          ...(rubricLabel ? [{ label: rubricLabel, tone: (stat?.rubric_avg ?? 0) >= 3.5 ? "good" : "warn" }] : []),
          ...(attLabel    ? [{ label: attLabel,    tone: (stat?.att_pct    ?? 0) >= 90  ? "good" : "bad"  }] : []),
        ] as { label: string; tone: string }[],
      };
    });

    return (
      <section className="greet-agg" aria-label="Household monthly briefing">
        <div className="greet-agg-label">May 2026 · household snapshot</div>
        <h1>Here&apos;s your {children.length === 1 ? "child" : `${children.length} children`} at a glance.</h1>

        <div className="child-summary-grid">
          {childData.map(c => (
            <div key={c.id} className="child-summary">
              <div className="child-summary-head">
                <span className="child-summary-av">{c.initial}</span>
                <div className="child-summary-nm">
                  {c.name}
                  <small>{c.grade}</small>
                </div>
              </div>
              <div className="child-summary-line">{c.line}</div>
              <div className="child-summary-chips">
                {c.chips.map(chip => (
                  <span key={chip.label} className={`child-summary-chip ${chip.tone}`}>{chip.label}</span>
                ))}
              </div>
              <div className="child-summary-open-btn">
                Open {c.name}&apos;s dashboard →
              </div>
            </div>
          ))}
        </div>

        <div className="greet-agg-actions">
          <button className="greet-btn">Read all {children.length} reports</button>
          <button className="greet-btn">Reply to school</button>
          <button className="greet-btn primary">Acknowledge all · 1 click</button>
        </div>
      </section>
    );
  }

  // Single-child view — personalise with child name from DEMO_CHILDREN.
  const name = child?.full_name.split(" ")[0] ?? "Your child";
  const grade = child?.grade_label ?? "";

  return (
    <section className="greet-hero" aria-label={`Monthly briefing for ${name}`}>
      <div className="greet-hero-label">April 2026 · monthly</div>
      <h1>{name} had a strong April.</h1>
      <p className="greet-hero-sub">Here&apos;s what to celebrate, and one thing to support this month.</p>

      <div className="greet-hero-narrative">
        {name} had a <b>standout month</b> in <b>Chemistry</b> and <b>Mathematics</b> — top of class
        on the equilibrium unit test and consistently strong on calculus. Oral-communication rubric
        climbed from 3.4 to 4.0, the third month running, supported by MUN preparation.<br /><br />
        The one to support: <span className="greet-build">written Arabic</span>. Score dipped below 3.0
        for the second month. Ms Khadija prepared a 3-week scaffold pack and {name} has 2 of 12 sessions
        done so far. Quiet encouragement at home goes a long way here.
        <div className="greet-hero-byline">
          Drafted by Manhaji · reviewed and approved by Ms Sandra Swart · 8 May 2026
        </div>
      </div>

      <div className="greet-hero-chips">
        {child && dash?.by_child[child.id]?.rubric_avg
          ? <span>Rubric avg {dash.by_child[child.id].rubric_avg.toFixed(1)}</span>
          : <span>★ Top of class · Chemistry</span>
        }
        {child && dash?.by_child[child.id]?.att_pct
          ? <span>Attendance {dash.by_child[child.id].att_pct}% · {dash.by_child[child.id].att_absences} absence{dash.by_child[child.id].att_absences === 1 ? "" : "s"}</span>
          : <span>Attendance 97% · 1 medical absence</span>
        }
        {grade && <span>{grade}</span>}
      </div>

      <div className="greet-hero-actions">
        <button className="greet-btn">Read the full report</button>
        <button className="greet-btn">Reply to Ms Swart</button>
        <button className="greet-btn primary">Acknowledge · 1 click</button>
      </div>
    </section>
  );
}
