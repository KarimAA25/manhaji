import StudentNav from "@manhaj/student/app/components/StudentNav";
import { LogoutButton } from "@manhaj/auth/components";
import { getCurrentStudentId } from "@manhaj/lib/queries/auth";
import { getStudentProfile } from "@manhaj/lib/queries/students";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const studentId = await getCurrentStudentId().catch(() => null);
  const profile = studentId ? await getStudentProfile(studentId).catch(() => null) : null;
  const displayName = profile?.full_name_en ?? "Layla Al-Habsi";
  const sectionCode = profile?.section_code ?? "10A";
  const initials = displayName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <div className="brand-name">
              Manhaji <span className="brand-sub">· {SCHOOL_NAME}</span>
            </div>
          </div>
          <StudentNav />
        </div>
        <div className="top-right">
          <LogoutButton />
          <span style={{ fontSize: 12 }}>{displayName} · {sectionCode}</span>
          <div className="avatar" title="Student">{initials || "LA"}</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
