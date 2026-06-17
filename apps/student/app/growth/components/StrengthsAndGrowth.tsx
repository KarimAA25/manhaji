import { MOCK_GROWTH, axisStrengths, axisGrowthAreas } from "@manhaj/lib/mock-growth";

const STRENGTH_QUOTES: Record<string, string> = {
  "Homework":      "4 weeks running — every problem-set in on Sunday. That's the strongest submission streak in the cohort.",
  "Analytical":    "Pattern recognition in Chemistry and History is a standout. Top quartile on evidence-based inference.",
  "Participation": "Consistently contributing in class discussions; teachers note substantive, on-topic additions.",
  "Oral":          "Oral-communication rubric climbed from 3.4 to 4.0 — third month in a row going up, supported by MUN prep.",
  "Creative":      "Original thinking shows in English — already pitched a creative brief rewrite for Romeo & Juliet.",
  "Written":       "Written expression is the current growth focus — scaffolded sessions with Ms Khadija underway.",
};

const GROWTH_NOTES: Record<string, string> = {
  "Written":       "Score dipped below 3.0 for the second month. Three 15-min scaffold sessions per week with Ms Khadija. Target: back to 3.5 by end of term.",
  "Creative":      "Strong ideas but not always captured on paper. Volunteer one design-idea pitch per English unit to build the habit.",
  "Oral":          "Big climb this month — keep the momentum. Sign up for the May MUN debate; a 3-min reflection slot is a low-risk way to lock in the gain.",
  "Analytical":    "Strong baseline. Push to apply inference skills in Maths word problems where the gain will compound.",
  "Participation": "Flat but solid. One stretch goal: raise a counter-argument at least once per lesson to deepen the score.",
  "Homework":      "Already near ceiling. Channel that reliability into problem-set depth, not just completion.",
};

export default function StrengthsAndGrowth() {
  const strengths    = axisStrengths(MOCK_GROWTH);
  const growthAreas  = axisGrowthAreas(MOCK_GROWTH);
  return (
    <section className="gr-sg-row" aria-label="Strengths and growth areas">
      <div className="gr-sg-card gr-sg-strengths">
        <h3>Strengths</h3>
        <ul role="list">
          {strengths.map(a => (
            <li key={a.axis}>
              <span className="gr-sg-name">{a.label}</span>
              <span className="gr-sg-score">{a.this_mo.toFixed(1)} / 5</span>
              <p className="gr-sg-note">{STRENGTH_QUOTES[a.label] ?? "—"}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="gr-sg-card gr-sg-growth">
        <h3>Growth areas</h3>
        <ul role="list">
          {growthAreas.map(a => (
            <li key={a.axis}>
              <span className="gr-sg-name">{a.label}</span>
              <span className="gr-sg-score">{a.this_mo.toFixed(1)} / 5</span>
              <p className="gr-sg-note"><strong>Advisor:</strong> {GROWTH_NOTES[a.label] ?? "—"}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
