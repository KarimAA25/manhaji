# Parent · Messages tab · 2.4a · UI + mocks (design spec)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) §9 (Messages × Outlook) |
| **Sibling spec** | `2026-05-27-parent-messages-2-4b.md` (next PR — live Resend wiring + schema) |

---

## 1. Background

Phase 1 left `/parent/messages` as a `<PlaceholderPage />`. This PR (2.4a) ships the **full UI** against synthetic threads in `lib/mock-messages.ts`. Live Resend wiring + database schema land in 2.4b — same UI, real I/O. Splitting the work means we get demo-ready visuals immediately without waiting on Resend domain verification or schema migrations.

## 2. Goals

1. **Master-detail layout** — inbox list on the left rail, opened thread + reply form on the right pane. Mobile stacks (inbox → click → thread takes over).
2. **All 5 UI blocks** from the brainstorm:
   - Category filter chips (All / Academic / Admin / Finance / Calendar) + Unread toggle
   - Inbox list with child-tag chip on every row (multi-child household)
   - Thread reading view with multi-message bubbles + read-receipt indicator on outgoing
   - Reply composer at the bottom of an opened thread
   - Compose-new modal/sheet
3. **Child-aware filtering** via `useActiveChild()`. When `"all"` is active, every thread is visible (with child-tag chips). When a specific child is selected, only that child's threads + household threads show.
4. **Drop-in replaceable** by 2.4b — the page state (active thread, composer open, form values) lives in component state; data is a static import. Swap the import for an RPC call in 2.4b without touching component shapes.

## 3. Non-goals (this PR)

Deferred to 2.4b:
- Resend send/receive wiring (composer logs to console).
- Schema migrations (`messages_threads`, `thread_messages`, `messages_audit_log` tables).
- Reply-To routing via `reply+thread-{id}@manhaj.app`.
- Outlook BCC.
- Actual read-receipt tracking (display is mocked).

Always deferred (Phase 3 / not in scope):
- Attachments.
- Markdown / rich text in compose.
- Thread search / archive.
- Per-message reactions.

## 4. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Layout | **Master-detail** on desktop (≥900px), stacked on mobile. |
| 2 | Data source | New `apps/web/lib/mock-messages.ts`. References children by ID from `lib/child.tsx`. |
| 3 | Compose-new in this PR | **Yes** — logs to console. Wired to Resend in 2.4b. |
| 4 | Thread routing | Single page `/parent/messages` with component state. NOT a separate route per thread. The thread ID stays in component state, not URL. (2.4b may add `?thread=` query string for shareability.) |
| 5 | Read receipts | Show "▸ opened 2h ago" string on outgoing messages where `opened_at` is set in the fixture. Static — no live tracking. |
| 6 | Active thread selection | Default to the first unread thread; if none, default to the most recent. |
| 7 | Categories | Academic / Admin / Finance / Calendar + Household (auto-tagged for the school administration broadcast threads). |

## 5. File map

**Create:**

| Path | Role |
|---|---|
| `apps/web/lib/mock-messages.ts` | Fixture + types: ~12 threads across children + household |
| `apps/web/lib/messages.test.ts` | Vitest tests |
| `apps/web/app/parent/messages/components/InboxList.tsx` | Left-rail list of threads |
| `apps/web/app/parent/messages/components/CategoryFilter.tsx` | Category chips (All / Academic / Admin / Finance / Calendar) + Unread filter |
| `apps/web/app/parent/messages/components/ChildFilter.tsx` | Per-child chips when household is active |
| `apps/web/app/parent/messages/components/ThreadView.tsx` | Right-pane thread reading view |
| `apps/web/app/parent/messages/components/MessageBubble.tsx` | Single message bubble (school vs parent) |
| `apps/web/app/parent/messages/components/ReplyComposer.tsx` | Reply form below an opened thread |
| `apps/web/app/parent/messages/components/NewMessageComposer.tsx` | Modal/sheet composer for a fresh thread |
| `apps/web/app/parent/messages/components/EmptyState.tsx` | Right-pane fallback when no thread is open |

**Modify:**

- `apps/web/app/parent/messages/page.tsx` — full rewrite, master-detail layout
- `apps/web/app/globals.css` — append CSS

## 6. Data shape

`apps/web/lib/mock-messages.ts` exports:

