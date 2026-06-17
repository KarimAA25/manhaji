"use client";

/**
 * Client component for the monthly parent report.
 * Reads ?student=... + ?month=... from URL; falls back to defaults.
 *
 * The actual data is sample (until rubric_scores are populated by teachers
 * via the PWA at Tier 2). Visual parity with the Tier 0 static demo.
 */

import { useSearchParams } from "next/navigation";

const DEFAULT_STUDENT = "Layla Al-Habsi";
const DEFAULT_GRADE = "Grade 10 · Section A";
const DEFAULT_ID = "ISO-2843";
const DEFAULT_MONTH = "April 2026";

// 6-axis rubric scores (1.0–5.0). Coordinates in the SVG mirror these values.
type Axis = { code: string; label: string; score: number; flag?: boolean };
const AXES: Axis[] = [
  { code: "analytical",    label: "Analytical reasoning",  score: 4.4 },
  { code: "creative",      label: "Creative expression",   score: 3.8 },
  { code: "oral",          label: "Oral communication",    score: 4.0 },
  { code: "homework",      label: "Homework consistency",  score: 4.6 },
  { code: "participation", label: "Class participation",   score: 4.2 },
  { code: "written",       label: "Written expression",    score: 2.8, flag: true },
];

// Per-subject rubric scores (subject × 6 axes)
const RUBRIC_MATRIX: { name: string; scores: number[] }[] = [
  { name: "Mathematics",     scores: [4.6, 3.7, 3.9, 3.5, 4.0, 4.8] },
  { name: "English",         scores: [4.2, 4.0, 4.2, 3.8, 4.3, 4.4] },
  { name: "Arabic",          scores: [3.5, 3.5, 3.6, 2.8, 4.0, 4.5] },
  { name: "Chemistry",       scores: [4.8, 4.0, 4.1, 3.0, 4.2, 4.7] },
  { name: "Physics",         scores: [4.5, 3.6, 3.8, 2.6, 4.0, 4.5] },
  { name: "Biology (SS)",    scores: [4.2, 3.4, 3.4, 2.6, 3.8, 4.6] },
  { name: "Social Studies",  scores: [4.0, 3.6, 4.2, 2.8, 4.3, 4.4] },
  { name: "Islamic Studies", scores: [4.1, 3.0, 4.1, 3.0, 4.5, 4.7] },
  { name: "PE",              scores: [3.6, 4.4, 4.5, 3.0, 4.6, 4.6] },
  { name: "ICT",             scores: [4.7, 4.3, 3.7, 3.2, 4.0, 4.5] },
];

// Subject performance grid (term grades + trend + class context)
const PERF: Array<{ subject: string; grade: string; trend: "up" | "dn" | "flat"; delta: string; classAvg: string; pct: string }> = [
  { subject: "Mathematics",        grade: "A",   trend: "up",   delta: "▲ +1 band vs March", classAvg: "B",   pct: "78th" },
  { subject: "English",            grade: "B+",  trend: "flat", delta: "— flat",            classAvg: "B",   pct: "62nd" },
  { subject: "Arabic",             grade: "C",   trend: "dn",   delta: "▼ down 1 band",      classAvg: "B-",  pct: "28th" },
  { subject: "Chemistry",          grade: "A*",  trend: "up",   delta: "▲ +1 band",          classAvg: "B",   pct: "92nd" },
  { subject: "Physics",            grade: "A",   trend: "up",   delta: "▲ +1 band",          classAvg: "B+",  pct: "75th" },
  { subject: "Biology Self-Study", grade: "B+",  trend: "flat", delta: "— flat",            classAvg: "B",   pct: "58th" },
];

function rsBandClass(v: number): string {
  if (v < 1.5) return "rs1";
  if (v < 2.5) return "rs2";
  if (v < 3.5) return "rs3";
  if (v < 4.5) return "rs4";
  return "rs5";
}

