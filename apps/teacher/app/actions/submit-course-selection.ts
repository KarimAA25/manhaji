"use server";

/**
 * Server action: submit a course-selection form.
 *
 * Delegates the entire transaction to the SECURITY DEFINER RPC
 * submit_course_selection_public (schema/007). Parents are not signed in,
 * so the anon publishable key is used — the RPC validates input and
 * performs the writes internally with bypassed RLS.
 *
 * This means: no service-role key needed at runtime, even though parents
 * aren't authenticated. The RPC is the only path to write these tables
 * from anon, so the attack surface is the function signature alone.
 */

import { serverClient } from "@manhaj/lib/supabase";
import { OFFERINGS } from "@manhaj/lib/electives";

const SCHOOL_NAME = process.env.NEXT_PUBLIC_SCHOOL_NAME || "International School of Oman";
const AY_LABEL = process.env.NEXT_PUBLIC_ACADEMIC_YEAR || "2026-2027";

export type SubmitResult =
  | { ok: true; form_id: string; student_id: string; picks_count: number; student_created: boolean }
  | { ok: false; error: string };

export type SubmitPayload = {
  student_name: string;
  grade: "9" | "10" | "11" | "12";
  language_choice: string;
  bundle_picks: Record<string, string>; // bundle.label → chosen subject code
};

export async function submitCourseSelection(payload: SubmitPayload): Promise<SubmitResult> {
  const studentName = (payload.student_name || "").trim();
  if (!studentName) return { ok: false, error: "Student name is required." };

  const offering = OFFERINGS[payload.grade];
  if (!offering) return { ok: false, error: `Unknown grade ${payload.grade}.` };

  // Client-side validation: every bundle has a pick + every pick is a valid option
  for (const bundle of offering.bundles) {
    const chosen = payload.bundle_picks[bundle.label];
    if (!chosen) return { ok: false, error: `Missing pick for bundle "${bundle.label}".` };
    if (!bundle.options.includes(chosen)) {
      return { ok: false, error: `Invalid pick "${chosen}" for "${bundle.label}".` };
    }
  }

  // Shape the picks array for the RPC: [{ bundle_label, subject_code }, ...]
  const picksArray = Object.entries(payload.bundle_picks).map(([bundle_label, subject_code]) => ({
    bundle_label,
    subject_code,
  }));

  const sb = await serverClient();
  const { data, error } = await sb.rpc("submit_course_selection_public", {
    p_school_name:         SCHOOL_NAME,
    p_academic_year_label: AY_LABEL,
    p_grade_level:         payload.grade,
    p_student_name:        studentName,
    p_picks:               picksArray,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  const result = data as {
    ok: boolean;
    form_id?: string;
    student_id?: string;
    picks_count?: number;
    student_created?: boolean;
    error?: string;
  };
  if (!result?.ok) {
    return { ok: false, error: result?.error || "Submission failed for an unknown reason." };
  }
  return {
    ok:              true,
    form_id:         result.form_id!,
    student_id:      result.student_id!,
    picks_count:     result.picks_count ?? 0,
    student_created: result.student_created ?? false,
  };
}
