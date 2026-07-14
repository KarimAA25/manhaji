"use server";

import { revalidatePath } from "next/cache";
import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import { serverClient } from "@manhaj/lib/supabase";

export type SlipNotesData = {
  attendance: "attend" | "stay_school" | "stay_home";
  healthChange: boolean;
  healthExtra: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRel: string;
  emergencyBackup: string;
};

export async function saveDraftAction(
  activityId: string,
  studentId: string,
  slipId: string | null,
  notes: SlipNotesData,
): Promise<{ slipId: string }> {
  const parentId = await getCurrentParentId();
  if (!parentId) throw new Error("Not authenticated");
  const db = await serverClient();
  const now = new Date().toISOString();

  const payload = {
    activity_id: activityId,
    student_id: studentId,
    parent_id: parentId,
    status: "draft" as const,
    notes: JSON.stringify(notes),
    responded_at: now,
  };

  if (slipId) {
    const { data, error } = await db
      .from("permission_slips")
      .update(payload)
      .eq("id", slipId)
      .eq("parent_id", parentId)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/parent/permission-slip");
    return { slipId: data.id };
  } else {
    const { data, error } = await db
      .from("permission_slips")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/parent/permission-slip");
    return { slipId: data.id };
  }
}

export async function signAndSubmitAction(
  activityId: string,
  studentId: string,
  slipId: string | null,
  notes: SlipNotesData,
  signedName: string,
): Promise<void> {
  const parentId = await getCurrentParentId();
  if (!parentId) throw new Error("Not authenticated");
  const db = await serverClient();
  const now = new Date().toISOString();

  const payload = {
    activity_id: activityId,
    student_id: studentId,
    parent_id: parentId,
    status: "signed" as const,
    notes: JSON.stringify(notes),
    responded_at: now,
    signed_at: now,
    signed_name: signedName,
    signed_by_parent_id: parentId,
  };

  if (slipId) {
    const { error } = await db
      .from("permission_slips")
      .update(payload)
      .eq("id", slipId)
      .eq("parent_id", parentId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("permission_slips").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/parent/permission-slip");
}

export async function declineSlipAction(
  activityId: string,
  studentId: string,
  slipId: string | null,
): Promise<void> {
  const parentId = await getCurrentParentId();
  if (!parentId) throw new Error("Not authenticated");
  const db = await serverClient();
  const now = new Date().toISOString();

  const payload = {
    activity_id: activityId,
    student_id: studentId,
    parent_id: parentId,
    status: "declined" as const,
    responded_at: now,
  };

  if (slipId) {
    const { error } = await db
      .from("permission_slips")
      .update(payload)
      .eq("id", slipId)
      .eq("parent_id", parentId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("permission_slips").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/parent/permission-slip");
}
