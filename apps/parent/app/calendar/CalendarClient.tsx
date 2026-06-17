"use client";

import { useMemo, useState } from "react";
import { useActiveChild, ALL_CHILDREN_ID } from "@manhaj/lib/child";
import {
  type CalendarEvent, type EventType,
  eventsForChild, eventTypeCounts, upcomingEvents,
} from "@manhaj/lib/mock-calendar";

import EventTypeFilter from "./components/EventTypeFilter";
import MonthGrid       from "./components/MonthGrid";
import UpcomingList    from "./components/UpcomingList";
import SyncCard        from "./components/SyncCard";

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const { activeId } = useActiveChild();
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(new Set());

  const scoped = useMemo(() => eventsForChild(events, activeId), [events, activeId]);

  const filtered = useMemo(
    () => activeTypes.size === 0 ? scoped : scoped.filter(e => activeTypes.has(e.type)),
    [scoped, activeTypes],
  );

  const counts   = useMemo(() => eventTypeCounts(scoped), [scoped]);
  const upcoming = useMemo(() => upcomingEvents(filtered, 14), [filtered]);

  function toggleType(t: EventType) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  const multiChild = activeId === ALL_CHILDREN_ID;

  return (
    <div className="container">
      <h1>Calendar</h1>
      <p className="sub">{multiChild ? "Household view" : "Single-child view"} · AY 2025–26</p>

      <EventTypeFilter
        active={activeTypes}
        counts={counts}
        totalAll={scoped.length}
        onToggle={toggleType}
        onClearAll={() => setActiveTypes(new Set())}
      />

      <MonthGrid events={filtered} multiChild={multiChild} />
      <UpcomingList events={upcoming} multiChild={multiChild} />
      <SyncCard activeChildId={activeId} />
    </div>
  );
}
