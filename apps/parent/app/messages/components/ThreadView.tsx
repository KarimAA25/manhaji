"use client";

import type { Thread } from "@manhaj/lib/mock-messages";
import MessageBubble from "./MessageBubble";
import ReplyComposer from "./ReplyComposer";

const CATEGORY_LABEL: Record<Thread["category"], string> = {
  academic: "Academic",
  admin:    "Admin",
  finance:  "Finance",
  calendar: "Calendar",
};

export default function ThreadView({
  thread, onBack, onReplySend,
}: {
  thread:      Thread;
  onBack?:     () => void;
  onReplySend: (body: string) => void;
}) {
  return (
    <section className="msg-thread" aria-label={`Thread: ${thread.subject}`}>
      <header className="msg-thread-head">
        {onBack && (
          <button type="button" className="msg-thread-back" onClick={onBack} aria-label="Back to inbox">←</button>
        )}
        <div>
          <div className="msg-thread-tags">
            <span className="msg-thread-tag">{CATEGORY_LABEL[thread.category]}</span>
            <span className="msg-thread-sub">{thread.from_label}</span>
          </div>
          <h2 className="msg-thread-subject">{thread.subject}</h2>
        </div>
      </header>
      <div className="msg-thread-body">
        {thread.messages.map(m => (
          <MessageBubble key={m.id} message={m} isOutgoing={m.role === "parent"} />
        ))}
      </div>
      <ReplyComposer threadSubject={thread.subject} onSend={onReplySend} />
    </section>
  );
}
