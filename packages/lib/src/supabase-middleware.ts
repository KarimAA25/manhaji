/**
 * Supabase middleware client — refreshes the user's session cookie on every
 * request, and exposes who's logged in to the middleware so we can redirect
 * unauthenticated users away from protected routes.
 *
 * Called from middleware.ts at the project root.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;

/**
 * Refresh the auth session + return the current user (or null) so middleware
 * can decide whether to redirect. Mutates the response to set refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() refreshes the session if expired. Don't replace with
  // getSession() — that reads from cookies without validating with Supabase.
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user };
}
