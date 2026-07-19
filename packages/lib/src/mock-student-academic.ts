/**
 * Manhaj Phase 3.3 — Layla's academic performance fixtures
 * Used by /student/growth new blocks:
 *   CurrentGrades · UniversityPlacementSignal · ImprovementPlan
 *   SubjectPercentiles · MonthOverMonthDelta
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type IGCSEGrade = "A*" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C";

/**
 * Regional convention: student-facing grades display as percentages, never
 * letters. Representative midpoint per IGCSE band, used by /student/growth.
 */
export const GRADE_PCT: Record<IGCSEGrade, number> = {
  "A*": 95, "A": 90, "A-": 85, "B+": 80, "B": 75, "B-": 70, "C+": 65, "C": 60,
};

export type SubjectGrade = {
  subject:    string;
  grade:      IGCSEGrade;
  trend:      "up" | "flat" | "down";
  delta_text: string;   // e.g. "▲ +2% vs last term"
  class_avg:  IGCSEGrade;
  percentile: number;   // 0–100
  band_label: string;   // "top 28%"
  flag?:      boolean;  // true = needs attention
};

export type PlacementTier = {
  name:                  string;
  band_pct:              number;        // 15 / 50 / 35
  example_universities:  string[];
  similar_profiles_n:    number;
};

export type ImprovementCard = {
  id:        string;
  icon:      string;        // emoji
  headline:  string;
  body:      string;
  cta_label: string;
};

export type DeltaItem = {
  subject: string;
  delta:   string;    // "+0.3" or "-0.4"
};

export type DeltaGroup = {
  kind:    "up" | "flat" | "down";
  label:   string;      // "Climbed" / "Held the line" / "Need attention"
  caption: string;
  items:   DeltaItem[];
};

/* -------------------------------------------------------------------------- */
/* Subject grades — Layla's IGCSE subjects (10 subjects)                       */
/* -------------------------------------------------------------------------- */

export const LAYLA_SUBJECTS: SubjectGrade[] = [
  {
    subject:    "English",
    grade:      "A",
    trend:      "up",
    delta_text: "▲ +3% vs last term",
    class_avg:  "B+",
    percentile: 87,
    band_label: "top 13%",
  },
  {
    subject:    "Mathematics",
    grade:      "B+",
    trend:      "up",
    delta_text: "▲ +2% vs last term",
    class_avg:  "B",
    percentile: 64,
    band_label: "top 36%",
  },
  {
    subject:    "Arabic",
    grade:      "A-",
    trend:      "flat",
    delta_text: "— flat vs last term",
    class_avg:  "B+",
    percentile: 76,
    band_label: "top 24%",
  },
  {
    subject:    "Chemistry",
    grade:      "B",
    trend:      "up",
    delta_text: "▲ +3% vs last term",
    class_avg:  "B-",
    percentile: 71,
    band_label: "top 29%",
  },
  {
    subject:    "Biology",
    grade:      "B+",
    trend:      "up",
    delta_text: "▲ +2% vs last term",
    class_avg:  "B",
    percentile: 73,
    band_label: "top 27%",
  },
  {
    subject:    "Physics",
    grade:      "B-",
    trend:      "down",
    delta_text: "▼ −2% vs last term",
    class_avg:  "B",
    percentile: 52,
    band_label: "top 48%",
    flag:       true,
  },
  {
    subject:    "History",
    grade:      "A",
    trend:      "up",
    delta_text: "▲ +3% vs last term",
    class_avg:  "B+",
    percentile: 89,
    band_label: "top 11%",
  },
  {
    subject:    "Geography",
    grade:      "A-",
    trend:      "up",
    delta_text: "▲ +1% vs last term",
    class_avg:  "B+",
    percentile: 80,
    band_label: "top 20%",
  },
  {
    subject:    "ICT",
    grade:      "B+",
    trend:      "flat",
    delta_text: "— flat vs last term",
    class_avg:  "B",
    percentile: 68,
    band_label: "top 32%",
  },
  {
    subject:    "PE",
    grade:      "A",
    trend:      "flat",
    delta_text: "— flat vs last term",
    class_avg:  "A-",
    percentile: 78,
    band_label: "top 22%",
  },
];

