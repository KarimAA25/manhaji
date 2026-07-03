import type { Metadata } from "next";
import "@manhaj/ui/globals.css";
import "@manhaj/ui/tokens.css";
import AdminNav from "./components/AdminNav";
import AskManhajDrawer from "./components/AskManhajDrawer";
import { getCurrentAdminId, getAdminName } from "@manhaj/lib/queries/auth";

export const metadata: Metadata = {
  title: "Manhaj Admin — School Ops Platform",
  description: "Principal dashboard for K-12 school operations.",
  robots: { index: false, follow: false },
};

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const adminId = await getCurrentAdminId().catch(() => null);
  const adminName = adminId ? await getAdminName(adminId).catch(() => "") : "";
  const displayName = adminName || "Principal";
  const initials = displayName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <header className="topbar">
          <div className="brand">
            <div className="logo">M</div>
            <div>
              <div className="brand-name">
                Manhaj <span className="brand-sub">· {SCHOOL_NAME}</span>
              </div>
            </div>
            <AdminNav />
          </div>
          <div className="top-right">
            <span style={{ fontSize: 12 }}>{displayName} · AY {AY}</span>
            <div className="avatar" title="Admin">{initials || "PR"}</div>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <AskManhajDrawer />
      </body>
    </html>
  );
}
