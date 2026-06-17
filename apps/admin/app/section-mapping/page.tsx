/**
 * /admin/section-mapping — Tier 1 port of the Tier 0 static page.
 *
 * Server component. Loads the section list via the same
 * `manhaj_dashboard_data_public` RPC the dashboard uses (RLS-safe, anon-callable).
 * Hands the section rows to a client component that lets the principal confirm
 * mappings and saves them via /api/sections/save-mapping — no SQL paste.
 */

import { getDashboardData } from "@manhaj/lib/data";
import SectionMappingClient from "./SectionMappingClient";

export const dynamic = "force-dynamic"; // always fresh from DB

export default async function SectionMappingPage() {
  const data = await getDashboardData();
  return (
    <div className="container">
      <h1>Section mapping</h1>
      <p className="sub">
        Tell Manhaj what each section code means. Once mapped, sections become
        usable across reports, scheduling, and parent-facing forms.
      </p>

      {data.sections.length === 0 ? (
        <div className="banner" role="status" aria-live="polite">
          No sections to map yet — the school workbook hasn&apos;t been
          imported, or this view is filtered to a school with no records.
        </div>
      ) : (
        <SectionMappingClient initialSections={data.sections} />
      )}
    </div>
  );
}
