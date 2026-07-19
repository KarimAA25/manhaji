/**
 * Manhaji Phase 2.4a demo fixture — synthetic message threads for the
 * Parent Messages tab. Thread/Message shapes mirror the future Postgres
 * schema (messages_threads + thread_messages from the IA spec §12).
 */

export type MessageCategory = "academic" | "admin" | "finance" | "calendar";
export type MessageRole     = "school" | "parent";

export type Message = {
  id:         string;
  thread_id:  string;
  ts:         string;
  role:       MessageRole;
  from_name:  string;
  from_label: string;
  body:       string;
  opened_at?: string;
};

export type Thread = {
  id:               string;
  subject:          string;
  category:         MessageCategory;
  child_id:         string | "household";
  from_label:       string;
  last_activity_at: string;
  unread:           boolean;
  messages:         Message[];
};

export type MessageRecipient = {
  id:        string;
  name:      string;
  role_text: string;       // "Student Advisor", "Arabic teacher", etc.
};

export const MESSAGE_RECIPIENTS: MessageRecipient[] = [
  { id: "swart",   name: "Ms Sandra Swart", role_text: "Student Advisor (10A)" },
  { id: "khadija", name: "Ms Khadija",      role_text: "Arabic teacher" },
  { id: "saab",    name: "Mr Saab",         role_text: "Mathematics" },
  { id: "salim",   name: "Mr Salim",        role_text: "Chemistry" },
  { id: "finance", name: "Finance office",  role_text: "School administration" },
  { id: "principal", name: "Principal",     role_text: "Ms Sarah Al-Rashid" },
];

function m(
  id: string, thread_id: string, ts: string, role: MessageRole,
  from_name: string, from_label: string, body: string, opened_at?: string,
): Message {
  return opened_at
    ? { id, thread_id, ts, role, from_name, from_label, body, opened_at }
    : { id, thread_id, ts, role, from_name, from_label, body };
}

// =========================
// Layla threads (3)
// =========================
const T1: Thread = {
  id: "t1", subject: "Layla — three things from April", category: "academic",
  child_id: "layla-al-habsi",
  from_label: "Ms Sandra Swart · Student Advisor",
  last_activity_at: "2026-05-14T11:32:00Z", unread: true,
  messages: [
    m("t1-m1", "t1", "2026-05-14T09:14:00Z", "school",
      "Ms Sandra Swart", "Student Advisor · 10A",
      "Dear Mr Al-Habsi,\n\nJust sharing Layla's April highlights and one area to support.\n\nLayla had a standout month in Chemistry and Mathematics — top of class on the equilibrium unit test and consistently strong on calculus. Her oral-communication rubric climbed from 3.4 to 4.0, the third month running, supported by her Model UN preparation.\n\nThe one to support: written Arabic. Her score dipped below 3.0 for the second month. Ms Khadija prepared a 3-week scaffold pack and Layla has 2 of 12 sessions done so far. Quiet encouragement at home goes a long way here.\n\nHappy to schedule a chat any time.\n\nBest,\nSandra"),
    m("t1-m2", "t1", "2026-05-14T11:32:00Z", "parent",
      "Mr Al-Habsi", "Parent",
      "Dear Ms Swart,\n\nThank you for the lovely note. Layla shared the scaffold pack with me — could we schedule a short chat next week to talk through her written-Arabic plan? Mornings work best.\n\nBest,\nMahmoud Al-Habsi",
      "2026-05-14T12:08:00Z"),
    m("t1-m3", "t1", "2026-05-14T12:08:00Z", "school",
      "Ms Sandra Swart", "Student Advisor · 10A · via Outlook",
      "Of course — how about Wed 22 May at 09:30? A 15-min slot in my free period. I'll send a calendar invite if that works."),
  ],
};
const T2: Thread = {
  id: "t2", subject: "Written-Arabic scaffold pack for Layla", category: "academic",
  child_id: "layla-al-habsi",
  from_label: "Ms Khadija · Arabic teacher",
  last_activity_at: "2026-05-08T11:30:00Z", unread: false,
  messages: [
    m("t2-m1", "t2", "2026-05-08T11:30:00Z", "school",
      "Ms Khadija", "Arabic teacher",
      "The pack is in Layla's locker. She'll start with prompt 1 this Friday. 15 minutes per session is plenty — no need to push longer. Friday check-ins through May.\n\nIf you want to see what she's writing, ask her to share the first scaffold this Sunday.\n\n— Khadija"),
  ],
};
const T3: Thread = {
  id: "t3", subject: "Chemistry mid-term · 12 May", category: "calendar",
  child_id: "layla-al-habsi",
  from_label: "Manhaji · School calendar",
  last_activity_at: "2026-05-05T09:00:00Z", unread: false,
  messages: [
    m("t3-m1", "t3", "2026-05-05T09:00:00Z", "school",
      "School calendar", "Auto-update",
      "Layla's Chemistry mid-term sits on 12 May at P3 (Lab 1). Format: 50-question paper, 90 minutes.\n\nThe revision pack is available from Mr Salim — Layla picked one up last week.\n\nDon't forget to confirm any accommodations (extra time, reader) by Friday 8 May.",
      "2026-05-05T18:20:00Z"),
  ],
};

