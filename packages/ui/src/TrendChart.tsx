/**
 * Reusable line trend chart with calendar-anchored event markers and an
 * axis-anchored target marker.
 *
 * Used by Admin · Attendance for the 30-day daily aggregate. Phase 2.4
 * Reports will reuse it for the send-pipeline historical view.
 *
 * Why server-renderable: there's no interactivity inside the SVG; consumers
 * pass a fully-resolved dataset and the component computes coordinates.
 */

type Tone = "muted" | "neutral" | "warn";

export type TrendPoint = { date: string; pct: number };
export type TrendMarker = { id: number; date: string; label: string; tone: Tone };

export default function TrendChart({
  points,
  markers = [],
  target = 95,
  height = 170,
  title = "Trend",
}: {
  points:   TrendPoint[];
  markers?: TrendMarker[];
  target?:  number;
  height?:  number;
  title?:   string;
}) {
  // Normalised viewBox: x = index across `points`, y = % (0–100).
  const W = 400;
  const H = height;
  const padL = 32;          // left padding for Y-axis labels
  const padR = 0;
  const padTop = 20;
  const padBot = 30;        // room for the x-axis label
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBot;

  // Y-axis: 85–100 visible range
  const yMin = 85;
  const yMax = 100;
  function y(pct: number): number {
    const clamped = Math.max(yMin, Math.min(yMax, pct));
    return padTop + (1 - (clamped - yMin) / (yMax - yMin)) * plotH;
  }
  function x(i: number): number {
    if (points.length <= 1) return padL;
    return padL + (i / (points.length - 1)) * plotW;
  }

  const polyPoints = points.map((p, i) => `${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ");
  const areaPath = [
    `M${padL},${y(points[0]?.pct ?? yMin).toFixed(1)}`,
    ...points.slice(1).map((p, i) => `L${x(i + 1).toFixed(1)},${y(p.pct).toFixed(1)}`),
    `L${(padL + plotW).toFixed(1)},${(padTop + plotH).toFixed(1)}`,
    `L${padL},${(padTop + plotH).toFixed(1)}`,
    "Z",
  ].join(" ");

  // Map marker date → x-coord
  function markerX(dateStr: string): number | null {
    const idx = points.findIndex(p => p.date === dateStr);
    if (idx === -1) return null;
    return x(idx);
  }

  const yTarget = y(target);

  return (
    <section className="trend-card" aria-label={title}>
      <header className="trend-head">
        <h3>{title}</h3>
      </header>
      <div className="trend-wrap">
        <svg
          className="trend-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title} · last ${points.length} data points`}
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#3D5A80" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3D5A80" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Below-target subtle tint */}
          <rect
            x={padL} y={yTarget}
            width={plotW} height={padTop + plotH - yTarget}
            fill="#FED7D7" opacity="0.18"
          />

          {/* Gridlines */}
          <line x1={padL} y1={y(100)} x2={padL + plotW} y2={y(100)} stroke="#EEF2F7" />
          <line x1={padL} y1={y(95)}  x2={padL + plotW} y2={y(95)}  stroke="#EEF2F7" />
          <line x1={padL} y1={y(90)}  x2={padL + plotW} y2={y(90)}  stroke="#EEF2F7" />
          <line x1={padL} y1={y(85)}  x2={padL + plotW} y2={y(85)}  stroke="#EEF2F7" />

          {/* Y-axis line */}
          <line x1={padL} y1={padTop} x2={padL} y2={padTop + plotH} stroke="#E5EAF0" strokeWidth="1.5" />

          {/* Y-axis labels */}
          <text x={padL - 6} y={y(100) + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">100</text>
          <text x={padL - 6} y={y(95)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">95</text>
          <text x={padL - 6} y={y(90)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">90</text>
          <text x={padL - 6} y={y(85)  + 3} fontSize="8.5" fill="#5A6B82" textAnchor="end">85</text>

          {/* Axis-anchored target marker — green arrow flush against the Y-axis */}
          <polygon
            points={`${padL},${(yTarget - 5).toFixed(1)} ${padL + 6},${yTarget.toFixed(1)} ${padL},${(yTarget + 5).toFixed(1)}`}
            fill="#2F855A"
          />
          <line x1={padL} y1={yTarget} x2={padL + 6} y2={yTarget} stroke="#2F855A" strokeWidth="2" />
          <text x={padL + 10} y={yTarget + 3} fontSize="8.5" fill="#2F855A" fontWeight="700">Target {target}%</text>

          {/* Filled area + line */}
          <path d={areaPath} fill="url(#trendFill)" />
          <polyline
            points={polyPoints}
            fill="none" stroke="#0B2545" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
          />

          {/* Event markers — numbered circles on the line */}
          {markers.map(m => {
            const mx = markerX(m.date);
            if (mx == null) return null;
            const idx = points.findIndex(p => p.date === m.date);
            const my = y(points[idx].pct);
            return (
              <g key={m.id}>
                <line x1={mx} y1={yTarget} x2={mx} y2={my - 6} stroke="#5A6B82" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                <circle cx={mx} cy={my + 4} r="9" fill="#fff" stroke="#0B2545" strokeWidth="1.5" />
                <text x={mx} y={my + 7} fontSize="9" fontWeight="700" fill="#0B2545" textAnchor="middle">{m.id}</text>
              </g>
            );
          })}

          {/* X-axis label */}
          <text x={padL + plotW / 2} y={H - 10} fontSize="8.5" fill="#5A6B82" textAnchor="middle">
            last {points.length} school days →
          </text>
        </svg>

        <div className="trend-legend">
          <span className="trend-legend-item">
            <span className="trend-legend-sw" style={{ background: "#0B2545" }} /> Daily %
          </span>
          <span className="trend-legend-item">
            <span className="trend-legend-sw" style={{ background: "#FED7D7", opacity: 0.6 }} /> Below-target zone
          </span>
          <span className="trend-legend-item trend-legend-arrow">
            <span className="trend-legend-target" /> Target marker
          </span>
          {markers.length > 0 && (
            <span className="trend-legend-marks">
              {markers.map(m => (
                <span key={m.id} className="trend-legend-pill">{`${m.id} · ${m.label}`}</span>
              ))}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
