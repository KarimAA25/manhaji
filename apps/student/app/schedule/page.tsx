import NowCard       from "./components/NowCard";
import TodayTimeline from "./components/TodayTimeline";
import WeekView      from "./components/WeekView";

export const dynamic = "force-dynamic";

export default function StudentSchedulePage() {
  return (
    <div className="container">
      <h1>My Schedule</h1>
      <p className="sub">Today + the rest of the week · what&apos;s next, where, what to bring.</p>

      <NowCard />
      <TodayTimeline />
      <WeekView />
    </div>
  );
}