// =========================
// Omar threads (3)
// =========================
const T4: Thread = {
  id: "t4", subject: "Re: Omar's attendance — could we chat?", category: "academic",
  child_id: "omar-al-habsi",
  from_label: "Ms Sandra Swart · Student Advisor",
  last_activity_at: "2026-05-14T09:14:00Z", unread: true,
  messages: [
    m("t4-m1", "t4", "2026-05-14T09:14:00Z", "school",
      "Ms Sandra Swart", "Student Advisor",
      "Hi Mr Al-Habsi,\n\nOmar has missed 3 days this month without a note. Mr Saab raised a separate flag about disengagement in class on Tuesday.\n\nCould we arrange a short call this week so we're on the same page about how to support him? Manhaji's tracker pattern shows the absences cluster around Mondays + post-exam days — happy to talk through what we're seeing.\n\nBest,\nSandra"),
  ],
};
const T5: Thread = {
  id: "t5", subject: "Football club · Term 3 sign-up", category: "admin",
  child_id: "omar-al-habsi",
  from_label: "Mr Yousef · PE",
  last_activity_at: "2026-04-28T13:00:00Z", unread: false,
  messages: [
    m("t5-m1", "t5", "2026-04-28T13:00:00Z", "school",
      "Mr Yousef", "PE / Football coach",
      "Term 3 football is open for sign-up. Practice runs Tue + Thu 16:00-17:30. Match-day Saturdays optional. Form due Friday 9 May.",
      "2026-04-30T08:11:00Z"),
    m("t5-m2", "t5", "2026-04-30T08:30:00Z", "parent",
      "Mr Al-Habsi", "Parent",
      "Omar signed up. Match-day Saturdays count us in too. Thanks!",
      "2026-04-30T09:15:00Z"),
  ],
};
const T6: Thread = {
  id: "t6", subject: "Maths quiz · 14 May", category: "calendar",
  child_id: "omar-al-habsi",
  from_label: "Manhaji · School calendar",
  last_activity_at: "2026-05-09T09:00:00Z", unread: false,
  messages: [
    m("t6-m1", "t6", "2026-05-09T09:00:00Z", "school",
      "School calendar", "Auto-update",
      "Omar's Maths quiz lands on 14 May at P3. Topics: percentages, ratios, simple linear equations. 45-minute paper.",
      "2026-05-09T19:42:00Z"),
  ],
};

// =========================
// Yasmin threads (2)
// =========================
const T7: Thread = {
  id: "t7", subject: "Yasmin's spring concert · photos attached", category: "admin",
  child_id: "yasmin-al-habsi",
  from_label: "Ms Aida · KG2 class teacher",
  last_activity_at: "2026-05-05T14:00:00Z", unread: false,
  messages: [
    m("t7-m1", "t7", "2026-05-05T14:00:00Z", "school",
      "Ms Aida", "KG2 class teacher",
      "Yasmin had a wonderful time on stage today — sharing a few photos from the morning. She was particularly proud of remembering the second verse.\n\nThank you for the costume help.",
      "2026-05-05T18:25:00Z"),
  ],
};
const T8: Thread = {
  id: "t8", subject: "KG2 · Summer day-camp sign-up", category: "calendar",
  child_id: "yasmin-al-habsi",
  from_label: "KG admin",
  last_activity_at: "2026-04-22T10:00:00Z", unread: false,
  messages: [
    m("t8-m1", "t8", "2026-04-22T10:00:00Z", "school",
      "KG admin", "School administration",
      "Summer day-camp opens 15 July. Three weeks, OMR 40 optional add-on (included as a line item in the Term 3 invoice if you'd like to enrol Yasmin).\n\nReply by 15 June to confirm.",
      "2026-04-23T07:50:00Z"),
  ],
};

