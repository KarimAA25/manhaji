"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@manhaj/lib/supabase";
import { getRoleForUser } from "@manhaj/lib/queries/auth";
import { setSessionRole } from "@manhaj/auth";
import type { Role } from "@manhaj/lib/queries/auth";

export async function loginWithPassword(formData: FormData) {
  const email    = ((formData.get("email")    as string | null) ?? "").trim();
  const password =  (formData.get("password") as string | null) ?? "";

  if (!email || !password) redirect("/login?error=missing");

  const db = await serverClient();

  // Try GoTrue first — sets a real JWT cookie so RLS works for DB queries.
  const { data } = await db.auth.signInWithPassword({ email, password });

  let role: Role | null = null;

  if (data.user) {
    // GoTrue auth succeeded — derive role from the role tables.
    role = await getRoleForUser(data.user.id);
  } else {
    // GoTrue couldn't verify the password (common for users created via SQL).
    // Fall back to our SECURITY DEFINER function that uses pgcrypto directly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcRole } = await (db as any).rpc("manhaj_verify_login", {
      p_email:    email,
      p_password: password,
    });
    role = (rpcRole as Role | null) ?? null;
  }

  if (!role) redirect("/login?error=credentials");

  await setSessionRole(role);
  redirect(`/${role}`);
}

export async function sendMagicLink(formData: FormData) {
  const email = ((formData.get("magic_email") as string | null) ?? "").trim();
  if (!email) redirect("/login?error=missing");

  const hdrs   = await headers();
  const origin = hdrs.get("origin") ?? "http://localhost:3000";

  const db = await serverClient();
  const { error } = await db.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) redirect("/login?error=magic");
  redirect("/login?magic=sent");
}
