import type { AdminStudentRow } from "@manhaj/lib/queries/students";

const MOCK_YEAR_GROUPS = [
  { name: "Grade 9",  count: 52, pct: 22 },
  { name: "Grade 10", count: 68, pct: 29 },
  { name: "Grade 11", count: 58, pct: 24 },
  { name: "Grade 12", count: 60, pct: 25 },
];

const MOCK_GENDER = [
  { name: "Female", pct: 52, count: 124 },
  { name: "Male",   pct: 48, count: 114 },
];

type BarRow = { name: string; count: number; pct: number };

function computeYearGroups(students: AdminStudentRow[]): BarRow[] {
  const map = new Map<string, number>();
  for (const s of students) {
    const g = s.grade_level ?? "Unknown";
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  const total = students.length || 1;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function computeGender(students: AdminStudentRow[]): BarRow[] {
  const map = new Map<string, number>();
  for (const s of students) {
    const g = s.gender ?? "Unknown";
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  const total = students.length || 1;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export default function DemographicBreakdown({ students }: { students?: AdminStudentRow[] }) {
  const yearGroups = students ? computeYearGroups(students) : MOCK_YEAR_GROUPS;
  const gender     = students ? computeGender(students)     : MOCK_GENDER;

  return (
    <section className="demo-card" aria-label="Demographic breakdown">
      <header className="demo-head">
        <div>
          <h3>Demographic breakdown</h3>
          <p className="demo-sub">Year-group and gender split · {students ? "live DB" : "demo data"}</p>
        </div>
      </header>

      <div className="demo-groups">
        <div className="demo-group">
          <div className="demo-group-label">By year group</div>
          {yearGroups.map(g => (
            <div key={g.name} className="demo-bar-row">
              <span className="demo-bar-name">{g.name}</span>
              <div className="demo-bar-track">
                <div className="demo-bar-fill" style={{ width: `${g.pct}%` }} />
              </div>
              <span className="demo-bar-val">{g.count} · {g.pct}%</span>
            </div>
          ))}
        </div>

        <div className="demo-group">
          <div className="demo-group-label">By gender</div>
          {gender.map(g => (
            <div key={g.name} className="demo-bar-row">
              <span className="demo-bar-name">{g.name}</span>
              <div className="demo-bar-track">
                <div className="demo-bar-fill demo-bar-fill-alt" style={{ width: `${g.pct}%` }} />
              </div>
              <span className="demo-bar-val">{g.count} · {g.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
