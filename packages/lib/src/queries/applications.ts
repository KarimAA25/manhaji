import { serverClient } from "../supabase";

export type UniversityApp = {
  id: string;
  universityName: string;
  country: string;
  program: string;
  status: "researching" | "in_progress" | "submitted" | "in_review" | "admitted" | "rejected";
  deadline: string | null;
  decisionDate: string | null;
  admissionRatePct: number | null;
  notes: string | null;
};

export async function getStudentUniversityApps(studentId: string): Promise<UniversityApp[]> {
  const db = await serverClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("university_applications")
    .select("id, university_name, country, program, status, deadline_on, decision_expected_on, admission_rate_pct, notes")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) return []; // table not yet in schema → caller uses mock
  return ((data as any[]) ?? []).map((r: any) => ({
    id:               r.id,
    universityName:   r.university_name,
    country:          r.country ?? "",
    program:          r.program ?? "",
    status:           r.status as UniversityApp["status"],
    deadline:         r.deadline_on ?? null,
    decisionDate:     r.decision_expected_on ?? null,
    admissionRatePct: r.admission_rate_pct ?? null,
    notes:            r.notes ?? null,
  }));
}

export type CounselorInfo = {
  name: string;
  nextSession: string | null;
};

export async function getStudentCounselor(studentId: string): Promise<CounselorInfo | null> {
  const db = await serverClient();
  const { data: student } = await db
    .from("students")
    .select("current_section_id")
    .eq("id", studentId)
    .single();
  if (!student?.current_section_id) return null;

  // Look for a teacher with counselor role linked to this section
  const { data: slots } = await db
    .from("timetable_slots")
    .select("teachers ( id, full_name, display_name, role )")
    .eq("section_id", student.current_section_id)
    .limit(20);

  const counselor = (slots ?? [])
    .map(s => (s.teachers as unknown) as { full_name: string; display_name: string | null; role: string | null } | null)
    .find(t => t?.role === "counselor" || t?.role === "school_counselor");

  if (!counselor) return null;
  return {
    name: counselor.display_name ?? counselor.full_name,
    nextSession: null,
  };
}
