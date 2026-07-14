"use client";

import { useState } from "react";
import type { UniversityApp, CounselorInfo } from "@manhaj/lib/queries/applications";
import type { RubricSuggestionData } from "@manhaj/lib/queries/goals";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  studentName: string;
  apps: UniversityApp[];
  rubricScores: RubricSuggestionData[];
  counselor: CounselorInfo | null;
  isMock: boolean;
};

type AppStatus = "researching" | "in_progress" | "submitted" | "in_review" | "admitted" | "rejected";

type MockApp = {
  id: string;
  abbr: string;
  color: string;
  name: string;
  country: string;
  program: string;
  status: AppStatus;
  deadline: string | null;
  decision: string | null;
  admitRate: number;
  note: string;
};

type Doc = { name: string; status: "uploaded" | "in_progress" | "missing"; detail?: string };
type TestScore = { name: string; score: string; suffix: string; note?: string; cta?: string };
type NeedleMover = { label: string; title: string; desc: string };
type AnonStudent = { year: string; ib: number; sat: number; note: string; outcomes: string[] };
type PlacementUni = { name: string; admitRate: number };

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_APPS: MockApp[] = [
  { id:"u1", abbr:"AUS",  color:"#009B77", name:"American University of Sharjah", country:"UAE",               program:"Computer Engineering",  status:"submitted",   deadline:null,         decision:"Q1 2027", admitRate:68, note:"Based on 10-yr data · Last on 10 Sept"       },
  { id:"u2", abbr:"KCL",  color:"#800020", name:"King's College London",           country:"UK · UCAS P430",    program:"BSc Computer Science",   status:"submitted",   deadline:null,         decision:"Q1 2027", admitRate:40, note:"40% adm · 3 documents pending"              },
  { id:"u3", abbr:"UCL",  color:"#522D6D", name:"University College London",       country:"UK",                program:"BSc Computer Science",   status:"in_progress", deadline:"2027-01-12", decision:null,      admitRate:32, note:"12 days left · personal statement at draft 3"},
  { id:"u4", abbr:"MCG",  color:"#ED1B2F", name:"McGill University",               country:"Canada · Montreal", program:"BSc Computer Science",   status:"in_review",   deadline:null,         decision:"Q2 2027", admitRate:44, note:"Interview stage"                             },
  { id:"u5", abbr:"UofT", color:"#003FA5", name:"University of Toronto",           country:"Toronto, Canada",   program:"Computer Science",       status:"submitted",   deadline:null,         decision:"Q2 2027", admitRate:51, note:""                                           },
  { id:"u6", abbr:"NYU",  color:"#57068C", name:"NYU Abu Dhabi",                   country:"AE · scholarship",  program:"BSc Computer Science",   status:"in_progress", deadline:"2027-07-01", decision:null,      admitRate:15, note:"Highly selective"                            },
  { id:"u7", abbr:"SQU",  color:"#006C3B", name:"Sultan Qaboos University",        country:"Oman",              program:"Computer Science",       status:"researching", deadline:null,         decision:null,      admitRate:82, note:"GPA 3.5 required"                            },
];

const MOCK_DOCS: Doc[] = [
  { name: "Personal IB grades (transcript)",        status: "uploaded"     },
  { name: "IELTS score report",                     status: "uploaded"     },
  { name: "Up-to-date ID photo (×3)",               status: "uploaded"     },
  { name: "Reference letter · academic (Mr. Alamy)",status: "uploaded"     },
  { name: "Reference letter · academic (Ms. Sara)", status: "uploaded"     },
  { name: "Reference letter · personal",            status: "uploaded"     },
  { name: "Personal statement",                     status: "in_progress", detail: "Draft 3 · AI feedback waiting · 11 days ago" },
  { name: "CV / activities list",                   status: "uploaded",    detail: "Updated 5 days ago"                           },
  { name: "IB Transcript (predicted)",              status: "uploaded"     },
];

const MOCK_SCORES: TestScore[] = [
  { name: "IELTS Academic",  score: "6.8",  suffix: "/9+"  },
  { name: "SAT",             score: "1480", suffix: ""     },
  { name: "Predicted IB",    score: "43",   suffix: "/45", note: "by your teachers" },
  { name: "SAT Math II",     score: "",     suffix: "",    cta: "Begin"            },
];

