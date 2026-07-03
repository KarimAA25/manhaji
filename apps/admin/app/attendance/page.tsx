import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import {
  getDailyAttendanceTrend,
  getSectionAttendanceStats,
  getChronicAbsentees,
  getAttendancePatterns,
  getSubjectAbsences,
  getAttendanceBenchmarks,
} from "@manhaj/lib/queries/attendance";
import AttendancePageClient from "./AttendancePageClient";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const academicYearId = await getCurrentAcademicYearId();

  const today = new Date();
  const to    = today.toISOString().slice(0, 10);
  const from  = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [dailyTrend, sectionStats, chronicAbsentees, patterns, subjectAbsences, benchmarks] = await Promise.all([
    academicYearId ? getDailyAttendanceTrend(academicYearId, from, to).catch(() => []) : Promise.resolve([]),
    getSectionAttendanceStats(from, to).catch(() => []),
    academicYearId ? getChronicAbsentees(academicYearId, 10).catch(() => []) : Promise.resolve([]),
    getAttendancePatterns(from, to).catch(() => ({ dow: [], byPeriod: [] })),
    getSubjectAbsences(from, to).catch(() => []),
    getAttendanceBenchmarks(from, to).catch(() => []),
  ]);

  return (
    <AttendancePageClient
      dailyTrend={dailyTrend}
      sectionStats={sectionStats}
      chronicAbsentees={chronicAbsentees}
      dowRows={patterns.dow}
      periodRows={patterns.byPeriod}
      subjectRows={subjectAbsences}
      benchmarkRows={benchmarks}
    />
  );
}
