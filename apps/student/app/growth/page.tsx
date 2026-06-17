import RubricRadar                from "./components/RubricRadar";
import AxisSparklines             from "./components/AxisSparklines";
import StrengthsAndGrowth         from "./components/StrengthsAndGrowth";
import GoalsList                  from "./components/GoalsList";
import CurrentGrades              from "./components/CurrentGrades";
import UniversityPlacementSignal  from "./components/UniversityPlacementSignal";
import ImprovementPlan            from "./components/ImprovementPlan";
import SubjectPercentiles         from "./components/SubjectPercentiles";
import MonthOverMonthDelta        from "./components/MonthOverMonthDelta";

export const dynamic = "force-dynamic";

export default function StudentGrowthPage() {
  return (
    <div className="container">
      <h1>My Growth</h1>
      <p className="sub">
        6-axis rubric · IGCSE subject grades · class percentiles · improvement plan ·
        university placement signal · what changed this month.
      </p>

      {/* ── Existing blocks ── */}
      <RubricRadar />
      <AxisSparklines />
      <StrengthsAndGrowth />
      <GoalsList />

      {/* ── Phase 3.3 new blocks ── */}
      <CurrentGrades />
      <UniversityPlacementSignal />
      <ImprovementPlan />
      <SubjectPercentiles />
      <MonthOverMonthDelta />
    </div>
  );
}