const MOCK_PLACEMENT: PlacementUni[] = [
  { name: "UCL CS",    admitRate: 52 },
  { name: "King's CS", admitRate: 38 },
  { name: "McGill CS", admitRate: 44 },
  { name: "NYUAD CS",  admitRate: 15 },
];

const MOCK_NEEDLE: NeedleMover[] = [
  {
    label: "PATH TO UCL",
    title: "Take the SAT Math II subject test",
    desc: "The 50 applicants who added it last year moved from waitlist to admit. Next sitting: 7 Dec.",
  },
  {
    label: "PATH TO MCGILL",
    title: "Lead a community volunteering project",
    desc: "Historically, McGill values community leadership. Manhaj says you have a project planned — could you formalise a final draft?",
  },
  {
    label: "PATH TO ALL",
    title: "Finish personal statement draft 4",
    desc: "Ms. Hala's Draft 3 feedback is waiting. Key revisions historically move the predicted ratio by 8.5%.",
  },
];

const MOCK_ANON: AnonStudent[] = [
  { year:"2024", ib:43, sat:1520, note:"Same CS focus · led robotics club",        outcomes:["UCL","McGill","AMS U"]           },
  { year:"2024", ib:42, sat:1480, note:"CS & maths · part-time data work",          outcomes:["UCL WAITLIST","GOOD S","START U"] },
  { year:"2025", ib:42, sat:1500, note:"CS maths · IB diploma ×53",                 outcomes:["McGill","ADMIT U"]               },
  { year:"2023", ib:41, sat:1480, note:"CS maths · volunteer activities",            outcomes:["UCL","GOOD S","AUS U"]           },
];

