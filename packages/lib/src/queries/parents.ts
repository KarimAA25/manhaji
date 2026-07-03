import { serverClient } from "../supabase";

export type ParentChild = {
  student_id: string;
  full_name_en: string;
  initial: string;
  section_id: string | null;
  section_code: string;
  grade_level: string | null;
};

export async function getParentName(parentId: string): Promise<string> {
  const db = await serverClient();
  const { data } = await db
    .from("parents")
    .select("full_name")
    .eq("id", parentId)
    .single();
  return data?.full_name ?? "";
}

export async function getParentChildren(parentId: string): Promise<ParentChild[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("student_parents")
    .select(`
      student_id, relationship,
      students ( full_name_en, current_section_id,
        sections:current_section_id ( code, grade_level ) )
    `)
    .eq("parent_id", parentId);
  if (error) throw new Error(error.message);

  return (data ?? []).map(r => {
    const stu = r.students as {
      full_name_en: string;
      current_section_id: string | null;
      sections: { code: string; grade_level: string | null } | null;
    } | null;
    const name = stu?.full_name_en ?? "";
    return {
      student_id: r.student_id,
      full_name_en: name,
      initial: name.charAt(0).toUpperCase(),
      section_id: stu?.current_section_id ?? null,
      section_code: stu?.sections?.code ?? "—",
      grade_level: stu?.sections?.grade_level ?? null,
    };
  });
}

export type ChildAttendanceSummary = {
  student_id: string;
  pct: number;
  absences: number;
};

export async function getAttendanceForStudents(
  studentIds: string[],
  from: string,
  to: string,
): Promise<ChildAttendanceSummary[]> {
  if (studentIds.length === 0) return [];
  const db = await serverClient();
  const { data, error } = await db
    .from("attendance_marks")
    .select("student_id, status")
    .in("student_id", studentIds)
    .gte("marked_on", from)
    .lte("marked_on", to);
  if (error) throw new Error(error.message);

  const byStudent = new Map<string, { total: number; present: number; absences: number }>();
  for (const row of data ?? []) {
    const s = byStudent.get(row.student_id) ?? { total: 0, present: 0, absences: 0 };
    s.total++;
    if (row.status === "present" || row.status === "late") s.present++;
    if (row.status === "absent") s.absences++;
    byStudent.set(row.student_id, s);
  }

  return studentIds.map(id => {
    const s = byStudent.get(id) ?? { total: 0, present: 0, absences: 0 };
    return {
      student_id: id,
      pct: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
      absences: s.absences,
    };
  });
}

export type ChildRubricSummary = {
  student_id: string;
  avg: number;
};

export async function getRubricAvgForStudents(
  studentIds: string[],
): Promise<ChildRubricSummary[]> {
  if (studentIds.length === 0) return [];
  const db = await serverClient();

  // Get the latest scored_for_month per student, then fetch scores for that month
  const { data, error } = await db
    .from("rubric_scores")
    .select("student_id, axis_code, score, scored_for_month")
    .in("student_id", studentIds)
    .order("scored_for_month", { ascending: false })
    .limit(studentIds.length * 20); // up to 20 axes per student
  if (error) throw new Error(error.message);

  // Find the latest month per student and compute avg across axes for that month
  const latestMonth = new Map<string, string>();
  for (const row of data ?? []) {
    if (!latestMonth.has(row.student_id)) latestMonth.set(row.student_id, row.scored_for_month as string);
  }

  const byStudent = new Map<string, { total: number; count: number }>();
  for (const row of data ?? []) {
    if ((row.scored_for_month as string) !== latestMonth.get(row.student_id)) continue;
    const s = byStudent.get(row.student_id) ?? { total: 0, count: 0 };
    s.total += Number(row.score);
    s.count++;
    byStudent.set(row.student_id, s);
  }

  return studentIds.map(id => {
    const s = byStudent.get(id);
    return {
      student_id: id,
      avg: s && s.count > 0 ? Math.round((s.total / s.count) * 10) / 10 : 0,
    };
  });
}
