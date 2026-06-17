/**
 * Admin · Schedule · Room + lab utilisation.
 *
 * Shows % of bell-periods booked this week per room/lab.
 * High = danger/warn, moderate = accent, low = muted.
 */

const ROOMS = [
  { name: "Lab 1 · Chem",  pct: 96, note: "near full" },
  { name: "Lab 2 · Bio",   pct: 88, note: "high"      },
  { name: "Lab 3 · ICT",   pct: 74, note: null         },
  { name: "Gym",           pct: 72, note: null         },
  { name: "R201",          pct: 60, note: null         },
  { name: "R204",          pct: 58, note: null         },
  { name: "Library",       pct: 24, note: "free Thu P5" },
  { name: "Music room",    pct: 18, note: "free most PMs" },
];

function tone(pct: number): string {
  if (pct >= 90) return "over";
  if (pct >= 75) return "high";
  if (pct >= 50) return "ok";
  return "under";
}

export default function RoomUtilization() {
  return (
    <section className="room-card" aria-label="Room + lab utilisation">
      <header className="room-head">
        <div>
          <h3>Room + lab utilisation</h3>
          <p className="room-sub">% of bell-periods booked this week. Spot under-used rooms or over-booked labs.</p>
        </div>
        <div className="room-toggle">
          <span className="room-toggle-pill active">This week</span>
          <span className="room-toggle-pill">Term avg</span>
        </div>
      </header>

      <div className="room-list">
        {ROOMS.map(r => (
          <div key={r.name} className="room-row">
            <span className="room-nm">{r.name}</span>
            <div className="room-bar-track">
              <div
                className={`room-bar-fill room-bar-${tone(r.pct)}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className={`room-val room-val-${tone(r.pct)}`}>
              {r.pct}%
              {r.note && <small className="room-note"> · {r.note}</small>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
