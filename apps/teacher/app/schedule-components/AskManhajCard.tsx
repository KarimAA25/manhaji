"use client";

import { useState } from "react";

const EXAMPLE_PROMPT = "Move Mr Salim's lab to mornings — current P6 collides with the football match.";

const MOCK_REPLY = `Plan: 3 swaps · 0 conflicts created · curriculum hours preserved.

1. 10A Tue P6 (Chemistry · Lab 1 · Ms Aida) → swap with 10A Tue P2 (Biology · Lab 2 · Ms Aida).
2. 7B Wed P6 (Arabic · R204 · Mr Salim) → move to Wed P3 (currently double-period English).
3. 9B Thu P6 (Arabic · R204 · Mr Salim) → move to Thu P2 (currently spare in homeroom).

Impact summary · 0 students lose any subject hours. Mr Salim's afternoon load drops from 4 → 1. Two football match conflicts cleared.`;

export default function AskManhajCard() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [reply, setReply] = useState<string | null>(null);

  function run() {
    // No real LLM — frozen reply.
    setReply(MOCK_REPLY);
  }

  return (
    <section className="sch-aq2-card" aria-label="Ask Manhaji">
      <header className="sch-aq2-head">
        <h3>Ask Manhaji</h3>
        <p className="sch-aq2-sub">Type a change in plain English · we draft the diff for your sign-off.</p>
      </header>
      <textarea
        className="sch-aq2-input"
        value={prompt}
        rows={2}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="sch-aq2-actions">
        <button type="button" className="sch-aq2-btn primary" onClick={run}>Generate diff</button>
        {reply && <button type="button" className="sch-aq2-btn ghost" onClick={() => setReply(null)}>Clear</button>}
      </div>
      {reply && (
        <pre className="sch-aq2-reply">{reply}</pre>
      )}
    </section>
  );
}
