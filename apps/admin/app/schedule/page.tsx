import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getSchoolTimetable, getTeacherDailyLoads, getRoomUtilization } from "@manhaj/lib/queries/timetable";
import SchedulePageClient from "./SchedulePageClient";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const academicYearId = await getCurrentAcademicYearId();

  const [schoolSlots, loads, rooms] = await Promise.all([
    academicYearId ? getSchoolTimetable(academicYearId).catch(() => []) : Promise.resolve([]),
    academicYearId ? getTeacherDailyLoads(academicYearId).catch(() => []) : Promise.resolve([]),
    academicYearId ? getRoomUtilization(academicYearId).catch(() => []) : Promise.resolve([]),
  ]);

  return <SchedulePageClient schoolSlots={schoolSlots} loads={loads} rooms={rooms} />;
}
