"use client";

import { useState } from "react";
import type { DayCell, CalendarEvent } from "@manhaj/lib/mock-calendar";
import { eventsInMonth } from "@manhaj/lib/mock-calendar";
import { DEMO_CHILDREN } from "@manhaj/lib/child";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function avatarForChild(child_id: string): string {
  if (child_id === "household") return "⌂";
  const c = DEMO_CHILDREN.find(c => c.id === child_id);
  return c?.initial ?? "?";
}

export default function MonthGrid({
  events,
  initialYear = 2026,
  initialMonth = 4,    // May, 0-indexed
  multiChild,
}: {
  events:       CalendarEvent[];
  initialYear?: number;
  initialMonth?: number;
  multiChild:   boolean;
}) {
  const [year, setYear]   = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const cells: DayCell[] = eventsInMonth(events, year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else             setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else              setMonth(month + 1);
  }

  return (
    <section className="cal-month-card" aria-label="Month view">
      <header className="cal-month-head">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">›</button>
      </header>
      <div className="cal-month-grid">
        {DOW.map(d => <div key={d} className="cal-month-dow">{d}</div>)}
        {cells.map((c, i) => {
          const cls = [
            "cal-month-cell",
            c.in_month   ? "" : "cal-not-in-month",
            c.is_weekend ? "cal-is-weekend" : "",
            c.is_today   ? "cal-is-today"   : "",
            c.events.some(e => e.type === "holiday") ? "cal-has-holiday" : "",
          ].filter(Boolean).join(" ");
          return (
            <div key={i} className={cls}>
              <div className="cal-month-num">{c.date.slice(-2)}</div>
              {c.events.slice(0, 3).map(ev => (
                <div key={ev.id} className={`cal-month-ev cal-type-${ev.type}`} title={ev.title}>
                  {multiChild && <span className="cal-month-av">{avatarForChild(ev.child_id)}</span>}
                  <span className="cal-month-ev-text">{ev.title}</span>
                </div>
              ))}
              {c.events.length > 3 && (
                <div className="cal-month-more">+{c.events.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
