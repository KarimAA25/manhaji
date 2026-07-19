"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "@/app/actions/auth";

export default function LoginForm() {
  const params = useSearchParams();
  const nextPath = params.get("next") ?? "/";
  const errorParam = params.get("error");
  const reasonParam = params.get("reason");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const r = await sendMagicLink(email, nextPath);
    setSubmitting(false);
    setResult(r);
  }

  return (
    <main id="main-content" tabIndex={-1} style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#F4F6FA 0%, #EEF2F7 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "36px 40px",
        width: 380, maxWidth: "100%",
        boxShadow: "0 20px 60px rgba(15,30,60,.10)",
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: "linear-gradient(135deg,#0B2545,#3D5A80)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 18, marginBottom: 18,
        }}>M</div>

        <h1 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
          Sign in to Manhaji
        </h1>
        <p className="sub" style={{ marginBottom: 22 }}>
          Enter your email. We&apos;ll send a one-click sign-in link.
        </p>

        {errorParam && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              background: "#FED7D7", color: "#742A2A", padding: "10px 14px",
              borderRadius: 8, fontSize: 12, marginBottom: 14,
            }}
          >
            {errorParam === "missing_code"
              ? "That link looks incomplete. Send yourself a new one below."
              : errorParam === "exchange_failed"
                ? "That link has expired or was already used. Send a fresh link below."
                : "Sign-in didn't work. Try again, or contact your school administrator."}
          </div>
        )}

        {result?.ok ? (
          <div style={{
            background: "#C6F6D5", color: "#22543D", padding: "14px 16px",
            borderRadius: 10, fontSize: 12.5, lineHeight: 1.55,
          }}>
            <b>Check your email.</b>
            <div style={{ marginTop: 6 }}>
              A sign-in link has been sent to <b>{email}</b>. Click it from
              the same browser session and you&apos;ll land on the dashboard.
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
              Didn&apos;t get it? Check spam, or{" "}
              <a onClick={() => setResult(null)} style={{ color: "var(--accent)", cursor: "pointer" }}>
                try again
              </a>.
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
                required
                autoFocus
                disabled={submitting}
              />
            </div>

            {result?.error && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  background: "#FED7D7", color: "#742A2A", padding: "10px 14px",
                  borderRadius: 8, fontSize: 12, marginBottom: 14,
                }}
              >
                {result.error}
              </div>
            )}

            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !email}
              aria-busy={submitting}
              style={{ width: "100%", padding: "12px", fontSize: 13 }}
            >
              {submitting ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}

        <div style={{
          marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)",
          fontSize: 11, color: "var(--muted)", lineHeight: 1.55,
        }}>
          <b style={{ color: "var(--ink)" }}>Closed beta.</b> Sign-in is for school
          staff. Parents don&apos;t need to sign in to fill the course-selection form.
        </div>
      </div>
    </main>
  );
}
