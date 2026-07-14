import { getCurrentParentId, getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getParentChildren, getAttendanceForStudents, getNextExamForSections, getCourseSelectionsForStudents } from "@manhaj/lib/queries/parents";
import { getInvoicesForParent } from "@manhaj/lib/queries/invoices";
import { getHomeworkForSection } from "@manhaj/lib/queries/lessons";
import { getBehaviourEventsForStudent, getAssessmentResultsForStudent, getWeeklyDigestDraft } from "@manhaj/lib/queries/weeklydigest";
import { getUpcomingActivitySlipsForStudent } from "@manhaj/lib/queries/permissionslip";
import { getFormTeachersForSections } from "@manhaj/lib/queries/siblings";
import SiblingComparisonClient from "./SiblingComparisonClient";

export const dynamic = "force-dynamic";

function getWeekRange(today: Date) {
  const dow = today.getUTCDay();
  const sun = new Date(today);
  sun.setUTCDate(today.getUTCDate() - dow);
  const thu = new Date(sun);
  thu.setUTCDate(sun.getUTCDate() + 4);
  return {
    weekStart: sun.toISOString().slice(0, 10),
    weekEnd:   thu.toISOString().slice(0, 10),
  };
}

export default async function SiblingComparisonPage() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const { weekStart, weekEnd } = getWeekRange(today);

  const [parentId, academicYearId] = await Promise.all([
    getCurrentParentId().catch(() => null),
    getCurrentAcademicYearId().catch(() => null),
  ]);

  const [children, invoices] = parentId
    ? await Promise.all([
        getParentChildren(parentId).catch(() => []),
        getInvoicesForParent(parentId).catch(() => []),
      ])
    : [[], []];

  const studentIds  = children.map(c => c.student_id);
  const sectionIds  = children.map(c => c.section_id).filter((id): id is string => id != null);

  const [attendance, formTeachers, nextExams, courseSelections] = await Promise.all([
    studentIds.length  ? getAttendanceForStudents(studentIds, weekStart, weekEnd).catch(() => []) : Promise.resolve([]),
    sectionIds.length  ? getFormTeachersForSections(sectionIds).catch(() => ({})) : Promise.resolve({}),
    sectionIds.length  ? getNextExamForSections(sectionIds, todayStr).catch(() => ({})) : Promise.resolve({}),
    studentIds.length && academicYearId
      ? getCourseSelectionsForStudents(studentIds, academicYearId).catch(() => ({}))
      : Promise.resolve({}),
  ]);

  const childData = await Promise.all(
    children.map(async child => {
      const sid  = child.section_id ?? "";
      const stId = child.student_id;
      const [homework, behaviourEvents, assessmentResults, digest, slips] = await Promise.all([
        sid  ? getHomeworkForSection(sid, weekStart, weekEnd).catch(() => []) : Promise.resolve([]),
        getBehaviourEventsForStudent(stId, weekStart, weekEnd).catch(() => []),
        getAssessmentResultsForStudent(stId, weekStart, weekEnd).catch(() => []),
        getWeeklyDigestDraft(stId).catch(() => null),
        sid  ? getUpcomingActivitySlipsForStudent(stId, sid, todayStr).catch(() => []) : Promise.resolve([]),
      ]);

      const att            = attendance.find(a => a.student_id === stId);
      const positiveNotes  = behaviourEvents.filter(e => e.kind === "positive").length;
      const concernNotes   = behaviourEvents.filter(e => e.kind === "concern").length;
      const latestRec      = behaviourEvents.filter(e => e.kind === "positive").slice(-1)[0] ?? null;
      const bestResult     = [...assessmentResults].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0] ?? null;
      const formTeacher    = child.section_id ? (formTeachers as Record<string, string | null>)[child.section_id] ?? null : null;
      const nextExam       = child.section_id ? (nextExams as Record<string, unknown>)[child.section_id] as { label: string; held_on: string; subject: string } | null ?? null : null;
      const courseSelection = (courseSelections as Record<string, unknown>)[stId] as { status: string; picks_count: number; submitted_at: string | null } | null ?? null;
      const pendingSlips   = slips.filter(s => s.status === "not_started" || s.status === "draft");

      return {
        child,
        formTeacher,
        att: { pct: att?.pct ?? 0, absences: att?.absences ?? 0 },
        homeworkCount: homework.length,
        latestResult: bestResult
          ? { pct: bestResult.pct ?? 0, subject: bestResult.subject, held_on: bestResult.held_on }
          : null,
        positiveNotes,
        concernNotes,
        latestRecognition: latestRec?.note ?? null,
        latestRecognitionTeacher: latestRec?.teacher_name ?? null,
        pendingSlips,
        courseSelection,
        digestText: digest?.text ?? null,
        nextExam,
      };
    }),
  );

  const unpaidInvoices = invoices.filter(i => i.status !== "paid");
  const isMock = children.length === 0;

  return (
    <SiblingComparisonClient
      childData={childData}
      unpaidInvoices={unpaidInvoices}
      weekStart={weekStart}
      weekEnd={weekEnd}
      isMock={isMock}
    />
  );
}
