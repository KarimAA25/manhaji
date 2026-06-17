/**
 * Manhaj Phase 3.1 demo fixture — synthetic faculty data for the
 * Admin · Faculty deep-dive tab.
 *
 * Contains:
 *  - 9 departments with aggregate metrics
 *  - 25 representative teachers
 *  - Contract groupings derived from teacher contract_status
 *  - 5-stage onboarding (hiring) pipeline
 *  - Performance composite scores (this term vs last, 9 depts)
 *
 * Live Supabase swap is a Phase 4 follow-up (the getDashboardData() RPC
 * remains intact in lib/data.ts for the top-level KPI overlay).
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type DeptId =
  | "math"
  | "sciences"
  | "languages"
  | "humanities"
  | "arts"
  | "pe"
  | "primary"
  | "kg"
  | "admin";

export type Department = {
  id:                  DeptId;
  label:               string;
  head:                string;
  teacher_count:       number;
  avg_load:            number;   // avg periods/week
  over_capacity_count: number;
  with_slack_count:    number;
};

export type ContractStatus =
  | "active"
  | "expiring-3m"
  | "expiring-6m"
  | "renewal-rec";

export type TeacherStatus = "over" | "ok" | "under";

export type FacultyTeacher = {
  id:               string;
  full_name:        string;
  dept_id:          DeptId;
  primary_subject:  string;
  sections:         number;
  periods_per_week: number;
  status:           TeacherStatus;
  contract_status:  ContractStatus;
};

export type OnboardingStage = {
  stage:   string;
  count:   number;
};

export type PerformanceRow = {
  dept_id:   DeptId;
  dept_label: string;
  this_term: number;   // 0–5 rubric
  last_term: number;
};

/* -------------------------------------------------------------------------- */
/* Departments                                                                 */
/* -------------------------------------------------------------------------- */

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "math",       label: "Mathematics",  head: "Mr Faisal Hussain",    teacher_count:  8, avg_load: 24, over_capacity_count: 1, with_slack_count: 2 },
  { id: "sciences",   label: "Sciences",     head: "Ms Aida Karimi",       teacher_count: 10, avg_load: 22, over_capacity_count: 0, with_slack_count: 3 },
  { id: "languages",  label: "Languages",    head: "Ms Elena Moreau",      teacher_count:  9, avg_load: 21, over_capacity_count: 0, with_slack_count: 4 },
  { id: "humanities", label: "Humanities",   head: "Ms Swart",             teacher_count:  8, avg_load: 19, over_capacity_count: 0, with_slack_count: 5 },
  { id: "arts",       label: "Arts",         head: "Ms Nour Al-Rashid",    teacher_count:  5, avg_load: 16, over_capacity_count: 0, with_slack_count: 3 },
  { id: "pe",         label: "PE",           head: "Mr Omar Saeed",        teacher_count:  4, avg_load: 14, over_capacity_count: 0, with_slack_count: 2 },
  { id: "primary",    label: "Primary",      head: "Ms Layla Hassan",      teacher_count: 12, avg_load: 25, over_capacity_count: 0, with_slack_count: 4 },
  { id: "kg",         label: "KG",           head: "Ms Rima Taha",         teacher_count:  8, avg_load: 20, over_capacity_count: 0, with_slack_count: 6 },
  { id: "admin",      label: "Admin / Ops",  head: "Mr Khaled Al-Mansoori",teacher_count:  5, avg_load: 10, over_capacity_count: 0, with_slack_count: 3 },
];

/* -------------------------------------------------------------------------- */
/* Teachers (25 representative rows)                                           */
/* -------------------------------------------------------------------------- */

