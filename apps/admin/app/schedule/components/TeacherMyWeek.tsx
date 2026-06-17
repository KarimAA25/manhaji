/**
 * Admin · Schedule · Ms Swart · my week.
 *
 * Per-teacher week grid showing only Ms Swart's periods.
 * HoD / teacher lens framing.
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;

type Day    = typeof DAYS[number];
type Period = typeof PERIODS[number];

interface Cell {
  subject: string;
  section: string;
  room:    string;
}

const SWART_WEEK: Partial<Record<Period, Partial<Record<Day, Cell | undefined>>>> = {
  P1: { Tue: { subject: "English", section: "10A", room: "R204" }, Thu: { subject: "English", section: "10A", room: "R204" } },
  P2: { Mon: { subject: "English", section: "10A", room: "R204" }, Wed: { subject: "English (sub)", section: "10A", room: "R204" }, Thu: { subject: "English", section: "10A", room: "R204" } },
  P3: { Tue: { subject: "English", section: "11 AS", room: "R204" }, Fri: { subject: "English", section: "12 A2", room: "R204" } },
  P4: { Fri: { subject: "English", section: "11 AS", room: "R204" } },
  P5: { Mon: { subject: "English", section: "12 A2", room: "R204" }, Wed: { subject: "English", section: "10A", room: "R204" } },
  P6: { Thu: { subject: "English", section: "12 A2", room: "R204" }, Fri: { subject: "English", section: "11 AS", room: "R204" } },
};

// Count total periods
const totalPeriods = Object.values(SWART_WEEK).reduce((acc, row) => {
  return acc + Object.values(row ?? {}).filter(Boolean).length;
}, 0);

export default function TeacherMyWeek() {
  return (
    <section className="tmw-card" aria-label="Ms Swart · my week">
      <header className="tmw-head">
        <div>
          <h3>Ms Swart · my week</h3>
          <p className="tmw-sub">
            English · {totalPeriods} periods this week · teacher lens
          </p>
        </div>
        <div className="tmw-toggle">
          <span className="tmw-toggle-pill active">Ms Swart</span>
          <span className="tmw-toggle-pill">Mr Saab</span>
          <span className="tmw-toggle-pill">Mr Salim</span>
        </div>
      </header>

      <div className="tmw-grid" role="grid" aria-label="Ms Swart weekly timetable">
        {/* Header row */}
        <div className="tmw-corner" aria-hidden="true" />
        {DAYS.map(d => (
          <div key={d} className="tmw-col-head" role="columnheader">{d}</div>
        ))}

        {/* Period rows */}
        {PERIODS.map(p => (
          <>
            <div key={`${p}-rh`} className="tmw-row-head" role="rowheader">{p}</div>
            {DAYS.map(d => {
              const cell = SWART_WEEK[p]?.[d];
              return (
                <div
                  key={`${p}-${d}`}
                  className={`tmw-cell ${cell ? "tmw-cell-filled" : "tmw-cell-free"}`}
                  role="gridcell"
                  aria-label={cell ? `${cell.subject} ${cell.section} ${cell.room}` : "free"}
                >
                  {cell ? (
                    <>
                      <span className="tmw-subj">{cell.subject}</span>
                      <span className="tmw-meta">{cell.section} · {cell.room}</span>
                    </>
                  ) : (
                    <span className="tmw-free">—</span>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </section>
  );
}
