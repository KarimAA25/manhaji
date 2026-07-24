"use client";

import { useState } from "react";

const EXAMPLE_PROMPT = "Which department has the most slack this term?";

const MOCK_REPLY = `Analysis: load redistribution opportunity identified.

Department with most slack: Humanities — 5 teachers with available capacity (avg 19 periods/wk vs 25-period cap).

Top 3 redistribution options:
1. Move 2 periods from Ms Leila Ahmadi (15 p/wk) → cover unfilled Arabic slots in Primary.
2. Mr Daniel Okafor has 7 free periods this week — assign supplementary History support for G9.
3. Ms Swart can absorb 1 additional section in HS; net load remains under 25 periods/wk.

Impact: 0 section disruptions · 3 periods redistributed · Humanities dept avg moves to 21 p/wk.`;

export default function FacultyAskManhaj() {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [reply, setReply]   = useState<string | null>(null);

  function run() {
    setReply(MOCK_REPLY);
  }

  return (
    <section className="fac-aq-card" aria-label="Ask Manhaji — Faculty">
      <header className="fac-aq-head">
        <h3>Ask Manhaji</h3>
        <p className="fac-aq-sub">Ask about load, contracts, performance — or request a rebalance plan.</p>
      </header>
      <textarea
        className="fac-aq-input"
        value={prompt}
        rows={2}
        onChange={e => setPrompt(e.target.value)}
      />
      <div className="fac-aq-actions">
        <button type="button" className="fac-aq-btn primary" onClick={run}>Generate insight</button>
        {reply && (
          <button type="button" className="fac-aq-btn ghost" onClick={() => setReply(null)}>
            Clear
          </button>
        )}
      </div>
      {reply && <pre className="fac-aq-reply">{reply}</pre>}
    </section>
  );
}