```ts
export type MessageCategory = "academic" | "admin" | "finance" | "calendar";
export type MessageRole     = "school" | "parent";

export type Message = {
  id:         string;
  thread_id:  string;
  ts:         string;            // ISO date-time
  role:       MessageRole;
  from_name:  string;            // "Ms Sandra Swart" / "Mr Al-Habsi" / "Finance office"
  from_label: string;            // "Student Advisor · 10A" / "Parent" / "School administration"
  body:       string;            // plain text, newline-separated paragraphs
  opened_at?: string;            // ISO date-time — present on outgoing-to-parent messages that have been read
};

export type Thread = {
  id:               string;
  subject:          string;
  category:         MessageCategory;
  child_id:         string | "household";   // matches lib/child.tsx ID convention
  from_label:       string;                  // "From: Ms Swart" / "From: Finance office"
  last_activity_at: string;                  // ISO
  unread:           boolean;
  messages:         Message[];               // ordered oldest-first
};

// Exports
export const MOCK_THREADS: Thread[];               // ~12 threads
export function threadsForChild(threads: Thread[], childId: string): Thread[];
export function categoryCounts(threads: Thread[]): Record<MessageCategory | "all" | "unread", number>;
export function formatRelative(iso: string): string;   // "14 May" / "2h ago" / "yesterday"
```

