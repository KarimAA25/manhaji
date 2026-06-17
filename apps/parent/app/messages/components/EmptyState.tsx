"use client";

import type { ReactNode } from "react";

export default function EmptyState({
  onCompose,
}: {
  onCompose: () => void;
}) {
  // onCompose is called from a client component; receiving the prop here is fine.
  return (
    <div className="msg-empty">
      <div className="msg-empty-ic">✉</div>
      <h3>No conversation open</h3>
      <p>Pick a thread on the left, or start a new conversation with the school.</p>
      <ComposeButton onClick={onCompose}>+ New message</ComposeButton>
    </div>
  );
}

function ComposeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  // Trivial wrapper to keep the empty state server-safe (the click handler
  // is passed through but never invoked here — the empty state is hydrated
  // inside the parent client component).
  return <button type="button" className="msg-empty-btn" onClick={onClick}>{children}</button>;
}
