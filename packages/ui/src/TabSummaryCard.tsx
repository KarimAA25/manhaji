/**
 * Generic per-tab summary card for persona dashboards.
 *
 * Big number on top, trend line, and a couple of detail rows. Click-through
 * via an enclosing <Link>; this component itself is presentational.
 */

import Link from "next/link";

export type TabSummary = {
  label: string;
  href: string;
  big: string;
  big_suffix?: string;
  trend?: { text: string; tone: "up" | "down" | "warn" | "flat" };
  rows?: Array<{ label: string; value: string }>;
};

export default function TabSummaryCard({ summary }: { summary: TabSummary }) {
  const toneClass = summary.trend ? `tone-${summary.trend.tone}` : "";
  return (
    <Link href={summary.href} className="tab-summary-card">
      <div className="tab-summary-head">
        <span className="tab-summary-label">{summary.label}</span>
        <span className="tab-summary-arrow" aria-hidden="true">→</span>
      </div>
      <div className="tab-summary-big">
        {summary.big}
        {summary.big_suffix && <span className="tab-summary-big-suffix"> {summary.big_suffix}</span>}
      </div>
      {summary.trend && (
        <div className={`tab-summary-trend ${toneClass}`}>{summary.trend.text}</div>
      )}
      {summary.rows && summary.rows.length > 0 && (
        <div className="tab-summary-rows">
          {summary.rows.map(r => (
            <div key={r.label} className="tab-summary-row">
              <span>{r.label}</span><b>{r.value}</b>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
