"use client";

import { useState } from "react";
import type { RegulatoryUpcomingRow } from "@manhaj/lib/queries/reports";
import { generateHref, slugForCatalogName, getReportDef } from "../catalogue";
import { recordSubmission } from "../actions";

type Urgency = "urgent" | "soon" | "upcoming";

type UpcomingItem = {
  id: string;
  slug: string;
  title: string;
  form: string;
  description: string;
  period: string;
  due_label: string;
  urgency: Urgency;
  /** true → the primary button also records a submission (Generate & submit). */
  canSubmit: boolean;
};

// Real Oman MoE recurring returns (research §2A) — used when the live
// regulatory_report_catalog is empty (the standing OR-fallback).
const MOCK_UPCOMING: UpcomingItem[] = [
  {
    id: "r1",
    slug: "r1-annual-comprehensive",
    title: "Annual Comprehensive Report",
    form: "Art. 49",
    description: "student statistics & results · staff roster · PD & activities — the flagship MoE return",
    period: "2025/26 academic year",
    due_label: "DUE ≤30 DAYS AFTER YEAR END",
    urgency: "soon",
    canSubmit: true,
  },
  {
    id: "r4",
    slug: "r4-staff-appointment-plan",
    title: "Staff Appointment Plan",
    form: "Art. 62",
    description: "teaching & admin roster with subjects — annual appointment plan backbone",
    period: "AY 2026/27 planning",
    due_label: "DUE ≥60 DAYS BEFORE YEAR START",
    urgency: "upcoming",
    canSubmit: true,
  },
  {
    id: "r3",
    slug: "r3-bank-statement",
    title: "Certified Bank Statement",
    form: "Art. 46",
    description: "bank-certified account statement — issued by the school's bank",
    period: "6-monthly",
    due_label: "EVERY 6 MONTHS",
    urgency: "upcoming",
    canSubmit: false,
  },
  {
    id: "r7",
    slug: "r7-fee-modification",
    title: "Tuition-Fee Modification Request",
    form: "gov.om",
    description: "windowed fee-change request with justification file",
    period: "On change",
    due_label: "DGPS WINDOW",
    urgency: "upcoming",
    canSubmit: false,
  },
];

function dbToItem(r: RegulatoryUpcomingRow): UpcomingItem {
  const slug = slugForCatalogName(r.name);
  const def = getReportDef(slug);
  return {
    id: r.id,
    slug,
    title: r.name,
    form: r.template_ref ?? def?.formRef ?? "",
    description: r.description ?? def?.summary ?? r.deadline_cadence ?? "",
    period: r.deadline_cadence ?? "—",
    due_label: r.deadline_cadence ?? "—",
    urgency: "upcoming",
    canSubmit: def?.kind === "r1" || def?.kind === "data-plug",
  };
}

export default function UpcomingSubmissions({
  upcoming,
}: {
  upcoming: RegulatoryUpcomingRow[];
}) {
  const items: UpcomingItem[] = upcoming.length > 0 ? upcoming.map(dbToItem) : MOCK_UPCOMING;
  const [busyId, setBusyId] = useState<string | null>(null);

  function openDoc(slug: string) {
    window.open(generateHref(slug), "_blank", "noopener,noreferrer");
  }

  async function generateAndSubmit(item: UpcomingItem) {
    openDoc(item.slug);
    setBusyId(item.id);
    try {
      // Real write path — records status + submitted_by when the DB is wired;
      // no-ops gracefully (demo) so the button is never dead.
      await recordSubmission({ slug: item.slug, title: item.title, periodLabel: item.period });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-label="Upcoming submissions">
      <div className="reg-section-head">
        <span className="reg-section-label">Upcoming submissions</span>
        <span className="reg-section-hint">Oman MoE · official returns</span>
      </div>

      {items.map(item => (
        <div key={item.id} className="reg-upcoming-row">
          <div className="reg-upcoming-body">
            <div className="reg-upcoming-title">{item.title}</div>
            <div className="reg-upcoming-desc">
              {item.form && <span className="reg-upcoming-form">{item.form} · </span>}
              {item.description}
            </div>
          </div>
          <div className="reg-upcoming-right">
            <span className={`reg-badge ${item.urgency}`}>{item.due_label}</span>
            <div className="reg-upcoming-btns">
              <button className="reg-btn" onClick={() => openDoc(item.slug)}>
                Review draft
              </button>
              {item.canSubmit ? (
                <button
                  className="reg-btn primary"
                  onClick={() => generateAndSubmit(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? "Submitting…" : "Generate & submit"}
                </button>
              ) : (
                <button className="reg-btn primary" onClick={() => openDoc(item.slug)}>
                  Open filing
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
