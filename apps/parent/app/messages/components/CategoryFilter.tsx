"use client";

import type { MessageCategory } from "@manhaj/lib/mock-messages";

type Counts = Record<MessageCategory | "all" | "unread", number>;
type CatOrAll = MessageCategory | "all";

const CATS: Array<{ key: CatOrAll; label: string }> = [
  { key: "all",      label: "All" },
  { key: "academic", label: "Academic" },
  { key: "admin",    label: "Admin" },
  { key: "finance",  label: "Finance" },
  { key: "calendar", label: "Calendar" },
];

export default function CategoryFilter({
  active, onChange, counts, unreadOnly, onToggleUnread,
}: {
  active:         CatOrAll;
  onChange:       (c: CatOrAll) => void;
  counts:         Counts;
  unreadOnly:     boolean;
  onToggleUnread: () => void;
}) {
  return (
    <div role="toolbar" aria-label="Filter threads" className="msg-cat-row">
      {CATS.map(c => (
        <button
          key={c.key} type="button"
          className={`msg-cat-pill ${active === c.key ? "active" : ""}`}
          onClick={() => onChange(c.key)}
          aria-pressed={active === c.key}
        >
          {c.label}<span className="msg-cat-count">{counts[c.key]}</span>
        </button>
      ))}
      <button
        type="button"
        className={`msg-cat-pill msg-cat-pill-unread ${unreadOnly ? "active" : ""}`}
        onClick={onToggleUnread}
        aria-pressed={unreadOnly}
        style={{ marginLeft: "auto" }}
      >
        Unread<span className="msg-cat-count">{counts.unread}</span>
      </button>
    </div>
  );
}
