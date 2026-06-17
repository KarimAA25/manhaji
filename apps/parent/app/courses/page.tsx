"use client";

/**
 * Parent course-selection form — Tier 1 port with REAL DB writes.
 *
 * Replicates the static demo's 4-step wizard (basic info → compulsory →
 * electives → review), then on Submit calls the submitCourseSelection
 * server action which writes to course_selection_forms +
 * course_selection_picks in Supabase.
 *
 * Visual design intentionally identical to the Tier 0 static demo at
 * https://manhaj.pages.dev/parent/select-courses — parents see no jump.
 */

import { useEffect, useMemo, useState } from "react";
import { submitCourseSelection, type SubmitPayload, type SubmitResult } from "@/app/actions/submit-course-selection";
import { OFFERINGS } from "@manhaj/lib/electives";
import { labelFor } from "@manhaj/lib/subject-labels";

type Grade = "9" | "10" | "11" | "12";
type Lang = "en" | "ar";

const STEP_NAMES: Array<{ en: string; ar: string }> = [
  { en: "Student",    ar: "الطالب" },
  { en: "Compulsory", ar: "إلزامي" },
  { en: "Electives",  ar: "اختياري" },
  { en: "Review",     ar: "مراجعة" },
];

// localStorage key — bump the version suffix if the schema changes so old drafts get ignored.
const DRAFT_KEY = "manhaj.parent.courseSelection.draft.v1";

type Draft = {
  step: number;
  studentName: string;
  grade: Grade;
  languagePref: string;
  picks: Record<string, string>;
  savedAt: number;
};

