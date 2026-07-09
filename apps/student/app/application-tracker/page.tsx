import { getCurrentStudentId } from "@manhaj/lib/queries/auth";
import { getGoalStudentProfile, getStudentLatestRubricScores } from "@manhaj/lib/queries/goals";
import { getStudentUniversityApps, getStudentCounselor } from "@manhaj/lib/queries/applications";
import ApplicationTrackerClient from "./ApplicationTrackerClient";

export const dynamic = "force-dynamic";

export default async function ApplicationTrackerPage() {
  const studentId = await getCurrentStudentId().catch(() => null);

  const [profile, apps, rubricScores, counselor] = await Promise.all([
    studentId
      ? getGoalStudentProfile(studentId).catch(() => ({ studentName: "" }))
      : Promise.resolve({ studentName: "" }),
    studentId
      ? getStudentUniversityApps(studentId).catch(() => [])
      : Promise.resolve([]),
    studentId
      ? getStudentLatestRubricScores(studentId).catch(() => [])
      : Promise.resolve([]),
    studentId
      ? getStudentCounselor(studentId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const isMock = apps.length === 0;

  return (
    <ApplicationTrackerClient
      studentName={profile.studentName}
      apps={apps}
      rubricScores={rubricScores}
      counselor={counselor}
      isMock={isMock}
    />
  );
}
