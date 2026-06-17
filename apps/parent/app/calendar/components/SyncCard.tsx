"use client";

import { useState } from "react";

const PATH = "/api/calendar/feed.ics";

export default function SyncCard({ activeChildId }: { activeChildId: string }) {
  const [host] = useState(() =>
    typeof window !== "undefined" ? window.location.host : ""
  );

  const childQuery = activeChildId === "all" ? "" : `?child=${encodeURIComponent(activeChildId)}`;
  const httpsUrl   = host ? `https://${host}${PATH}${childQuery}` : `${PATH}${childQuery}`;
  const webcalUrl  = host ? `webcal://${host}${PATH}${childQuery}` : "";

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(httpsUrl);
    }
    console.log("[calendar] copy ICS URL", httpsUrl);
  }

  function googleHref() {
    if (!host) return "#";
    return `https://www.google.com/calendar/render?cid=${encodeURIComponent(httpsUrl)}`;
  }

  return (
    <section className="cal-sync-card" aria-label="Sync calendar">
      <header className="cal-sync-head">
        <h3>Sync to your phone</h3>
        <p className="cal-sync-sub">Add school events to Apple / Google Calendar · one tap.</p>
      </header>
      <div className="cal-sync-body">
        <div className="cal-sync-left">
          <h4>One ICS feed that stays in sync</h4>
          <p>Adds today + every future school event for the active child (or the whole household). Updates when the school changes a date.</p>
        </div>
        <div className="cal-sync-actions">
          <a className="cal-sync-btn primary" href={webcalUrl}>Add to Apple Calendar</a>
          <a className="cal-sync-btn primary" href={googleHref()} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          <button type="button" className="cal-sync-btn ghost" onClick={copy}>Copy ICS link</button>
        </div>
      </div>
    </section>
  );
}