export default function CourseSelectionPage() {
  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<Lang>("en");

  const [studentName, setStudentName] = useState("Sample Student");
  const [grade, setGrade] = useState<Grade>("9");
  const [languagePref, setLanguagePref] = useState<string>("Ar");
  const [picks, setPicks] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on first mount. This is the legit "load
  // browser-only data after mount" pattern; React's set-state-in-effect lint
  // rule flags it but the alternative (lazy state init) can't read
  // localStorage during SSR. We batch all setStates in this single effect.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<Draft>;
        if (d && typeof d === "object") {
          /* eslint-disable react-hooks/set-state-in-effect */
          if (typeof d.step === "number" && d.step >= 1 && d.step <= 4) setStep(d.step);
          if (typeof d.studentName === "string") setStudentName(d.studentName);
          if (d.grade && ["9", "10", "11", "12"].includes(d.grade)) setGrade(d.grade as Grade);
          if (typeof d.languagePref === "string") setLanguagePref(d.languagePref);
          if (d.picks && typeof d.picks === "object") setPicks(d.picks as Record<string, string>);
          setDraftRestored(true);
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch {
      // localStorage parse failure — fine to ignore; we just start fresh.
    }
    setHydrated(true);
  }, []);

  // Persist on every relevant change (but not during the initial hydration pass).
  useEffect(() => {
    if (!hydrated) return;
    if (result?.ok) return; // don't keep persisting after a successful submit
    try {
      const draft: Draft = { step, studentName, grade, languagePref, picks, savedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Quota exceeded / private-mode — silent. Auto-save is a nice-to-have.
    }
  }, [hydrated, step, studentName, grade, languagePref, picks, result]);

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    setDraftRestored(false);
  }

  function discardDraft() {
    clearDraft();
    setStep(1);
    setStudentName("Sample Student");
    setGrade("9");
    setLanguagePref("Ar");
    setPicks({});
  }

  const offering = OFFERINGS[grade];

  // Compulsory: swap Ar for language preference if user picked French
  const compulsoryCodes = useMemo(() => {
    return offering.compulsory.map(c => (c === "Ar" && languagePref !== "Ar" ? languagePref : c));
  }, [offering, languagePref]);

  const t = (en: string, ar: string) => (lang === "en" ? en : ar);

  function goto(next: number) {
    if (step === 3 && next === 4) {
      // Validate all bundles have picks
      const missing = offering.bundles.filter(b => !picks[b.label]);
      if (missing.length > 0) {
        setError(t(
          `Please pick one option per row. ${missing.length} pending.`,
          `يرجى اختيار خيار من كل صف. ${missing.length} متبقي.`,
        ));
        return;
      }
    }
    setError(null);
    setStep(next);
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    const payload: SubmitPayload = {
      student_name: studentName.trim(),
      grade,
      language_choice: languagePref,
      bundle_picks: picks,
    };
    const r = await submitCourseSelection(payload);
    setSubmitting(false);
    setResult(r);
    if (r.ok) {
      setStep(5);
      clearDraft();
    } else {
      setError(r.error);
    }
  }

  // Sync <html lang/dir> when the parent wizard toggles AR.
  // Screen readers + browser spellcheckers + line-breaking all use the doc-level
  // attribute, not inline style.direction.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "ar" ? "ar" : "en";
      document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = "en";
        document.documentElement.dir  = "ltr";
      }
    };
  }, [lang]);

  return (
    <div className="pc-shell" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      <header className="topbar pc-topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div><div className="brand-name">Manhaj <span className="brand-sub">· International School of Oman</span></div></div>
        </div>
        <div className="top-right">
          <button
            className="btn ghost pc-lang-btn"
            style={{ marginRight: 4, opacity: lang === "en" ? 1 : .55 }}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >EN</button>
          <button
            className="btn ghost pc-lang-btn"
            style={{ opacity: lang === "ar" ? 1 : .55 }}
            onClick={() => setLang("ar")}
            aria-pressed={lang === "ar"}
          >العربية</button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {/* Progress with named steps */}
        <ol className="pc-progress" aria-label={t("Form progress", "تقدم النموذج")}>
          {[1, 2, 3, 4].map(s => (
            <ProgressStep key={s} n={s} current={step} name={t(STEP_NAMES[s-1].en, STEP_NAMES[s-1].ar)} isLast={s === 4} />
          ))}
        </ol>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="banner"
            style={{ background: "#FED7D7", borderColor: "#FC8181", color: "#742A2A" }}
          >
            {error}
          </div>
        )}

        {draftRestored && step < 5 && (
          <div
            role="status"
            aria-live="polite"
            className="banner"
            style={{
              background: "#EBF4FF", borderColor: "#90CDF4", color: "#2A4365",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}
          >
            <span>
              {t(
                "We restored your previous draft so you can pick up where you left off.",
                "تم استعادة المسودة السابقة لتتمكن من المتابعة من حيث توقفت.",
              )}
            </span>
            <button
              type="button"
              className="btn ghost"
              style={{ padding: "6px 12px", fontSize: 11 }}
              onClick={() => setDraftRestored(false)}
            >
              {t("Continue", "متابعة")}
            </button>
            <button
              type="button"
              className="btn ghost"
              style={{ padding: "6px 12px", fontSize: 11 }}
              onClick={discardDraft}
            >
              {t("Start over", "البدء من جديد")}
            </button>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h1>{t("Course selection · AY 2026/27", "اختيار المواد الدراسية · العام الدراسي 2026/27")}</h1>
            <p className="sub">{t("Please select your child's grade for next year to begin.", "يرجى تحديد صف ابنك/ابنتك للعام المقبل للبدء.")}</p>

            <div className="field">
              <label>{t("Student name", "اسم الطالب")}</label>
              <input value={studentName} onChange={e => setStudentName(e.target.value)} />
            </div>

            <div className="field">
              <label>{t("Grade in AY 2026/27", "الصف في العام الدراسي 2026/27")}</label>
              <select value={grade} onChange={e => setGrade(e.target.value as Grade)}>
                <option value="9">Grade 9 · IGCSE (pick 5)</option>
                <option value="10">Grade 10 · IGCSE (pick 5)</option>
                <option value="11">Grade 11 · AS / GDE (pick 3)</option>
                <option value="12">Grade 12 · A2 / GDE (pick 3)</option>
              </select>
            </div>

            <div className="field">
              <label>{t("Language preference (compulsory)", "تفضيل اللغة (إجباري)")}</label>
              <select value={languagePref} onChange={e => setLanguagePref(e.target.value)}>
                <option value="Ar">Arabic</option>
                <option value="F2">French (Stage 2)</option>
                <option value="F3">French (Stage 3)</option>
              </select>
            </div>

            <FooterActions
              onBack={null}
              onNext={() => goto(2)}
              nextLabel={t("Continue →", "متابعة →")}
            />
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h1>{t(`Compulsory subjects · Grade ${grade}`, `المواد الإلزامية · الصف ${grade}`)}</h1>
            <p className="sub">{t("These are required for all students at this grade. You'll choose electives next.", "هذه المواد إلزامية لجميع طلاب هذا الصف. ستختار المواد الاختيارية تالياً.")}</p>

            <div style={{ background: "#FAFCFE", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
              <div className="card-label">{t("Compulsory", "إلزامي")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {compulsoryCodes.map(c => {
                  const l = labelFor(c);
                  return (
                    <span key={c} style={{ background: "var(--soft)", color: "var(--ink)", fontSize: 11.5, padding: "5px 10px", borderRadius: 8, fontWeight: 600 }}>
                      <b>{lang === "ar" ? (l.name_ar || l.name_en) : l.name_en}</b>
                      {l.name_ar && lang === "en" && <span style={{ opacity: .6 }}> · {l.name_ar}</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            <FooterActions
              onBack={() => goto(1)}
              onNext={() => goto(3)}
              backLabel={t("← Back", "← رجوع")}
              nextLabel={t("Continue to electives →", "متابعة إلى المواد الاختيارية →")}
            />
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h1>{t(`Electives · pick ${offering.pick_count} in total (one per row)`, `المواد الاختيارية · اختر ${offering.pick_count} من المجموع`)}</h1>
            <p className="sub">{t("Each row offers a choice. Pick one option per row.", "كل صف يقدم خياراً. اختر خياراً واحداً لكل صف.")}</p>

            {offering.bundles.map((bundle, bi) => (
              <div key={bundle.label} className="choice-group">
                <div className="choice-label">{t("Bundle", "مجموعة")} {bi + 1} · {bundle.label}</div>
                <div className="choice-options">
                  {bundle.options.map(code => {
                    const l = labelFor(code);
                    const selected = picks[bundle.label] === code;
                    return (
                      <button
                        key={code}
                        className={`choice ${selected ? "selected" : ""}`}
                        onClick={() => setPicks({ ...picks, [bundle.label]: code })}
                      >
                        {lang === "ar" ? (l.name_ar || l.name_en) : l.name_en}
                        {((lang === "en" && l.name_ar) || (lang === "ar" && l.name_en)) && (
                          <span className="ar">{lang === "ar" ? l.name_en : l.name_ar}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <FooterActions
              onBack={() => goto(2)}
              onNext={() => goto(4)}
              backLabel={t("← Back", "← رجوع")}
              nextLabel={t("Review selection →", "مراجعة الاختيار →")}
            />
          </div>
        )}

        {/* STEP 4 — review */}
        {step === 4 && (
          <ReviewStep
            t={t}
            grade={grade}
            studentName={studentName}
            compulsoryCodes={compulsoryCodes}
            picks={picks}
            lang={lang}
            onBack={() => goto(3)}
            onSubmit={onSubmit}
            submitting={submitting}
          />
        )}

        {/* STEP 5 — success */}
        {step === 5 && result?.ok && (
          <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#C6F6D5", color: "#22543D", fontSize: 28, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>✓</div>
            <h1>{t("Submitted", "تم الإرسال")}</h1>
            <p className="sub" style={{ marginBottom: 18 }}>
              {t(
                "Your selection is saved. The school administration will review and email you by 29 January 2026 if anything needs to change.",
                "تم حفظ اختياركم. ستراجعه إدارة المدرسة وسيتم التواصل معكم عبر البريد الإلكتروني قبل 29 يناير 2026 إذا احتجنا أي تعديل.",
              )}
            </p>
            <div style={{ display: "inline-block", textAlign: "left", background: "#FAFCFE", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px", fontSize: 12.5, color: "var(--muted)" }}>
              <div>
                <b style={{ color: "var(--ink)" }}>{t("Reference", "رقم المرجع")}:</b>{" "}
                <code style={{ fontFamily: "'SF Mono', 'Menlo', monospace" }}>
                  ISO-{result.form_id.slice(0, 6).toUpperCase()}
                </code>
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>{t("Subjects saved", "المواد المحفوظة")}:</b> {result.picks_count}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProgressStep({ n, current, name, isLast }: { n: number; current: number; name: string; isLast: boolean }) {
  const isDone = n < current;
  const isActive = n === current;
  return (
    <li aria-current={isActive ? "step" : undefined}>
      <div className="pc-step">
        <div
          className="pc-step-dot"
          style={{
            background: isDone ? "var(--success)" : isActive ? "var(--primary)" : "var(--soft)",
            color: isDone || isActive ? "#fff" : "var(--muted)",
          }}
        >
          {isDone ? "✓" : n}
        </div>
        <span
          className="pc-step-name"
          style={{
            fontWeight: isActive ? 700 : 500,
            color: isActive ? "var(--primary)" : "var(--muted)",
          }}
        >{name}</span>
      </div>
      {!isLast && (
        <div
          className="pc-step-conn"
          style={{ background: isDone ? "var(--success)" : "var(--border)" }}
        />
      )}
    </li>
  );
}

function FooterActions({
  onBack, onNext, nextLabel, backLabel,
}: { onBack: (() => void) | null; onNext: () => void; nextLabel: string; backLabel?: string }) {
  return (
    <div className="pc-actions">
      {onBack ? (
        <button className="btn ghost" onClick={onBack}>{backLabel}</button>
      ) : <span />}
      <button className="btn primary" onClick={onNext}>{nextLabel}</button>
    </div>
  );
}

function ReviewStep({
  t, grade, studentName, compulsoryCodes, picks, lang, onBack, onSubmit, submitting,
}: {
  t: (en: string, ar: string) => string;
  grade: Grade;
  studentName: string;
  compulsoryCodes: string[];
  picks: Record<string, string>;
  lang: Lang;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const offering = OFFERINGS[grade];
  const total = compulsoryCodes.length + Object.keys(picks).length;

  return (
    <div>
      <div className="pc-review-hero">
        <h2>
          {t("All set — please review and confirm", "تم — يرجى المراجعة والتأكيد")}
        </h2>
        <p style={{ margin: 0, fontSize: 12.5, opacity: .85 }}>
          {t("Once you submit, the school administration will see your selection.", "بمجرد الإرسال، ستظهر اختياراتك لإدارة المدرسة.")}
        </p>
        <div className="pc-review-stats">
          <Stat n={grade} l={t("Grade", "الصف")} />
          <Stat n={compulsoryCodes.length} l={t("Compulsory", "إلزامي")} />
          <Stat n={Object.keys(picks).length} l={t("Electives", "اختياري")} />
          <Stat n={total} l={t("Total subjects", "إجمالي المواد")} />
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
        <PickRow l={t("Student", "الطالب")} v={studentName} />
        <PickRow l={t("Academic year", "العام الدراسي")} v="2026 / 2027" />
        <PickRow l={t("Grade", "الصف")} v={`${grade} · ${offering.stage}`} />
        <div style={{ marginTop: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, color: "var(--muted)" }}>
          {t("Compulsory", "إلزامي")}
        </div>
        {compulsoryCodes.map(c => {
          const l = labelFor(c);
          return (
            <PickRow
              key={c}
              l={lang === "ar" ? (l.name_ar || l.name_en) : l.name_en}
              v={lang === "ar" ? l.name_en : l.name_ar}
            />
          );
        })}
        <div style={{ marginTop: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700, color: "var(--muted)" }}>
          {t("Electives", "اختياري")}
        </div>
        {Object.entries(picks).map(([bundle, code]) => {
          const l = labelFor(code);
          return (
            <PickRow
              key={bundle}
              l={(lang === "ar" ? (l.name_ar || l.name_en) : l.name_en) + (l.name_ar && lang === "en" ? ` · ${l.name_ar}` : "")}
              v={bundle}
            />
          );
        })}
      </div>

      <div className="pc-actions">
        <button className="btn ghost" onClick={onBack} disabled={submitting}>
          {t("← Back to electives", "← رجوع إلى المواد الاختيارية")}
        </button>
        <button className="btn primary" onClick={onSubmit} disabled={submitting} aria-busy={submitting}>
          {submitting
            ? t("Saving…", "جارٍ الحفظ…")
            : t("Submit selection", "إرسال الاختيار")}
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <b style={{ display: "block", fontSize: 20, fontWeight: 800 }}>{n}</b>
      <span>{l}</span>
    </div>
  );
}

function PickRow({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed var(--border)", fontSize: 12.5 }}>
      <span style={{ color: "var(--muted)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 700 }}>{l}</span>
      <span style={{ fontWeight: 700, color: "var(--ink)" }}>{v}</span>
    </div>
  );
}