/* -------------------------------------------------------------------------- */
/* University placement tiers                                                  */
/* -------------------------------------------------------------------------- */

export const PLACEMENT_TIERS: PlacementTier[] = [
  {
    name:                 "Top universities",
    band_pct:             15,
    example_universities: ["Oxford", "Cambridge", "King's College London", "Imperial College", "NYU Abu Dhabi"],
    similar_profiles_n:   412,
  },
  {
    name:                 "Strong programmes",
    band_pct:             50,
    example_universities: ["University of Warwick", "University of Edinburgh", "University of Manchester", "UAE University"],
    similar_profiles_n:   412,
  },
  {
    name:                 "Local & regional",
    band_pct:             35,
    example_universities: ["Sultan Qaboos University", "American University of Sharjah", "American University in Cairo"],
    similar_profiles_n:   412,
  },
];

/* -------------------------------------------------------------------------- */
/* Improvement plan cards (3 cards)                                            */
/* -------------------------------------------------------------------------- */

export const IMPROVEMENT_PLAN: ImprovementCard[] = [
  {
    id:        "ip-1",
    icon:      "✍️",
    headline:  "Written Arabic structure",
    body:      "Your Written Arabic score dipped from 3.2 → 2.8 this term. Schedule three 15-min scaffold sessions per week with Ms Khadija focusing on paragraph transitions and essay structure. Friday checkpoint to review progress against the target of 3.5 by end of term.",
    cta_label: "Discuss with advisor",
  },
  {
    id:        "ip-2",
    icon:      "🔬",
    headline:  "Build on the Science momentum",
    body:      "Chemistry climbed from 70% → 75% with strong lab participation scores. Push into Biology by joining the after-school science project on Tuesday afternoons — lab-based work will reinforce both subjects and strengthen your university profile.",
    cta_label: "Mark as in-progress",
  },
  {
    id:        "ip-3",
    icon:      "🎤",
    headline:  "Public-speaking opportunity",
    body:      "Your Oral rubric score is on a three-month upward streak, climbing from 3.4 to 4.0. The MUN debate in May is the right next stretch — sign up for the policy committee and take a 3-minute speaking slot to lock in this gain with a visible achievement.",
    cta_label: "Mark as in-progress",
  },
];

/* -------------------------------------------------------------------------- */
/* Month-over-month delta groups                                               */
/* -------------------------------------------------------------------------- */

export const MOM_DELTA: DeltaGroup[] = [
  {
    kind:    "up",
    label:   "Climbed",
    caption: "Three areas with strongest gains this month.",
    items: [
      { subject: "Maths",   delta: "+0.3" },
      { subject: "Oral",    delta: "+0.6" },
      { subject: "ICT",     delta: "+0.2" },
    ],
  },
  {
    kind:    "flat",
    label:   "Held the line",
    caption: "Areas that maintained your strong pattern.",
    items: [
      { subject: "English",       delta: "0.0" },
      { subject: "Participation", delta: "+0.1" },
      { subject: "Behaviour",     delta: "ceiling" },
    ],
  },
  {
    kind:    "down",
    label:   "Need attention",
    caption: "Areas to focus on next month — both have plans in the Improvement section above.",
    items: [
      { subject: "Written", delta: "−0.4" },
      { subject: "Physics", delta: "−0.2" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Grade band → numeric ordering (A* = 8 highest, C = 1 lowest) */
const GRADE_ORDER: Record<IGCSEGrade, number> = {
  "A*": 8, "A": 7, "A-": 6, "B+": 5, "B": 4, "B-": 3, "C+": 2, "C": 1,
};

/** Returns subjects sorted highest grade first */
export function subjectsByGrade(subjects: SubjectGrade[]): SubjectGrade[] {
  return [...subjects].sort(
    (a, b) => GRADE_ORDER[b.grade] - GRADE_ORDER[a.grade],
  );
}

/** Returns subjects that are flagged (needs attention) */
export function flaggedSubjects(subjects: SubjectGrade[]): SubjectGrade[] {
  return subjects.filter(s => s.flag === true);
}

/** Returns subjects with an upward trend */
export function trendingUpSubjects(subjects: SubjectGrade[]): SubjectGrade[] {
  return subjects.filter(s => s.trend === "up");
}
