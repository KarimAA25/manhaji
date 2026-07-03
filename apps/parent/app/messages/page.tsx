/**
 * Parent · Messages tab.
 *
 * Server component. Fetches threads from Postgres via lib/messages.ts and
 * hands them to <MessagesClient /> (a client component that owns the
 * interactive state). After any mutation (reply / compose / mark-read),
 * the server action calls revalidatePath which re-runs this fetch.
 */

import { listThreadsForParent } from "@manhaj/lib/messages";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function ParentMessagesPage() {
  const threads = await listThreadsForParent().catch(() => []);
  return <MessagesClient initialThreads={threads} />;
}