// =========================
// Household-wide threads (4)
// =========================
const T9: Thread = {
  id: "t9", subject: "Term 2 invoices · OMR 1,820 outstanding household total", category: "finance",
  child_id: "household",
  from_label: "Finance office",
  last_activity_at: "2026-05-12T16:00:00Z", unread: true,
  messages: [
    m("t9-m1", "t9", "2026-05-12T16:00:00Z", "school",
      "Finance office", "School administration",
      "Reminder that the remainder of your Term 2 invoices is due 25 May.\n\nLayla: OMR 750 outstanding.\nOmar: OMR 1,070 outstanding.\nYasmin: paid in full.\n\nHousehold total: OMR 1,820.\n\nPay via the Manhaji Invoices tab, bank transfer, or in person at the front desk. Receipts auto-emailed once processed."),
  ],
};
const T10: Thread = {
  id: "t10", subject: "Parent-teacher evening · 18 May", category: "calendar",
  child_id: "household",
  from_label: "School calendar",
  last_activity_at: "2026-05-05T09:00:00Z", unread: false,
  messages: [
    m("t10-m1", "t10", "2026-05-05T09:00:00Z", "school",
      "School calendar", "Auto-update",
      "Parent-teacher evening on Wednesday 18 May from 16:00. You can book slots from your dashboard.\n\nMs Swart (Layla's advisor) has 3 slots remaining.\nMr Yousef (Omar's PE coach) has 5 slots remaining.\nMs Aida (Yasmin's class teacher) has 6 slots remaining.",
      "2026-05-06T07:20:00Z"),
  ],
};
const T11: Thread = {
  id: "t11", subject: "Eid Al-Adha · school closure 24-26 June", category: "admin",
  child_id: "household",
  from_label: "Principal's office",
  last_activity_at: "2026-04-30T08:00:00Z", unread: false,
  messages: [
    m("t11-m1", "t11", "2026-04-30T08:00:00Z", "school",
      "Principal's office", "Ms Sarah Al-Rashid",
      "School closes for the Eid Al-Adha holiday from 24 June (Thursday) through 26 June (Saturday). Classes resume Sunday 27 June.\n\nEnd-of-year ceremony 30 June, 18:00, school auditorium. All families welcome.",
      "2026-05-01T09:15:00Z"),
  ],
};
const T12: Thread = {
  id: "t12", subject: "May monthly reports · sent to all parents", category: "academic",
  child_id: "household",
  from_label: "Manhaji",
  last_activity_at: "2026-05-03T16:00:00Z", unread: false,
  messages: [
    m("t12-m1", "t12", "2026-05-03T16:00:00Z", "school",
      "Manhaji", "School administration",
      "April's monthly reports are now in your Dashboard for each of your children.\n\nLayla: strong month overall · one area to support (written Arabic).\nOmar: improving in Mathematics · attendance flag.\nYasmin: happy + settled · spring concert highlight.\n\nThree things to celebrate · one to support · two ideas for May. Open the Dashboard to read each in full.",
      "2026-05-03T19:18:00Z"),
  ],
};

export const MOCK_THREADS: Thread[] = [
  T1, T4, T9, T2, T3, T5, T6, T7, T8, T10, T11, T12,
];

// ----- helpers -----
export function threadsForChild(threads: Thread[], childId: string): Thread[] {
  if (childId === "all") return threads;
  return threads.filter(t => t.child_id === childId || t.child_id === "household");
}

export function categoryCounts(
  threads: Thread[],
): Record<MessageCategory | "all" | "unread", number> {
  const result = { all: 0, unread: 0, academic: 0, admin: 0, finance: 0, calendar: 0 } as
    Record<MessageCategory | "all" | "unread", number>;
  for (const t of threads) {
    result.all++;
    result[t.category]++;
    if (t.unread) result.unread++;
  }
  return result;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now  = new Date("2026-05-22T12:00:00Z").getTime();  // fixed "now" for deterministic display
  const diffH = Math.round((now - then) / (1000 * 60 * 60));
  if (diffH < 1)  return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "yesterday";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
