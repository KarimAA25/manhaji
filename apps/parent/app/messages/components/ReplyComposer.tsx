"use client";

import { useState } from "react";

export default function ReplyComposer({
  threadSubject, onSend,
}: {
  threadSubject: string;
  onSend:        (body: string) => void;
}) {
  const [body, setBody] = useState("");
  function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setBody("");
  }
  return (
    <footer className="msg-reply" aria-label="Reply form">
      <div className="msg-reply-hint">Replying to: <b>{threadSubject}</b></div>
      <textarea
        className="msg-reply-textarea"
        placeholder="Type your reply…"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
      />
      <div className="msg-reply-actions">
        <button type="button" className="msg-btn msg-btn-ghost" onClick={() => console.log("[reply] save draft")}>Save draft</button>
        <button type="button" className="msg-btn msg-btn-primary" onClick={send} disabled={body.trim().length === 0}>
          Send
        </button>
      </div>
    </footer>
  );
}
