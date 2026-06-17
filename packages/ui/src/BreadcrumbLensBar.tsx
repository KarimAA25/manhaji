"use client";

/**
 * Breadcrumb + lens-toggle bar used at the top of every Phase 2 admin tab.
 *
 * The breadcrumb is a static visual chain (steps[].active marks the current
 * step). The lens toggle is interactive — three pills (Principal / Student
 * Advisor / Teacher) — and calls onLensChange.
 */

export type BreadcrumbStep = { label: string; href?: string; active?: boolean };
export type Lens = "principal" | "advisor" | "teacher";

const LENS_LABELS: Record<Lens, string> = {
  principal: "Principal",
  advisor:   "Student Advisor",
  teacher:   "Teacher",
};

export default function BreadcrumbLensBar({
  steps, lens, onLensChange,
}: {
  steps:        BreadcrumbStep[];
  lens:         Lens;
  onLensChange: (next: Lens) => void;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="bclens-crumb">
        {steps.map((step, i) => (
          <span key={`${i}-${step.label}`} className="bclens-crumb-row">
            {i > 0 && <span className="bclens-crumb-arrow" aria-hidden="true">▸</span>}
            <span className={`bclens-step ${step.active ? "active" : ""}`}>{step.label}</span>
          </span>
        ))}
      </nav>
      <div role="tablist" aria-label="Switch lens" className="bclens-lens">
        {(["principal", "advisor", "teacher"] as Lens[]).map(l => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={l === lens}
            onClick={() => onLensChange(l)}
            className={`bclens-lens-pill ${l === lens ? "active" : ""}`}
          >
            {LENS_LABELS[l]}
          </button>
        ))}
      </div>
    </>
  );
}
