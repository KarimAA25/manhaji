import { serverClient } from "../supabase";

export type AssessmentRow = {
  id: string;
  title: string;
  subject: string;
  scheduledOn: string;
  kind: string;
};

export async function getStudentAssessmentsThisWeek(
  studentId: string,
  from: string,
  to: string,
): Promise<AssessmentRow[]> {
  const db = await serverClient();

  const { data: student } = await db
    .from("students")
    .select("current_section_id")
    .eq("id", studentId)
    .single();
  if (!student?.current_section_id) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("assessments")
    .select("id, title, kind, scheduled_on, subjects ( name_en )")
    .eq("section_id", student.current_section_id)
    .in("kind", ["quiz", "test", "exam"])
    .gte("scheduled_on", from)
    .lte("scheduled_on", to)
    .order("scheduled_on");
  if (error) throw new Error((error as { message: string }).message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((a: any) => {
    const sub = a.subjects as { name_en: string } | null;
    return {
      id:          a.id,
      title:       a.title ?? "",
      subject:     sub?.name_en ?? "Unknown",
      scheduledOn: a.scheduled_on as string,
      kind:        a.kind,
    };
  });
}
