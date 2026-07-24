/**
 * Manhaji Phase 2.8 demo fixture — synthetic homework list for Layla (10A).
 * Mirrors a future RPC return.
 */

export type HomeworkStatus = "overdue" | "due-today" | "not-started" | "in-progress" | "done";

export type HomeworkItem = {
  id:           string;
  subject:      string;
  title:        string;
  due:          string;       // ISO
  status:       HomeworkStatus;
  ai_estimate:  string;
  catch_up_pack?: boolean;
};

export type WeekCompletion = { week_label: string; on_time_pct: number };

export const DEMO_HW_TODAY = "2026-05-27";

export const MOCK_HOMEWORK: HomeworkItem[] = [
  { id: "hw-1", subject: "Maths",     title: "Algebra worksheet · Ch 7",
    due: "2026-05-26T16:00:00+04:00", status: "overdue",
    ai_estimate: "~35 min · same difficulty as last week's quiz.",
    catch_up_pack: true },
  { id: "hw-2", subject: "English",   title: "Essay draft: 'A character I admire'",
    due: "2026-05-27T20:00:00+04:00", status: "due-today",
    ai_estimate: "~45 min · 300-400 words · use the planning sheet first." },
  { id: "hw-3", subject: "Chemistry", title: "Lab write-up · titration",
    due: "2026-05-27T23:59:00+04:00", status: "in-progress",
    ai_estimate: "~25 min left · you've done the data table." },
  { id: "hw-4", subject: "Arabic",    title: "Vocabulary list · Unit 12",
    due: "2026-05-28T08:00:00+04:00", status: "due-today",
    ai_estimate: "~15 min · 20 words." },
  { id: "hw-5", subject: "Biology",   title: "Read pp 142-150 + answer Q1-Q4",
    due: "2026-05-29T08:00:00+04:00", status: "not-started",
    ai_estimate: "~30 min reading + ~15 min questions." },
  { id: "hw-6", subject: "History",   title: "Source-analysis Q3 from sheet",
    due: "2026-05-30T16:00:00+04:00", status: "not-started",
    ai_estimate: "~20 min · use the source pack on Manhaji." },
  { id: "hw-7", subject: "Physics",   title: "Problem set 11.2 (skip Q5)",
    due: "2026-06-02T16:00:00+04:00", status: "in-progress",
    ai_estimate: "~40 min remaining · stuck on Q3? Try the worked example." },

  // Done this week
  { id: "hw-8",  subject: "English",  title: "Reading log entry",
    due: "2026-05-25T20:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-9",  subject: "Maths",    title: "Quiz prep · linear equations",
    due: "2026-05-24T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-10", subject: "Geography",title: "Map labelling · Middle East",
    due: "2026-05-24T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-11", subject: "Arabic",   title: "Recitation practice",
    due: "2026-05-23T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-12", subject: "Chemistry",title: "Pre-lab questions",
    due: "2026-05-22T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-13", subject: "PE",       title: "Fitness log entry",
    due: "2026-05-22T16:00:00+04:00", status: "done", ai_estimate: "" },
  { id: "hw-14", subject: "ICT",      title: "Spreadsheet exercise",
    due: "2026-05-21T16:00:00+04:00", status: "done", ai_estimate: "" },
];

export const MOCK_COMPLETION: WeekCompletion[] = [
  { week_label: "Wk -3", on_time_pct: 71 },
  { week_label: "Wk -2", on_time_pct: 83 },
  { week_label: "Wk -1", on_time_pct: 91 },
  { week_label: "Wk 0",  on_time_pct: 88 },
];

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function homeworkKpis(items: HomeworkItem[]) {
  let overdue = 0, dueSoon = 0, inProgress = 0, doneThisWeek = 0;
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const cutoff  = todayMs + 24 * 60 * 60 * 1000;
  const weekAgo = todayMs - 7 * 24 * 60 * 60 * 1000;
  for (const h of items) {
    if (h.status === "overdue")    overdue++;
    if (h.status === "due-today" || (h.status !== "done" && Date.parse(h.due) <= cutoff && Date.parse(h.due) >= todayMs)) dueSoon++;
    if (h.status === "in-progress") inProgress++;
    if (h.status === "done" && Date.parse(h.due) >= weekAgo) doneThisWeek++;
  }
  return { overdue, due_soon: dueSoon, in_progress: inProgress, done_this_week: doneThisWeek };
}

export function mostUrgent(items: HomeworkItem[]): HomeworkItem | null {
  const overdue = items.filter(h => h.status === "overdue");
  if (overdue.length > 0) {
    return [...overdue].sort((a, b) => a.due.localeCompare(b.due))[0];
  }
  const dueToday = items.filter(h => h.status === "due-today");
  if (dueToday.length > 0) {
    return [...dueToday].sort((a, b) => a.due.localeCompare(b.due))[0];
  }
  return null;
}

export type HomeworkGroup = { key: HomeworkStatus | "later"; label: string; items: HomeworkItem[] };

export function groupByStatus(items: HomeworkItem[]): HomeworkGroup[] {
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const weekEnd = todayMs + 7 * 24 * 60 * 60 * 1000;
  const overdue:   HomeworkItem[] = [];
  const dueToday:  HomeworkItem[] = [];
  const dueWeek:   HomeworkItem[] = [];
  const later:     HomeworkItem[] = [];
  const done:      HomeworkItem[] = [];
  for (const h of items) {
    if (h.status === "overdue")          { overdue.push(h);  continue; }
    if (h.status === "done")             { done.push(h);     continue; }
    const dueMs = Date.parse(h.due);
    if (h.status === "due-today")        { dueToday.push(h); continue; }
    if (dueMs <= weekEnd)                { dueWeek.push(h);  continue; }
    later.push(h);
  }
  return ([
    { key: "overdue"      as const, label: "Overdue",          items: overdue  },
    { key: "due-today"    as const, label: "Due today",        items: dueToday },
    { key: "in-progress"  as const, label: "Due this week",    items: dueWeek  },
    { key: "later"        as const, label: "Later",            items: later    },
    { key: "done"         as const, label: "Done · this week", items: done     },
  ] as HomeworkGroup[]).filter(g => g.items.length > 0);
}

export function relativeDue(iso: string): string {
  const todayMs = Date.parse(DEMO_HW_TODAY + "T00:00:00+04:00");
  const dueMs   = Date.parse(iso);
  const diff    = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return `${-diff} day${-diff === 1 ? "" : "s"} late`;
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${diff} days`;
}
