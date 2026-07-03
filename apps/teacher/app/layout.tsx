/**
 * Layout for the teacher app — topbar with TeacherNav + AskManhajDrawer.
 *
 * DEMO MODE: hard-coded teacher = Ms Swart (avatar "MS").
 * School name + AY from env.
 */

import type { Metadata } from "next";
import "@manhaj/ui/globals.css";
import "@manhaj/ui/tokens.css";
import TeacherNav from "./components/TeacherNav";
import { getCurrentTeacherId } from "@manhaj/lib/queries/auth";
import { getTeacherName } from "@manhaj/lib/queries/teachers";

export const metadata: Metadata = {
  title: "Manhaj Teacher — School Ops Platform",
  description: "Teacher dashboard for K-12 school operations.",
  robots: { index: false, follow: false },
};

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";
const AY = process.env.ACADEMIC_YEAR || "2026-2027";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const teacherId = await getCurrentTeacherId().catch(() => null);
  const teacherName = teacherId ? await getTeacherName(teacherId).catch(() => "") : "";
  const displayName = teacherName || "Ms Swart";
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
            <TeacherNav />
          </div>
          <div className="top-right">
            <span style={{ fontSize: 12 }}>{displayName} · AY {AY}</span>
            <div className="avatar" title="Teacher">{initials || "MS"}</div>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </body>
    </html>
  );
}