export default function ReportClient() {
  const params = useSearchParams();
  const student = params.get("student") || DEFAULT_STUDENT;
  const grade = params.get("grade") || DEFAULT_GRADE;
  const studentId = params.get("id") || DEFAULT_ID;
  const month = params.get("month") || DEFAULT_MONTH;

  return (
    <main id="main-content" tabIndex={-1} className="p-shell">
      <article className="p-article">
        {/* IP banner */}
        <div className="p-ip-banner">
          <b style={{ color: "#7B341E" }}>Manhaj IP:</b> the 6-axis rubric framework, the radar visualisation,
          the report card template and the university-fit bands below are Manhaj-built — schools don&apos;t define these.
        </div>

        {/* COVER */}
        <div className="p-cover">
          <div className="p-cover-top">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14,
              }}>M</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, opacity: .9 }}>International School of Oman</div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", opacity: .7 }}>
                  Monthly report · {month}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, opacity: .85 }}>
              <div>{grade}</div>
              <div>ID: {studentId}</div>
            </div>
          </div>
          <h1>{student}</h1>
          <p style={{ fontSize: 14, opacity: .85, margin: 0 }}>
            A snapshot of how {student.split(" ")[0]} progressed this month — strengths, areas to build, and what&apos;s next.
          </p>
          <div className="p-cover-chips">
            {[`${PERF.length} subjects`, "24 graded items", "Attendance 97%", "Rubric composite 4.1 / 5"].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="p-body">

          {/* Narrative */}
          <Section label="This month at a glance">
            <div style={{
              background: "#F4F6FA", borderRadius: 12, padding: "18px 20px",
              fontSize: 13, lineHeight: 1.7, color: "var(--ink)",
            }}>
              {student.split(" ")[0]} had a <b style={{ color: "var(--primary)" }}>strong month overall</b>,
              with notable progress in <b style={{ color: "var(--primary)" }}>Chemistry</b> and{" "}
              <b style={{ color: "var(--primary)" }}>Mathematics</b> &mdash; her work on equilibrium problems
              showed real conceptual depth and she scored top of class on the unit test. Her{" "}
              <b style={{ color: "var(--primary)" }}>oral communication</b> rubric score climbed from 3.4 to
              4.0 this month, the third consecutive monthly gain, supported by her engagement in the Model
              UN preparation sessions. We continue to flag <b style={{ color: "var(--primary)" }}>written
              Arabic</b> as an area to build &mdash; this is the second month her written-expression score
              dipped below 3.0, and the targeted plan below should help. {student.split(" ")[0]} was absent
              once this month (medical) and remained engaged in class throughout.
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, fontStyle: "italic" }}>
                Drafted by Manhaj &middot; reviewed and approved by Ms Sandra Swart &middot; 8 May 2026
              </div>
            </div>
          </Section>

          {/* Subject performance grid */}
          <Section label="Subject performance" title="Grades · trends · class context">
            <div className="p-grid-3">
              {PERF.map(p => (
                <div key={p.subject} style={{
                  border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", background: "#FAFCFE",
                }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700 }}>
                    {p.subject}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", margin: "4px 0" }}>{p.grade}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: p.trend === "up" ? "var(--success)" : p.trend === "dn" ? "var(--danger)" : "var(--muted)",
                  }}>{p.delta}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 6 }}>
                    Class avg <b style={{ color: "var(--ink)" }}>{p.classAvg}</b> · percentile <b style={{ color: "var(--ink)" }}>{p.pct}</b>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Rubric radar */}
          <Section label="Manhaj rubric · 6-axis competency profile" title="Strengths & areas to build · this month">
            <div className="p-radar-row">
              <RubricRadarSvg axes={AXES} />
              <div>
                {AXES.map(a => (
                  <div key={a.code} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "1px dashed var(--border)", fontSize: 12,
                  }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)", minWidth: 130 }}>{a.label}</span>
                    <div style={{ flex: 1, height: 6, background: "#EDF1F7", borderRadius: 3, margin: "0 12px", position: "relative", overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${(a.score / 5) * 100}%`,
                        background: a.flag ? "#C05621" : "#3D5A80",
                        borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--ink)", minWidth: 42, textAlign: "right", fontSize: 11.5 }}>
                      {a.score.toFixed(1)} / 5
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
              Manhaj scores every subject against the same 6 universal axes so parents can compare strengths
              consistently across subjects, term to term. Scale: 1 emerging &middot; 3 meeting &middot; 5 mastering.
            </div>
          </Section>

          {/* Rubric matrix */}
          <Section label="Rubric matrix · this month" title={`How ${student.split(" ")[0]} scored on each axis, per subject`}>
            <div className="p-rubric-matrix-wrap">
            <table className="p-rubric-matrix">
              <thead>
                <tr>
                  {["Subject", "Analytical", "Creative", "Oral", "Written", "Participation", "Homework"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 0 ? "left" : "center",
                      padding: "8px 6px", background: "var(--soft)",
                      fontSize: 10, textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700, color: "var(--muted)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RUBRIC_MATRIX.map(row => (
                  <tr key={row.name}>
                    <td style={{ padding: "8px 6px", borderBottom: "1px dashed var(--border)", textAlign: "left", fontWeight: 600 }}>
                      {row.name}
                    </td>
                    {row.scores.map((s, i) => (
                      <td key={i} style={{ padding: "8px 6px", borderBottom: "1px dashed var(--border)", textAlign: "center" }}>
                        <RsCell value={s} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--muted)", fontStyle: "italic" }}>
              Cells colour-coded by score: <RsCell value={1} /> emerging &nbsp;
              <RsCell value={2} /> approaching &nbsp;
              <RsCell value={3} /> meeting &nbsp;
              <RsCell value={4} /> exceeding &nbsp;
              <RsCell value={5} /> mastering
            </div>
          </Section>

          {/* Improvement plan */}
          <Section label="Improvement plan · this month" title={`Three concrete actions for ${student.split(" ")[0]}`}>
            <div className="p-grid-3">
              {[
                { n: "1", h: "Written Arabic structure", p: `Three 15-minute essay-outline exercises per week using the Manhaj scaffolds. Sample prompts attached — ${student.split(" ")[0]} can pick from any.` },
                { n: "2", h: "Build on Chemistry momentum", p: `${student.split(" ")[0]} is ready for stretch material — the Cambridge IGCSE extension problem set on organic chemistry. 20 min / session.` },
                { n: "3", h: "Public-speaking opportunity", p: `Oral rubric score climbed three months running — recommend a 3-minute reflection slot in May's MUN debate.` },
              ].map(card => (
                <div key={card.n} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "#fff" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: "#0B2545",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, marginBottom: 8,
                  }}>{card.n}</div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{card.h}</h4>
                  <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.55 }}>{card.p}</p>
                  <a style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginTop: 8, display: "inline-block" }}>
                    Open pack →
                  </a>
                </div>
              ))}
            </div>
          </Section>

          {/* University fit */}
          <Section label="University placement signal · early indicator" title={`Where students with profiles like ${student.split(" ")[0]}'s have landed`}>
            <div style={{
              background: "linear-gradient(135deg,#FAFCFE,#F0F4FA)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "18px 22px",
            }}>
              <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginBottom: 10 }}>
                Based on Manhaj rubric profile + IGCSE projection compared against International School of
                Oman&apos;s alumni placement history. Shown as historical bands, not predictions.
                Refreshed monthly. <b>Demo:</b> alumni dataset is illustrative; real signal lights up once
                school shares 5 years of placement data.
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>
                    82<span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, marginTop: 2 }}>
                    Profile strength · top 31%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, marginTop: 10 }}>
                    <b>Historical placement tiers for this rubric profile:</b>
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.7, fontWeight: 400, color: "var(--muted)" }}>
                      <li>Regional research universities (SQU, AUB, AUS, Khalifa) — 58% of similar alumni</li>
                      <li>UK Russell Group / US R1 (Manchester, Edinburgh, UToronto) — 24% of similar alumni</li>
                      <li>US selective + IB direct entry (NYU Abu Dhabi, UBC, Boston U.) — 11% of similar alumni</li>
                    </ul>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12 }}>
                    <b style={{ color: "var(--primary)" }}>Strongest-fit fields:</b> Chemistry (biomedical, materials),
                    Engineering (chemical, environmental). <b style={{ color: "var(--primary)" }}>Watch:</b> consistent
                    written Arabic / IELTS Writing will be key for UK applications.
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* MoM delta */}
          <Section label="Month-over-month delta" title="What changed since March">
            <div className="p-grid-4">
              {[
                { l: "Rubric composite", v: "+0.22", color: "var(--success)", sub: "4.1 / 5" },
                { l: "Attendance", v: "— 97%", color: "var(--muted)", sub: "flat" },
                { l: "Homework on-time", v: "+5pp", color: "var(--success)", sub: "96%" },
                { l: "Written-expression", v: "-0.4", color: "var(--danger)", sub: "watch" },
              ].map(d => (
                <div key={d.l} className="card">
                  <div className="card-label">{d.l}</div>
                  <div className="big-num" style={{ color: d.color, fontSize: 24 }}>{d.v}</div>
                  <div className="delta">{d.sub}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="p-footer">
          <span>Generated by Manhaj · reviewed and approved by {student.split(" ")[0]}&apos;s teachers · 8 May 2026</span>
          <span>Questions? Reply to this email · <a href="#" style={{ color: "var(--accent)" }}>school contact</a></span>
        </div>
      </article>
    </main>
  );
}

function Section({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {title && <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)", marginBottom: 14 }}>{title}</div>}
      {children}
    </section>
  );
}

function RsCell({ value }: { value: number }) {
  const cls = value < 1.5 ? "rs1" : value < 2.5 ? "rs2" : value < 3.5 ? "rs3" : value < 4.5 ? "rs4" : "rs5";
  const bg = cls === "rs1" ? "#C53030" : cls === "rs2" ? "#9C4221" : cls === "rs3" ? "#9C4221" : cls === "rs4" ? "#3D5A80" : "#0B2545";
  return (
    <span style={{
      display: "inline-block", width: 30, height: 24, lineHeight: "24px",
      borderRadius: 5, fontWeight: 700, fontSize: 11, color: "#fff", background: bg, textAlign: "center",
    }}>
      {value.toFixed(1)}
    </span>
  );
}

function RubricRadarSvg({ axes }: { axes: Axis[] }) {
  // Convert 6 scores to SVG polygon points. Center 160,145, max radius 115.
  // 6 axes at angles: top(270°), ur(330°), lr(30°), bottom(90°), ll(150°), ul(210°)
  // We compute SVG coords for each.
  const CENTER = { x: 160, y: 145 };
  const MAX_R = 115;
  const ANGLES_DEG = [270, 330, 30, 90, 150, 210];

  function point(score: number, angleDeg: number) {
    const r = (score / 5) * MAX_R;
    const a = (angleDeg * Math.PI) / 180;
    return { x: CENTER.x + r * Math.cos(a), y: CENTER.y + r * Math.sin(a) };
  }

  const points = axes.map((a, i) => point(a.score, ANGLES_DEG[i]));
  const polygonPoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Concentric ring sizes: 0.2, 0.4, 0.6, 0.8, 1.0 of MAX_R
  function ringPoints(scale: number) {
    return ANGLES_DEG.map(deg => {
      const a = (deg * Math.PI) / 180;
      const r = scale * MAX_R;
      return `${(CENTER.x + r * Math.cos(a)).toFixed(1)},${(CENTER.y + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  }

  // Axis-label positions (slightly beyond the outer ring)
  const labelOffset = MAX_R + 30;
  function labelPos(angleDeg: number) {
    const a = (angleDeg * Math.PI) / 180;
    return { x: CENTER.x + labelOffset * Math.cos(a), y: CENTER.y + labelOffset * Math.sin(a) };
  }

  return (
    <svg
      viewBox="0 0 320 290"
      role="img"
      aria-labelledby="radar-title radar-desc"
      style={{ width: "100%", maxWidth: 320, height: "auto", display: "block" }}
    >
      <title id="radar-title">Manhaj 6-axis competency profile</title>
      <desc id="radar-desc">
        Radar chart with six dimensions: {axes.map(a => `${a.label} ${a.score}`).join(", ")} — out of 5.
      </desc>
      {[0.2, 0.4, 0.6, 0.8, 1.0].map(scale => (
        <polygon key={scale} points={ringPoints(scale)} fill="none" stroke="#EDF1F7" strokeWidth="1" />
      ))}
      <line x1={CENTER.x} y1={CENTER.y - MAX_R} x2={CENTER.x} y2={CENTER.y + MAX_R} stroke="#EDF1F7" />
      <line x1={CENTER.x - MAX_R * 0.866} y1={CENTER.y - MAX_R * 0.5} x2={CENTER.x + MAX_R * 0.866} y2={CENTER.y + MAX_R * 0.5} stroke="#EDF1F7" />
      <line x1={CENTER.x - MAX_R * 0.866} y1={CENTER.y + MAX_R * 0.5} x2={CENTER.x + MAX_R * 0.866} y2={CENTER.y - MAX_R * 0.5} stroke="#EDF1F7" />

      <polygon points={polygonPoints} fill="rgba(61,90,128,0.20)" stroke="#3D5A80" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={axes[i].flag ? "#C05621" : "#0B2545"}
        />
      ))}

      {axes.map((a, i) => {
        const pos = labelPos(ANGLES_DEG[i]);
        return (
          <text
            key={a.code}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={a.flag ? "#C05621" : "#1A2440"}
            dominantBaseline="middle"
          >
            {a.label.split(" ")[0]} {a.score.toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}
