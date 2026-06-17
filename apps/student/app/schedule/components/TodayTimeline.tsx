import { periodsForDay, currentPeriod, MOCK_PERIODS, DEMO_NOW, DEMO_DAY } from "@manhaj/lib/mock-student-schedule";

export default function TodayTimeline() {
  const periods = periodsForDay(MOCK_PERIODS, DEMO_DAY);
  const { current } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  const nowMs = Date.parse(DEMO_NOW);
  const dateStr = DEMO_NOW.slice(0, 10);
  return (
    <section className="sc-tl-card" aria-label="Today timeline">
      <header className="sc-tl-head">
        <h3>Today&apos;s classes · {DEMO_DAY}</h3>
      </header>
      <ol className="sc-tl-list">
        {periods.map(p => {
          const endMs   = Date.parse(`${dateStr}T${p.end}:00+04:00`);
          const isNow   = current?.period === p.period;
          const isDone  = endMs <= nowMs && !isNow;
          const cls = ["sc-tl-row"];
          if (p.state === "break") cls.push("sc-tl-break");
          if (p.state === "lunch") cls.push("sc-tl-lunch");
          if (isDone)              cls.push("sc-tl-done");
          if (isNow)               cls.push("sc-tl-now");
          return (
            <li key={p.period} className={cls.join(" ")}>
              <span className="sc-tl-time">{p.start}–{p.end}</span>
              <span className="sc-tl-pkey">{p.period}</span>
              <span className="sc-tl-body">
                <span className="sc-tl-subj">{p.subject}</span>
                {(p.teacher || p.room) && (
                  <span className="sc-tl-meta">{p.teacher}{p.teacher && p.room ? " · " : ""}{p.room}</span>
                )}
              </span>
              {isDone && <span className="sc-tl-check">✓</span>}
              {isNow  && <span className="sc-tl-pill">NOW</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
