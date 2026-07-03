import { MOCK_TEACHER_LOADS, DAYS } from "@manhaj/lib/mock-schedule";
import type { TeacherDayLoad } from "@manhaj/lib/queries/timetable";

type Row = { teacher: string; by_day: Record<string, number>; total: number };

function tone(n: number): string {
  if (n === 0) return "tl-0";
  if (n <= 2)  return "tl-1";
  if (n <= 4)  return "tl-2";
  if (n <= 5)  return "tl-3";
  return "tl-4";
}

export default function TeacherLoadHeatmap({ loads }: { loads?: TeacherDayLoad[] }) {
  const rows: Row[] = loads && loads.length > 0
    ? loads.map(l => ({ teacher: l.full_name, by_day: l.by_day, total: l.total }))
    : MOCK_TEACHER_LOADS;

  const days: string[] = loads && loads.length > 0
    ? [...new Set(rows.flatMap(r => Object.keys(r.by_day)))]
    : DAYS;

  const over = new Set(rows.filter(r => Object.values(r.by_day).some(n => n > 5)).map(r => r.teacher));

  return (
    <section className="sch-tl-card" aria-label="Teacher load heatmap">
      <header className="sch-tl-head">
        <h3>Teacher load · periods / day</h3>
        <p className="sch-tl-sub">Red dot = overloaded any day (&gt; 5 periods).</p>
      </header>
      <div className="sch-tl-grid">
        <div className="sch-tl-cnr" />
        {days.map(d => <div key={d} className="sch-tl-dow">{d}</div>)}
        <div className="sch-tl-dow sch-tl-total">Total</div>
        {rows.map(l => (
          <FragmentRow key={l.teacher} l={l} days={days} overloaded={over.has(l.teacher)} />
        ))}
      </div>
      <div className="sch-tl-legend">
        <span>Less</span>
        <span className="sch-tl-sw tl-0" />
        <span className="sch-tl-sw tl-1" />
        <span className="sch-tl-sw tl-2" />
        <span className="sch-tl-sw tl-3" />
        <span className="sch-tl-sw tl-4" />
        <span>More</span>
      </div>
    </section>
  );
}

function FragmentRow({ l, days, overloaded }: { l: Row; days: string[]; overloaded: boolean }) {
  return (
    <>
      <div className="sch-tl-name">
        {l.teacher}
        {overloaded && <span className="sch-tl-dot" aria-label="overloaded"/>}
      </div>
      {days.map(d => {
        const n = l.by_day[d] ?? 0;
        return <div key={d} className={`sch-tl-cell ${tone(n)}`}>{n}</div>;
      })}
      <div className="sch-tl-cell sch-tl-totcell">{l.total}</div>
    </>
  );
}
