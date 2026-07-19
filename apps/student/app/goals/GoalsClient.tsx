"use client";

import { useState, useTransition } from "react";
import type { RubricSuggestionData } from "@manhaj/lib/queries/goals";

type GoalStatus   = "done" | "active" | "behind";
type GoalCategory = "ACADEMIC" | "PERSONAL" | "COLLABORATION" | "ARABIC" | "MATHS";

type Goal = {
  id: string;
  title: string;
  category: GoalCategory;
  setWith: string;
  frequency: string;
  progressLabel: string;
  progressPct: number;
  status: GoalStatus;
  highlight: string;
  actions: { label: string; primary?: boolean }[];
  wide?: boolean;
};

type Suggestion = {
  id: string;
  title: string;
  description: string;
};

type Props = {
  studentName: string;
  rubricScores: RubricSuggestionData[];
};

// ── Mock goals ────────────────────────────────────────────────────────────────
const MOCK_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Score 90%+ in every maths quiz",
    category: "ACADEMIC",
    setWith: "Mr. Tariq",
    frequency: "4 quiz min",
    progressLabel: "4 of 4 quizzes hit",
    progressPct: 100,
    status: "done",
    highlight: "Highest quiz score this month: 93% on chapter 4 — top of class!",
    actions: [{ label: "See history" }, { label: "Set next month's →", primary: true }],
  },
  {
    id: "g2",
    title: "Read for 30 minutes every day",
    category: "PERSONAL",
    setWith: "you",
    frequency: "Self-reported · daily check-in",
    progressLabel: "12-day streak — keep going!",
    progressPct: 92,
    status: "active",
    highlight: "Streak: 12 days · longest streak ever: 14 days · don't break the chain!",
    actions: [{ label: "✓ Tick today", primary: true }],
  },
  {
    id: "g3",
    title: "Help 1 new classmate each week",
    category: "COLLABORATION",
    setWith: "Ms. Reem (counselor)",
    frequency: "Linked to rubric · self + teacher checked",
    progressLabel: "3 of 4 weeks this month",
    progressPct: 75,
    status: "active",
    highlight: "Ms. Sara noticed you helping the new student at lunch on Thursday — that counts!",
    actions: [{ label: "Add this week", primary: true }],
  },
  {
    id: "g4",
    title: "Master all 60 chapter-6 Arabic words",
    category: "ARABIC",
    setWith: "Ms. Maryam",
    frequency: "Self-quizzed · ~15 a week",
    progressLabel: "54 of 60 words mastered",
    progressPct: 90,
    status: "active",
    highlight: "Almost there — just 6 more words to go. You're ahead of schedule!",
    actions: [{ label: "Practise now" }, { label: "Mark words", primary: true }],
  },
  {
    id: "g5",
    title: "Get better at multi-step word problems",
    category: "MATHS",
    setWith: "Mr. Tariq",
    frequency: "Practise 5 a week · 10 weeks",
    progressLabel: "14 of 25 problems done · slightly behind",
    progressPct: 56,
    status: "behind",
    highlight: "Try 2 more this weekend to catch up — Mr. Tariq has 5 new problems waiting.",
    actions: [{ label: "See problems" }, { label: "Try one now", primary: true }],
    wide: true,
  },
];

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    title: "Practise explaining your maths thinking out loud",
    description: "Your 'communication of reasoning' axis is your lowest — and the easiest to improve quickly. Mr. Tariq could pair you with a younger student once a week to explain a problem.",
  },
  {
    id: "s2",
    title: "Try one Arabic short story a week",
    description: "You're crushing vocabulary — try connecting it. Reading short stories will help fluency more than another word list.",
  },
];

const CAT_CLASS: Record<GoalCategory, string> = {
  ACADEMIC:      "myg-cat-academic",
  PERSONAL:      "myg-cat-personal",
  COLLABORATION: "myg-cat-collab",
  ARABIC:        "myg-cat-arabic",
  MATHS:         "myg-cat-maths",
};

const CAT_BORDER: Record<GoalCategory, string> = {
  ACADEMIC:      "#3182CE",
  PERSONAL:      "#38A169",
  COLLABORATION: "#805AD5",
  ARABIC:        "#ED8936",
  MATHS:         "#319795",
};

function barColor(pct: number, status: GoalStatus): string {
  if (status === "done")    return "#38A169";
  if (status === "behind")  return "#ED8936";
  return "#3182CE";
}

function buildSuggestions(rubricScores: RubricSuggestionData[]): Suggestion[] {
  const low = rubricScores
    .filter(r => r.score !== null && r.score <= 2)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 2);
  if (!low.length) return DEFAULT_SUGGESTIONS;
  return low.map(r => ({
    id: r.axisCode,
    title: `Improve your ${r.axisCode.toLowerCase().replace(/_/g, " ")} skills`,
    description: `Your score on this area is ${r.score}/5 — a good area to set a goal around this month.`,
  }));
}

const CURRENT_MONTH = new Date().toLocaleString("en", { month: "long" });

