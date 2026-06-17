# Parent · Messages 2.4a · Implementation Plan (UI + mocks)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the master-detail Messages page against `lib/mock-messages.ts`. 5 UI blocks + compose-new. No backend wiring (that's 2.4b).

**Spec reference:** [`docs/superpowers/specs/2026-05-27-parent-messages-2-4a.md`](../specs/2026-05-27-parent-messages-2-4a.md)

---

## File map

**Create:**
- `apps/web/lib/mock-messages.ts` + `apps/web/lib/messages.test.ts`
- `apps/web/app/parent/messages/components/{InboxList,CategoryFilter,ChildFilter,ThreadView,MessageBubble,ReplyComposer,NewMessageComposer,EmptyState}.tsx`

**Modify:**
- `apps/web/app/parent/messages/page.tsx` — full rewrite
- `apps/web/app/globals.css` — append CSS

---

## Task 1 — Mock messages fixture + tests

**Files:**
- Create: `apps/web/lib/mock-messages.ts`
- Create: `apps/web/lib/messages.test.ts`

- [ ] **Step 1: Write `mock-messages.ts`**

```ts
/**
 * Manhaj Phase 2.4a demo fixture — synthetic message threads for the
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
  from_label: "Manhaj · School calendar",
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
      "Hi Mr Al-Habsi,\n\nOmar has missed 3 days this month without a note. Mr Saab raised a separate flag about disengagement in class on Tuesday.\n\nCould we arrange a short call this week so we're on the same page about how to support him? Manhaj's tracker pattern shows the absences cluster around Mondays + post-exam days — happy to talk through what we're seeing.\n\nBest,\nSandra"),
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
  from_label: "Manhaj · School calendar",
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
      "Reminder that the remainder of your Term 2 invoices is due 25 May.\n\nLayla: OMR 750 outstanding.\nOmar: OMR 1,070 outstanding.\nYasmin: paid in full.\n\nHousehold total: OMR 1,820.\n\nPay via the Manhaj Invoices tab, bank transfer, or in person at the front desk. Receipts auto-emailed once processed."),
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
  from_label: "Manhaj",
  last_activity_at: "2026-05-03T16:00:00Z", unread: false,
  messages: [
    m("t12-m1", "t12", "2026-05-03T16:00:00Z", "school",
      "Manhaj", "School administration",
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
```

- [ ] **Step 2: Write `messages.test.ts`** with 9 tests:

```ts
import { describe, expect, it } from "vitest";
import {
  MOCK_THREADS, MESSAGE_RECIPIENTS, threadsForChild, categoryCounts, formatRelative,
} from "./mock-messages";

describe("mock-messages fixture", () => {
  it("has 12 threads", () => {
    expect(MOCK_THREADS.length).toBe(12);
  });
  it("every thread has at least 1 message and messages share the thread_id", () => {
    for (const t of MOCK_THREADS) {
      expect(t.messages.length).toBeGreaterThan(0);
      for (const m of t.messages) expect(m.thread_id).toBe(t.id);
    }
  });
  it("has 6 message recipients", () => {
    expect(MESSAGE_RECIPIENTS.length).toBeGreaterThanOrEqual(6);
  });
  it("has at least 3 unread threads", () => {
    const unread = MOCK_THREADS.filter(t => t.unread).length;
    expect(unread).toBeGreaterThanOrEqual(3);
  });
  it("has household-tagged threads", () => {
    expect(MOCK_THREADS.some(t => t.child_id === "household")).toBe(true);
  });
});

describe("threadsForChild", () => {
  it("returns all threads when childId='all'", () => {
    expect(threadsForChild(MOCK_THREADS, "all").length).toBe(MOCK_THREADS.length);
  });
  it("returns single-child + household threads when a child is active", () => {
    const omar = threadsForChild(MOCK_THREADS, "omar-al-habsi");
    expect(omar.every(t => t.child_id === "omar-al-habsi" || t.child_id === "household")).toBe(true);
    expect(omar.length).toBeGreaterThan(3);
  });
});

describe("categoryCounts", () => {
  it("counts all + per-category + unread", () => {
    const c = categoryCounts(MOCK_THREADS);
    expect(c.all).toBe(MOCK_THREADS.length);
    expect(c.academic + c.admin + c.finance + c.calendar).toBe(c.all);
  });
});

describe("formatRelative", () => {
  it("returns day-month for older dates", () => {
    const s = formatRelative("2026-04-22T10:00:00Z");
    expect(s.toLowerCase()).toMatch(/apr/);
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-messages.ts apps/web/lib/messages.test.ts && git commit -m "lib/mock-messages: 12-thread fixture + helpers"
```

