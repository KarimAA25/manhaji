/**
 * Manhaj data-fetching layer.
 *
 * DEMO MODE: calls the SECURITY DEFINER RPC `manhaj_dashboard_data_public`
 * defined in schema/008. The RPC bundles teachers + contracts + sections +
 * subjects + load into one JSONB response and is callable by anon — i.e.
 * the password-gated visitor doesn't need to be signed in to Supabase.
 *
 * PRODUCTION MODE (future, when we flip back to magic-link): the RPC is
 * still safe to call (it always returns the school you pass) but we'd
 * prefer the JWT-scoped reads from before because RLS becomes the source
 * of truth. To revert: replace the RPC call with the parallel-fetch block
 * preserved in git history.
 *
 * Why a single RPC? The password gate is client-side only — there is no
 * auth session — so the user's JWT can't drive RLS. SECURITY DEFINER
 * functions run as the function-owner (postgres role), bypassing RLS,
 * which lets us serve anon callers without exposing tables directly.
 */

import { serverClient } from "./supabase";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "International School of Oman";

export type Teacher = {
  id: string;
  full_name: string;
  primary_subject_text: string | null;
  department: string;     // inferred from primary_subject_text
  cap: number;
  assigned: number;
  slack: number;
  status: "over" | "full" | "ok" | "under";
};

/**
 * Best-effort department inference from primary_subject_text.
 * Mirrors the parser logic in etl/parse_workbook.py. When we add a
 * proper teachers.department column later we'll drop this; the column
 * doesn't exist yet because the workbook doesn't carry it explicitly.
 */
const SUBJECT_STR_TO_DEPT: Array<[RegExp, string]> = [
  [/^ENGLISH/i,            "English"],
  [/^(MATH|MATHS)/i,       "Math"],
  [/^ISLAMIC/i,            "Social-Arabic"],
  [/^ARABIC/i,             "Arabic"],
  [/^(ART|PE|MUSIC)/i,     "Recreational"],
  [/^SCIENCE|^BIO|^CHEM|^PHYS|^ICT/i, "Science"],
  [/^FRENCH/i,             "French"],
  [/^(HISTORY|ECONOMICS|BUSINESS|SOCIAL)/i, "Social-English"],
  [/^CIVICS/i,             "Social-Arabic"],
  [/^(EXAM|LIBRARY|LAB)/i, "Assessment"],
];

function inferDept(primary: string | null | undefined): string {
  const s = (primary ?? "").trim();
  if (!s) return "Other";
  for (const [re, dept] of SUBJECT_STR_TO_DEPT) {
    if (re.test(s)) return dept;
  }
  return "Other";
}

export type Section = {
  id: string;
  code: string;
  grade_level: string | null;
  label: string | null;
  stream: string | null;
  is_mapped: boolean;
};

export type Subject = {
  id: string;
  code: string;
  name_en: string;
  department: string;
};

export type LoadCell = {
  teacher_id: string;
  section_id: string;
  subject_id: string;
  weekly_periods: number;
};

export type DashboardData = {
  school_id: string | null;
  teachers: Teacher[];
  sections: Section[];
  subjects: Subject[];
  load: LoadCell[];
  stats: {
    n_teachers: number;
    n_sections: number;
    n_subjects: number;
    n_load: number;
    total_cap: number;
    total_assigned: number;
    over_capacity: number;
    at_capacity: number;
    under_utilised: number;
    healthy: number;
    unmapped_sections: number;
    vacant_roles: number;
  };
};

// Shape of the RPC payload — keeps the rest of the function pure-typed.
type RpcBundle = {
  school_id: string | null;
  teachers: Array<{ id: string; full_name: string; primary_subject_text: string | null }>;
  contracts: Array<{ teacher_id: string; weekly_period_cap: number }>;
  sections: Array<{ id: string; code: string; grade_level: string | null; label: string | null; stream: string | null; is_mapped: boolean }>;
  subjects: Array<{ id: string; code: string; name_en: string; department: string }>;
  load: Array<{ teacher_id: string; section_id: string; subject_id: string; weekly_periods: number }>;
};

