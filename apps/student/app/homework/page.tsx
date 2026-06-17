import KpiRow         from "./components/KpiRow";
import DueSoonBanner  from "./components/DueSoonBanner";
import HomeworkList   from "./components/HomeworkList";
import CompletionTrend from "./components/CompletionTrend";

export const dynamic = "force-dynamic";

export default function StudentHomeworkPage() {
  return (
    <div className="container">
      <h1>Homework</h1>
      <p className="sub">What&apos;s due · what&apos;s in progress · what&apos;s done · AI-suggested time per task.</p>

      <KpiRow />
      <DueSoonBanner />
      <HomeworkList />
      <CompletionTrend />
    </div>
  );
}
