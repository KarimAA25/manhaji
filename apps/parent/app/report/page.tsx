/**
 * Monthly parent report — Tier 1 port.
 *
 * Visually identical to the Tier 0 demo at https://manhaj.pages.dev/parent/report
 * but reads the student name from the URL (?student=Layla%20Al-Habsi) so a
 * single page serves every parent without us hardcoding the family.
 *
 * Data sources today (Tier 1 first-pass):
 *   - Student name + grade: from the URL query (or default "Layla Al-Habsi · G10A")
 *   - Subject grades, rubric scores, narrative: SAMPLE — clearly labelled in the
 *     "drafted by Manhaji" byline + a footer banner. Real rubric_scores rows only
 *     start landing once teachers begin entering them via the PWA (Tier 2). Same
 *     pattern as the Tier 0 demo.
 *   - Cover-band stats (subject count, attendance %, rubric composite): derived
 *     from the sample data.
 *
 * Bilingual EN/AR support is parked for the report (the static demo doesn't
 * have it either) — adds when we have the IP-template scaffolding to share
 * with the comm-templates pattern.
 */

import Link from "next/link";
import { Suspense } from "react";
import ReportClient from "./ReportClient";

export const metadata = {
  title: "Monthly report · Manhaji",
};

export default function MonthlyReportPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
        Loading report…
      </div>
    }>
      <ReportClient />
      <div style={{ textAlign: "center", padding: "20px 0 40px", fontSize: 11, color: "var(--muted)" }}>
        <Link href="/">← Back to Manhaji</Link>
      </div>
    </Suspense>
  );
}
