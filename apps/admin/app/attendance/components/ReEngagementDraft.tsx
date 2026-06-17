"use client";

import type { ReEngagementDraft } from "@manhaj/lib/mock-attendance";

export default function ReEngagementDraftComponent({ draft }: { draft: ReEngagementDraft }) {
  return (
    <section className="draft-card att-block-advisor-only" aria-label="Re-engagement message · AI draft">
      <header className="draft-head">
        <h3>Re-engagement message · AI draft</h3>
        <p className="draft-sub">Manhaj drafts using the 17-template catalog. Teacher / advisor reviews before send.</p>
      </header>
      <div className="draft-box">
        <div className="draft-meta">To: {draft.to} · Template: <code>{draft.template_id}</code></div>
        <div className="draft-subject">{draft.subject}</div>
        <div className="draft-body">
          {draft.body.split("\n").map((line, i) => <p key={i} className="draft-line">{line || " "}</p>)}
        </div>
        <div className="draft-actions">
          <button type="button" className="draft-btn draft-ghost" onClick={() => console.log("[draft] edit")}>Edit</button>
          <button type="button" className="draft-btn draft-ghost" onClick={() => console.log("[draft] regenerate")}>Regenerate</button>
          <button type="button" className="draft-btn draft-primary" onClick={() => console.log("[draft] send", draft)}>Send via email</button>
        </div>
      </div>
    </section>
  );
}
