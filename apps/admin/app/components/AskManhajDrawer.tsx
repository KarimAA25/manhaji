"use client";

/**
 * Floating "Ask Manhaji" drawer.
 *
 * Lives in the admin layout so the chat is one click away on every /admin/*
 * route. Closed by default; clicking the floating M button opens a 400px
 * side drawer (full-width on mobile) containing AskManhaj.
 *
 * Why a drawer (not a route): the principal often wants to ask Manhaji about
 * what they're looking at without losing the page context. The drawer keeps
 * the question in the same visual frame.
 *
 * Open/close state is component-local; if we later want it to persist across
 * navigations we'll lift it to a context.
 */

import { useEffect, useRef, useState } from "react";
import AskManhaj from "./AskManhaj";

export default function AskManhajDrawer() {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Esc closes; focus the close button when the drawer opens.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Ask Manhaji chat"
        aria-expanded={open}
        aria-controls="ask-manhaj-drawer"
        className="amd-launcher"
      >
        <span className="amd-launcher-logo" aria-hidden="true">M</span>
        <span className="amd-launcher-label">Ask Manhaji</span>
      </button>

      {/* Backdrop — only on mobile so desktop keeps page interactivity */}
      {open && (
        <div
          className="amd-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        id="ask-manhaj-drawer"
        className={`amd-drawer ${open ? "amd-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="amd-title"
        aria-hidden={!open}
      >
        <header className="amd-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="amd-launcher-logo" aria-hidden="true">M</span>
            <h2 id="amd-title" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
              Ask Manhaji
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="amd-close"
            onClick={() => setOpen(false)}
            aria-label="Close Ask Manhaji"
          >
            ×
          </button>
        </header>
        <div className="amd-body">
          {/* Only mount the chat once the drawer has been opened — keeps SSR fast
              and avoids streaming nothing on the dashboard. */}
          {open && <AskManhaj />}
        </div>
      </aside>
    </>
  );
}
