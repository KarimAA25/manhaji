/**
 * Manhaj Phase 2.14 demo fixture — Layla's 6-axis academic rubric history
 * (last 6 months) + 4 goals she set with her advisor.
 *
 * Axes match the mockup: Analytical / Creative / Oral / Written /
 * Participation / Homework.
 */

export type AxisKey =
  | "analytical" | "creative" | "oral"
  | "written" | "participation" | "homework";

export const AXIS_LABELS: Array<{ key: AxisKey; label: string; description: string }> = [
  { key: "analytical",    label: "Analytical",    description: "Pattern recognition, evidence, inference" },
  { key: "creative",      label: "Creative",      description: "Original ideas, design thinking" },
  { key: "oral",          label: "Oral",          description: "Spoken expression in class + presentation" },
  { key: "written",       label: "Written",       description: "Essay craft, clarity, structure" },
  { key: "participation", label: "Participation", description: "Engagement + contribution in class" },
  { key: "homework",      label: "Homework",      description: "Completion + quality of work outside class" },
];

export type MonthScore = { month: string; score: number };

export type AxisHistory = {
  axis:    AxisKey;
  label:   string;
  history: MonthScore[];
  this_mo: number;
  last_mo: number;
  six_mo:  number;
};

export type Goal = {
  id:          string;
  axis:        AxisKey;
  title:       string;
  detail:      string;
  progress:    number;
  status:      "on-track" | "behind" | "done";
  last_update: string;
};

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];

// History arrays: start → end (6 months), end = this_mo (May)
// analytical:    3.8 → 4.4 gradual climb
// creative:      3.6 → 3.8 slight up
// oral:          3.4 → 4.0 steady climb
// written:       3.5 → 2.8 declining (red flag)
// participation: 4.1 → 4.2 flat-ish
// homework:      4.4 → 4.6 climbing
const HISTORIES: Array<{ axis: AxisKey; scores: number[] }> = [
  { axis: "analytical",    scores: [3.8, 3.9, 4.0, 4.2, 4.3, 4.4] },
  { axis: "creative",      scores: [3.6, 3.6, 3.7, 3.7, 3.8, 3.8] },
  { axis: "oral",          scores: [3.4, 3.5, 3.6, 3.7, 3.9, 4.0] },
  { axis: "written",       scores: [3.5, 3.4, 3.3, 3.1, 3.0, 2.8] },
  { axis: "participation", scores: [4.1, 4.1, 4.2, 4.1, 4.2, 4.2] },
  { axis: "homework",      scores: [4.4, 4.4, 4.5, 4.5, 4.6, 4.6] },
];

export const MOCK_GROWTH: AxisHistory[] = HISTORIES.map(h => {
  const label = AXIS_LABELS.find(a => a.key === h.axis)!.label;
  const history: MonthScore[] = MONTHS.map((m, i) => ({ month: m, score: h.scores[i] }));
  return {
    axis:    h.axis,
    label,
    history,
    this_mo: h.scores[h.scores.length - 1],
    last_mo: h.scores[h.scores.length - 2],
    six_mo:  h.scores[0],
  };
});

export const MOCK_GOALS: Goal[] = [
  {
    id: "g-1", axis: "written",
    title: "Move Written Arabic ≥ 3.5",
    detail: "Three 15-min scaffolds per week. Friday checkpoint with Ms Khadija. Progress: 2 / 12 sessions done.",
    progress: 17, status: "behind", last_update: "2026-05-22",
  },
  {
    id: "g-2", axis: "oral",
    title: "Speak at the May MUN debate",
    detail: "3-min reflection slot. Practice script with Ms Swart Tuesday lunch.",
    progress: 80, status: "on-track", last_update: "2026-05-20",
  },
  {
    id: "g-3", axis: "homework",
    title: "Submit all problem-sets by Sunday EOD",
    detail: "Weekly homework tracker visible to Mr Faisal. Streak: 4 weeks running.",
    progress: 95, status: "on-track", last_update: "2026-05-25",
  },
  {
    id: "g-4", axis: "creative",
    title: "Pitch one design idea per English unit",
    detail: "Voluntary creative brief. Already pitched ‘rewrite Romeo & Juliet ending’.",
    progress: 100, status: "done", last_update: "2026-04-30",
  },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function axisStrengths(histories: AxisHistory[]): AxisHistory[] {
  return [...histories].sort((a, b) => b.this_mo - a.this_mo).slice(0, 2);
}

export function axisGrowthAreas(histories: AxisHistory[]): AxisHistory[] {
  return [...histories].sort((a, b) => a.this_mo - b.this_mo).slice(0, 2);
}
