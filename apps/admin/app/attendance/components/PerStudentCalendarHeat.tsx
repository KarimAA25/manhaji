import type { CalendarRow } from "@manhaj/lib/mock-attendance";

export default function PerStudentCalendarHeat({
  weeks, studentName, sectionCode,
}: {
  weeks:       CalendarRow[];
  studentName: string;
  sectionCode: string;
}) {
  return (
    <section className="cal-card att-block-advisor-only" aria-label={`${studentName} · attendance calendar`}>
      <header className="cal-head">
        <h3>{studentName} · attendance calendar · last {weeks.length} weeks</h3>
        <p className="cal-sub">{sectionCode} · green=present, amber=late, red=absent. Each cell is one school day.</p>
      </header>
      <div className="cal-grid">
        {weeks.flatMap((row, wIdx) =>
          row.map((d, dIdx) => (
            <div key={`${wIdx}-${dIdx}`} className={`cal-day cal-${d}`} aria-label={`Week ${wIdx + 1} day ${dIdx + 1}: ${d}`} />
          ))
        )}
      </div>
      <p className="cal-foot">
        <b>Manhaj:</b> Cluster pattern visible — absences concentrate around exam periods. First two clusters excused (medical),
        most recent two unexplained.
      </p>
    </section>
  );
}