export const MOCK_TEACHERS: FacultyTeacher[] = [
  // Mathematics (8 dept; 3 shown)
  { id: "t01", full_name: "Mr Faisal Hussain",     dept_id: "math",       primary_subject: "Algebra",        sections: 5, periods_per_week: 28, status: "over",  contract_status: "renewal-rec" },
  { id: "t02", full_name: "Ms Divya Nair",          dept_id: "math",       primary_subject: "Statistics",     sections: 3, periods_per_week: 20, status: "ok",    contract_status: "active" },
  { id: "t03", full_name: "Mr Ahmed Qasim",         dept_id: "math",       primary_subject: "Calculus",       sections: 2, periods_per_week: 15, status: "under", contract_status: "expiring-6m" },

  // Sciences (4 shown)
  { id: "t04", full_name: "Ms Aida Karimi",         dept_id: "sciences",   primary_subject: "Chemistry",      sections: 4, periods_per_week: 24, status: "ok",    contract_status: "active" },
  { id: "t05", full_name: "Mr Nasser Al-Balushi",   dept_id: "sciences",   primary_subject: "Physics",        sections: 4, periods_per_week: 22, status: "ok",    contract_status: "active" },
  { id: "t06", full_name: "Ms Priya Sharma",        dept_id: "sciences",   primary_subject: "Biology",        sections: 3, periods_per_week: 18, status: "under", contract_status: "expiring-3m" },
  { id: "t07", full_name: "Mr James O'Brien",       dept_id: "sciences",   primary_subject: "Earth Sci",      sections: 3, periods_per_week: 17, status: "under", contract_status: "renewal-rec" },

  // Languages (3 shown)
  { id: "t08", full_name: "Ms Elena Moreau",        dept_id: "languages",  primary_subject: "French",         sections: 4, periods_per_week: 22, status: "ok",    contract_status: "active" },
  { id: "t09", full_name: "Mr Salim Al-Zadjali",    dept_id: "languages",  primary_subject: "Arabic",         sections: 4, periods_per_week: 20, status: "ok",    contract_status: "active" },
  { id: "t10", full_name: "Ms María González",      dept_id: "languages",  primary_subject: "Spanish",        sections: 3, periods_per_week: 15, status: "under", contract_status: "expiring-6m" },

  // Humanities (3 shown)
  { id: "t11", full_name: "Ms Swart",               dept_id: "humanities", primary_subject: "History",        sections: 4, periods_per_week: 20, status: "ok",    contract_status: "renewal-rec" },
  { id: "t12", full_name: "Mr Daniel Okafor",       dept_id: "humanities", primary_subject: "Geography",      sections: 3, periods_per_week: 18, status: "ok",    contract_status: "active" },
  { id: "t13", full_name: "Ms Leila Ahmadi",        dept_id: "humanities", primary_subject: "Islamic Studies", sections: 3, periods_per_week: 15, status: "under", contract_status: "expiring-3m" },

  // Arts (2 shown)
  { id: "t14", full_name: "Ms Nour Al-Rashid",      dept_id: "arts",       primary_subject: "Visual Art",     sections: 3, periods_per_week: 16, status: "ok",    contract_status: "active" },
  { id: "t15", full_name: "Mr Pablo Vega",          dept_id: "arts",       primary_subject: "Music",          sections: 2, periods_per_week: 12, status: "under", contract_status: "renewal-rec" },

  // PE (2 shown)
  { id: "t16", full_name: "Mr Omar Saeed",          dept_id: "pe",         primary_subject: "Physical Ed",    sections: 4, periods_per_week: 20, status: "ok",    contract_status: "active" },
  { id: "t17", full_name: "Ms Fatima Al-Harthy",    dept_id: "pe",         primary_subject: "Physical Ed",    sections: 3, periods_per_week: 15, status: "under", contract_status: "expiring-6m" },

  // Primary (3 shown)
  { id: "t18", full_name: "Ms Layla Hassan",        dept_id: "primary",    primary_subject: "Grade 4 Homeroom", sections: 1, periods_per_week: 25, status: "ok",  contract_status: "active" },
  { id: "t19", full_name: "Mr Ivan Petrov",         dept_id: "primary",    primary_subject: "Grade 5 Homeroom", sections: 1, periods_per_week: 25, status: "ok",  contract_status: "renewal-rec" },
  { id: "t20", full_name: "Ms Amira Benali",        dept_id: "primary",    primary_subject: "Grade 3 Homeroom", sections: 1, periods_per_week: 25, status: "ok",  contract_status: "expiring-3m" },

  // KG (2 shown)
  { id: "t21", full_name: "Ms Rima Taha",           dept_id: "kg",         primary_subject: "KG1 Homeroom",   sections: 1, periods_per_week: 20, status: "ok",    contract_status: "active" },
  { id: "t22", full_name: "Ms Hana Al-Siyabi",      dept_id: "kg",         primary_subject: "KG2 Homeroom",   sections: 1, periods_per_week: 20, status: "ok",    contract_status: "renewal-rec" },

  // Admin / Ops (3 shown)
  { id: "t23", full_name: "Mr Khaled Al-Mansoori",  dept_id: "admin",      primary_subject: "Administration", sections: 0, periods_per_week: 10, status: "under", contract_status: "active" },
  { id: "t24", full_name: "Ms Sophie Laurent",      dept_id: "admin",      primary_subject: "Counselling",    sections: 0, periods_per_week: 12, status: "ok",    contract_status: "expiring-6m" },
  { id: "t25", full_name: "Mr Bilal Chaudhry",      dept_id: "admin",      primary_subject: "IT Support",     sections: 0, periods_per_week:  8, status: "under", contract_status: "renewal-rec" },
];

