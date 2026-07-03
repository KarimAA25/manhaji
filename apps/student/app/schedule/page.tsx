import { getCurrentStudentId, getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getStudentTimetable, type PeriodSlot } from "@manhaj/lib/queries/timetable";
import { MOCK_PERIODS, type StudentPeriod } from "@manhaj/lib/mock-student-schedule";
import NowCard       from "./components/NowCard";
import TodayTimeline from "./components/TodayTimeline";
import WeekView      from "./components/WeekView";

export const dynamic = "force-dynamic";

function mockToPeriodSlots(mock: StudentPeriod[]): PeriodSlot[] {
  return mock.map(p => ({
    id: null,
    period: p.period,
    day: p.day,
    start: p.start,
    end: p.end,
    subject: p.subject,
    subject_code: null,
    teacher: p.teacher ?? null,
    room: p.room ?? null,
    is_teaching: !p.state,
  }));
}

export default async function StudentSchedulePage() {
  const [studentId, academicYearId] = await Promise.all([
    getCurrentStudentId().catch(() => null),
    getCurrentAcademicYearId().catch(() => null),
  ]);

  const dbPeriods: PeriodSlot[] = studentId && academicYearId
    ? await getStudentTimetable(studentId, academicYearId).catch(() => [])
    : [];

  const periods = dbPeriods.length > 0 ? dbPeriods : mockToPeriodSlots(MOCK_PERIODS);

  return (
    <div className="container">
      <h1>My Schedule</h1>
      <p className="sub">Today + the rest of the week · what&apos;s next, where, what to bring.</p>

      <NowCard periods={periods} />
      <TodayTimeline periods={periods} />
      <WeekView periods={periods} />
    </div>
  );
}
