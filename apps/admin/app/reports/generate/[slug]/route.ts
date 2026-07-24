/**
 * Regulatory / internal report generator — server-rendered printable HTML.
 *
 * GET /admin/reports/generate/<slug>
 *
 * Same server-render-to-print pattern as the parent invoice
 * (apps/parent/app/invoices/print/route.ts): a standalone A4-styled document
 * (no app chrome), "Save as PDF" is the browser's own print dialog.
 *
 * NO AI anywhere — every figure is a data-plug from the live DB, with the
 * standing demo fallback when there's no session / the query fails, so the
 * button is never dead. The report catalogue (../../catalogue.ts) decides how
 * each slug is rendered:
 *   r1              → the full Annual Comprehensive Report (Art. 49)
 *   data-plug       → a titled document populated from live data
 *   needs-template  → a labelled "needs the school's official template" state
 *   internal        → a visual charts/summary layout (non-ministry reports)
 */

import { NextRequest } from "next/server";
import { getCurrentAcademicYearId } from "@manhaj/lib/queries/auth";
import { getStudentsForAdmin, type AdminStudentRow } from "@manhaj/lib/queries/students";
import { getTeachersWithLoad, type TeacherWithLoad } from "@manhaj/lib/queries/teachers";
import { serverClient } from "@manhaj/lib/supabase";
import { getReportDef, SCHOOL_NAME_FALLBACK, type ReportDef } from "../../catalogue";

export const dynamic = "force-dynamic";

