/**
 * Navy gradient briefing card used at the top of every persona Dashboard.
 *
 * Consumes the deterministic Summary shape from lib/summary.ts. Phase 3 will
 * swap the source from the deterministic composer to a live Claude call —
 * this component does not change.
 */

import type { Summary } from "@manhaj/lib/summary";

export default function AiBriefingHeader({ summary, refreshedAgoMin }: {
  summary: Summary;
  refreshedAgoMin?: number;
}) {
  return (
    <section className="ai-briefing" aria-label="Manhaji briefing">
      <div className="ai-briefing-label">Manhaji briefing</div>
      <p className="ai-briefing-headline">{summary.headline}</p>
      {summary.ai_suggested_action && (
        <p className="ai-briefing-cta"><b>Suggested first move:</b> {summary.ai_suggested_action}</p>
      )}
      <div className="ai-briefing-sections">
        <div>
          <div className="ai-briefing-sect-label">Today</div>
          <div className="ai-briefing-sect-body">{summary.today}</div>
        </div>
        <div>
          <div className="ai-briefing-sect-label">This week</div>
          <div className="ai-briefing-sect-body">{summary.this_week}</div>
        </div>
        <div>
          <div className="ai-briefing-sect-label">This month</div>
          <div className="ai-briefing-sect-body">{summary.this_month}</div>
        </div>
      </div>
      <div className="ai-briefing-meta">
        Drafted by Manhaji{refreshedAgoMin != null ? ` · refreshed ${refreshedAgoMin} min ago` : ""} · verify before acting
      </div>
    </section>
  );
}
