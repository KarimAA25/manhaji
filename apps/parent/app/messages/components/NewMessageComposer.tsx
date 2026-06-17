"use client";

import { useEffect, useState } from "react";
import { ALL_CHILDREN_ID, DEMO_CHILDREN } from "@manhaj/lib/child";
import { MESSAGE_RECIPIENTS, type MessageRecipient } from "@manhaj/lib/mock-messages";

export type NewMessagePayload = {
  to:       string;
  child_id: string | "household";
  subject:  string;
  body:     string;
};

export default function NewMessageComposer({
  open, onClose, onSend, defaultChildId,
}: {
  open:           boolean;
  onClose:        () => void;
  onSend:         (payload: NewMessagePayload) => void;
  defaultChildId: string;
}) {
  const [to, setTo] = useState<string>(MESSAGE_RECIPIENTS[0].id);
  const [childId, setChildId] = useState<string>(defaultChildId === ALL_CHILDREN_ID ? "household" : defaultChildId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Reset composer fields when re-opened — intentional sync setState in effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setChildId(defaultChildId === ALL_CHILDREN_ID ? "household" : defaultChildId);
      setSubject("");
      setBody("");
    }
  }, [open, defaultChildId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!open) return null;

  function send() {
    if (!subject.trim() || !body.trim()) return;
    onSend({ to, child_id: childId, subject: subject.trim(), body: body.trim() });
    onClose();
  }

  return (
    <div className="msg-modal-bg" role="dialog" aria-modal="true" aria-labelledby="new-msg-title">
      <div className="msg-modal">
        <header className="msg-modal-head">
          <h3 id="new-msg-title">New message</h3>
          <button type="button" className="msg-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="msg-modal-body">
          <label className="msg-field">
            <span className="msg-field-label">To</span>
            <select value={to} onChange={e => setTo(e.target.value)}>
              {MESSAGE_RECIPIENTS.map((r: MessageRecipient) => (
                <option key={r.id} value={r.id}>{r.name} ({r.role_text})</option>
              ))}
            </select>
          </label>
          <label className="msg-field">
            <span className="msg-field-label">About</span>
            <select value={childId} onChange={e => setChildId(e.target.value)}>
              <option value="household">Household-wide</option>
              {DEMO_CHILDREN.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </label>
          <label className="msg-field">
            <span className="msg-field-label">Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject…" />
          </label>
          <label className="msg-field">
            <span className="msg-field-label">Message</span>
            <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" />
          </label>
        </div>
        <footer className="msg-modal-foot">
          <button type="button" className="msg-btn msg-btn-ghost" onClick={() => { console.log("[compose] draft", { to, childId, subject, body }); onClose(); }}>Save draft</button>
          <button type="button" className="msg-btn msg-btn-primary" onClick={send} disabled={!subject.trim() || !body.trim()}>Send</button>
        </footer>
      </div>
    </div>
  );
}
