import TeacherNav from "@manhaj/teacher/app/components/TeacherNav";
import { LogoutButton } from "@manhaj/auth/components";
import { getCurrentTeacherId } from "@manhaj/lib/queries/auth";
import { getTeacherName } from "@manhaj/lib/queries/teachers";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const teacherId = await getCurrentTeacherId().catch(() => null);
  const teacherName = teacherId ? await getTeacherName(teacherId).catch(() => "") : "";
  const displayName = teacherName || "Ms Swart";
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
          <TeacherNav />
        </div>
        <div className="top-right">
          <LogoutButton />
          <span style={{ fontSize: 12 }}>{displayName} · AY {AY}</span>
          <div className="avatar" title="Teacher">{initials || "MS"}</div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </>
  );
}