**Realism rules:**
- 12 threads total. At least:
  - 3 academic (monthly report from Ms Swart, behavioural alert about Omar, written-Arabic scaffold from Ms Khadija)
  - 2 finance (Layla's Term 2 invoice, Omar's transport overdue)
  - 2 admin / household (parent-teacher evening, school-wide announcement)
  - 2 calendar (May term events, Eid holiday notice)
  - 3 misc (Aya's chemistry result, attendance follow-up, music concert thank-you)
- Mix of unread (3-4) and read.
- Multi-message threads where a parent replied: 2-3 of them.
- At least 2 outgoing parent replies that have `opened_at` set (for the read-receipt indicator).

## 7. Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Persona switcher · ParentNav · ChildSwitcher                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──── INBOX (left rail) ────────┐  ┌──── THREAD (right pane) ─────────────┐ │
│ │ [filters: category + unread]  │  │ subject + tag chips                   │ │
│ │ [filters: per-child (HH only)] │  │ ┌── MessageBubble (school) ───────┐  │ │
│ │ ─────────────────────────────  │  │ │ Ms Swart · 14 May                │  │ │
│ │ ▶ Layla — three things…       │  │ │ body…                            │  │ │
│ │   Omar — attendance chat?     │  │ └──────────────────────────────────┘  │ │
│ │   Finance — invoice reminder  │  │ ┌── MessageBubble (parent) ───────┐  │ │
│ │   …                           │  │ │ Mr Al-Habsi · 14 May · ▸ opened │  │ │
│ │                               │  │ │ body…                            │  │ │
│ │                               │  │ └──────────────────────────────────┘  │ │
│ │                               │  │ ┌── ReplyComposer ────────────────┐  │ │
│ │                               │  │ │ [textarea] [Send] [Save draft]   │  │ │
│ └───────────────────────────────┘  └──────────────────────────────────────┘ │
│   [+ New message] sticky button                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Desktop (≥900 px):** 380px left rail + flexible right pane.
**Mobile (<900 px):** stacked. When a thread is selected, the inbox slides off / hides; a "← Back" button at the top of the thread returns to the inbox.

## 8. State model

The page is a `"use client"` component. State:

```ts
const { activeId: activeChildId } = useActiveChild();
const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
const [category, setCategory] = useState<MessageCategory | "all">("all");
const [unreadOnly, setUnreadOnly] = useState(false);
const [composerOpen, setComposerOpen] = useState(false);
```

Filtering pipeline:
1. Start with `MOCK_THREADS`.
2. If `activeChildId !== "all"` → keep threads where `child_id === activeChildId || child_id === "household"`.
3. If `category !== "all"` → keep threads where `category === category`.
4. If `unreadOnly` → keep threads where `unread === true`.

Default `activeThreadId` on mount: first unread thread → else first thread → else null.

When a thread is selected, it's marked read locally (no fixture mutation; just a `Set<string>` of "viewed in this session" we OR with `unread` to compute display). Actually simpler — keep `unread` as a read-only display flag; don't toggle. 2.4b will mutate via the API. (Add a comment in the code noting this.)

## 9. Compose-new flow

Clicking "+ New message" opens `<NewMessageComposer />` as a modal sheet (overlay).

Fields:
- **To:** select dropdown with options like "Ms Sandra Swart (Student Advisor)", "Ms Khadija (Arabic)", "Finance office", "Principal". List comes from a small static array in `mock-messages.ts` (`MESSAGE_RECIPIENTS`).
- **About:** child select (one of DEMO_CHILDREN.full_name + "Household-wide"). Defaults to the active child.
- **Subject:** text input.
- **Body:** textarea.

Buttons: Cancel · Save draft (logs `[compose] draft`) · Send (logs `[compose] send` + the form values, then closes).

## 10. Components — interface summary

```ts
// CategoryFilter.tsx
type Props = {
  active:      MessageCategory | "all";
  onChange:    (c: MessageCategory | "all") => void;
  counts:      Record<MessageCategory | "all" | "unread", number>;
  unreadOnly:  boolean;
  onToggleUnread: () => void;
};

// ChildFilter.tsx — only rendered when activeChildId === "all"
type Props = {
  threads:  Thread[];
  activeChildId: string;       // for highlighting
  onPick:   (childId: string | "all") => void;  // calls setActive in the active-child context
};

// InboxList.tsx
type Props = {
  threads:        Thread[];
  activeThreadId: string | null;
  onSelect:       (threadId: string) => void;
  multiChild:     boolean;     // when true, show child-tag chip on rows
};

// ThreadView.tsx
type Props = {
  thread:      Thread;
  onBack?:     () => void;     // mobile only
  onReplySend: (body: string) => void;
};

// MessageBubble.tsx — small, presentational
type Props = {
  message:  Message;
  isOutgoing: boolean;         // message.role === "parent"
};

// ReplyComposer.tsx
type Props = {
  threadSubject: string;
  onSend: (body: string) => void;
};

// NewMessageComposer.tsx — modal/sheet
type Props = {
  open:         boolean;
  onClose:      () => void;
  onSend:       (payload: NewMessagePayload) => void;
};

type NewMessagePayload = {
  to:       string;       // recipient ID
  child_id: string | "household";
  subject:  string;
  body:     string;
};

// EmptyState.tsx
type Props = { onCompose: () => void };
```

## 11. Acceptance criteria

- [ ] `/parent/messages` renders the inbox + opens the first unread thread by default.
- [ ] Category chips filter the inbox. Unread toggle filters to unread only.
- [ ] When "All children" is active, child-tag chips appear on each inbox row. When a single child is active, only that child's threads + household threads show.
- [ ] Switching child in the ChildSwitcher re-filters the inbox immediately (via `useActiveChild()`).
- [ ] Clicking an inbox row swaps the right-pane to that thread.
- [ ] "▸ opened 2h ago" indicator appears on outgoing parent messages with `opened_at` set.
- [ ] Reply composer at the bottom of an opened thread; Send logs to console + clears the textarea.
- [ ] "+ New message" button opens a composer modal; Send logs to console + closes.
- [ ] Mobile (375 px) — inbox first, click → thread takes over with a Back button.
- [ ] tsc + lint + build all clean. Tests pass.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Master-detail layout is fiddly | Use CSS grid for desktop, a single CSS rule (`@media max-width:900px`) for mobile stacking. No JS responsive logic. |
| Compose-new modal needs accessible focus management | Lock focus inside the modal while open; restore focus on close. Implement minimally with `tabIndex` + `aria-modal`. |
| Mock data shape must match the eventual schema | The Thread / Message shape mirrors a reasonable Postgres schema (already sketched in the IA spec §12). Keep it close. |
| `useActiveChild()` requires `<ActiveChildProvider>` | Already wired in the parent layout (Phase 2.3). Any new parent page just opts in. |

## 13. Self-review

- ✓ No "TBD" / placeholder language.
- ✓ Types in §6, §10 consistent.
- ✓ Scope: 5 UI blocks + compose-new. Live Resend explicitly deferred to 2.4b.
- ✓ Master-detail layout decision is concrete (desktop ≥900px, mobile stacks).
- ✓ Empty state covered (`<EmptyState />` when no thread is selected).

Ready to write the implementation plan.
