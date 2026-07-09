import { serverClient } from "../supabase";

export type BehaviourEvent = {
  id: string;
  kind: "positive" | "concern" | "observation";
  note: string;
  observed_on: string;
  teacher_name: string | null;
};

export async function getBehaviourEventsForStudent(
  studentId: string,
  from: string,
  to: string,
): Promise<BehaviourEvent[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("behaviour_notes")
    .select("id, kind, note, observed_on, teachers ( display_name, full_name )")
    .eq("student_id", studentId)
    .gte("observed_on", from)
    .lte("observed_on", to)
    .order("observed_on");
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => {
    const t = r.teachers as { display_name: string | null; full_name: string } | null;
    return {
      id: r.id,
      kind: r.kind as "positive" | "concern" | "observation",
      note: r.note,
      observed_on: r.observed_on,
      teacher_name: t ? (t.display_name ?? t.full_name) : null,
    };
  });
}

export type StudentAssessmentResult = {
  id: string;
  label: string;
  subject: string;
  held_on: string;
  score: number | null;
  max_score: number | null;
  pct: number | null;
};

export async function getAssessmentResultsForStudent(
  studentId: string,
  from: string,
  to: string,
): Promise<StudentAssessmentResult[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("assessment_results")
    .select(`
      id, score,
      assessments ( label, held_on, max_score, subjects ( name_en ) )
    `)
    .eq("student_id", studentId)
    .not("score", "is", null);
  if (error) return [];

  return (data ?? [])
    .map(r => {
      const a = r.assessments as {
        label: string;
        held_on: string | null;
        max_score: number | null;
        subjects: { name_en: string } | null;
      } | null;
      if (!a?.held_on) return null;
      if (a.held_on < from || a.held_on > to) return null;
      const maxScore = a.max_score ? Number(a.max_score) : null;
      const score = r.score !== null ? Number(r.score) : null;
      return {
        id: r.id,
        label: a.label,
        subject: a.subjects?.name_en ?? "Unknown",
        held_on: a.held_on,
        score,
        max_score: maxScore,
        pct: score !== null && maxScore ? Math.round((score / maxScore) * 100) : null,
      };
    })
    .filter((x): x is StudentAssessmentResult => x !== null)
    .sort((a, b) => a.held_on.localeCompare(b.held_on));
}

export type WeeklyDigestDraft = {
  id: string;
  text: string;
  status: string | null;
};

export async function getWeeklyDigestDraft(studentId: string): Promise<WeeklyDigestDraft | null> {
  const db = await serverClient();
  const { data, error } = await db
    .from("comm_drafts")
    .select("id, drafted_en, edited_en, status")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const text = (data.edited_en ?? data.drafted_en) as string | null;
  if (!text) return null;
  return { id: data.id, text, status: data.status as string | null };
}

export type TeacherRecognition = {
  note: string;
  teacher_name: string | null;
  observed_on: string;
};

export async function getTeacherRecognitionForStudent(
  studentId: string,
  from: string,
  to: string,
): Promise<TeacherRecognition | null> {
  const db = await serverClient();
  const { data, error } = await db
    .from("behaviour_notes")
    .select("note, observed_on, teachers ( display_name, full_name )")
    .eq("student_id", studentId)
    .eq("kind", "positive")
    .gte("observed_on", from)
    .lte("observed_on", to)
    .order("observed_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const t = data.teachers as { display_name: string | null; full_name: string } | null;
  return {
    note: data.note,
    teacher_name: t ? (t.display_name ?? t.full_name) : null,
    observed_on: data.observed_on,
  };
}
