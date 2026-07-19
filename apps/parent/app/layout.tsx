import type { Metadata } from "next";
import "@manhaj/ui/globals.css";
import "@manhaj/ui/tokens.css";
import "./parent.css";
import ParentNav from "./components/ParentNav";
import ChildSwitcher from "./components/ChildSwitcher";
import { ActiveChildProvider, type DemoChild } from "@manhaj/lib/child";
import { getCurrentParentId } from "@manhaj/lib/queries/auth";
import { getParentName, getParentChildren } from "@manhaj/lib/queries/parents";

export const metadata: Metadata = {
  title: "Manhaji Parent — School Ops Platform",
  description: "Parent dashboard for K-12 school operations.",
  robots: { index: false, follow: false },
};

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";

function gradeLabel(gl: string | null): string {
  if (!gl) return "";
  const n = parseInt(gl, 10);
  if (isNaN(n)) return gl;
  if (n <= 6)  return "Primary";
  if (n <= 9)  return "MS";
  return "HS";
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const parentId = await getCurrentParentId().catch(() => null);

  const [parentName, dbChildren] = parentId
    ? await Promise.all([
        getParentName(parentId).catch(() => ""),
        getParentChildren(parentId).catch(() => []),
      ])
    : ["", []];

  const realChildren: DemoChild[] = dbChildren.map(c => ({
    id: c.student_id,
    full_name: c.full_name_en,
    initial: c.initial,
    grade_label: c.section_code + (c.grade_level ? ` · ${gradeLabel(c.grade_level)}` : ""),
  }));

  const displayName = parentName || "Mr Al-Habsi";

  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ActiveChildProvider realChildren={realChildren.length > 0 ? realChildren : undefined}>
          <header className="topbar">
            <div className="brand">
              <div className="logo">M</div>
              <div>
                <div className="brand-name">
                  Manhaji <span className="brand-sub">· {SCHOOL_NAME}</span>
                </div>
              </div>
              <ParentNav />
            </div>
            <div className="top-right">
              <span style={{ fontSize: 12 }}>{displayName}</span>
              <div className="avatar" title="Parent">{displayName.charAt(0).toUpperCase()}</div>
            </div>
          </header>
          <ChildSwitcher />
          <main id="main-content" tabIndex={-1}>{children}</main>
        </ActiveChildProvider>
      </body>
    </html>
  );
}
