"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ChildCurrentSlot = {
  period:  string;
  subject: string;
  teacher: string | null;
  room:    string | null;
  start:   string;
  end:     string;
};

export type ChildNextExam = {
  label:      string;
  held_on:    string;
  subject:    string;
  days_until: number;
};

export type ChildCourseSelection = {
  status:       string;
  picks_count:  number;
  submitted_at: string | null;
};

export type ChildStat = {
  student_id:       string;
  att_pct:          number;
  att_absences:     number;
  rubric_avg:       number;
  today_slot:       ChildCurrentSlot | null;
  next_exam:        ChildNextExam    | null;
  course_selection: ChildCourseSelection | null;
};

export type ParentDashData = {
  outstanding_total:  number;
  next_due_date:      string | null;
  next_due_label:     string | null;
  report_count:       number;
  unread_count:       number;
  latest_thread_from: string | null;
  open_thread_count:  number;
  by_child:           Record<string, ChildStat>;
};

const ParentDashContext = createContext<ParentDashData | null>(null);

export function useParentDash(): ParentDashData | null {
  return useContext(ParentDashContext);
}

export function ParentDashboardClient({
  data,
  children,
}: {
  data:     ParentDashData;
  children: ReactNode;
}) {
  return (
    <ParentDashContext.Provider value={data}>
      {children}
    </ParentDashContext.Provider>
  );
}
