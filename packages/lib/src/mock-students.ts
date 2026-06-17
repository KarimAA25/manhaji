/**
 * Manhaj Phase-2 demo fixture: synthetic student / incident / admission rows
 * for the Admin Students tab.
 *
 * The shape mirrors the eventual `manhaj_admin_students_public` RPC return
 * (Phase 3). Replacing this fixture with a real RPC is a one-import change.
 */

export type RubricScores = {
  analytical:    number;
  creative:      number;
  oral:          number;
  written:       number;
  participation: number;
  homework:      number;
};

export type StudentStatus =
  | "honor" | "good" | "watch" | "support"
  | "renewal-pending" | "admission-pending";

export type StudentRow = {
  id:           string;
  full_name:    string;
  section_code: string;
  grade_band:   "Primary" | "MS" | "HS" | "KG";
  rubric:       RubricScores;
  rubric_avg:   number;
  attendance:   number;
  status:       StudentStatus;
  risk_score:   number;
  flags:        string[];
};

export type IncidentRow = {
  id:             string;
  student_id:     string;
  student_name:   string;
  section_code:   string;
  ts:             string;
  kind:           "positive" | "negative" | "neutral";
  body:           string;
  ai_suggestion?: string;
};

export type AdmissionRow = {
  id:           string;
  full_name:    string;
  target_grade: string;
  source:       string;
  ai_score:     number;
  ai_band:      "A" | "A-" | "B+" | "B" | "B-" | "—";
  status:       "review" | "hold" | "decided";
};

export type CohortHeatRow = {
  section_code: string;
  rubric:       RubricScores;
};

function avg(r: RubricScores): number {
  return (
    r.analytical + r.creative + r.oral + r.written + r.participation + r.homework
  ) / 6;
}

function s(
  id: string, full_name: string, section_code: string, grade_band: StudentRow["grade_band"],
  rubric: RubricScores, attendance: number, status: StudentStatus, risk_score: number, flags: string[] = [],
): StudentRow {
  return {
    id, full_name, section_code, grade_band, rubric,
    rubric_avg: Number(avg(rubric).toFixed(2)),
    attendance, status, risk_score, flags,
  };
}

