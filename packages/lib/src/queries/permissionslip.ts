import { serverClient } from "../supabase";

export type ActivitySlip = {
  activityId: string;
  slipId: string | null;
  status: "not_started" | "draft" | "signed" | "declined";
  slipNotes: string | null;
  signedAt: string | null;
  signedName: string | null;
  // Activity details
  title: string;
  location: string | null;
  activityDate: string;
  departTime: string | null;
  returnTime: string | null;
  transport: string | null;
  costAed: number;
  supervisorRatio: string | null;
  curriculumLink: string | null;
  riskPdfPath: string | null;
  description: string | null;
  deadline: string | null;
};

export async function getUpcomingActivitySlipsForStudent(
  studentId: string,
  sectionId: string,
  from: string,
): Promise<ActivitySlip[]> {
  const db = await serverClient();
  const [{ data: activities }, { data: slips }] = await Promise.all([
    db.from("activities")
      .select(`
        id, title, activity_date, event_location, cost_aed,
        depart_time, return_time, transport, supervisor_ratio,
        curriculum_link, risk_pdf_path, description_en, deadline, target_sections
      `)
      .gte("activity_date", from)
      .order("activity_date")
      .limit(20),
    db.from("permission_slips")
      .select("id, activity_id, status, notes, signed_at, signed_name")
      .eq("student_id", studentId),
  ]);

  const relevant = (activities ?? []).filter(a => {
    const ts = a.target_sections as string[] | null;
    return !ts || ts.includes(sectionId);
  });

  const slipByActivity = new Map((slips ?? []).map(s => [s.activity_id, s]));

  return relevant.map(a => {
    const slip = slipByActivity.get(a.id);
    return {
      activityId: a.id,
      slipId: slip?.id ?? null,
      status: (slip?.status as ActivitySlip["status"]) ?? "not_started",
      slipNotes: slip?.notes ?? null,
      signedAt: slip?.signed_at ?? null,
      signedName: slip?.signed_name ?? null,
      title: a.title,
      location: a.event_location,
      activityDate: a.activity_date,
      departTime: a.depart_time as string | null,
      returnTime: a.return_time as string | null,
      transport: a.transport,
      costAed: Number(a.cost_aed),
      supervisorRatio: a.supervisor_ratio,
      curriculumLink: a.curriculum_link,
      riskPdfPath: a.risk_pdf_path,
      description: a.description_en,
      deadline: a.deadline,
    };
  });
}

export type StudentHealthInfo = {
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRel: string | null;
};

export async function getStudentHealthForSlip(studentId: string): Promise<StudentHealthInfo | null> {
  const db = await serverClient();
  const { data, error } = await db
    .from("student_health")
    .select(`
      allergies, conditions, medications,
      emergency_contact_name, emergency_contact_phone, emergency_contact_rel
    `)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    allergies: data.allergies,
    conditions: data.conditions,
    medications: data.medications,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    emergencyContactRel: data.emergency_contact_rel,
  };
}

export type ParentContactInfo = {
  name: string;
  phone: string | null;
  relationship: string;
};

export async function getParentContactForStudent(
  parentId: string,
  studentId: string,
): Promise<ParentContactInfo | null> {
  const db = await serverClient();
  const [{ data: parent }, { data: sp }] = await Promise.all([
    db.from("parents").select("full_name, phone_e164").eq("id", parentId).single(),
    db.from("student_parents")
      .select("relationship")
      .eq("parent_id", parentId)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);
  if (!parent) return null;
  return {
    name: parent.full_name,
    phone: parent.phone_e164,
    relationship: sp?.relationship ?? "Guardian",
  };
}
