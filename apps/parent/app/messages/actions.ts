"use server";

import { revalidatePath } from "next/cache";
import {
  createReply, createThread, markThreadRead, type NewThreadPayload,
} from "@manhaj/lib/messages";

export async function sendReplyAction(threadId: string, body: string) {
  const newId = await createReply(threadId, body);
  revalidatePath("/parent/messages");
  return newId;
}

export async function createThreadAction(payload: NewThreadPayload) {
  const newId = await createThread(payload);
  revalidatePath("/parent/messages");
  return newId;
}

export async function markThreadReadAction(threadId: string) {
  await markThreadRead(threadId);
  revalidatePath("/parent/messages");
}
