import { serverClient } from "../supabase";

export type GoalStudentProfile = {
  studentName: string;
};

export type RubricSuggestionData = {
  axisCode: string;
  score: number | null;
};

export async function getGoalStudentProfile(studentId: string): Promise<GoalStudentProfile> {
  const db = await serverClient();
  const { data } = await db
    .from("students")
    .select("full_name_en")
    .eq("id", studentId)
    .single();
  return {
    studentName: data?.full_name_en ?? "",
  };
}

export async function getStudentLatestRubricScores(studentId: string): Promise<RubricSuggestionData[]> {
  const db = await serverClient();
  const { data } = await db
    .from("rubric_scores")
    .select("axis_code, score")
    .eq("student_id", studentId)
    .order("scored_for_month", { ascending: false })
    .limit(20);
  if (!data?.length) return [];
  const seen = new Set<string>();
  return (data ?? []).filter(r => {
    if (seen.has(r.axis_code)) return false;
    seen.add(r.axis_code);
    return true;
  }).map(r => ({ axisCode: r.axis_code, score: r.score }));
}
