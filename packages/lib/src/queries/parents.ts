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

// ---------------------------------------------------------------------------
// Today's timetable slot for a set of sections
// ---------------------------------------------------------------------------

export type ChildCurrentSlot = {
  period:  string;
  subject: string;
  teacher: string | null;
  room:    string | null;
  start:   string;   // "HH:MM"
  end:     string;
};

export async function getTodaySlotsForSections(
  sectionIds: string[],
  academicYearId: string,
  todayDow: string,       // "monday" | "tuesday" | …
  currentTime: string,    // "HH:MM" — used to find the active/next period
): Promise<Record<string, ChildCurrentSlot | null>> {
  if (sectionIds.length === 0) return {};
  const db = await serverClient();

  const [{ data: bells }, { data: slots }] = await Promise.all([
    db.from("bell_periods")
      .select("id, period_label, day_of_week, starts_at, ends_at, is_teaching")
      .eq("academic_year_id", academicYearId)
      .eq("day_of_week", todayDow)
      .eq("is_teaching", true)
      .order("starts_at"),
    db.from("timetable_slots")
      .select(`
        bell_period_id, section_id,
        subjects ( name_en ),
        teachers ( display_name, full_name ),
        rooms ( code )
      `)
      .eq("academic_year_id", academicYearId)
      .in("section_id", sectionIds),
  ]);

  type SlotRow = { bell_period_id: string; section_id: string | null; subjects: unknown; teachers: unknown; rooms: unknown };
  type BellRow = { id: string; period_label: string | null; starts_at: string; ends_at: string };

  // Index slots: section_id → Map<bell_period_id, slot>
  const slotsBySec = new Map<string, Map<string, SlotRow>>();
  for (const s of (slots ?? []) as SlotRow[]) {
    if (!s.section_id) continue;
    if (!slotsBySec.has(s.section_id)) slotsBySec.set(s.section_id, new Map());
    slotsBySec.get(s.section_id)!.set(s.bell_period_id, s);
  }

  const result: Record<string, ChildCurrentSlot | null> = {};
  for (const sectionId of sectionIds) {
    const secSlots = slotsBySec.get(sectionId);
    if (!secSlots) { result[sectionId] = null; continue; }

    // Find current or next teaching period
    let chosen: BellRow | null = null;
    for (const bell of (bells ?? []) as BellRow[]) {
      const start = (bell.starts_at as string).slice(0, 5);
      const end   = (bell.ends_at   as string).slice(0, 5);
      if (currentTime >= start && currentTime < end) { chosen = bell; break; }
      if (currentTime < start && !chosen) chosen = bell; // first upcoming
    }

    if (!chosen) { result[sectionId] = null; continue; }
    const slot = secSlots.get(chosen.id) as SlotRow | undefined;
    if (!slot) { result[sectionId] = null; continue; }

    const sub = slot.subjects as { name_en: string } | null;
    const tch = slot.teachers as { display_name: string | null; full_name: string } | null;
    const rm  = slot.rooms    as { code: string } | null;
    if (!sub) { result[sectionId] = null; continue; }

    result[sectionId] = {
      period:  chosen.period_label ?? "",
      subject: sub.name_en,
      teacher: tch ? (tch.display_name ?? tch.full_name) : null,
      room:    rm?.code ?? null,
      start:   (chosen.starts_at as string).slice(0, 5),
      end:     (chosen.ends_at   as string).slice(0, 5),
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Next upcoming exam for a set of sections
// ---------------------------------------------------------------------------

export type ChildNextExam = {
  label:      string;
  held_on:    string;
  subject:    string;
  days_until: number;
};

export async function getNextExamForSections(
  sectionIds: string[],
  from: string,   // today ISO date
): Promise<Record<string, ChildNextExam | null>> {
  if (sectionIds.length === 0) return {};
  const db = await serverClient();
  const { data, error } = await db
    .from("assessments")
    .select("section_id, label, held_on, subjects ( name_en )")
    .in("section_id", sectionIds)
    .gte("held_on", from)
    .order("held_on");
  if (error) return {};

  const result: Record<string, ChildNextExam | null> = {};
  for (const sectionId of sectionIds) result[sectionId] = null;

  const today = new Date(from);
  for (const row of data ?? []) {
    if (!row.section_id || result[row.section_id]) continue; // take first per section
    const sub = row.subjects as { name_en: string } | null;
    const daysUntil = Math.round(
      (new Date(row.held_on!).getTime() - today.getTime()) / 86400000
    );
    result[row.section_id] = {
      label:      row.label,
      held_on:    row.held_on!,
      subject:    sub?.name_en ?? row.label,
      days_until: daysUntil,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Course selection status for a set of students
// ---------------------------------------------------------------------------

export type ChildCourseSelection = {
  status:       string;
  picks_count:  number;
  submitted_at: string | null;
};

export async function getCourseSelectionsForStudents(
  studentIds: string[],
  academicYearId: string,
): Promise<Record<string, ChildCourseSelection | null>> {
  if (studentIds.length === 0) return {};
  const db = await serverClient();
  const { data, error } = await db
    .from("course_selection_forms")
    .select("student_id, status, submitted_at, course_selection_picks ( form_id )")
    .in("student_id", studentIds)
    .eq("academic_year_id", academicYearId);
  if (error) return {};

  const result: Record<string, ChildCourseSelection | null> = {};
  for (const studentId of studentIds) result[studentId] = null;
  for (const row of data ?? []) {
    const picks = (row.course_selection_picks as Array<{ form_id: string }> | null) ?? [];
    result[row.student_id] = {
      status:       row.status as string,
      picks_count:  picks.length,
      submitted_at: row.submitted_at,
    };
  }
  return result;
}