export default function GoalsClient({ studentName, rubricScores }: Props) {
  const displayName = studentName || "Layla";

  const [tickedGoals, setTickedGoals]       = useState<Record<string, boolean>>({});
  const [reflection, setReflection]         = useState(
    "Maths is starting to make more sense, especially fractions. I felt proud about the chapter 4 quiz. Reading every day has helped my vocabulary.",
  );
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [, startTransition]                 = useTransition();

  const activeCount = MOCK_GOALS.filter(g => g.status !== "done").length;
  const doneCount   = MOCK_GOALS.filter(g => g.status === "done").length;
  const dayStreak   = 12;

  const suggestions = buildSuggestions(rubricScores);

  function handleSave() {
    startTransition(() => {
      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 3000);
    });
  }

  return (
    <div className="myg-page">

      {/* Title */}
      <div className="myg-title-row">
        <h1 className="myg-title">My goals · {CURRENT_MONTH}</h1>
        <p className="myg-subtitle">What you&apos;re working on this month. Set a few, track your progress, celebrate the wins.</p>
      </div>

      {/* Summary card */}
      <div className="myg-summary-card">
        <div className="myg-summary-left">
          <span className="myg-summary-icon">☀️</span>
          <div>
            <div className="myg-summary-headline">
              You&apos;re on track with {activeCount + doneCount - 1} of your {MOCK_GOALS.length} goals.
            </div>
            <div className="myg-summary-sub">
              Big week — your maths quiz score (92%) hit your &apos;90% quiz&apos; goal. And you read every day for {dayStreak} days straight!
            </div>
          </div>
        </div>
        <div className="myg-kpis">
          <div className="myg-kpi">
            <div className="myg-kpi-num">{activeCount}</div>
            <div className="myg-kpi-label">ACTIVE</div>
          </div>
          <div className="myg-kpi">
            <div className="myg-kpi-num">{doneCount}</div>
            <div className="myg-kpi-label">DONE</div>
          </div>
          <div className="myg-kpi">
            <div className="myg-kpi-num">{dayStreak}</div>
            <div className="myg-kpi-label">DAY STREAK</div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="myg-section-hdr">
        <span className="myg-section-label">ACTIVE GOALS</span>
        <button className="myg-add-btn">+ Add a goal</button>
      </div>

      <div className="myg-goals-grid">
        {MOCK_GOALS.map(goal => (
          <div
            key={goal.id}
            className={`myg-goal-card${goal.wide ? " wide" : ""}`}
            style={{ borderTopColor: CAT_BORDER[goal.category] }}
          >
            {/* Top row */}
            <div className="myg-card-top">
              <span className={`myg-cat-badge ${CAT_CLASS[goal.category]}`}>{goal.category}</span>
              {goal.status === "done" && <span className="myg-done-badge">✓ DONE</span>}
              <span className="myg-goal-freq">{goal.frequency}</span>
            </div>

            {/* Title */}
            <div className="myg-goal-title">{goal.title}</div>

            {/* Progress */}
            <div className="myg-progress-row">
              <span className="myg-progress-label">{goal.progressLabel}</span>
              <span className="myg-progress-pct">{goal.progressPct}%</span>
            </div>
            <div className="myg-bar-wrap">
              <div
                className="myg-bar-fill"
                style={{ width: `${goal.progressPct}%`, background: barColor(goal.progressPct, goal.status) }}
              />
            </div>

            {/* Highlight */}
            <div className="myg-highlight">{goal.highlight}</div>

            {/* Footer */}
            <div className="myg-card-footer">
              <span className="myg-set-by">Set with {goal.setWith}</span>
              <div className="myg-card-actions">
                {goal.actions.map((a, i) => (
                  <button
                    key={i}
                    className={`myg-action-btn${a.primary ? " primary" : ""}`}
                    onClick={() => {
                      if (a.label.includes("Tick")) setTickedGoals(p => ({ ...p, [goal.id]: true }));
                    }}
                  >
                    {a.label.includes("Tick") && tickedGoals[goal.id] ? "✓ Ticked!" : a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manhaji Suggests */}
      <div className="myg-section-hdr myg-section-hdr-gap">
        <span className="myg-section-label">GOALS MANHAJ SUGGESTS</span>
        <span className="myg-suggests-note">Based on your rubric scores · pick what feels right</span>
      </div>
      <div className="myg-suggests-card">
        <div className="myg-suggests-grid">
          {suggestions.map(s => (
            <div key={s.id} className="myg-suggest-item">
              <div className="myg-suggest-title">{s.title}</div>
              <div className="myg-suggest-desc">{s.description}</div>
              <button className="myg-suggest-add">+ Add this as a goal +</button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reflection */}
      <div className="myg-reflection-section">
        <div className="myg-section-hdr">
          <span className="myg-section-label">QUICK REFLECTION</span>
          <span className="myg-suggests-note">Private to you and Mr. Tariq · saved with your monthly report</span>
        </div>
        <div className="myg-reflection-card">
          <div className="myg-reflection-label">WHAT WENT WELL THIS MONTH?</div>
          <textarea
            className="myg-reflection-textarea"
            value={reflection}
            rows={4}
            onChange={e => { setReflection(e.target.value); setReflectionSaved(false); }}
          />
          <div className="myg-reflection-footer">
            <span className="myg-reflection-note">
              {reflectionSaved
                ? "Saved ✓"
                : `Last saved just now · only you, Mr. Tariq, and ${displayName}'s parents can see this`}
            </span>
            <button className="myg-save-btn" onClick={handleSave}>Save reflection</button>
          </div>
        </div>
      </div>

    </div>
  );
}
