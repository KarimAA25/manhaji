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

import {
  DEMO_CHILDREN, getActiveChild, useActiveChild, ALL_CHILDREN_ID,
} from "@manhaj/lib/child";

export default function GreetHero() {
  const { activeId } = useActiveChild();
  const child = getActiveChild(activeId);
  const isHousehold = activeId === ALL_CHILDREN_ID;

  if (isHousehold) {
    // Household aggregate view — matches parent-multi-child.html greet-agg block:
    // gradient hero with child-summary-grid (3 per-child panels: avatar, narrative, chips, open btn).
    const childData = [
      {
        id:      DEMO_CHILDREN[0].id,
        initial: DEMO_CHILDREN[0].initial,
        name:    "Layla",
        grade:   "10A · HS",
        line:    <>Strong April. ▲ <b>Oral 4.0</b>, top of class in Chem. <b>Build</b>: written Arabic 2.8.</>,
        chips:   [{ label: "Rubric 4.1", tone: "good" }, { label: "Att 97%", tone: "good" }],
      },
      {
        id:      DEMO_CHILDREN[1].id,
        initial: DEMO_CHILDREN[1].initial,
        name:    "Omar",
        grade:   "7B · MS",
        line:    <>Improving in Mathematics. <b>Concern</b>: 3 unexplained absences. Ms Swart wants a chat — meeting drafted.</>,
        chips:   [{ label: "Rubric 3.4", tone: "warn" }, { label: "Att 86%", tone: "bad" }],
      },
      {
        id:      DEMO_CHILDREN[2].id,
        initial: DEMO_CHILDREN[2].initial,
        name:    "Yasmin",
        grade:   "KG2 · Primary",
        line:    <>Happy + settled. Loved the spring concert. No flags this month.</>,
        chips:   [{ label: "All good", tone: "good" }, { label: "Att 99%", tone: "good" }],
      },
    ];

    return (
      <section className="greet-agg" aria-label="Household monthly briefing">
        <div className="greet-agg-label">May 2026 · household snapshot</div>
        <h1>Mr Al-Habsi — here&apos;s your three children at a glance.</h1>

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
          <button className="greet-btn">Read all 3 reports</button>
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
          Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026
        </div>
      </div>

      <div className="greet-hero-chips">
        <span>★ Top of class · Chemistry</span>
        <span>▲ Oral 3.4 → 4.0 over 3 months</span>
        <span>● MUN finalist citation</span>
        <span>Attendance 97% · 1 medical absence</span>
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
