import StudentReportArchive from "./components/StudentReportArchive";

export const dynamic = "force-dynamic";

export default function StudentPastReportsPage() {
  return (
    <div className="container">
      <h1>Past Reports</h1>
      <p className="sub">Layla Al-Habsi · 10A · AY 2025–26</p>
      <StudentReportArchive />
    </div>
  );
}
