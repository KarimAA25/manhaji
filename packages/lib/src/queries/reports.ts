import { serverClient } from "../supabase";

export type CommDraftRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  sent_at: string | null;
  student_id: string | null;
  student_name: string | null;
  template_name: string | null;
  template_code: string | null;
};

export type ReportArchiveRow = {
  id: string;
  report_kind: string;
  scope: string;
  storage_path: string;
  generated_at: string | null;
  sent_at: string | null;
  delete_after: string | null;
  student_id: string | null;
  parent_id: string | null;
  student_name: string | null;
};

export async function getCommDrafts(limit = 100): Promise<CommDraftRow[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("comm_drafts")
    .select(`
      id, status, created_at, sent_at, student_id,
      students ( full_name_en ),
      comm_templates ( name_en, template_code )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(d => {
    const stu  = d.students as { full_name_en: string } | null;
    const tmpl = d.comm_templates as { name_en: string; template_code: string } | null;
    return {
      id: d.id,
      status: d.status,
      created_at: d.created_at,
      sent_at: d.sent_at,
      student_id: d.student_id,
      student_name: stu?.full_name_en ?? null,
      template_name: tmpl?.name_en ?? null,
      template_code: tmpl?.template_code ?? null,
    };
  });
}

export async function getCommDraftPipelineCounts() {
  const db = await serverClient();
  const { data, error } = await db
    .from("comm_drafts")
    .select("status");
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.status) continue;
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}

export async function getReportArchive(filters: { studentId?: string; parentId?: string } = {}): Promise<ReportArchiveRow[]> {
  const db = await serverClient();
  let q = db
    .from("report_archive")
    .select("id, report_kind, scope, storage_path, generated_at, sent_at, delete_after, student_id, parent_id, students(full_name_en)")
    .is("deleted_at", null)
    .order("generated_at", { ascending: false });
  if (filters.studentId) q = q.eq("student_id", filters.studentId);
  if (filters.parentId)  q = q.eq("parent_id", filters.parentId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => {
    const stu = (r as never as { students: { full_name_en: string } | null }).students;
    return {
      id: r.id,
      report_kind: r.report_kind,
      scope: r.scope,
      storage_path: r.storage_path,
      generated_at: r.generated_at,
      sent_at: r.sent_at,
      delete_after: r.delete_after,
      student_id: r.student_id,
      parent_id: r.parent_id,
      student_name: stu?.full_name_en ?? null,
    };
  });
}

export async function getCommTemplates() {
  const db = await serverClient();
  const { data, error } = await db
    .from("comm_templates")
    .select("id, template_code, name_en, name_ar, channel, tone, is_manhaj_default, display_order")
    .order("display_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type SectionDraftRow = {
  section_id: string;
  section_code: string;
  total_students: number;
  drafted: number;
  reviewed: number;
};

export async function getSectionDraftProgress(): Promise<SectionDraftRow[]> {
  const db = await serverClient();
  const [{ data: students, error: stuErr }, { data: drafts, error: draftErr }] = await Promise.all([
    db.from("students")
      .select("current_section_id, sections:current_section_id ( id, code )")
      .is("withdrawn_on", null),
    db.from("comm_drafts")
      .select("status, students ( current_section_id )"),
  ]);
  if (stuErr) throw new Error(stuErr.message);
  if (draftErr) throw new Error(draftErr.message);

  // Count students per section for target
  const totalBySection = new Map<string, { code: string; count: number }>();
  for (const s of students ?? []) {
    if (!s.current_section_id) continue;
    const sec = s.sections as { id: string; code: string } | null;
    const entry = totalBySection.get(s.current_section_id) ?? { code: sec?.code ?? "—", count: 0 };
    entry.count++;
    totalBySection.set(s.current_section_id, entry);
  }

  // Count drafts per section
  const draftsBySection = new Map<string, { drafted: number; reviewed: number }>();
  for (const d of drafts ?? []) {
    const stu = d.students as { current_section_id: string | null } | null;
    if (!stu?.current_section_id) continue;
    const r = draftsBySection.get(stu.current_section_id) ?? { drafted: 0, reviewed: 0 };
    r.drafted++;
    const st = d.status as string | null;
    if (st === "review" || st === "ready" || st === "sent") r.reviewed++;
    draftsBySection.set(stu.current_section_id, r);
  }

  return Array.from(totalBySection.entries())
    .map(([section_id, { code, count }]) => {
      const d = draftsBySection.get(section_id) ?? { drafted: 0, reviewed: 0 };
      return { section_id, section_code: code, total_students: count, drafted: d.drafted, reviewed: d.reviewed };
    })
    .filter(r => r.total_students > 0)
    .sort((a, b) => a.section_code.localeCompare(b.section_code, undefined, { numeric: true }));
}

export async function getAuditLogRecent(limit = 50) {
  const db = await serverClient();
  const { data, error } = await db
    .from("audit_log")
    .select("id, actor_label, action, object_kind, object_id, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type RegulatorySubmissionRow = {
  id: string;
  report_name: string;
  regulator: string | null;
  period_label: string;
  submitted_at: string | null;
  submitted_by: string | null;
  status: string;
  file_url: string | null;
};

export async function getRegulatorySubmissions(limit = 10): Promise<RegulatorySubmissionRow[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("report_submissions")
    .select(`
      id, period_label, submitted_at, submitted_by, status, file_url,
      regulatory_report_catalog ( name, regulator )
    `)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => {
    const cat = r.regulatory_report_catalog as { name: string; regulator: string | null } | null;
    return {
      id: r.id,
      report_name: cat?.name ?? "—",
      regulator: cat?.regulator ?? null,
      period_label: r.period_label,
      submitted_at: r.submitted_at,
      submitted_by: r.submitted_by,
      status: r.status,
      file_url: r.file_url,
    };
  });
}

export type RegulatoryUpcomingRow = {
  id: string;
  name: string;
  regulator: string | null;
  report_type: string;
  description: string | null;
  deadline_cadence: string | null;
  template_ref: string | null;
};

export async function getRegulatoryUpcoming(): Promise<RegulatoryUpcomingRow[]> {
  const db = await serverClient();
  const { data, error } = await db
    .from("regulatory_report_catalog")
    .select("id, name, regulator, report_type, description, deadline_cadence, template_ref")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    regulator: r.regulator,
    report_type: r.report_type,
    description: r.description,
    deadline_cadence: r.deadline_cadence,
    template_ref: r.template_ref,
  }));
}
