import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getTeachersWithLoad } from "@manhaj/lib/queries/teachers";
import { getTeacherDailyLoads } from "@manhaj/lib/queries/timetable";
import FacultyPageClient from "./FacultyPageClient";

export const dynamic = "force-dynamic";

export default async function AdminFacultyPage() {
  const academicYearId = await getCurrentAcademicYearId();
  const [teachers, loads] = await Promise.all([
    academicYearId ? getTeachersWithLoad(academicYearId).catch(() => []) : Promise.resolve([]),
    academicYearId ? getTeacherDailyLoads(academicYearId).catch(() => []) : Promise.resolve([]),
  ]);
  return <FacultyPageClient teachers={teachers} loads={loads} />;
}
