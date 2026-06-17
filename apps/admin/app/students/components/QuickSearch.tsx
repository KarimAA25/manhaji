"use client";

/**
 * Admin · Students · Quick search (Cmd-K).
 *
 * Typeahead across student name, parent name, ID, and section code.
 * Phase 2.15 — matches the "Quick search · Cmd-K" block from students-deep-v2.html.
 */

import { useState, useEffect, useRef } from "react";
import { MOCK_STUDENTS } from "@manhaj/lib/mock-students";

type Result = {
  id:      string;
  label:   string;
  sub:     string;
  kind:    "student" | "section";
};

function buildIndex(): Result[] {
  const results: Result[] = [];
  const sections = new Set<string>();

  for (const s of MOCK_STUDENTS) {
    results.push({
      id:    s.id,
      label: s.full_name,
      sub:   `${s.section_code} · ${s.grade_band} · ID ${s.id}`,
      kind:  "student",
    });
    if (!sections.has(s.section_code)) {
      sections.add(s.section_code);
      results.push({
        id:    `sec-${s.section_code}`,
        label: `Section ${s.section_code}`,
        sub:   `${MOCK_STUDENTS.filter(x => x.section_code === s.section_code).length} students`,
        kind:  "section",
      });
    }
  }

  return results;
}

const INDEX = buildIndex();

export default function QuickSearch() {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length === 0
    ? []
    : INDEX.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.sub.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 8);

  // Cmd-K / Ctrl-K global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown")  { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === "Escape")     { setOpen(false); setQuery(""); }
  }

  return (
    <section className="qs-card" aria-label="Quick search">
      <div className="qs-head">
        <div className="qs-title">Quick search</div>
        <div className="qs-kbd">Cmd K</div>
      </div>
      <div className="qs-input-wrap">
        <span className="qs-icon" aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          className="qs-input"
          type="search"
          placeholder="Search student name, ID, or section…"
          value={query}
          aria-label="Search students"
          autoComplete="off"
          onChange={e => { setQuery(e.target.value); setOpen(true); setFocused(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKey}
        />
      </div>

      {open && results.length > 0 && (
        <ul className="qs-results" role="listbox" aria-label="Search results">
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === focused}
              className={`qs-result${i === focused ? " qs-result-active" : ""}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setQuery(r.label); setOpen(false); }}
            >
              <span className={`qs-kind qs-kind-${r.kind}`}>
                {r.kind === "student" ? "S" : "§"}
              </span>
              <div>
                <div className="qs-result-label">{r.label}</div>
                <div className="qs-result-sub">{r.sub}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length > 0 && results.length === 0 && (
        <div className="qs-empty">No students or sections match &ldquo;{query}&rdquo;</div>
      )}
    </section>
  );
}