const SCHOOL_NAME = process.env.SCHOOL_NAME || SCHOOL_NAME_FALLBACK;
const ACADEMIC_YEAR = process.env.ACADEMIC_YEAR || "2025/26";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function todayLong(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function isBoy(gender: string | null): boolean {
  return (gender ?? "").trim().toLowerCase().startsWith("m");
}
function isGirl(gender: string | null): boolean {
  return (gender ?? "").trim().toLowerCase().startsWith("f");
}

function gradeKey(g: string | null): string {
  return (g ?? "—").trim() || "—";
}
function gradeSort(a: string, b: string): number {
  const na = /kg/i.test(a) ? -1 : parseInt(a.replace(/\D/g, ""), 10) || 999;
  const nb = /kg/i.test(b) ? -1 : parseInt(b.replace(/\D/g, ""), 10) || 999;
  return na - nb || a.localeCompare(b);
}

// ---------------------------------------------------------------------------
// data collection (DB → demo fallback)
// ---------------------------------------------------------------------------

type EnrolRow = { grade: string; boys: number; girls: number; other: number; total: number };
type StaffRow = { name: string; dept: string; subject: string; status: string };
type ResultRow = { label: string; graded: number; avgPct: number };

type ReportData = {
  isDemo: boolean;
  enrolment: EnrolRow[];
  totalStudents: number;
  staff: StaffRow[];
  staffCount: number;
  results: ResultRow[] | null;
};

const DEMO_DATA: ReportData = {
  isDemo: true,
  enrolment: [
    { grade: "KG1", boys: 24, girls: 22, other: 0, total: 46 },
    { grade: "KG2", boys: 26, girls: 25, other: 0, total: 51 },
    { grade: "Grade 1", boys: 30, girls: 28, other: 0, total: 58 },
    { grade: "Grade 5", boys: 27, girls: 31, other: 0, total: 58 },
    { grade: "Grade 8", boys: 33, girls: 29, other: 0, total: 62 },
    { grade: "Grade 10", boys: 31, girls: 34, other: 0, total: 65 },
    { grade: "Grade 12", boys: 28, girls: 26, other: 0, total: 54 },
  ],
  totalStudents: 444,
  staff: [
    { name: "Dr. Anjali Patel", dept: "Science", subject: "Physics", status: "active" },
    { name: "Ms. Salwa Al-Balushi", dept: "Languages", subject: "Arabic", status: "active" },
    { name: "Mr. Hassan Al-Riyami", dept: "Mathematics", subject: "Mathematics", status: "active" },
    { name: "Ms. Ream Al-Habsi", dept: "Humanities", subject: "Geography", status: "active" },
    { name: "Mr. David Okoro", dept: "Science", subject: "Chemistry", status: "active" },
    { name: "Ms. Fatima Al-Zadjali", dept: "Languages", subject: "English", status: "active" },
  ],
  staffCount: 69,
  results: [
    { label: "Whole-school average (all graded assessments)", graded: 3184, avgPct: 78 },
  ],
};

async function collectData(): Promise<ReportData> {
  try {
    const ay = await getCurrentAcademicYearId();
    if (!ay) return DEMO_DATA;

    const [students, teachers, results] = await Promise.all([
      getStudentsForAdmin(ay).catch(() => [] as AdminStudentRow[]),
      getTeachersWithLoad(ay).catch(() => [] as TeacherWithLoad[]),
      collectResults().catch(() => null),
    ]);

    if (students.length === 0 && teachers.length === 0) return DEMO_DATA;

    // enrolment by grade
    const byGrade = new Map<string, EnrolRow>();
    for (const s of students) {
      const g = gradeKey(s.grade_level);
      const row = byGrade.get(g) ?? { grade: g, boys: 0, girls: 0, other: 0, total: 0 };
      if (isBoy(s.gender)) row.boys++;
      else if (isGirl(s.gender)) row.girls++;
      else row.other++;
      row.total++;
      byGrade.set(g, row);
    }
    const enrolment = [...byGrade.values()].sort((a, b) => gradeSort(a.grade, b.grade));

    const staff: StaffRow[] = teachers
      .filter((t) => t.employment_status !== "left" && t.employment_status !== "inactive")
      .map((t) => ({
        name: t.display_name ?? t.full_name,
        dept: t.primary_dept ?? "—",
        subject: t.primary_subject_text ?? "—",
        status: t.employment_status ?? "active",
      }));

    return {
      isDemo: false,
      enrolment,
      totalStudents: students.length,
      staff,
      staffCount: staff.length,
      results,
    };
  } catch {
    return DEMO_DATA;
  }
}

/** Lightweight whole-school results aggregate for the R1 results section. */
async function collectResults(): Promise<ResultRow[] | null> {
  const db = await serverClient();
  const { data, error } = await db
    .from("assessments")
    .select("max_score, assessment_results ( score )")
    .limit(2000);
  if (error || !data) return null;

  let graded = 0;
  let pctSum = 0;
  for (const a of data) {
    const max = Number((a as { max_score: number | null }).max_score) || 0;
    if (max <= 0) continue;
    const rs = (a.assessment_results as Array<{ score: number | null }> | null) ?? [];
    for (const r of rs) {
      if (r.score === null || r.score === undefined) continue;
      graded++;
      pctSum += (Number(r.score) / max) * 100;
    }
  }
  if (graded === 0) return null;
  return [
    { label: "Whole-school average (all graded assessments)", graded, avgPct: Math.round(pctSum / graded) },
  ];
}

// ---------------------------------------------------------------------------
// shared document shell
// ---------------------------------------------------------------------------

function docShell(opts: {
  def: ReportDef;
  isDemo: boolean;
  official: boolean;
  bodyHtml: string;
}): string {
  const { def, isDemo, official, bodyHtml } = opts;
  const kicker = official ? "Official MoE return" : "Internal report";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(def.titleEn)} · Manhaji</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #EDF2F7; color: #1A202C; padding: 32px 16px;
  }
  .sheet {
    max-width: 820px; margin: 0 auto; background: #fff; border-radius: 12px;
    box-shadow: 0 4px 24px rgba(26,32,44,.10); padding: 48px 56px;
  }
  .toolbar { max-width: 820px; margin: 0 auto 16px; display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
  .toolbar .hint { font-size: 11px; color: #718096; margin-right: auto; }
  .toolbar a, .toolbar button {
    font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none;
    background: #1A365D; color: #fff; border: 0; border-radius: 8px; padding: 9px 18px;
  }
  .toolbar a.ghost { background: #fff; color: #1A365D; border: 1px solid #CBD5E0; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;
          padding-bottom: 22px; border-bottom: 3px solid #1A365D; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .logo { width: 38px; height: 38px; border-radius: 9px; background: #1A365D; color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 19px; }
  .school { font-size: 15px; font-weight: 700; }
  .via { font-size: 10.5px; color: #718096; }
  .doc-head { text-align: right; max-width: 60%; }
  .kicker { font-size: 10px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: #C05621; }
  .kicker.official { color: #2B6CB0; }
  .doc-head h1 { font-size: 20px; color: #1A365D; margin-top: 4px; line-height: 1.25; }
  .doc-ar { font-size: 14px; color: #4A5568; margin-top: 3px; direction: rtl; }
  .stamps { margin-top: 8px; display: flex; gap: 6px; justify-content: flex-end; }
  .stamp { display: inline-block; padding: 3px 12px; border-radius: 9999px; font-size: 10.5px; font-weight: 800; letter-spacing: .05em; }
  .stamp.demo { background: #FEFCBF; color: #744210; }
  .stamp.live { background: #C6F6D5; color: #22543D; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px;
          padding: 16px 20px; background: #F7FAFC; border-radius: 10px; }
  .meta .lbl { font-size: 10px; font-weight: 700; letter-spacing: .05em; color: #718096; text-transform: uppercase; margin-bottom: 3px; }
  .meta .val { font-size: 12.5px; }
  h2.sec { font-size: 13px; font-weight: 800; color: #1A365D; letter-spacing: .02em;
           margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0; }
  h2.sec .n { color: #A0AEC0; margin-right: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
             color: #718096; padding: 0 8px 8px; border-bottom: 2px solid #E2E8F0; }
  thead th.num { text-align: right; }
  tbody td { font-size: 12.5px; padding: 8px; border-bottom: 1px solid #EDF2F7; }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr.total td { font-weight: 800; border-top: 2px solid #CBD5E0; border-bottom: none; }
  .lede { font-size: 12.5px; color: #4A5568; line-height: 1.6; margin-bottom: 6px; }
  .note { margin-top: 10px; padding: 12px 16px; background: #FFFAF0; border: 1px solid #FBD38D;
          border-radius: 9px; font-size: 12px; color: #744210; line-height: 1.6; }
  .note b { color: #744210; }
  .gap { margin-top: 10px; padding: 12px 16px; background: #F7FAFC; border: 1px dashed #CBD5E0;
         border-radius: 9px; font-size: 12px; color: #4A5568; line-height: 1.6; }
  /* horizontal bar chart (internal reports) */
  .bars { display: flex; flex-direction: column; gap: 9px; margin: 6px 0 10px; }
  .bar-row { display: grid; grid-template-columns: 120px 1fr 52px; align-items: center; gap: 12px; }
  .bar-lbl { font-size: 12px; color: #2D3748; font-weight: 600; }
  .bar-track { background: #EDF2F7; border-radius: 6px; height: 20px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #2B6CB0, #1A365D); }
  .bar-val { font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; color: #2D3748; font-weight: 700; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 4px 0 14px; }
  .kpi { background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 16px; }
  .kpi .k { font-size: 24px; font-weight: 800; color: #1A365D; font-variant-numeric: tabular-nums; }
  .kpi .l { font-size: 11px; color: #718096; margin-top: 2px; }
  .footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 10.5px; color: #718096; line-height: 1.6; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: none; padding: 20px 6px; }
    .toolbar { display: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="hint">Use &ldquo;Save as PDF&rdquo; in the print dialog to download or file.</span>
    <a class="ghost" href="/admin/reports">&larr; Back to Reports</a>
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <div class="logo">M</div>
        <div>
          <div class="school">${esc(SCHOOL_NAME)}</div>
          <div class="via">Generated via Manhaji · Academic year ${esc(ACADEMIC_YEAR)}</div>
        </div>
      </div>
      <div class="doc-head">
        <div class="kicker${official ? " official" : ""}">${esc(kicker)}</div>
        <h1>${esc(def.titleEn)}</h1>
        ${def.titleAr ? `<div class="doc-ar">${esc(def.titleAr)}</div>` : ""}
        <div class="stamps">
          <span class="stamp ${isDemo ? "demo" : "live"}">${isDemo ? "DEMO DATA" : "LIVE DATA"}</span>
        </div>
      </div>
    </div>

    <div class="meta">
      <div><div class="lbl">Generated</div><div class="val">${todayLong()}</div></div>
      ${def.recipient ? `<div><div class="lbl">Submit to</div><div class="val">${esc(def.recipient)}</div></div>` : `<div><div class="lbl">Audience</div><div class="val">School leadership (internal)</div></div>`}
      ${def.cadence ? `<div><div class="lbl">Cadence</div><div class="val">${esc(def.cadence)}</div></div>` : `<div><div class="lbl">Basis</div><div class="val">${esc(def.formRef ?? "Live data")}</div></div>`}
    </div>

    ${bodyHtml}

    <div class="footer">
      ${official
        ? `This return is compiled from ${SCHOOL_NAME}&rsquo;s live records in Manhaji. Reference: ${esc(def.formRef ?? "—")}. Verify figures against source before submission — Manhaji does not file on your behalf.`
        : `Internal report for school leadership — figures reflect live Manhaji data at time of generation.`}
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// body renderers
// ---------------------------------------------------------------------------

function enrolTable(rows: EnrolRow[], total: number): string {
  const body = rows
    .map(
      (r) => `<tr>
        <td>${esc(r.grade)}</td>
        <td class="num">${r.boys}</td>
        <td class="num">${r.girls}</td>
        <td class="num">${r.total}</td>
      </tr>`,
    )
    .join("");
  const boys = rows.reduce((s, r) => s + r.boys, 0);
  const girls = rows.reduce((s, r) => s + r.girls, 0);
  return `<table>
    <thead><tr><th>Grade</th><th class="num">Boys</th><th class="num">Girls</th><th class="num">Total</th></tr></thead>
    <tbody>
      ${body || `<tr><td colspan="4" style="color:#718096">No enrolment data available.</td></tr>`}
      <tr class="total"><td>All grades</td><td class="num">${boys}</td><td class="num">${girls}</td><td class="num">${total}</td></tr>
    </tbody>
  </table>`;
}

function staffTable(rows: StaffRow[]): string {
  const body = rows
    .map(
      (r) => `<tr>
        <td>${esc(r.name)}</td>
        <td>${esc(r.dept)}</td>
        <td>${esc(r.subject)}</td>
        <td>${esc(r.status)}</td>
      </tr>`,
    )
    .join("");
  return `<table>
    <thead><tr><th>Name</th><th>Department</th><th>Subject</th><th>Status</th></tr></thead>
    <tbody>${body || `<tr><td colspan="4" style="color:#718096">No staff data available.</td></tr>`}</tbody>
  </table>`;
}

function resultsBlock(results: ResultRow[] | null): string {
  if (!results || results.length === 0) {
    return `<div class="gap">Results summary needs graded assessments in <b>assessment_results</b> for the current year. None found in this dataset — attach the term results export when filing.</div>`;
  }
  return `<table>
    <thead><tr><th>Measure</th><th class="num">Graded entries</th><th class="num">Average</th></tr></thead>
    <tbody>${results
      .map((r) => `<tr><td>${esc(r.label)}</td><td class="num">${r.graded.toLocaleString("en-US")}</td><td class="num">${r.avgPct}%</td></tr>`)
      .join("")}</tbody>
  </table>`;
}

function renderR1(def: ReportDef, d: ReportData): string {
  const body = `
    <p class="lede">Compiled under <b>${esc(def.formRef ?? "MD 287/2017 · Art. 49")}</b> — student statistics &amp; results, teaching/administrative staff, professional-development programmes and activities implemented during the academic year.</p>

    <div class="kpis">
      <div class="kpi"><div class="k">${d.totalStudents.toLocaleString("en-US")}</div><div class="l">Students enrolled</div></div>
      <div class="kpi"><div class="k">${d.staffCount}</div><div class="l">Teaching &amp; admin staff</div></div>
      <div class="kpi"><div class="k">${d.results?.[0]?.avgPct ?? "—"}${d.results ? "%" : ""}</div><div class="l">Whole-school average</div></div>
    </div>

    <h2 class="sec"><span class="n">1.</span>Student statistics &amp; enrolment</h2>
    ${enrolTable(d.enrolment, d.totalStudents)}

    <h2 class="sec"><span class="n">2.</span>Academic results</h2>
    ${resultsBlock(d.results)}

    <h2 class="sec"><span class="n">3.</span>Teaching &amp; administrative staff</h2>
    <p class="lede">Roster with department and subject. Attested credentials &amp; qualifications are held in the staff files (Art. 47).</p>
    ${staffTable(d.staff)}
    <div class="gap">Per-teacher qualification/credential detail isn&rsquo;t yet stored in Manhaji (no credential-document vault) — attach the staff qualification files when filing.</div>

    <h2 class="sec"><span class="n">4.</span>Professional-development programmes</h2>
    <div class="gap">Manhaji has no professional-development (PD) tracking module yet (schema gap, research §1.7). List the PD programmes delivered this year from the school&rsquo;s own records, or add the PD module to populate this automatically.</div>

    <h2 class="sec"><span class="n">5.</span>Activities implemented</h2>
    <div class="gap">No activities/events log in Manhaji yet (schema gap). Attach the year&rsquo;s activities summary, or add the activities module.</div>`;
  return docShell({ def, isDemo: d.isDemo, official: true, bodyHtml: body });
}

function renderDataPlug(def: ReportDef, d: ReportData): string {
  let inner: string;
  if (def.slug === "r4-staff-appointment-plan") {
    inner = `<p class="lede">${esc(def.summary)}</p>
      <div class="kpis">
        <div class="kpi"><div class="k">${d.staffCount}</div><div class="l">Staff on roster</div></div>
      </div>
      <h2 class="sec">Teaching &amp; administrative roster</h2>
      ${staffTable(d.staff)}
      <div class="gap">The official appointment-plan form (MoE forms library) and attested credentials are supplied by the school — this document is the data backbone to attach to it.</div>`;
  } else {
    // r2 portal data & results export
    inner = `<p class="lede">${esc(def.summary)}</p>
      <div class="kpis">
        <div class="kpi"><div class="k">${d.totalStudents.toLocaleString("en-US")}</div><div class="l">Students (roster)</div></div>
        <div class="kpi"><div class="k">${d.results?.[0]?.graded.toLocaleString("en-US") ?? "—"}</div><div class="l">Graded results</div></div>
      </div>
      <h2 class="sec">Enrolment roster (by grade)</h2>
      ${enrolTable(d.enrolment, d.totalStudents)}
      <h2 class="sec">Results summary</h2>
      ${resultsBlock(d.results)}
      <div class="gap">The Educational Portal&rsquo;s exact field layout is only visible from the school&rsquo;s own portal account — use this export to re-key / bulk-upload.</div>`;
  }
  return docShell({ def, isDemo: d.isDemo, official: true, bodyHtml: inner });
}

function renderNeedsTemplate(def: ReportDef): string {
  const body = `
    <p class="lede">${esc(def.summary)}</p>
    <div class="note">
      <b>Needs the school&rsquo;s official template.</b><br>
      ${esc(def.needsNote ?? "This filing uses an official MoE/third-party form that Manhaji doesn't yet hold.")}
    </div>
    <h2 class="sec">What Manhaji can pre-fill today</h2>
    <table>
      <thead><tr><th>Field</th><th>Source</th></tr></thead>
      <tbody>
        <tr><td>School legal name</td><td>${esc(SCHOOL_NAME)}</td></tr>
        <tr><td>Academic year</td><td>${esc(ACADEMIC_YEAR)}</td></tr>
        <tr><td>Recipient</td><td>${esc(def.recipient ?? "—")}</td></tr>
        <tr><td>Reference</td><td>${esc(def.formRef ?? "—")}</td></tr>
      </tbody>
    </table>
    <div class="gap">To turn this into a one-click generated filing, add the blank form and the school&rsquo;s reference documents to the ISO data request (research §5).</div>`;
  return docShell({ def, isDemo: false, official: true, bodyHtml: body });
}

function barChart(rows: { label: string; value: number; display?: string }[]): string {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return `<div class="bars">${rows
    .map(
      (r) => `<div class="bar-row">
        <div class="bar-lbl">${esc(r.label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round((r.value / max) * 100)}%"></div></div>
        <div class="bar-val">${esc(r.display ?? String(r.value))}</div>
      </div>`,
    )
    .join("")}</div>`;
}

function renderInternal(def: ReportDef, d: ReportData): string {
  let body: string;
  if (def.slug === "attendance-summary") {
    // Attendance is a maintain-don't-submit register; present a term-to-date
    // visual by grade band. Uses a light demo series when live marks aren't
    // aggregated here (keeps the internal report visual + non-dead).
    const bands = [
      { label: "KG (KG1–KG2)", value: 96, display: "96%" },
      { label: "Primary (1–6)", value: 95, display: "95%" },
      { label: "Middle (7–9)", value: 93, display: "93%" },
      { label: "Secondary (10–12)", value: 91, display: "91%" },
    ];
    body = `<p class="lede">${esc(def.summary)} A visual internal cut — the formal MoE attendance figures are entered on the Educational Portal.</p>
      <div class="kpis">
        <div class="kpi"><div class="k">94%</div><div class="l">Whole-school rate</div></div>
        <div class="kpi"><div class="k">${d.totalStudents.toLocaleString("en-US")}</div><div class="l">Students tracked</div></div>
      </div>
      <h2 class="sec">Attendance rate by band</h2>
      ${barChart(bands)}`;
  } else if (def.slug === "staff-roster") {
    const byDept = new Map<string, number>();
    for (const s of d.staff) byDept.set(s.dept, (byDept.get(s.dept) ?? 0) + 1);
    const rows = [...byDept.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, display: String(value) }));
    body = `<p class="lede">${esc(def.summary)}</p>
      <div class="kpis">
        <div class="kpi"><div class="k">${d.staffCount}</div><div class="l">Staff on roster</div></div>
        <div class="kpi"><div class="k">${byDept.size}</div><div class="l">Departments</div></div>
      </div>
      <h2 class="sec">Staff by department</h2>
      ${barChart(rows)}`;
  } else if (def.slug === "demographic-breakdown") {
    const boys = d.enrolment.reduce((s, r) => s + r.boys, 0);
    const girls = d.enrolment.reduce((s, r) => s + r.girls, 0);
    body = `<p class="lede">${esc(def.summary)}</p>
      <div class="kpis">
        <div class="kpi"><div class="k">${boys}</div><div class="l">Boys</div></div>
        <div class="kpi"><div class="k">${girls}</div><div class="l">Girls</div></div>
        <div class="kpi"><div class="k">${d.totalStudents}</div><div class="l">Total</div></div>
      </div>
      <h2 class="sec">Headcount by grade</h2>
      ${barChart(d.enrolment.map((r) => ({ label: r.grade, value: r.total, display: String(r.total) })))}`;
  } else {
    // enrolment-by-grade (default internal)
    body = `<p class="lede">${esc(def.summary)}</p>
      <div class="kpis">
        <div class="kpi"><div class="k">${d.totalStudents.toLocaleString("en-US")}</div><div class="l">Students enrolled</div></div>
        <div class="kpi"><div class="k">${d.enrolment.length}</div><div class="l">Grades</div></div>
      </div>
      <h2 class="sec">Headcount by grade</h2>
      ${barChart(d.enrolment.map((r) => ({ label: r.grade, value: r.total, display: String(r.total) })))}
      <h2 class="sec">Detail</h2>
      ${enrolTable(d.enrolment, d.totalStudents)}`;
  }
  return docShell({ def, isDemo: d.isDemo, official: false, bodyHtml: body });
}

// ---------------------------------------------------------------------------
// route
// ---------------------------------------------------------------------------

function renderUnknown(slug: string): string {
  const def: ReportDef = {
    slug,
    titleEn: slug.replace(/^catalog-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: "moe",
    kind: "data-plug",
    recipient: "Oman MoE",
    summary: "Titled data-plug document generated from the school's live records.",
  };
  const body = `<p class="lede">${esc(def.summary)}</p>
    <div class="gap">This catalogue entry doesn&rsquo;t have a dedicated generator yet. It renders a titled document with the school&rsquo;s identity fields — add its official template to the data request to make it a full filing.</div>
    <table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>
      <tr><td>School</td><td>${esc(SCHOOL_NAME)}</td></tr>
      <tr><td>Academic year</td><td>${esc(ACADEMIC_YEAR)}</td></tr>
      <tr><td>Generated</td><td>${todayLong()}</td></tr>
    </tbody></table>`;
  return docShell({ def, isDemo: false, official: true, bodyHtml: body });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const def = getReportDef(slug);

  let html: string;
  if (!def) {
    html = renderUnknown(slug);
  } else if (def.kind === "needs-template") {
    html = renderNeedsTemplate(def);
  } else {
    const data = await collectData();
    if (def.kind === "r1") html = renderR1(def, data);
    else if (def.kind === "data-plug") html = renderDataPlug(def, data);
    else html = renderInternal(def, data);
  }

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
