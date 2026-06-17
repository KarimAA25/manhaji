/**
 * Magic-link callback — Supabase redirects here after the user clicks the
 * email link. We exchange the auth code for a session, set the cookie, and
 * redirect to the originally-requested page (or /admin if none).
 */

import { type NextRequest, NextResponse } from "next/server";
import { serverClient } from "@manhaj/lib/supabase";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    url.pathname = "/login";
    url.searchParams.set("error", "missing_code");
    return NextResponse.redirect(url);
  }

  const sb = await serverClient();
  const { error } = await sb.auth.exchangeCodeForSession(code);

  if (error) {
    url.pathname = "/login";
    url.searchParams.set("error", "exchange_failed");
    url.searchParams.set("reason", error.message.slice(0, 80));
    return NextResponse.redirect(url);
  }

  url.pathname = next.startsWith("/") ? next : "/admin";
  url.searchParams.delete("code");
  url.searchParams.delete("next");
  return NextResponse.redirect(url);
}