const EMPTY: DashboardData = {
  school_id: null, teachers: [], sections: [], subjects: [], load: [],
  stats: {
    n_teachers: 0, n_sections: 0, n_subjects: 0, n_load: 0,
    total_cap: 0, total_assigned: 0,
    over_capacity: 0, at_capacity: 0, under_utilised: 0, healthy: 0,
    unmapped_sections: 0, vacant_roles: 0,
  },
};

/** Fetch everything the admin dashboard needs in a single RPC call. */
export async function getDashboardData(): Promise<DashboardData> {
  const sb = await serverClient();

  const { data, error } = await sb.rpc("manhaj_dashboard_data_public", {
    p_school_name: SCHOOL_NAME,
  });

  if (error) {
    console.error("[manhaj/data] manhaj_dashboard_data_public failed:", error);
    return EMPTY;
  }

  const bundle = (data ?? {}) as Partial<RpcBundle>;
  if (!bundle.school_id) return EMPTY;

  const contracts = bundle.contracts ?? [];
  const teachersRaw = bundle.teachers ?? [];
  const sectionsRaw = bundle.sections ?? [];
  const subjectsRaw = bundle.subjects ?? [];
  const loadRaw = bundle.load ?? [];

  const capByTeacher = new Map<string, number>(
    contracts.map(r => [r.teacher_id, r.weekly_period_cap]),
  );

  const assignedByTeacher = new Map<string, number>();
  for (const r of loadRaw) {
    assignedByTeacher.set(r.teacher_id, (assignedByTeacher.get(r.teacher_id) ?? 0) + r.weekly_periods);
  }

  const teachers: Teacher[] = teachersRaw.map(r => {
    const cap = capByTeacher.get(r.id) ?? 30;
    const assigned = assignedByTeacher.get(r.id) ?? 0;
    const slack = cap - assigned;
    const status: Teacher["status"] =
      slack < 0 ? "over" : slack === 0 ? "full" : slack > 4 ? "under" : "ok";
    return {
      id: r.id,
      full_name: r.full_name,
      primary_subject_text: r.primary_subject_text,
      department: inferDept(r.primary_subject_text),
      cap, assigned, slack, status,
    };
  });

  // Sort: over-capacity first (most over), then under-utilised (most under), then alphabetical
  teachers.sort((a, b) => {
    if (a.slack < 0 && b.slack >= 0) return -1;
    if (b.slack < 0 && a.slack >= 0) return 1;
    if (Math.abs(a.slack) !== Math.abs(b.slack)) return Math.abs(b.slack) - Math.abs(a.slack);
    return a.full_name.localeCompare(b.full_name);
  });

  const sections: Section[] = sectionsRaw.map(r => ({
    id: r.id,
    code: r.code,
    grade_level: r.grade_level,
    label: r.label,
    stream: r.stream,
    is_mapped: r.is_mapped ?? false,
  }));

  const subjects: Subject[] = subjectsRaw.map(r => ({
    id: r.id, code: r.code, name_en: r.name_en, department: r.department,
  }));

  const load: LoadCell[] = loadRaw.map(r => ({
    teacher_id: r.teacher_id,
    section_id: r.section_id,
    subject_id: r.subject_id,
    weekly_periods: r.weekly_periods,
  }));

  const buckets = { over_capacity: 0, at_capacity: 0, under_utilised: 0, healthy: 0 };
  for (const t of teachers) {
    if (t.status === "over") buckets.over_capacity++;
    else if (t.status === "full") buckets.at_capacity++;
    else if (t.status === "under") buckets.under_utilised++;
    else buckets.healthy++;
  }

  return {
    school_id: bundle.school_id,
    teachers,
    sections,
    subjects,
    load,
    stats: {
      n_teachers: teachers.length,
      n_sections: sections.length,
      n_subjects: subjects.length,
      n_load: load.length,
      total_cap: teachers.reduce((s, t) => s + t.cap, 0),
      total_assigned: teachers.reduce((s, t) => s + t.assigned, 0),
      ...buckets,
      unmapped_sections: sections.filter(s => !s.is_mapped).length,
      vacant_roles: teachers.filter(t => /^NEW\b/i.test(t.full_name)).length,
    },
  };
}
