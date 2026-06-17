import { MOCK_COMPLETION } from "@manhaj/lib/mock-homework";

export default function CompletionTrend() {
  const max = 100;
  const w   = 56;
  const gap = 10;
  const h   = 90;
  const baseX = 30;
  return (
    <section className="hw-ct-card" aria-label="Completion trend">
      <header className="hw-ct-head">
        <h3>On-time completion · last 4 weeks</h3>
        <p className="hw-ct-sub">Trend up from 71% → 88% over the month. Keep it going.</p>
      </header>
      <svg viewBox="0 0 320 130" width="100%" height="130" role="img" aria-label="Bar chart">
        {/* axis */}
        <line x1="20" y1="100" x2="310" y2="100" stroke="var(--color-border)" strokeWidth="1" />
        {/* bars */}
        {MOCK_COMPLETION.map((c, i) => {
          const x  = baseX + i * (w + gap);
          const bh = Math.round((c.on_time_pct / max) * h);
          const y  = 100 - bh;
          return (
            <g key={c.week_label}>
              <rect x={x} y={y} width={w} height={bh} rx="3" fill="var(--color-primary)" opacity={0.7 + i * 0.1} />
              <text x={x + w / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-ink)">{c.on_time_pct}%</text>
              <text x={x + w / 2} y={118} textAnchor="middle" fontSize="9" fill="var(--color-muted)">{c.week_label}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
