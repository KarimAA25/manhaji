import AdminNav from "@manhaj/admin/app/components/AdminNav";
import AskManhajDrawer from "@manhaj/admin/app/components/AskManhajDrawer";
import { LogoutButton } from "@manhaj/auth/components";
import { getCurrentAdminId, getAdminName } from "@manhaj/lib/queries/auth";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminId = await getCurrentAdminId().catch(() => null);
  const adminName = adminId ? await getAdminName(adminId).catch(() => "") : "";
  const displayName = adminName || "Principal";
  const initials = displayName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
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
          <LogoutButton />
          <span style={{ fontSize: 12 }}>{displayName} · AY {AY}</span>
          <div className="avatar" title="Admin">{initials || "PR"}</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} style={{ paddingBottom: "90px" }}>{children}</main>
      <AskManhajDrawer />
    </>
  );
}