Expect: 70 tests pass (61 + 9 new).

---

## Task 2 — InboxList + CategoryFilter + ChildFilter

**Files:**
- Create: `apps/web/app/parent/messages/components/InboxList.tsx`
- Create: `apps/web/app/parent/messages/components/CategoryFilter.tsx`
- Create: `apps/web/app/parent/messages/components/ChildFilter.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `CategoryFilter.tsx`** (client — onClick handlers)

```tsx
"use client";

import type { MessageCategory } from "@/lib/mock-messages";

type Counts = Record<MessageCategory | "all" | "unread", number>;
type CatOrAll = MessageCategory | "all";

const CATS: Array<{ key: CatOrAll; label: string }> = [
  { key: "all",      label: "All" },
  { key: "academic", label: "Academic" },
  { key: "admin",    label: "Admin" },
  { key: "finance",  label: "Finance" },
  { key: "calendar", label: "Calendar" },
];

export default function CategoryFilter({
  active, onChange, counts, unreadOnly, onToggleUnread,
}: {
  active:         CatOrAll;
  onChange:       (c: CatOrAll) => void;
  counts:         Counts;
  unreadOnly:     boolean;
  onToggleUnread: () => void;
}) {
  return (
    <div role="toolbar" aria-label="Filter threads" className="msg-cat-row">
      {CATS.map(c => (
        <button
          key={c.key} type="button"
          className={`msg-cat-pill ${active === c.key ? "active" : ""}`}
          onClick={() => onChange(c.key)}
          aria-pressed={active === c.key}
        >
          {c.label}<span className="msg-cat-count">{counts[c.key]}</span>
        </button>
      ))}
      <button
        type="button"
        className={`msg-cat-pill msg-cat-pill-unread ${unreadOnly ? "active" : ""}`}
        onClick={onToggleUnread}
        aria-pressed={unreadOnly}
        style={{ marginLeft: "auto" }}
      >
        Unread<span className="msg-cat-count">{counts.unread}</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `ChildFilter.tsx`** (client — calls setActive from useActiveChild)

```tsx
"use client";

import { ALL_CHILDREN_ID, DEMO_CHILDREN, useActiveChild } from "@/lib/child";
import type { Thread } from "@/lib/mock-messages";

export default function ChildFilter({ threads }: { threads: Thread[] }) {
  const { activeId, setActive } = useActiveChild();

  const counts = new Map<string, number>();
  for (const c of DEMO_CHILDREN) counts.set(c.id, 0);
  for (const t of threads) {
    if (t.child_id !== "household") {
      counts.set(t.child_id, (counts.get(t.child_id) ?? 0) + 1);
    }
  }
  const allCount = threads.length;

  return (
    <div role="toolbar" aria-label="Filter by child" className="msg-child-row">
      <button
        type="button"
        className={`msg-child-pill ${activeId === ALL_CHILDREN_ID ? "active" : ""}`}
        onClick={() => setActive(ALL_CHILDREN_ID)}
        aria-pressed={activeId === ALL_CHILDREN_ID}
      >
        All<span className="msg-cat-count">{allCount}</span>
      </button>
      {DEMO_CHILDREN.map(c => (
        <button
          key={c.id} type="button"
          className={`msg-child-pill ${activeId === c.id ? "active" : ""}`}
          onClick={() => setActive(c.id)}
          aria-pressed={activeId === c.id}
        >
          <span className="msg-child-av" aria-hidden="true">{c.initial}</span>
          {c.full_name.split(" ")[0]}<span className="msg-cat-count">{counts.get(c.id) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `InboxList.tsx`** (client — onClick)

```tsx
"use client";

import type { Thread } from "@/lib/mock-messages";
import { formatRelative } from "@/lib/mock-messages";
import { DEMO_CHILDREN } from "@/lib/child";

export default function InboxList({
  threads, activeThreadId, onSelect, multiChild,
}: {
  threads:        Thread[];
  activeThreadId: string | null;
  onSelect:       (threadId: string) => void;
  multiChild:     boolean;
}) {
  if (threads.length === 0) {
    return <div className="msg-inbox-empty">No messages match the current filter.</div>;
  }
  return (
    <ul className="msg-inbox-list" role="list">
      {threads.map(t => {
        const isActive = t.id === activeThreadId;
        const child = t.child_id === "household"
          ? { initial: "⌂", label: "Household" }
          : DEMO_CHILDREN.find(c => c.id === t.child_id);
        const childLabel = t.child_id === "household" ? "Household" : (child as any)?.full_name?.split(" ")[0] ?? "?";
        const childInitial = t.child_id === "household" ? "⌂" : (child as any)?.initial ?? "?";
        return (
          <li key={t.id}>
            <button
              type="button"
              className={`msg-inbox-row ${isActive ? "is-active" : ""} ${t.unread ? "is-unread" : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(t.id)}
            >
              <span className="msg-inbox-dot" aria-hidden="true" />
              {multiChild && (
                <span className={`msg-inbox-childtag ${t.child_id === "household" ? "is-hh" : ""}`}>
                  <span className="msg-inbox-childtag-av" aria-hidden="true">{childInitial}</span>
                  {childLabel}
                </span>
              )}
              <span className="msg-inbox-body">
                <span className="msg-inbox-from">{t.from_label}</span>
                <span className="msg-inbox-subject">{t.subject}</span>
                <span className="msg-inbox-preview">
                  {t.messages[t.messages.length - 1]?.body.slice(0, 80) ?? ""}…
                </span>
              </span>
              <span className="msg-inbox-when">{formatRelative(t.last_activity_at)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: CSS** — append to `globals.css` before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Parent Messages · CategoryFilter + ChildFilter
   ========================================================================= */
.msg-cat-row {
  background: var(--color-card); border-bottom: 1px solid var(--color-border);
  padding: 8px 14px; display: flex; gap: 4px; flex-wrap: wrap; align-items: center;
}
.msg-cat-pill {
  font-size: 10px; padding: 3px 10px; border-radius: var(--radius-2xl);
  font-weight: var(--font-weight-semibold); cursor: pointer;
  background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border);
  font-family: inherit; display: inline-flex; align-items: center; gap: 4px;
}
.msg-cat-pill.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.msg-cat-pill-unread.active { background: var(--color-danger); border-color: var(--color-danger); }
.msg-cat-count { background: rgba(255,255,255,0.16); padding: 1px 5px; border-radius: 6px; font-size: 9px; }
.msg-cat-pill:not(.active) .msg-cat-count { background: var(--color-soft); color: var(--color-muted); }

.msg-child-row {
  background: var(--color-card); border-bottom: 1px solid var(--color-border);
  padding: 8px 14px; display: flex; gap: 4px; flex-wrap: wrap; align-items: center;
}
.msg-child-pill {
  font-size: 10.5px; padding: 4px 10px; border-radius: var(--radius-2xl);
  font-weight: var(--font-weight-semibold); cursor: pointer;
  background: var(--color-surface-subtle); color: var(--color-muted); border: 1px solid var(--color-border);
  font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
}
.msg-child-pill.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.msg-child-av {
  width: 18px; height: 18px; border-radius: 50%; background: #C7D2DC; color: var(--color-ink);
  display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 9px;
}
.msg-child-pill.active .msg-child-av { background: rgba(255,255,255,.18); color: #fff; }

/* =========================================================================
   Parent Messages · Inbox list
   ========================================================================= */
.msg-inbox-list { list-style: none; padding: 0; margin: 0; }
.msg-inbox-empty { padding: 24px; text-align: center; color: var(--color-muted); font-size: 12px; }
.msg-inbox-row {
  display: grid; grid-template-columns: 6px auto 1fr 70px;
  gap: 10px; align-items: start; padding: 10px 14px;
  border-bottom: 1px dashed var(--color-border); cursor: pointer; font-size: 11px;
  background: var(--color-card); border-left: 0; border-right: 0; border-top: 0;
  font-family: inherit; text-align: left; width: 100%;
}
.msg-inbox-row:hover { background: var(--color-surface-subtle); }
.msg-inbox-row.is-active { background: var(--color-info-soft); }
.msg-inbox-row.is-unread .msg-inbox-from { color: var(--color-primary); font-weight: var(--font-weight-bold); }
.msg-inbox-row.is-unread .msg-inbox-subject { font-weight: var(--font-weight-bold); }
.msg-inbox-dot {
  width: 6px; height: 6px; border-radius: 50%; background: transparent; margin-top: 6px;
}
.msg-inbox-row.is-unread .msg-inbox-dot { background: var(--color-primary); }
.msg-inbox-childtag {
  background: var(--color-soft); color: var(--color-ink);
  padding: 2px 8px; border-radius: var(--radius-2xl); font-size: 9.5px;
  font-weight: var(--font-weight-bold); display: inline-flex; align-items: center; gap: 4px; height: 18px;
}
.msg-inbox-childtag.is-hh { background: var(--color-info-soft); color: var(--color-info-text); }
.msg-inbox-childtag-av {
  width: 12px; height: 12px; border-radius: 50%; background: rgba(0,0,0,0.10);
  display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800;
}
.msg-inbox-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.msg-inbox-from { font-size: 10px; color: var(--color-muted); font-weight: var(--font-weight-semibold); }
.msg-inbox-subject { color: var(--color-ink); font-weight: var(--font-weight-semibold); font-size: 12px; }
.msg-inbox-preview { color: var(--color-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-inbox-when { font-size: 9.5px; color: var(--color-muted); text-align: right; }
```

- [ ] **Step 5: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/messages/components apps/web/app/globals.css && git commit -m "Messages: InboxList + CategoryFilter + ChildFilter"
```

---

## Task 3 — ThreadView + MessageBubble + EmptyState

**Files:**
- Create: `apps/web/app/parent/messages/components/ThreadView.tsx`
- Create: `apps/web/app/parent/messages/components/MessageBubble.tsx`
- Create: `apps/web/app/parent/messages/components/EmptyState.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `MessageBubble.tsx`** (server)

```tsx
import type { Message } from "@/lib/mock-messages";
import { formatRelative } from "@/lib/mock-messages";

export default function MessageBubble({
  message, isOutgoing,
}: {
  message:    Message;
  isOutgoing: boolean;
}) {
  const lines = message.body.split("\n");
  return (
    <article className={`msg-bubble ${isOutgoing ? "is-outgoing" : "is-incoming"}`}>
      <header className="msg-bubble-head">
        <span className="msg-bubble-from">{message.from_name}</span>
        <span className="msg-bubble-sub">{message.from_label} · {formatRelative(message.ts)}</span>
      </header>
      <div className="msg-bubble-body">
        {lines.map((line, i) => <p key={i}>{line || " "}</p>)}
      </div>
      {isOutgoing && message.opened_at && (
        <div className="msg-bubble-receipt">▸ opened {formatRelative(message.opened_at)}</div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: `EmptyState.tsx`** (server)

```tsx
import type { ReactNode } from "react";

export default function EmptyState({
  onCompose,
}: {
  onCompose: () => void;
}) {
  // onCompose is called from a client component; receiving the prop here is fine.
  return (
    <div className="msg-empty">
      <div className="msg-empty-ic">✉</div>
      <h3>No conversation open</h3>
      <p>Pick a thread on the left, or start a new conversation with the school.</p>
      <ComposeButton onClick={onCompose}>+ New message</ComposeButton>
    </div>
  );
}

function ComposeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  // Trivial wrapper to keep the empty state server-safe (the click handler
  // is passed through but never invoked here — the empty state is hydrated
  // inside the parent client component).
  return <button type="button" className="msg-empty-btn" onClick={onClick}>{children}</button>;
}
```

EmptyState becomes effectively client-only via the onClick handler. Add `"use client";` at the top of `EmptyState.tsx`.

- [ ] **Step 3: `ThreadView.tsx`** (client — uses ReplyComposer; receives onReplySend prop)

```tsx
"use client";

import type { Thread } from "@/lib/mock-messages";
import MessageBubble from "./MessageBubble";
import ReplyComposer from "./ReplyComposer";

const CATEGORY_LABEL: Record<Thread["category"], string> = {
  academic: "Academic",
  admin:    "Admin",
  finance:  "Finance",
  calendar: "Calendar",
};

export default function ThreadView({
  thread, onBack, onReplySend,
}: {
  thread:      Thread;
  onBack?:     () => void;
  onReplySend: (body: string) => void;
}) {
  return (
    <section className="msg-thread" aria-label={`Thread: ${thread.subject}`}>
      <header className="msg-thread-head">
        {onBack && (
          <button type="button" className="msg-thread-back" onClick={onBack} aria-label="Back to inbox">←</button>
        )}
        <div>
          <div className="msg-thread-tags">
            <span className="msg-thread-tag">{CATEGORY_LABEL[thread.category]}</span>
            <span className="msg-thread-sub">{thread.from_label}</span>
          </div>
          <h2 className="msg-thread-subject">{thread.subject}</h2>
        </div>
      </header>
      <div className="msg-thread-body">
        {thread.messages.map(m => (
          <MessageBubble key={m.id} message={m} isOutgoing={m.role === "parent"} />
        ))}
      </div>
      <ReplyComposer threadSubject={thread.subject} onSend={onReplySend} />
    </section>
  );
}
```

- [ ] **Step 4: CSS** — append:

```css
/* =========================================================================
   Parent Messages · ThreadView + MessageBubble + EmptyState
   ========================================================================= */
.msg-thread { display: flex; flex-direction: column; height: 100%; }
.msg-thread-head {
  background: var(--color-card); border-bottom: 1px solid var(--color-border);
  padding: 14px 18px; display: flex; align-items: flex-start; gap: 10px;
}
.msg-thread-back {
  background: transparent; border: 0; font-size: 16px; cursor: pointer;
  color: var(--color-muted); padding: 6px 8px;
}
.msg-thread-tags { display: flex; gap: 8px; align-items: center; font-size: 10px; }
.msg-thread-tag {
  background: var(--color-info-soft); color: var(--color-info-text);
  padding: 2px 8px; border-radius: var(--radius-sm); font-size: 9.5px;
  font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .04em;
}
.msg-thread-sub { color: var(--color-muted); font-size: 11px; }
.msg-thread-subject { margin: 4px 0 0; font-size: 16px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.msg-thread-body {
  flex: 1; overflow-y: auto; padding: 18px 18px 12px;
  background: var(--color-surface-subtle);
  display: flex; flex-direction: column; gap: 14px;
}

.msg-bubble {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 16px;
  max-width: 100%;
}
.msg-bubble.is-outgoing { background: var(--color-info-soft); border-color: #BEE3F8; align-self: flex-end; max-width: 86%; }
.msg-bubble.is-incoming { align-self: flex-start; max-width: 86%; }
.msg-bubble-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.msg-bubble-from { font-weight: var(--font-weight-bold); color: var(--color-ink); font-size: 11.5px; }
.msg-bubble-sub { color: var(--color-muted); font-size: 10px; }
.msg-bubble-body p { margin: 0 0 6px; font-size: 12px; line-height: 1.55; color: var(--color-ink); }
.msg-bubble-body p:last-child { margin-bottom: 0; }
.msg-bubble-receipt {
  margin-top: 6px; font-size: 9.5px; color: var(--color-muted); font-style: italic;
}

.msg-empty { text-align: center; padding: 48px 24px; color: var(--color-muted); font-size: 12px; }
.msg-empty-ic { font-size: 34px; margin-bottom: 8px; }
.msg-empty h3 { margin: 8px 0 4px; font-size: 14px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.msg-empty p { margin: 0 0 16px; }
.msg-empty-btn {
  background: var(--color-primary); color: #fff; padding: 8px 16px;
  border: 0; border-radius: var(--radius-md); font-weight: var(--font-weight-bold); font-size: 12px;
  cursor: pointer; font-family: inherit;
}
```

- [ ] **Step 5: Commit** — note that ReplyComposer doesn't exist yet; tsc will fail. Skip the build verify here and run after Task 4. Just commit the 3 files + CSS.

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/messages/components apps/web/app/globals.css && git commit -m "Messages: ThreadView + MessageBubble + EmptyState"
```

---

## Task 4 — ReplyComposer + NewMessageComposer

**Files:**
- Create: `apps/web/app/parent/messages/components/ReplyComposer.tsx`
- Create: `apps/web/app/parent/messages/components/NewMessageComposer.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `ReplyComposer.tsx`** (client)

```tsx
"use client";

import { useState } from "react";

export default function ReplyComposer({
  threadSubject, onSend,
}: {
  threadSubject: string;
  onSend:        (body: string) => void;
}) {
  const [body, setBody] = useState("");
  function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setBody("");
  }
  return (
    <footer className="msg-reply" aria-label="Reply form">
      <div className="msg-reply-hint">Replying to: <b>{threadSubject}</b></div>
      <textarea
        className="msg-reply-textarea"
        placeholder="Type your reply…"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
      />
      <div className="msg-reply-actions">
        <button type="button" className="msg-btn msg-btn-ghost" onClick={() => console.log("[reply] save draft")}>Save draft</button>
        <button type="button" className="msg-btn msg-btn-primary" onClick={send} disabled={body.trim().length === 0}>
          Send
        </button>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: `NewMessageComposer.tsx`** (client modal)

```tsx
"use client";

import { useEffect, useState } from "react";
import { ALL_CHILDREN_ID, DEMO_CHILDREN } from "@/lib/child";
import { MESSAGE_RECIPIENTS, type MessageRecipient } from "@/lib/mock-messages";

export type NewMessagePayload = {
  to:       string;
  child_id: string | "household";
  subject:  string;
  body:     string;
};

export default function NewMessageComposer({
  open, onClose, onSend, defaultChildId,
}: {
  open:           boolean;
  onClose:        () => void;
  onSend:         (payload: NewMessagePayload) => void;
  defaultChildId: string;
}) {
  const [to, setTo] = useState<string>(MESSAGE_RECIPIENTS[0].id);
  const [childId, setChildId] = useState<string>(defaultChildId === ALL_CHILDREN_ID ? "household" : defaultChildId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) {
      setChildId(defaultChildId === ALL_CHILDREN_ID ? "household" : defaultChildId);
      setSubject("");
      setBody("");
    }
  }, [open, defaultChildId]);

  if (!open) return null;

  function send() {
    if (!subject.trim() || !body.trim()) return;
    onSend({ to, child_id: childId, subject: subject.trim(), body: body.trim() });
    onClose();
  }

  return (
    <div className="msg-modal-bg" role="dialog" aria-modal="true" aria-labelledby="new-msg-title">
      <div className="msg-modal">
        <header className="msg-modal-head">
          <h3 id="new-msg-title">New message</h3>
          <button type="button" className="msg-modal-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="msg-modal-body">
          <label className="msg-field">
            <span className="msg-field-label">To</span>
            <select value={to} onChange={e => setTo(e.target.value)}>
              {MESSAGE_RECIPIENTS.map((r: MessageRecipient) => (
                <option key={r.id} value={r.id}>{r.name} ({r.role_text})</option>
              ))}
            </select>
          </label>
          <label className="msg-field">
            <span className="msg-field-label">About</span>
            <select value={childId} onChange={e => setChildId(e.target.value)}>
              <option value="household">Household-wide</option>
              {DEMO_CHILDREN.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </label>
          <label className="msg-field">
            <span className="msg-field-label">Subject</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject…" />
          </label>
          <label className="msg-field">
            <span className="msg-field-label">Message</span>
            <textarea rows={6} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" />
          </label>
        </div>
        <footer className="msg-modal-foot">
          <button type="button" className="msg-btn msg-btn-ghost" onClick={() => { console.log("[compose] draft", { to, childId, subject, body }); onClose(); }}>Save draft</button>
          <button type="button" className="msg-btn msg-btn-primary" onClick={send} disabled={!subject.trim() || !body.trim()}>Send</button>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Parent Messages · ReplyComposer + NewMessageComposer + shared buttons
   ========================================================================= */
.msg-reply {
  background: var(--color-card); border-top: 1px solid var(--color-border);
  padding: 12px 18px;
}
.msg-reply-hint { font-size: 10.5px; color: var(--color-muted); margin-bottom: 8px; }
.msg-reply-hint b { color: var(--color-ink); }
.msg-reply-textarea {
  width: 100%; padding: 10px 12px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 12px; font-family: inherit; resize: vertical; min-height: 70px;
  background: var(--color-card); color: var(--color-ink);
}
.msg-reply-textarea:focus { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.msg-reply-actions { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }

.msg-btn {
  padding: 6px 14px; border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold); font-size: 11px;
  cursor: pointer; border: 0; font-family: inherit;
}
.msg-btn-primary { background: var(--color-primary); color: #fff; }
.msg-btn-primary:disabled { background: var(--color-muted-disabled); cursor: not-allowed; }
.msg-btn-ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
.msg-btn-ghost:hover { background: var(--color-soft); color: var(--color-ink); }

.msg-modal-bg {
  position: fixed; inset: 0; background: rgba(15,30,60,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 50;
  padding: 20px;
}
.msg-modal {
  background: var(--color-card); border-radius: var(--radius-xl);
  width: 100%; max-width: 540px; max-height: 90vh;
  display: flex; flex-direction: column; box-shadow: var(--shadow-2xl);
}
.msg-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--color-border); }
.msg-modal-head h3 { margin: 0; font-size: 13px; color: var(--color-ink); font-weight: var(--font-weight-bold); }
.msg-modal-close { background: transparent; border: 0; font-size: 22px; cursor: pointer; color: var(--color-muted); padding: 0 4px; }
.msg-modal-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.msg-modal-foot { display: flex; gap: 6px; justify-content: flex-end; padding: 12px 18px; border-top: 1px solid var(--color-border); }
.msg-field { display: flex; flex-direction: column; gap: 4px; }
.msg-field-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.msg-field input, .msg-field select, .msg-field textarea {
  padding: 8px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 12px; font-family: inherit; background: var(--color-card); color: var(--color-ink);
}
.msg-field input:focus, .msg-field select:focus, .msg-field textarea:focus { outline: 2px solid var(--color-accent); outline-offset: 2px; }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -5
cd ~/dev/manhaj && git add apps/web/app/parent/messages/components apps/web/app/globals.css && git commit -m "Messages: ReplyComposer + NewMessageComposer + button + modal CSS"
```

---

## Task 5 — Page assembly

**Files:**
- Modify: `apps/web/app/parent/messages/page.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Replace `page.tsx`**

```tsx
"use client";

import { useMemo, useState, useEffect } from "react";

import { useActiveChild, ALL_CHILDREN_ID } from "@/lib/child";
import {
  MOCK_THREADS, categoryCounts, threadsForChild,
  type MessageCategory, type Thread,
} from "@/lib/mock-messages";

import InboxList            from "./components/InboxList";
import CategoryFilter       from "./components/CategoryFilter";
import ChildFilter          from "./components/ChildFilter";
import ThreadView           from "./components/ThreadView";
import EmptyState           from "./components/EmptyState";
import NewMessageComposer, { type NewMessagePayload } from "./components/NewMessageComposer";

export default function ParentMessagesPage() {
  const { activeId: activeChildId } = useActiveChild();

  const [category,   setCategory]   = useState<MessageCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  // Apply filters in order: child → category → unread.
  const childScoped = useMemo(
    () => threadsForChild(MOCK_THREADS, activeChildId),
    [activeChildId],
  );

  const filtered = useMemo(() => {
    let rows: Thread[] = childScoped;
    if (category !== "all") rows = rows.filter(t => t.category === category);
    if (unreadOnly)         rows = rows.filter(t => t.unread);
    return rows;
  }, [childScoped, category, unreadOnly]);

  const counts = useMemo(() => categoryCounts(childScoped), [childScoped]);

  // Default active thread: first unread → else first → else null.
  useEffect(() => {
    if (activeThreadId && filtered.some(t => t.id === activeThreadId)) return;
    const next = filtered.find(t => t.unread)?.id ?? filtered[0]?.id ?? null;
    setActiveThreadId(next);
  }, [filtered, activeThreadId]);

  const activeThread = filtered.find(t => t.id === activeThreadId)
                    ?? MOCK_THREADS.find(t => t.id === activeThreadId)
                    ?? null;

  const multiChild = activeChildId === ALL_CHILDREN_ID;

  function onSelectThread(id: string) {
    setActiveThreadId(id);
    setMobileShowThread(true);
  }

  function onReplySend(body: string) {
    console.log("[reply] send", { thread_id: activeThreadId, body });
  }

  function onNewMessageSend(payload: NewMessagePayload) {
    console.log("[compose] send", payload);
  }

  return (
    <div className="msg-page">
      <aside className={`msg-rail ${mobileShowThread ? "is-mobile-hidden" : ""}`} aria-label="Inbox">
        {multiChild && <ChildFilter threads={MOCK_THREADS} />}
        <CategoryFilter
          active={category}
          onChange={setCategory}
          counts={counts}
          unreadOnly={unreadOnly}
          onToggleUnread={() => setUnreadOnly(v => !v)}
        />
        <InboxList
          threads={filtered}
          activeThreadId={activeThreadId}
          onSelect={onSelectThread}
          multiChild={multiChild}
        />
        <div className="msg-rail-foot">
          <button type="button" className="msg-btn msg-btn-primary" onClick={() => setComposerOpen(true)}>+ New message</button>
        </div>
      </aside>

      <main className={`msg-pane ${mobileShowThread ? "is-mobile-active" : ""}`}>
        {activeThread ? (
          <ThreadView
            thread={activeThread}
            onBack={() => setMobileShowThread(false)}
            onReplySend={onReplySend}
          />
        ) : (
          <EmptyState onCompose={() => setComposerOpen(true)} />
        )}
      </main>

      <NewMessageComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={onNewMessageSend}
        defaultChildId={activeChildId}
      />
    </div>
  );
}
```

- [ ] **Step 2: Append layout CSS**

```css
/* =========================================================================
   Parent Messages · Page layout (master-detail)
   ========================================================================= */
.msg-page {
  display: grid; grid-template-columns: 380px 1fr; gap: 0;
  height: calc(100vh - 280px); min-height: 600px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  margin: 0 auto var(--space-6); max-width: 1240px;
  background: var(--color-card); overflow: hidden;
}
@media (max-width: 900px) {
  .msg-page { grid-template-columns: 1fr; height: calc(100vh - 220px); }
}
.msg-rail {
  display: flex; flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-card); overflow: hidden;
}
.msg-rail .msg-inbox-list { overflow-y: auto; flex: 1; }
.msg-rail-foot {
  padding: 12px 14px; border-top: 1px solid var(--color-border);
  display: flex; justify-content: stretch;
  background: var(--color-card);
}
.msg-rail-foot .msg-btn { width: 100%; padding: 10px 14px; font-size: 12px; }

.msg-pane { background: var(--color-card); overflow: hidden; }
@media (max-width: 900px) {
  .msg-rail.is-mobile-hidden { display: none; }
  .msg-pane:not(.is-mobile-active) { display: none; }
  .msg-rail:not(.is-mobile-hidden) { display: flex; }
  .msg-pane.is-mobile-active { display: block; }
}
@media (min-width: 901px) {
  .msg-rail.is-mobile-hidden { display: flex; }
  .msg-pane.is-mobile-active { display: block; }
}
```

- [ ] **Step 3: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -25
```

- [ ] **Step 4: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/messages/page.tsx apps/web/app/globals.css && git commit -m "/parent/messages: master-detail page assembly · filter + thread + compose"
```

---

## Task 6 — Verification + push + memory

- [ ] **Step 1: Full suite**
```bash
cd ~/dev/manhaj/apps/web && npm test && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -25
```
All clean. 70+ tests.

- [ ] **Step 2: Visual smoke** at 1280 × 900:
   - `/parent/messages` opens with inbox left, first unread thread right (Ms Swart · "Layla — three things from April").
   - Click each category chip — inbox filters.
   - Toggle Unread — list shrinks to unread threads.
   - Switch to ChildSwitcher → "Layla" → inbox now shows only Layla + household threads.
   - Click "+ New message" → modal opens with To / About / Subject / Body. Cancel closes.
   - Reply textarea + Send button under each opened thread.
   - Mobile (375 px): inbox first, click → thread takes over, Back button returns.

- [ ] **Step 3: Push**
```bash
cd ~/dev/manhaj && git push origin main
```

- [ ] **Step 4: Update memory** at `~/.claude/projects/.../memory/project_school_ops_decisions.md`.

---

## Self-review

| Spec section | Plan task |
|---|---|
| §5 fixture | Task 1 |
| §6 data shape | Task 1 |
| §10 InboxList/CategoryFilter/ChildFilter | Task 2 |
| §10 ThreadView/MessageBubble/EmptyState | Task 3 |
| §10 ReplyComposer/NewMessageComposer | Task 4 |
| §7 master-detail layout · §8 state model | Task 5 |
| §11 acceptance criteria | Task 6 |

All "use client" / server boundaries explicit. Mock data shape mirrors the future schema. Empty state covered. Mobile stacking via CSS only.
