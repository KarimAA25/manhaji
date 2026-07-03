import type { RoomUtilRow } from "@manhaj/lib/queries/timetable";

const MOCK_ROOMS = [
  { code: "Lab 1 · Chem",  pct: 96 },
  { code: "Lab 2 · Bio",   pct: 88 },
  { code: "Lab 3 · ICT",   pct: 74 },
  { code: "Gym",           pct: 72 },
  { code: "R201",          pct: 60 },
  { code: "R204",          pct: 58 },
  { code: "Library",       pct: 24 },
  { code: "Music room",    pct: 18 },
];

function tone(pct: number): string {
  if (pct >= 90) return "over";
  if (pct >= 75) return "high";
  if (pct >= 50) return "ok";
  return "under";
}

export default function RoomUtilization({ rooms }: { rooms?: RoomUtilRow[] }) {
  const rows = rooms && rooms.length > 0 ? rooms : MOCK_ROOMS;

  return (
    <section className="room-card" aria-label="Room + lab utilisation">
      <header className="room-head">
        <div>
          <h3>Room + lab utilisation</h3>
          <p className="room-sub">% of bell-periods booked this week. Spot under-used rooms or over-booked labs.</p>
        </div>
      </header>

      <div className="room-list">
        {rows.map(r => (
          <div key={r.code} className="room-row">
            <span className="room-nm">{r.code}</span>
            <div className="room-bar-track">
              <div className={`room-bar-fill room-bar-${tone(r.pct)}`} style={{ width: `${r.pct}%` }} />
            </div>
            <span className={`room-val room-val-${tone(r.pct)}`}>{r.pct}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
