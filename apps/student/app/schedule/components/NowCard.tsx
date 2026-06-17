import { currentPeriod, MOCK_PERIODS, DEMO_NOW } from "@manhaj/lib/mock-student-schedule";

export default function NowCard() {
  const { current, next, minutes_left } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  if (!current) {
    return (
      <section className="sc-now-card sc-now-empty" aria-label="Right now">
        <h3>No class right now</h3>
        <p>You&apos;re outside school hours. Next class begins tomorrow at 08:00.</p>
      </section>
    );
  }
  return (
    <section className="sc-now-card" aria-label="Right now">
      <div className="sc-now-head">
        <span className="sc-now-tag">Right now · {current.period}</span>
        <span className="sc-now-time">{minutes_left} min left</span>
      </div>
      <h3 className="sc-now-title">{current.subject}</h3>
      <p className="sc-now-meta">
        {current.teacher && <>· {current.teacher} </>}
        {current.room && <>· {current.room} </>}
        · {current.start}–{current.end}
      </p>
      {current.bring && current.bring.length > 0 && (
        <div className="sc-now-bring">
          <span className="sc-now-bring-label">Bring:</span>
          <ul>{current.bring.map(b => <li key={b}>{b}</li>)}</ul>
        </div>
      )}
      {next && (
        <div className="sc-now-next">
          <span className="sc-now-next-label">Next up</span>
          <span>{next.period} · {next.subject}{next.room ? ` · ${next.room}` : ""} · starts {next.start}</span>
        </div>
      )}
    </section>
  );
}
