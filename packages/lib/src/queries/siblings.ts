import { serverClient } from "../supabase";

export async function getFormTeachersForSections(
  sectionIds: string[],
): Promise<Record<string, string | null>> {
  if (sectionIds.length === 0) return {};
  const db = await serverClient();
  const { data, error } = await db
    .from("sections")
    .select(`id, form_teacher:form_teacher_id ( display_name, full_name )`)
    .in("id", sectionIds);
  if (error) return {};

  const result: Record<string, string | null> = {};
  for (const s of data ?? []) {
    const t = (s.form_teacher as unknown) as { display_name: string | null; full_name: string } | null;
    result[s.id] = t ? (t.display_name ?? t.full_name) : null;
  }
  return result;
}