export const MOCK_STUDENTS: StudentRow[] = [
  // 10A — mid-pack
  s("layla-al-habsi",   "Layla Al-Habsi",   "10A", "HS", { analytical: 4.4, creative: 3.8, oral: 4.0, written: 2.8, participation: 4.2, homework: 4.6 }, 97, "honor",  14, ["ieap"]),
  s("aya-mansour",      "Aya Mansour",      "10A", "HS", { analytical: 4.7, creative: 4.5, oral: 4.6, written: 4.5, participation: 4.7, homework: 4.8 }, 99, "honor",   8),
  s("khalil-al-mansoor","Khalil Al-Mansoor","10A", "HS", { analytical: 3.8, creative: 3.4, oral: 3.6, written: 3.2, participation: 3.5, homework: 3.7 }, 95, "good",   22),
  s("rania-khalifa",    "Rania Khalifa",    "10A", "HS", { analytical: 3.5, creative: 3.0, oral: 3.2, written: 2.9, participation: 3.6, homework: 3.4 }, 89, "watch",  41, ["eal"]),
  s("tariq-said",       "Tariq Said",       "10A", "HS", { analytical: 4.0, creative: 3.6, oral: 3.8, written: 3.4, participation: 3.9, homework: 4.1 }, 96, "good",   18),

  // 10B — softer numbers
  s("maya-habibi",      "Maya Habibi",      "10B", "HS", { analytical: 3.5, creative: 3.3, oral: 3.5, written: 3.1, participation: 3.4, homework: 3.6 }, 87, "watch",  48, ["chronic-absentee"]),
  s("faisal-bilal",     "Faisal Bilal",     "10B", "HS", { analytical: 3.2, creative: 2.9, oral: 3.0, written: 2.8, participation: 3.1, homework: 3.3 }, 93, "good",   34, ["eal"]),
  s("noura-saleh",      "Noura Saleh",      "10B", "HS", { analytical: 3.9, creative: 3.7, oral: 3.8, written: 3.5, participation: 3.8, homework: 4.0 }, 96, "good",   20),
  s("hassan-omar",      "Hassan Omar",      "10B", "HS", { analytical: 3.4, creative: 3.0, oral: 3.1, written: 2.7, participation: 3.3, homework: 3.5 }, 92, "good",   29),
  s("dana-rashid",      "Dana Rashid",      "10B", "HS", { analytical: 3.6, creative: 3.5, oral: 3.7, written: 3.3, participation: 3.6, homework: 3.7 }, 94, "good",   24),

  // 11 AS — exam-track
  s("omar-saadi",       "Omar Saadi",       "11 AS", "HS", { analytical: 2.8, creative: 2.6, oral: 2.7, written: 2.4, participation: 2.5, homework: 2.6 }, 82, "support", 78, ["chronic-absentee"]),
  s("yasmin-naser",     "Yasmin Naser",     "11 AS", "HS", { analytical: 3.2, creative: 3.0, oral: 3.1, written: 2.8, participation: 3.0, homework: 3.1 }, 88, "watch",  51, ["chronic-absentee"]),
  s("mariam-nasser",    "Mariam Nasser",    "11 AS", "HS", { analytical: 4.5, creative: 4.0, oral: 4.2, written: 3.8, participation: 4.3, homework: 4.5 }, 98, "honor",  10),
  s("hamad-al-busaidi", "Hamad Al-Busaidi", "11 AS", "HS", { analytical: 4.6, creative: 4.1, oral: 4.2, written: 3.9, participation: 4.4, homework: 4.5 }, 97, "honor",  12),
  s("layla-al-rashid",  "Layla Al-Rashid",  "11 AS", "HS", { analytical: 3.7, creative: 3.5, oral: 3.6, written: 3.4, participation: 3.7, homework: 3.8 }, 94, "good",   26),

  // 12 A2 — most senior
  s("khalid-rashid",    "Khalid Rashid",    "12 A2", "HS", { analytical: 3.2, creative: 3.0, oral: 3.1, written: 2.9, participation: 3.0, homework: 3.2 }, 91, "renewal-pending", 65),
  s("aisha-mohamed",    "Aisha Mohamed",    "12 A2", "HS", { analytical: 4.7, creative: 4.4, oral: 4.5, written: 4.2, participation: 4.6, homework: 4.7 }, 99, "honor",   8),
  s("samir-ali",        "Samir Ali",        "12 A2", "HS", { analytical: 4.5, creative: 4.0, oral: 4.3, written: 4.1, participation: 4.4, homework: 4.5 }, 97, "honor",  12),
  s("noor-suleiman",    "Noor Suleiman",    "12 A2", "HS", { analytical: 4.0, creative: 3.8, oral: 4.0, written: 3.7, participation: 4.0, homework: 4.1 }, 96, "good",   22),

  // 9A — younger band
  s("ahmed-jaber",      "Ahmed Jaber",      "9A", "HS", { analytical: 4.1, creative: 3.7, oral: 3.9, written: 3.6, participation: 4.0, homework: 4.2 }, 96, "good",   20),
  s("fatima-shamsi",    "Fatima Shamsi",    "9A", "HS", { analytical: 4.4, creative: 4.0, oral: 4.1, written: 4.0, participation: 4.3, homework: 4.5 }, 98, "honor",  10),
  s("yousef-al-amri",   "Yousef Al-Amri",   "9A", "HS", { analytical: 3.6, creative: 3.4, oral: 3.5, written: 3.2, participation: 3.5, homework: 3.7 }, 93, "good",   28),
  s("hala-mohsen",      "Hala Mohsen",      "9A", "HS", { analytical: 3.0, creative: 2.8, oral: 2.9, written: 2.6, participation: 2.9, homework: 3.0 }, 84, "support", 71, ["chronic-absentee", "eal"]),

  // 9B
  s("zayd-al-hashimi",  "Zayd Al-Hashimi",  "9B", "HS", { analytical: 3.9, creative: 3.6, oral: 3.7, written: 3.4, participation: 3.7, homework: 3.9 }, 95, "good",   23),
  s("mona-khalil",      "Mona Khalil",      "9B", "HS", { analytical: 4.6, creative: 4.3, oral: 4.4, written: 4.1, participation: 4.5, homework: 4.6 }, 99, "honor",   9),
  s("rashid-al-saadi",  "Rashid Al-Saadi",  "9B", "HS", { analytical: 3.3, creative: 3.0, oral: 3.1, written: 2.8, participation: 3.0, homework: 3.2 }, 90, "watch",   46),
  s("salwa-ibrahim",    "Salwa Ibrahim",    "9B", "HS", { analytical: 3.7, creative: 3.4, oral: 3.5, written: 3.3, participation: 3.6, homework: 3.8 }, 94, "good",   25),

  // A couple of admission-pending placeholders (also listed in MOCK_ADMISSIONS)
  s("sara-khoury",      "Sara Khoury",      "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
  s("faisal-al-mawla",  "Faisal Al-Mawla",  "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
  s("hannah-rizwan",    "Hannah Rizwan",    "—",   "HS", { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 }, 0, "admission-pending", 0),
];

export const MOCK_INCIDENTS: IncidentRow[] = [
  { id: "i1", student_id: "khalid-rashid", student_name: "Khalid Rashid", section_code: "12 A2", ts: "2026-05-22T09:14:00Z", kind: "negative",
    body: "Third incident in 2 weeks (late + disruptive · Maths).",
    ai_suggestion: "3 incidents in 14 days — propose a check-in. Schedule meeting · draft parent note." },
  { id: "i2", student_id: "layla-al-habsi", student_name: "Layla Al-Habsi", section_code: "10A", ts: "2026-05-20T13:00:00Z", kind: "positive",
    body: "MUN finalist · positive citation from Ms Swart." },
  { id: "i3", student_id: "omar-saadi", student_name: "Omar Saadi", section_code: "11 AS", ts: "2026-05-17T10:30:00Z", kind: "neutral",
    body: "Meeting with student advisor · re-engagement plan agreed." },
  { id: "i4", student_id: "hala-mohsen", student_name: "Hala Mohsen", section_code: "9A", ts: "2026-05-15T08:45:00Z", kind: "negative",
    body: "Two consecutive unexplained absences." },
  { id: "i5", student_id: "aya-mansour", student_name: "Aya Mansour", section_code: "10A", ts: "2026-05-12T11:00:00Z", kind: "positive",
    body: "Top of class on the chemistry equilibrium unit test." },
  { id: "i6", student_id: "rania-khalifa", student_name: "Rania Khalifa", section_code: "10A", ts: "2026-05-10T14:20:00Z", kind: "negative",
    body: "Written-Arabic essay score dipped below 3.0 for the second month." },
];

export const MOCK_ADMISSIONS: AdmissionRow[] = [
  { id: "a1", full_name: "Sara Khoury",     target_grade: "G9 applicant",  source: "IGCSE preview · score 84/100",      ai_score: 84, ai_band: "A",  status: "review" },
  { id: "a2", full_name: "Faisal Al-Mawla", target_grade: "G10 transfer",  source: "From British School Muscat",         ai_score: 76, ai_band: "B+", status: "review" },
  { id: "a3", full_name: "Hannah Rizwan",   target_grade: "G11 applicant", source: "Awaiting transcript",                ai_score: 0,  ai_band: "—",  status: "hold" },
  { id: "a4", full_name: "Tariq Hashemi",   target_grade: "G9 applicant",  source: "IGCSE preview · score 72/100",      ai_score: 72, ai_band: "B+", status: "review" },
  { id: "a5", full_name: "Yara Al-Sabah",   target_grade: "G10 applicant", source: "From American School Doha",          ai_score: 81, ai_band: "A-", status: "review" },
  { id: "a6", full_name: "Maya Yousef",     target_grade: "G12 transfer",  source: "From IB DP track · Beirut",          ai_score: 88, ai_band: "A",  status: "review" },
];

/**
 * Compute the per-section rubric averages used by the cohort heatmap.
 * Drops the synthetic admission-pending rows (no real rubric scores).
 */
export function cohortHeat(students: StudentRow[]): CohortHeatRow[] {
  const buckets = new Map<string, StudentRow[]>();
  for (const s of students) {
    if (s.section_code === "—") continue;
    const arr = buckets.get(s.section_code) ?? [];
    arr.push(s);
    buckets.set(s.section_code, arr);
  }
  const result: CohortHeatRow[] = [];
  for (const [section_code, rows] of buckets) {
    const n = rows.length;
    const sum: RubricScores = { analytical: 0, creative: 0, oral: 0, written: 0, participation: 0, homework: 0 };
    for (const r of rows) {
      sum.analytical    += r.rubric.analytical;
      sum.creative      += r.rubric.creative;
      sum.oral          += r.rubric.oral;
      sum.written       += r.rubric.written;
      sum.participation += r.rubric.participation;
      sum.homework      += r.rubric.homework;
    }
    result.push({
      section_code,
      rubric: {
        analytical:    Number((sum.analytical    / n).toFixed(2)),
        creative:      Number((sum.creative      / n).toFixed(2)),
        oral:          Number((sum.oral          / n).toFixed(2)),
        written:       Number((sum.written       / n).toFixed(2)),
        participation: Number((sum.participation / n).toFixed(2)),
        homework:      Number((sum.homework      / n).toFixed(2)),
      },
    });
  }
  // Sort by section_code for stable output
  result.sort((a, b) => a.section_code.localeCompare(b.section_code));
  return result;
}
