"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ChildStat = {
  student_id: string;
  att_pct: number;
  att_absences: number;
  rubric_avg: number;
};

export type ParentDashData = {
  outstanding_total: number;
  next_due_date: string | null;
  next_due_label: string | null;
  report_count: number;
  by_child: Record<string, ChildStat>;   // keyed by student_id
};

const ParentDashContext = createContext<ParentDashData | null>(null);

export function useParentDash(): ParentDashData | null {
  return useContext(ParentDashContext);
}

export function ParentDashboardClient({
  data,
  children,
}: {
  data: ParentDashData;
  children: ReactNode;
}) {
  return (
    <ParentDashContext.Provider value={data}>
      {children}
    </ParentDashContext.Provider>
  );
}
