import { getCurrentStudentId, getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getRubricScoresForStudent, getGoalsForStudent, type RubricAxisScore, type GoalRow } from "@manhaj/lib/queries/growth";
import { MOCK_GROWTH, MOCK_GOALS } from "@manhaj/lib/mock-growth";
import RubricRadar               from "./components/RubricRadar";
import AxisSparklines            from "./components/AxisSparklines";
import StrengthsAndGrowth        from "./components/StrengthsAndGrowth";
import GoalsList                 from "./components/GoalsList";
import CurrentGrades             from "./components/CurrentGrades";
import UniversityPlacementSignal from "./components/UniversityPlacementSignal";
import ImprovementPlan           from "./components/ImprovementPlan";
import SubjectPercentiles        from "./components/SubjectPercentiles";
import MonthOverMonthDelta       from "./components/MonthOverMonthDelta";

export const dynamic = "force-dynamic";

const MOCK_SCORES: RubricAxisScore[] = MOCK_GROWTH.map(h => ({
  axis_code: h.axis,
  this_mo:   h.this_mo,
  last_mo:   h.last_mo,
  history:   h.history,
}));

const MOCK_GOAL_ROWS: GoalRow[] = MOCK_GOALS.map(g => ({
  id:               g.id,
  kind:             g.axis,
  title:            g.title,
  description:      g.detail,
  due_on:           null,
  status:           g.status === "done" ? "achieved" : g.status === "behind" ? "dropped" : "active",
  metric:           null,
  target_value:     null,
  latest_progress:  g.progress,
  last_checkin:     g.last_update,
}));

export default async function StudentGrowthPage() {
  const [studentId, academicYearId] = await Promise.all([
    getCurrentStudentId().catch(() => null),
    getCurrentAcademicYearId().catch(() => null),
  ]);

  const [dbScores, dbGoals] = await Promise.all([
    studentId ? getRubricScoresForStudent(studentId).catch(() => []) : Promise.resolve([]),
    studentId && academicYearId ? getGoalsForStudent(studentId, academicYearId).catch(() => []) : Promise.resolve([]),
  ]);

  const scores = dbScores.length > 0 ? dbScores : MOCK_SCORES;
  const goals  = dbGoals.length  > 0 ? dbGoals  : MOCK_GOAL_ROWS;

  return (
    <div className="container">
      <h1>My Growth</h1>
      <p className="sub">
        6-axis rubric · IGCSE subject grades · class percentiles · improvement plan ·
        university placement signal · what changed this month.
      </p>

      <RubricRadar scores={scores} />
      <AxisSparklines scores={scores} />
      <StrengthsAndGrowth scores={scores} />
      <GoalsList goals={goals} />

      <CurrentGrades />
      <UniversityPlacementSignal />
      <ImprovementPlan />
      <SubjectPercentiles />
      <MonthOverMonthDelta />
    </div>
  );
}