const STUDY_ASSIST = [
  "Get feedback on a draft essay",
  "Practice interview questions",
  "Compare 2 universities",
  "Build a deadline plan",
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, { label: string; bg: string; color: string }> = {
  researching: { label: "RESEARCHING", bg: "#EDF2F7", color: "#4A5568"  },
  in_progress: { label: "IN PROGRESS", bg: "#EBF8FF", color: "#2B6CB0"  },
  submitted:   { label: "SUBMITTED",   bg: "#F0FFF4", color: "#276749"  },
  in_review:   { label: "IN REVIEW",   bg: "#FEEBC8", color: "#975A16"  },
  admitted:    { label: "ADMITTED",    bg: "#C6F6D5", color: "#276749"  },
  rejected:    { label: "REJECTED",    bg: "#FED7D7", color: "#C53030"  },
};

const ALL_STATUSES: AppStatus[] = ["researching","in_progress","submitted","in_review","admitted","rejected"];
const STATUS_LABELS: Record<AppStatus,string> = {
  researching:"RESEARCHING", in_progress:"IN PROGRESS", submitted:"SUBMITTED",
  in_review:"IN REVIEW", admitted:"ADMITTED", rejected:"REJECTED",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApplicationTrackerClient({ studentName, apps, rubricScores, counselor, isMock }: Props) {
  const displayName   = studentName || "Layla";
  const activeApps    = isMock ? MOCK_APPS : apps;
  const activeCounselor = counselor ?? { name: "Ms. Hala Al-Aatari", nextSession: "Mon 2 Jan · 3:30 PM" };

  const [activeFilter, setActiveFilter] = useState<AppStatus | "all">("all");

  // Status counts
  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = activeApps.filter(a => {
      if (isMock) return (a as MockApp).status === s;
      return (a as UniversityApp).status === s;
    }).length;
    return acc;
  }, {} as Record<AppStatus, number>);

  const filteredApps = activeFilter === "all"
    ? activeApps
    : activeApps.filter(a => {
        const st = isMock ? (a as MockApp).status : (a as UniversityApp).status;
        return st === activeFilter;
      });

  function renderApp(app: MockApp | UniversityApp) {
    const isM    = isMock;
    const ma     = isM ? app as MockApp : null;
    const ra     = isM ? null : app as UniversityApp;
    const name   = isM ? ma!.name   : ra!.universityName;
    const abbr   = isM ? ma!.abbr   : ra!.universityName.slice(0,3).toUpperCase();
    const color  = isM ? ma!.color  : "#4A5568";
    const cntry  = isM ? ma!.country: ra!.country;
    const prog   = isM ? ma!.program: ra!.program;
    const status = (isM ? ma!.status: ra!.status) as AppStatus;
    const dl     = isM ? ma!.deadline    : ra!.deadline;
    const dec    = isM ? ma!.decision    : ra!.decisionDate;
    const rate   = isM ? ma!.admitRate   : (ra!.admissionRatePct ?? 0);
    const note   = isM ? ma!.note        : (ra!.notes ?? "");
    const cfg    = STATUS_CFG[status];

    return (
      <div key={app.id} className="at-app-row">
        <div className="at-app-logo" style={{ background: color }}>
          {abbr.slice(0,3)}
        </div>
        <div className="at-app-info">
          <div className="at-app-name">{name}</div>
          <div className="at-app-sub">{cntry} · {prog}</div>
        </div>
        <div className="at-app-status-col">
          <span className="at-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          {dl && <div className="at-app-deadline">Due {new Date(dl + "T00:00:00Z").toLocaleDateString("en-GB", { day:"numeric", month:"short", timeZone:"UTC" })}</div>}
          {dec && !dl && <div className="at-app-decision">Decision {dec}</div>}
        </div>
        <div className="at-app-rate-col">
          <div className="at-admit-bar-wrap">
            <div className="at-admit-bar-fill" style={{ width: `${rate}%` }} />
          </div>
          <div className="at-admit-pct">{rate}% adm</div>
          {note && <div className="at-app-note">{note}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="at-page">

      {/* ── Full-width header ─────────────────────────────────────────────── */}
      <div className="at-header">
        <h1 className="at-title">My university applications · 2026/27 entry</h1>
        <p className="at-subtitle">
          {activeApps.length} applications in motion. 3 deadlines this month.
          Your counsellor, {activeCounselor.name.split(" ").slice(-2).join(" ")}, is your partner in this — message her any time.
        </p>
      </div>

      {/* ── Status strip ─────────────────────────────────────────────────── */}
      <div className="at-status-strip">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            className={`at-status-tab${activeFilter === s ? " active" : ""}`}
            onClick={() => setActiveFilter(prev => prev === s ? "all" : s)}
          >
            <span className="at-tab-num">{counts[s]}</span>
            <span className="at-tab-label">{STATUS_LABELS[s]}</span>
          </button>
        ))}
      </div>

      {/* ── UCL alert banner ─────────────────────────────────────────────── */}
      <div className="at-alert-banner">
        <div className="at-alert-left">
          <div className="at-alert-msg">
            <strong>UCL deadline is in 12 days</strong> · your personal statement is at draft 3.
            Ms. Hala has feedback waiting on it — recommend reviewing this weekend.
          </div>
          <div className="at-alert-sub">
            Drafted by Manhaj AI · personal statements are reviewed by your counsellor before any AI feedback is marked
          </div>
        </div>
        <button className="at-alert-btn">Open with Ms. Hala</button>
      </div>

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="at-body">

        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="at-main">

          {/* Applications list */}
          <div className="at-section">
            <div className="at-section-hdr">
              <span className="at-section-label">YOUR APPLICATIONS</span>
              <button className="at-add-btn">+ Add a university</button>
            </div>
            <div className="at-app-list">
              {filteredApps.map(a => renderApp(a as MockApp))}
            </div>
          </div>

          {/* Placement insights */}
          <div className="at-section">
            <div className="at-section-hdr">
              <span className="at-section-label">PLACEMENT INSIGHTS — WHERE YOU STAND</span>
            </div>
            <div className="at-placement-card">
              <div className="at-placement-left">
                <div className="at-placement-eyebrow">YOUR PROFILE ON 5YR Y12 COHORT</div>
                <div className="at-placement-rank">Top 18%</div>
                <div className="at-placement-profile">
                  Predicted IB: 43 · SAT: 1480 · GS: 78.5 · strong extracurriculars
                </div>
              </div>
              <div className="at-placement-right">
                <div className="at-placement-eyebrow">5-YEAR IBO RANK: 18 PROGRAMME</div>
                {MOCK_PLACEMENT.map((p, i) => (
                  <div key={i} className="at-placement-row">
                    <span className="at-placement-uni">{p.name}</span>
                    <div className="at-placement-bar-wrap">
                      <div className="at-placement-bar-fill" style={{ width: `${p.admitRate}%` }} />
                    </div>
                    <span className="at-placement-rate">{p.admitRate}% adm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What would move the needle */}
          <div className="at-section">
            <div className="at-section-hdr">
              <span className="at-section-label">WHAT WOULD MOVE THE NEEDLE MOST</span>
            </div>
            <div className="at-needle-grid">
              {MOCK_NEEDLE.map((n, i) => (
                <div key={i} className="at-needle-card">
                  <div className="at-needle-label">{n.label}</div>
                  <div className="at-needle-title">{n.title}</div>
                  <div className="at-needle-desc">{n.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous past students */}
          <div className="at-section">
            <div className="at-section-hdr">
              <span className="at-section-label">ANONYMOUS PAST STUDENTS WITH SIMILAR PROFILES</span>
            </div>
            <div className="at-anon-card">
              <table className="at-anon-table">
                <thead>
                  <tr>
                    <th>CLASS</th>
                    <th>IB</th>
                    <th>SAT</th>
                    <th>PROFILE NOTE</th>
                    <th>OUTCOME</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ANON.map((s, i) => (
                    <tr key={i}>
                      <td>{s.year}</td>
                      <td>{s.ib}</td>
                      <td>{s.sat}</td>
                      <td>{s.note}</td>
                      <td>
                        <div className="at-outcome-chips">
                          {s.outcomes.map((o, j) => (
                            <span key={j} className="at-outcome-chip">{o}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="at-anon-footer">
                About these numbers: Manhaj&apos;s internal model is trained on 5 years of applicant outcomes (50 senior classes). Match scores are indicative only — universities make the final call, and many things outside our data matter too. Use this as a planning aid, not a verdict.
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="at-sidebar">

          {/* Master docs */}
          <div className="at-side-card">
            <div className="at-side-label">YOUR MASTER DOCS</div>
            <div className="at-doc-list">
              {MOCK_DOCS.map((d, i) => (
                <div key={i} className="at-doc-row">
                  <span className={`at-doc-icon${d.status === "uploaded" ? " ok" : d.status === "in_progress" ? " wip" : " miss"}`}>
                    {d.status === "uploaded" ? "✓" : d.status === "in_progress" ? "·" : "!"}
                  </span>
                  <div className="at-doc-info">
                    <div className="at-doc-name">{d.name}</div>
                    {d.detail && <div className="at-doc-detail">{d.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test scores */}
          <div className="at-side-card">
            <div className="at-side-label">TEST SCORES</div>
            <div className="at-scores-list">
              {MOCK_SCORES.map((s, i) => (
                <div key={i} className="at-score-row">
                  <span className="at-score-name">{s.name}</span>
                  {s.score
                    ? <span className="at-score-val">{s.score}<span className="at-score-suffix">{s.suffix}</span>{s.note && <span className="at-score-note"> · {s.note}</span>}</span>
                    : <button className="at-score-cta">{s.cta}</button>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Study assistant */}
          <div className="at-side-card at-assist-card">
            <div className="at-side-label">MANHAJ STUDY ASSISTANT</div>
            <div className="at-assist-list">
              {STUDY_ASSIST.map((item, i) => (
                <button key={i} className="at-assist-item">
                  <span className="at-assist-arrow">›</span> {item}
                </button>
              ))}
            </div>
          </div>

          {/* Counsellor */}
          <div className="at-side-card">
            <div className="at-side-label">YOUR COUNSELLOR</div>
            <div className="at-counselor-row">
              <div className="at-counselor-avatar">
                {activeCounselor.name.split(" ").filter(w => w.length > 2).slice(0,2).map(w => w[0]).join("")}
              </div>
              <div>
                <div className="at-counselor-name">{activeCounselor.name}</div>
                {activeCounselor.nextSession && (
                  <div className="at-counselor-next">Next session: {activeCounselor.nextSession}</div>
                )}
              </div>
            </div>
            <button className="at-book-btn">Book a 1:1 session</button>
          </div>

        </div>
      </div>
    </div>
  );
}
