"use server";

/**
 * Auth server actions:
 *   - sendMagicLink(email, next?): Supabase emails a one-click sign-in link.
 *     Returns { ok: true } if the email was queued, or { ok: false, error }.
 *   - signOut(): clears the session cookie + redirects to /.
 */

import { redirect } from "next/navigation";
import { serverClient } from "@manhaj/lib/supabase";
import { headers } from "next/headers";

type Result = { ok: true } | { ok: false; error: string };

export async function sendMagicLink(email: string, nextPath?: string): Promise<Result> {
  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  // Resolve the absolute URL of /auth/callback so Supabase knows where to
  // redirect after the user clicks the magic link. Different host on
  // localhost vs Vercel; we read it from request headers.
  const hdr = await headers();
  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host = hdr.get("x-forwarded-host") ?? hdr.get("host") ?? "manhaj-ten.vercel.app";
  const next = encodeURIComponent(nextPath ?? "/admin");
  const redirectTo = `${proto}://${host}/auth/callback?next=${next}`;

  const sb = await serverClient();
  const { error } = await sb.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,  // for the pilot — every staff member who tries an email gets an account
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  const sb = await serverClient();
  await sb.auth.signOut();
  redirect("/");
}
