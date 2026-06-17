# Parent · Messages 2.4b-1 · DB schema + page refactor (design spec)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) §9, §12 |
| **Prior PR** | [`2026-05-27-parent-messages-2-4a.md`](2026-05-27-parent-messages-2-4a.md) shipped the UI |
| **Sibling spec** | `2026-05-27-parent-messages-2-4b2.md` (Resend wiring — next) |

---

## 1. Background

Phase 2.4a shipped the Messages UI driven by `lib/mock-messages.ts`. This PR replaces the static import with **real database persistence** (Supabase Postgres) so the UI behaves end-to-end without yet integrating with Resend. After this PR lands the user runs the migration + a seed script and the demo works as before — but every state mutation actually writes to the DB.

Resend send/receive arrives in 2.4b-2.

## 2. Goals

1. **Schema migration** — new tables: `messages_threads`, `thread_messages`, `messages_audit_log`. SECURITY DEFINER RPCs make them anon-callable for the password-gated demo.
2. **`lib/messages.ts` wrappers** — server-side functions `listThreadsForParent()`, `createMessage()`, `createThread()`, `markThreadRead()`. All call the new RPCs.
3. **Page refactor** — `/parent/messages/page.tsx` becomes a server component that fetches threads. The interactive state moves to a new `<MessagesClient />` child component. Server actions handle reply/compose/mark-read.
4. **Seed script** `etl/seed_messages.py` — loads the same 12 demo threads (mirroring `lib/mock-messages.ts`) into the new tables. Idempotent.
5. **No UX regression** — same look + feel as 2.4a. Switching child, filtering, replying, composing all still work; the only difference is the data is now persisted and survives a refresh.

## 3. Non-goals (this PR)

