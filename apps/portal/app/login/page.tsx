import { loginAction } from "./actions";

export const metadata = { title: "Login — Manhaj" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F4F6FA",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        boxShadow: "0 4px 32px rgba(11,37,69,0.10)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}>
        {/* Logo */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "#0B2545", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, marginBottom: 20,
        }}>
          M
        </div>

        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0B2545" }}>
          Manhaj
        </h1>
        <p style={{ margin: "6px 0 28px", fontSize: 13, color: "#5A6B82" }}>
          School Operations Platform
        </p>

        {error && (
          <p style={{
            width: "100%", marginBottom: 16, padding: "10px 14px",
            background: "#FFF5F5", border: "1px solid #FEB2B2",
            borderRadius: 8, fontSize: 13, color: "#C53030", textAlign: "center",
          }}>
            Incorrect access code. Please try again.
          </p>
        )}

        <form action={loginAction} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            name="password"
            placeholder="Enter your access code"
            autoComplete="current-password"
            required
            style={{
              width: "100%", padding: "11px 14px",
              borderRadius: 8, border: "1px solid #E5EAF0",
              fontSize: 15, outline: "none", color: "#1A2440",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%", padding: "11px 14px",
              borderRadius: 8, background: "#3D5A80",
              color: "#fff", fontWeight: 600, fontSize: 15,
              border: "none", cursor: "pointer",
            }}
          >
            Sign in
          </button>
        </form>

        <a
          href="/demo"
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#3D5A80",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Demo Picker →
        </a>
      </div>
    </div>
  );
}
