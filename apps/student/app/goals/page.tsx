import { getCurrentStudentId } from "@manhaj/lib/queries/auth";
import {
  getGoalStudentProfile,
  getStudentLatestRubricScores,
} from "@manhaj/lib/queries/goals";
import GoalsClient from "./GoalsClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const studentId = await getCurrentStudentId().catch(() => null);

  const [profile, rubricScores] = await Promise.all([
    studentId
      ? getGoalStudentProfile(studentId).catch(() => ({ studentName: "" }))
      : Promise.resolve({ studentName: "" }),
    studentId
      ? getStudentLatestRubricScores(studentId).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <GoalsClient
      studentName={profile.studentName}
      rubricScores={rubricScores}
    />
  );
}
