import { MOCK_GROWTH, AXIS_LABELS } from "@manhaj/lib/mock-growth";

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = SIZE / 2 - 32;

function polyPoints(scores: number[]): string {
  const n = scores.length;
  return scores.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (s / 5) * MAX_R;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");
}

export default function RubricRadar() {
  const axes = AXIS_LABELS;
  const orderedHist = axes.map(a => MOCK_GROWTH.find(h => h.axis === a.key)!);
  const thisMo = orderedHist.map(h => h.this_mo);
  const lastMo = orderedHist.map(h => h.last_mo);

  const gridRings = [1, 2, 3, 4, 5].map(v => v / 5 * MAX_R);

  return (
    <section className="gr-radar-card" aria-label="6-axis rubric radar">
      <header className="gr-radar-head">
        <div>
          <h3>Rubric this month vs last</h3>
          <div className="gr-radar-sub">Coloured area = this month · grey dashed = last month.</div>
        </div>
        <div className="gr-radar-legend">
          <span className="gr-radar-sw gr-radar-sw-this" /> This
          <span className="gr-radar-sw gr-radar-sw-last" /> Last
        </div>
      </header>

      {/* rubric-row: radar on left, axis-list bars on right */}
      <div className="gr-rubric-row">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ width: "100%", maxWidth: "280px", height: "auto" }}
          role="img"
          aria-label="Radar chart"
        >
          {/* grid rings */}
          {gridRings.map((r, i) => (
            <circle key={i} cx={CX} cy={CY} r={r} fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          ))}
          {/* axis spokes + labels */}
          {axes.map((a, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            const x = CX + MAX_R * Math.cos(angle);
            const y = CY + MAX_R * Math.sin(angle);
            const lx = CX + (MAX_R + 20) * Math.cos(angle);
            const ly = CY + (MAX_R + 20) * Math.sin(angle);
            const isWritten = a.key === "written";
            return (
              <g key={a.key}>
                <line x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="0.5" />
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isWritten ? "var(--color-danger)" : "var(--color-ink)"}
                >
                  {a.label}
                </text>
              </g>
            );
          })}
          {/* last month polygon */}
          <polygon
            points={polyPoints(lastMo)}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* this month polygon */}
          <polygon
            points={polyPoints(thisMo)}
            fill="var(--color-primary)"
            fillOpacity="0.22"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
          />
          {/* dot markers for this month */}
          {thisMo.map((s, i) => {
            const angle = (Math.PI * 2 * i) / thisMo.length - Math.PI / 2;
            const r = (s / 5) * MAX_R;
            const x = CX + r * Math.cos(angle);
            const y = CY + r * Math.sin(angle);
            return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)" />;
          })}
        </svg>

        {/* Axis-list bars */}
        <div className="gr-axis-list" aria-label="Axis scores">
          {orderedHist.map(h => {
            const delta = +(h.this_mo - h.last_mo).toFixed(1);
            const pct   = Math.round((h.this_mo / 5) * 100);
            const isFlag = h.this_mo < 3.0;
            const toneClass = delta > 0 ? "up" : delta < 0 ? "dn" : "flat";
            const trendArrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "—";
            const sign = delta > 0 ? "+" : "";
            return (
              <div key={h.axis} className="gr-axis-row">
                <span className="gr-axis-nm">{h.label}</span>
                <div className="gr-axis-bar">
                  <div
                    className={`gr-axis-fill${isFlag ? " gr-axis-fill-flag" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`gr-axis-v${isFlag ? " gr-axis-v-flag" : ""}`}>
                  {h.this_mo.toFixed(1)} / 5
                </span>
                <span className={`gr-axis-trend ${toneClass}`}>
                  {trendArrow} {sign}{Math.abs(delta).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