Deferred to 2.4b-2:
- Resend outbound (`/api/messages/send` writes to DB only; doesn't email anyone).
- Resend inbound webhook + reply-to routing.
- Real read-receipt pixel.
- Outlook BCC for teachers.

Never in scope:
- Multi-tenant teacher routing (Phase 3 — one school for now).
- Attachments.
- Search.

## 4. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | RLS approach | SECURITY DEFINER RPCs callable by `anon`, matching the existing pattern (schema/008, schema/009). |
| 2 | Parent identity | Demo hard-codes a single parent: `parent_email = 'mahmoud.al-habsi@example.com'`. The RPC filters by this email. In production, parent identity comes from `auth.users` (Phase 3). |
| 3 | Thread scoping | Each thread has `student_id` (nullable for household-wide) + `school_id`. The RPC returns threads where the parent has any matching child (joined via a placeholder `parent_children` view). For 2.4b-1 we hard-code which student_ids belong to the parent (matches `DEMO_CHILDREN`). |
| 4 | Mark-read | Adds `manhaj_mark_thread_read_public(thread_id)` RPC. Sets `unread=false`. Called as a Next.js server action when a thread is opened. |
| 5 | Compose / Reply | Two RPCs: `manhaj_create_thread_public` + `manhaj_append_message_public`. Both are SECURITY DEFINER. They also write to `messages_audit_log`. |
| 6 | Mock fallback | If `listThreadsForParent()` returns zero rows, the page renders an empty state ("No conversations yet — seed the database to load the demo threads"). NOT a silent fallback to `MOCK_THREADS` — keeps the failure mode obvious. |
| 7 | Migration safety | Migration is purely additive (no destructive changes). Existing tables untouched. |
| 8 | `lib/mock-messages.ts` | Stays in repo — used as the data source for the seed script + still exported for future fixture-based tests. Page no longer imports it. |

## 5. Data model

### `messages_threads`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, default `gen_random_uuid()`) | |
| `school_id` | uuid (FK schools) | RLS scope |
| `parent_email` | text | demo identity (Phase 3: replaced by FK to `auth.users`) |
| `student_id` | uuid NULL (FK students) | NULL = household-wide |
| `subject` | text | |
| `category` | text CHECK in ('academic','admin','finance','calendar') | |
| `from_label` | text | "Ms Sandra Swart · Student Advisor" |
| `last_activity_at` | timestamptz | Touched whenever a message lands |
| `unread` | boolean | True if at least one school message is unread by the parent |
| `created_at` | timestamptz default now() | |

### `thread_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `thread_id` | uuid (FK messages_threads · on delete cascade) | |
| `ts` | timestamptz default now() | |
| `role` | text CHECK in ('school','parent') | |
| `from_name` | text | "Ms Sandra Swart" / "Mr Al-Habsi" |
| `from_label` | text | "Student Advisor · 10A" / "Parent" |
| `body` | text | plain-text body (newlines as paragraph breaks) |
| `opened_at` | timestamptz NULL | for read receipts (set by 2.4b-2 webhook) |

### `messages_audit_log` (PDPL audit trail)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `school_id` | uuid (FK schools) | |
| `thread_id` | uuid NULL (FK messages_threads) | NULL for "create-thread" event |
| `ts` | timestamptz default now() | |
| `direction` | text CHECK in ('out_to_parent','in_from_parent','out_to_teacher_bcc','in_from_teacher') | 2.4b-1 only uses `out_to_parent` + `in_from_parent` |
| `from_email` | text NULL | NULL when not yet emailing (2.4b-1 stays NULL) |
| `to_email` | text NULL | |
| `template_id` | text NULL | |
| `outcome` | text | "queued" / "delivered" / "bounced" / "opened" — 2.4b-1 writes "queued" |

### `parent_child_demo` (lightweight view)

Demo-only — maps the demo parent email to student IDs.

```sql
create or replace view parent_child_demo as
  select
    'mahmoud.al-habsi@example.com'::text as parent_email,
    s.id as student_id,
    s.full_name as student_name
  from students s
  where s.full_name in ('Layla Al-Habsi','Omar Al-Habsi','Yasmin Al-Habsi');
```

Production replaces this with a real `parent_contacts` table (Phase 3).

## 6. RPCs (SECURITY DEFINER, anon-callable)

```sql
-- 1. List threads visible to a parent. Returns threads + nested messages.
manhaj_threads_for_parent_public(
  p_school_name text,
  p_parent_email text
) returns jsonb;

-- 2. Append a message to an existing thread. Touches last_activity_at + unread.
manhaj_append_message_public(
  p_thread_id uuid,
  p_role text,             -- 'school' | 'parent'
  p_from_name text,
  p_from_label text,
  p_body text
) returns uuid;             -- returns the new message id

-- 3. Create a new thread + initial message in one round trip.
manhaj_create_thread_public(
  p_school_name text,
  p_parent_email text,
  p_student_id uuid,        -- nullable for household
  p_category text,
  p_subject text,
  p_from_name text,
  p_from_label text,
  p_body text
) returns uuid;             -- returns the new thread id

-- 4. Mark a thread as read.
manhaj_mark_thread_read_public(
  p_thread_id uuid
) returns void;
```

All four RPCs validate input + write to `messages_audit_log`.

## 7. File map

**Create:**

| Path | Role |
|---|---|
| `schema/010_messages.sql` | Tables + RLS + RPCs + parent_child_demo view |
| `apps/web/lib/messages.ts` | Server-side wrappers (`listThreadsForParent` etc.) |
| `apps/web/app/parent/messages/MessagesClient.tsx` | Client component (state + interactivity) — moved out of `page.tsx` |
| `apps/web/app/parent/messages/actions.ts` | Server actions: `sendReplyAction` / `createThreadAction` / `markThreadReadAction` |
| `etl/seed_messages.py` | Idempotent loader: reads `MOCK_THREADS`-equivalent fixtures (hard-coded in Python), writes to DB |
| `etl/data/messages_seed.json` | The 12 thread payloads (mirror of `mock-messages.ts` for cross-language parity) |

**Modify:**

- `apps/web/app/parent/messages/page.tsx` — becomes a server component that fetches via `listThreadsForParent()` and renders `<MessagesClient threads={...} parentEmail={...} />`
- `apps/web/app/globals.css` — no new CSS

**Unchanged but retained:**

- `apps/web/lib/mock-messages.ts` — stays for tests + the seed-script source data.

## 8. RPC SQL outline

The migration `schema/010_messages.sql` follows the schema/008 + 009 pattern. Sketch:

```sql
-- Tables (additive only)
create table messages_threads ( ... );
create table thread_messages ( ... );
create table messages_audit_log ( ... );

-- RLS: disabled on these for demo phase (RPCs gate access)
alter table messages_threads disable row level security;
alter table thread_messages disable row level security;
alter table messages_audit_log disable row level security;

-- Demo identity view
create or replace view parent_child_demo as ... ;

-- 4 RPCs (full SQL provided in plan Task 1)
create or replace function manhaj_threads_for_parent_public(...) returns jsonb ... ;
create or replace function manhaj_append_message_public(...) returns uuid ... ;
create or replace function manhaj_create_thread_public(...) returns uuid ... ;
create or replace function manhaj_mark_thread_read_public(...) returns void ... ;

grant execute on function manhaj_threads_for_parent_public(text, text) to anon, authenticated;
grant execute on function manhaj_append_message_public(uuid, text, text, text, text) to anon, authenticated;
grant execute on function manhaj_create_thread_public(text, text, uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function manhaj_mark_thread_read_public(uuid) to anon, authenticated;
```

## 9. `lib/messages.ts` interface

```ts
import { serverClient } from "./supabase";
import type { Thread } from "./mock-messages";   // reuse the existing type

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const DEMO_PARENT_EMAIL = "mahmoud.al-habsi@example.com";

export async function listThreadsForParent(parentEmail?: string): Promise<Thread[]>;
export async function createReply(threadId: string, body: string): Promise<string>;
export async function createThread(payload: NewThreadPayload): Promise<string>;
export async function markThreadRead(threadId: string): Promise<void>;
```

The shape returned matches `Thread[]` from `lib/mock-messages.ts` so the existing components don't need re-typing.

## 10. Page split

**Before (Phase 2.4a):**
```
app/parent/messages/
  page.tsx                                  <- "use client", all state + UI
  components/
    InboxList.tsx etc.
```

**After (Phase 2.4b-1):**
```
app/parent/messages/
  page.tsx                                  <- server component, fetches threads
  MessagesClient.tsx                        <- "use client", all state + UI
  actions.ts                                <- server actions
  components/
    ...                                     <- unchanged
```

### `page.tsx` (server)

```tsx
import { listThreadsForParent } from "@/lib/messages";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function ParentMessagesPage() {
  const threads = await listThreadsForParent();
  return <MessagesClient initialThreads={threads} />;
}
```

### `MessagesClient.tsx` (client)

Mostly the current `page.tsx` code, but:
- Takes `initialThreads: Thread[]` as a prop (was reading `MOCK_THREADS` directly).
- Reply / compose / mark-read call **server actions** from `./actions.ts` (which call into `lib/messages.ts`).
- After a server action runs, the client re-fetches threads via `router.refresh()` (no manual state mutation).

### `actions.ts` (server actions)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { createReply, createThread, markThreadRead } from "@/lib/messages";

export async function sendReplyAction(threadId: string, body: string) {
  await createReply(threadId, body);
  revalidatePath("/parent/messages");
}

export async function createThreadAction(payload: NewThreadPayload) {
  const id = await createThread(payload);
  revalidatePath("/parent/messages");
  return id;
}

export async function markThreadReadAction(threadId: string) {
  await markThreadRead(threadId);
  revalidatePath("/parent/messages");
}
```

## 11. Seed script

`etl/seed_messages.py` mirrors the existing `etl/load_to_postgres.py` pattern (env-driven Supabase connection, idempotent, fails noisily on missing config).

Flow:
1. Reads `etl/data/messages_seed.json` (12 thread payloads — mirror of `mock-messages.ts`).
2. Connects to Postgres using `SUPABASE_DB_HOST / USER / PASSWORD / NAME` env vars (same as load_to_postgres.py).
3. `truncate messages_threads, thread_messages, messages_audit_log cascade;` so re-runs always produce the same state.
4. For each thread: INSERT into `messages_threads` (resolving student_id by name lookup), then INSERT each message into `thread_messages` keyed by the thread ID.
5. Reports counts: "Seeded 12 threads, 18 messages."

## 12. Acceptance criteria

- [ ] Migration applies cleanly in Supabase (no SQL errors). All 3 tables + 4 RPCs + view present.
- [ ] After running the seed: `select count(*) from messages_threads` → 12; `select count(*) from thread_messages` → ≥12 (multi-message threads bring it higher).
- [ ] `/parent/messages` renders the same 12 threads it did in 2.4a — but the data flows through the RPC.
- [ ] Replying in the UI writes a row to `thread_messages` (visible in Supabase Studio), bumps `messages_threads.last_activity_at`, and the new message appears in the thread without a manual refresh (server action + `revalidatePath`).
- [ ] Composing a new message writes a new thread + initial message.
- [ ] Opening a thread marks it read (`unread = false` in DB).
- [ ] Empty DB (migration applied, no seed run) → page shows an empty inbox + composer button. No error, no fallback to mocks.
- [ ] Build green, tsc clean, lint clean, tests pass (existing 70 tests; no new tests since this PR is plumbing).
- [ ] User-action checklist documented in the commit message + memory entry.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Migration breaks an existing route | Migration is purely additive. Verify build is green after the migration is in. |
| Server action + client component state get out of sync | `revalidatePath` after each mutation forces the server component to re-render with fresh data. `router.refresh()` (built-in to Next.js App Router) is the safety net. |
| Demo identity (`mahmoud.al-habsi@example.com`) doesn't have matching students | Seed script verifies the 3 students exist before inserting; fails noisily otherwise. |
| Schema RLS oversight exposes data | RPCs are SECURITY DEFINER → they bypass RLS internally. RLS on the tables is intentionally disabled (gating happens in the RPC). Same pattern as 008/009. |
| Foreign-key cascade on student deletion drops their threads | `messages_threads.student_id` is NULLABLE — household threads have NULL. We do NOT cascade on student delete. Set ON DELETE SET NULL. |

## 14. Self-review

- ✓ No "TBD" / placeholder language.
- ✓ Types consistent with `lib/mock-messages.ts`.
- ✓ Scope: schema + lib + page refactor + seed. No Resend.
- ✓ Empty-state behaviour explicit (no silent fallback to mocks).
- ✓ Audit log table present so 2.4b-2 doesn't need a second migration.

Ready to write the plan.
