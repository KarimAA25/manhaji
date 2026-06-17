"use client";

import { useMemo, useState, useEffect } from "react";

import { useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import {
  categoryCounts, threadsForChild, MESSAGE_RECIPIENTS,
  type MessageCategory, type Thread,
} from "@manhaj/lib/mock-messages";

import InboxList            from "./components/InboxList";
import CategoryFilter       from "./components/CategoryFilter";
import ChildFilter          from "./components/ChildFilter";
import ThreadView           from "./components/ThreadView";
import EmptyState           from "./components/EmptyState";
import NewMessageComposer, { type NewMessagePayload } from "./components/NewMessageComposer";
import { sendReplyAction, createThreadAction, markThreadReadAction } from "./actions";

export default function MessagesClient({ initialThreads }: { initialThreads: Thread[] }) {
  const { activeId: activeChildId } = useActiveChild();

  const [category,   setCategory]   = useState<MessageCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Apply filters in order: child → category → unread.
  const childScoped = useMemo(
    () => threadsForChild(initialThreads, activeChildId),
    [initialThreads, activeChildId],
  );

  const filtered = useMemo(() => {
    let rows: Thread[] = childScoped;
    if (category !== "all") rows = rows.filter(t => t.category === category);
    if (unreadOnly)         rows = rows.filter(t => t.unread);
    return rows;
  }, [childScoped, category, unreadOnly]);

  const counts = useMemo(() => categoryCounts(childScoped), [childScoped]);

  // Default active thread: first unread → else first → else null.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeThreadId && filtered.some(t => t.id === activeThreadId)) return;
    const next = filtered.find(t => t.unread)?.id ?? filtered[0]?.id ?? null;
    setActiveThreadId(next);
  }, [filtered, activeThreadId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activeThread = filtered.find(t => t.id === activeThreadId)
                    ?? initialThreads.find(t => t.id === activeThreadId)
                    ?? null;

  const multiChild = activeChildId === ALL_CHILDREN_ID;

  function onSelectThread(id: string) {
    setActiveThreadId(id);
    setMobileShowThread(true);
    // Mark read on the server; UI updates via revalidatePath.
    const thread = initialThreads.find(t => t.id === id);
    if (thread?.unread) {
      markThreadReadAction(id).catch(err => console.error(err));
    }
  }

  async function onReplySend(body: string) {
    if (!activeThreadId) return;
    await sendReplyAction(activeThreadId, body);
  }

  async function onNewMessageSend(payload: NewMessagePayload) {
    // Map the recipient ID to a from_name/from_label pair for the seed.
    // For 2.4b-1 we just store the parent's outgoing message; teacher fan-out
    // is 2.4b-2 territory.
    const recipient = MESSAGE_RECIPIENTS.find(r => r.id === payload.to);
    await createThreadAction({
      student_id: payload.child_id === "household" ? null : payload.child_id,
      category:   "admin",    // 2.4b-1 default; UX picker for category is a Phase 3 nicety
      subject:    payload.subject,
      from_name:  "Mr Al-Habsi",
      from_label: `Parent → ${recipient?.name ?? payload.to}`,
      body:       payload.body,
    });
  }

  return (
    <div className="msg-page">
      <aside className={`msg-rail ${mobileShowThread ? "is-mobile-hidden" : ""}`} aria-label="Inbox">
        {multiChild && <ChildFilter threads={initialThreads} />}
        <CategoryFilter
          active={category}
          onChange={setCategory}
          counts={counts}
          unreadOnly={unreadOnly}
          onToggleUnread={() => setUnreadOnly(v => !v)}
        />
        <InboxList
          threads={filtered}
          activeThreadId={activeThreadId}
          onSelect={onSelectThread}
          multiChild={multiChild}
        />
        <div className="msg-rail-foot">
          <button type="button" className="msg-btn msg-btn-primary" onClick={() => setComposerOpen(true)}>+ New message</button>
        </div>
      </aside>

      <main className={`msg-pane ${mobileShowThread ? "is-mobile-active" : ""}`}>
        {activeThread ? (
          <ThreadView
            thread={activeThread}
            onBack={() => setMobileShowThread(false)}
            onReplySend={onReplySend}
          />
        ) : (
          <EmptyState onCompose={() => setComposerOpen(true)} />
        )}
      </main>

      <NewMessageComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={onNewMessageSend}
        defaultChildId={activeChildId}
      />
    </div>
  );
}
