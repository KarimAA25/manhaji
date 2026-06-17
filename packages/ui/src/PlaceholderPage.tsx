/**
 * Phase 1 placeholder for tabs whose content lands in Phase 2+.
 *
 * Renders the tab title, a short "what will be here" description, and an
 * optional preview block. Visible in the persona's nav so the structural
 * shape of the IA is discoverable today.
 */

import type { ReactNode } from "react";

export default function PlaceholderPage({
  title, lead, bullets, preview,
}: {
  title: string;
  lead: string;
  bullets?: string[];
  preview?: ReactNode;
}) {
  return (
    <div className="container">
      <h1>{title}</h1>
      <p className="sub">{lead}</p>

      <div className="banner" role="status" style={{ background: "var(--color-info-soft)", borderColor: "#90CDF4", color: "var(--color-info-text)" }}>
        <b>In development.</b> This page lands in the next build phase. The structure below shows what you can expect.
      </div>

      {bullets && bullets.length > 0 && (
        <div className="card">
          <div className="card-label">What will be here</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 12.5, color: "var(--color-ink)" }}>
            {bullets.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
      )}

      {preview && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-label">Preview</div>
          {preview}
        </div>
      )}
    </div>
  );
}
