"use client";

import { ALL_CHILDREN_ID, useActiveChild } from "@manhaj/lib/child";
import type { Thread } from "@manhaj/lib/mock-messages";

export default function ChildFilter({ threads }: { threads: Thread[] }) {
  const { activeId, setActive, children } = useActiveChild();

  const counts = new Map<string, number>();
  for (const c of children) counts.set(c.id, 0);
  for (const t of threads) {
    if (t.child_id !== "household") {
      counts.set(t.child_id, (counts.get(t.child_id) ?? 0) + 1);
    }
  }
  const allCount = threads.length;

  return (
    <div role="toolbar" aria-label="Filter by child" className="msg-child-row">
      <button
        type="button"
        className={`msg-child-pill ${activeId === ALL_CHILDREN_ID ? "active" : ""}`}
        onClick={() => setActive(ALL_CHILDREN_ID)}
        aria-pressed={activeId === ALL_CHILDREN_ID}
      >
        All<span className="msg-cat-count">{allCount}</span>
      </button>
      {children.map(c => (
        <button
          key={c.id} type="button"
          className={`msg-child-pill ${activeId === c.id ? "active" : ""}`}
          onClick={() => setActive(c.id)}
          aria-pressed={activeId === c.id}
        >
          <span className="msg-child-av" aria-hidden="true">{c.initial}</span>
          {c.full_name.split(" ")[0]}<span className="msg-cat-count">{counts.get(c.id) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
