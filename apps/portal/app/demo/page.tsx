import { demoLogin } from "./actions";

export const metadata = { title: "Demo Picker — Manhaji" };

const ROLES = [
  {
    role: "admin" as const,
    label: "Admin",
    description: "Principal · school operations dashboard",
    color: "#0B2545",
  },
  {
    role: "teacher" as const,
    label: "Teacher",
    description: "Analyze grades · input student data",
    color: "#3D5A80",
  },
  {
    role: "parent" as const,
    label: "Parent",
    description: "Reports · messages · course selection",
    color: "#5A7D9A",
  },
  {
    role: "student" as const,
    label: "Student",
    description: "Schedule · homework · growth tracker",
    color: "#2F6B8A",
  },
];

export default function DemoPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F4F6FA",
      padding: "24px 16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}>
        {/* Header */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "#0B2545", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, marginBottom: 16,
        }}>
          M
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0B2545" }}>
          Demo Picker
        </h1>
        <p style={{ margin: "6px 0 28px", fontSize: 13, color: "#5A6B82", textAlign: "center" }}>
          Select a role to instantly log in with demo access.
        </p>

        {/* Role buttons */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {ROLES.map(({ role, label, description, color }) => (
            <form key={role} action={demoLogin.bind(null, role)}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: "#fff",
                  border: `1px solid #E5EAF0`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "box-shadow 0.15s",
                  boxShadow: "0 1px 4px rgba(11,37,69,0.06)",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                }}>
                  {label[0]}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A2440" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: "#5A6B82", marginTop: 2 }}>
                    {description}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", color: "#B0BCC8", fontSize: 18 }}>›</div>
              </button>
            </form>
          ))}
        </div>

        {/* Back to login */}
        <a
          href="/login"
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#5A6B82",
            textDecoration: "none",
          }}
        >
          ← Back to login
        </a>
      </div>
    </div>
  );
}
