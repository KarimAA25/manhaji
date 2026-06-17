"use client";

import type { EventType, EventTypeCount } from "@manhaj/lib/mock-calendar";

const TYPES: Array<{ key: EventType; label: string }> = [
  { key: "exam",    label: "Exams" },
  { key: "meeting", label: "Parent-teacher" },
  { key: "event",   label: "Events" },
  { key: "club",    label: "Clubs" },
  { key: "holiday", label: "Holidays" },
];

export default function EventTypeFilter({
  active, counts, totalAll, onToggle, onClearAll,
}: {
  active:     Set<EventType>;
  counts:     EventTypeCount;
  totalAll:   number;
  onToggle:   (t: EventType) => void;
  onClearAll: () => void;
}) {
  return (
    <div role="toolbar" aria-label="Filter event types" className="cal-cat-row">
      <button
        type="button"
        className={`cal-cat-pill ${active.size === 0 ? "active" : ""}`}
        aria-pressed={active.size === 0}
        onClick={onClearAll}
      >
        All<span className="cal-cat-count">{totalAll}</span>
      </button>
      {TYPES.map(t => (
        <button
          key={t.key} type="button"
          className={`cal-cat-pill cal-type-${t.key} ${active.has(t.key) ? "active" : ""}`}
          aria-pressed={active.has(t.key)}
          onClick={() => onToggle(t.key)}
        >
          {t.label}<span className="cal-cat-count">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}
