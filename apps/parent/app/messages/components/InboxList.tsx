"use client";

import type { Thread } from "@manhaj/lib/mock-messages";
import { formatRelative } from "@manhaj/lib/mock-messages";
import { useActiveChild } from "@manhaj/lib/child";

export default function InboxList({
  threads, activeThreadId, onSelect, multiChild,
}: {
  threads:        Thread[];
  activeThreadId: string | null;
  onSelect:       (threadId: string) => void;
  multiChild:     boolean;
}) {
  const { children } = useActiveChild();
  if (threads.length === 0) {
    return <div className="msg-inbox-empty">No messages match the current filter.</div>;
  }
  return (
    <ul className="msg-inbox-list" role="list">
      {threads.map(t => {
        const isActive = t.id === activeThreadId;
        const realChild = t.child_id !== "household"
          ? children.find(c => c.id === t.child_id)
          : undefined;
        const childLabel = t.child_id === "household" ? "Household" : realChild?.full_name?.split(" ")[0] ?? "?";
        const childInitial = t.child_id === "household" ? "⌂" : realChild?.initial ?? "?";
        return (
          <li key={t.id}>
            <button
              type="button"
              className={`msg-inbox-row ${isActive ? "is-active" : ""} ${t.unread ? "is-unread" : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(t.id)}
            >
              <span className="msg-inbox-dot" aria-hidden="true" />
              {multiChild && (
                <span className={`msg-inbox-childtag ${t.child_id === "household" ? "is-hh" : ""}`}>
                  <span className="msg-inbox-childtag-av" aria-hidden="true">{childInitial}</span>
                  {childLabel}
                </span>
              )}
              <span className="msg-inbox-body">
                <span className="msg-inbox-from">{t.from_label}</span>
                <span className="msg-inbox-subject">{t.subject}</span>
                <span className="msg-inbox-preview">
                  {t.messages[t.messages.length - 1]?.body.slice(0, 80) ?? ""}…
                </span>
              </span>
              <span className="msg-inbox-when">{formatRelative(t.last_activity_at)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
