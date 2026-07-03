import { getCurrentTeacherId, getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getTeacherWithSections } from "@manhaj/lib/queries/teachers";
import { getStudentsForSections } from "@manhaj/lib/queries/students";
import { MOCK_STUDENTS } from "@manhaj/lib/mock-students";
import TeacherInputPageClient from "./TeacherInputPageClient";
import type { ClassOption } from "./TeacherInputPageClient";

export const dynamic = "force-dynamic";

const FALLBACK_SECTIONS = ["10A", "9A", "11 AS", "12 A2"];

export default async function TeacherInputPage() {
  const [teacherId, academicYearId] = await Promise.all([
    getCurrentTeacherId(),
    getCurrentAcademicYearId(),
  ]);

  const teacherSections = teacherId && academicYearId
    ? await getTeacherWithSections(teacherId, academicYearId).catch(() => [])
    : [];

  const sectionIds = teacherSections
    .map(r => (r.sections as { id: string } | null)?.id)
    .filter((id): id is string => id != null);

  const dbStudents = sectionIds.length > 0
    ? await getStudentsForSections(sectionIds).catch(() => [])
    : [];

  const students = dbStudents.length > 0
    ? dbStudents.map(s => ({ id: s.id, full_name: s.full_name_en, section_code: s.section_code }))
    : MOCK_STUDENTS
        .filter(s => FALLBACK_SECTIONS.includes(s.section_code))
        .map(s => ({ id: s.id, full_name: s.full_name, section_code: s.section_code }));

  // Build class options from real teacher-section-subject rows
  const classOptions: ClassOption[] = teacherSections.length > 0
    ? teacherSections
        .map(r => {
          const sec = r.sections as { id: string; code: string } | null;
          const sub = r.subjects as { name_en: string } | null;
          if (!sec || !sub) return null;
          return {
            id:      `${sec.id}-${sub.name_en}`,
            label:   `${sec.code} · ${sub.name_en}`,
            section: sec.code,
            subject: sub.name_en,
          };
        })
        .filter((o): o is ClassOption => o !== null)
    : [];

  return <TeacherInputPageClient students={students} classOptions={classOptions} />;
}
