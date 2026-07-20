"use server";

import { serverClient } from "@manhaj/lib/supabase";
import { getCurrentAdminId } from "@manhaj/lib/queries/auth";
import { revalidatePath } from "next/cache";
import { generateHref } from "./catalogue";

export type RecordSubmissionResult = {
  ok: boolean;
  /** Why the DB write didn't happen (UI still opens the generated doc). */
  reason?: "no_session" | "no_catalog_row" | "insert_failed";
};

/**
 * Records a regulatory submission — the real write path behind the Upcoming
 * "Generate & submit" button. Writes `status`, `submitted_by` and `file_url`
 * (the generated document's URL) to `report_submissions`, so the row then
 * appears in "Recent submissions" from live data.
 *
 * Data-plug + OR-fallback: if there's no admin session or no matching
 * `regulatory_report_catalog` row (e.g. the demo dataset), it no-ops
 * gracefully and returns a reason — the caller still opens the generated
 * document, and the demo rows keep the table populated. Never throws.
 */
export async function recordSubmission(input: {
  slug: string;
  title: string;
  periodLabel: string;
}): Promise<RecordSubmissionResult> {
  try {
    const adminId = await getCurrentAdminId();
    if (!adminId) return { ok: false, reason: "no_session" };

    const db = await serverClient();

    // The submission FK requires a catalogue row. Match by name.
    const { data: cat } = await db
      .from("regulatory_report_catalog")
      .select("id")
      .ilike("name", `%${input.title}%`)
      .limit(1)
      .maybeSingle();

    const catalogId = (cat as { id: string } | null)?.id;
    if (!catalogId) return { ok: false, reason: "no_catalog_row" };

    const { error } = await db.from("report_submissions").insert({
      catalog_id: catalogId,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: adminId,
      period_label: input.periodLabel,
      file_url: generateHref(input.slug),
    } as never);

    if (error) return { ok: false, reason: "insert_failed" };

    revalidatePath("/admin/reports");
    return { ok: true };
  } catch {
    return { ok: false, reason: "insert_failed" };
  }
}