/* -------------------------------------------------------------------------- */
/* Contract groupings (derived)                                                */
/* -------------------------------------------------------------------------- */

/** Contract group labels for the ContractsDashboard block. */
export type ContractGroup = {
  key:     ContractStatus;
  label:   string;
  teachers: FacultyTeacher[];
};

export function contractGroups(teachers: FacultyTeacher[]): ContractGroup[] {
  return [
    {
      key:      "expiring-3m",
      label:    "Expiring in 3 months",
      teachers: teachers.filter(t => t.contract_status === "expiring-3m"),
    },
    {
      key:      "expiring-6m",
      label:    "Expiring in 6 months",
      teachers: teachers.filter(t => t.contract_status === "expiring-6m"),
    },
    {
      key:      "renewal-rec",
      label:    "Renewal recommended",
      teachers: teachers.filter(t => t.contract_status === "renewal-rec"),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Onboarding pipeline                                                         */
/* -------------------------------------------------------------------------- */

export const MOCK_ONBOARDING_PIPELINE: OnboardingStage[] = [
  { stage: "Applicants",  count: 47 },
  { stage: "Shortlisted", count: 12 },
  { stage: "Interviewed", count:  8 },
  { stage: "Offered",     count:  3 },
  { stage: "Hired",       count:  2 },
];

/* -------------------------------------------------------------------------- */
/* Performance composite                                                       */
/* -------------------------------------------------------------------------- */

export const MOCK_PERFORMANCE: PerformanceRow[] = [
  { dept_id: "math",       dept_label: "Mathematics",  this_term: 3.9, last_term: 3.7 },
  { dept_id: "sciences",   dept_label: "Sciences",     this_term: 4.1, last_term: 4.2 },
  { dept_id: "languages",  dept_label: "Languages",    this_term: 3.6, last_term: 3.4 },
  { dept_id: "humanities", dept_label: "Humanities",   this_term: 3.8, last_term: 3.9 },
  { dept_id: "arts",       dept_label: "Arts",         this_term: 4.3, last_term: 4.0 },
  { dept_id: "pe",         dept_label: "PE",           this_term: 4.0, last_term: 4.0 },
  { dept_id: "primary",    dept_label: "Primary",      this_term: 4.2, last_term: 4.1 },
  { dept_id: "kg",         dept_label: "KG",           this_term: 4.5, last_term: 4.3 },
  { dept_id: "admin",      dept_label: "Admin / Ops",  this_term: 3.5, last_term: 3.6 },
];

/* -------------------------------------------------------------------------- */
/* KPI helpers                                                                 */
/* -------------------------------------------------------------------------- */

/** Compute the 4-card KPI values from the teachers fixture. */
export function facultyKpis(teachers: FacultyTeacher[]) {
  const total          = teachers.length;
  const over_capacity  = teachers.filter(t => t.status === "over").length;
  const vacancies      = 3; // static placeholder — Phase 4: derive from open roles table
  const avg_util       = total === 0
    ? 0
    : Math.round(
        teachers.reduce((s, t) => s + t.periods_per_week, 0) /
        (total * 28) * 100,
      );
  return { total, over_capacity, vacancies, avg_util };
}

/** Largest absolute delta per dept (this_term vs last_term). */
export function biggestDelta(rows: PerformanceRow[]): PerformanceRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort(
    (a, b) => Math.abs(b.this_term - b.last_term) - Math.abs(a.this_term - a.last_term),
  )[0];
}
