import { MOCK_PERIODS, DEMO_DAY, currentPeriod, DEMO_NOW, type StudentPeriod } from "@manhaj/lib/mock-student-schedule";

const DAYS: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri"> = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function WeekView() {
  const { current } = currentPeriod(MOCK_PERIODS, DEMO_NOW);
  // Group by day, in bell-order
  const byDay: Record<string, StudentPeriod[]> = {};
  for (const day of DAYS) byDay[day] = MOCK_PERIODS.filter(p => p.day === day);
  return (
    <section className="sc-wv-card" aria-label="Week view">
      <header className="sc-wv-head">
        <h3>This week</h3>
      </header>
      <div className="sc-wv-grid">
        {DAYS.map(d => (
          <div key={d} className={`sc-wv-col ${d === DEMO_DAY ? "sc-wv-today" : ""}`}>
            <div className="sc-wv-dow">{d}{d === DEMO_DAY ? " · Today" : ""}</div>
            {byDay[d].map(p => {
              const isNow = p.day === DEMO_DAY && current?.period === p.period;
              const cls = ["sc-wv-cell"];
              if (p.state === "break") cls.push("sc-wv-break");
              if (p.state === "lunch") cls.push("sc-wv-lunch");
              if (isNow)               cls.push("sc-wv-now");
              return (
                <div key={p.period} className={cls.join(" ")}>
                  <span className="sc-wv-key">{p.period}</span>
                  <span className="sc-wv-subj">{abbrev(p.subject)}</span>
                  {p.room && !p.state && <span className="sc-wv-room">{p.room}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function abbrev(subject: string): string {
  const map: Record<string, string> = {
    "English":   "Eng",
    "Maths":     "Mth",
    "Chemistry": "Chm",
    "Biology":   "Bio",
    "Physics":   "Phy",
    "History":   "His",
    "Geography": "Geo",
    "Arabic":    "Ara",
    "PE":        "PE",
    "ICT":       "ICT",
    "MUN club":  "MUN",
    "Study":     "Study",
    "Break":     "Break",
    "Lunch":     "Lunch",
  };
  return map[subject] ?? subject.slice(0, 3);
}
