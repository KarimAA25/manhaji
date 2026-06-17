"use client";

/**
 * StudentSearchFilter — name search + section dropdown for the Admin Students tab.
 *
 * Designed to sit above FilterChipRow and use the same design tokens.
 * Both filters combine with AND semantics in the parent page's useMemo.
 *
 * Props:
 *  searchValue     current text search value
 *  sectionValue    currently selected section code ("" = All sections)
 *  onSearchChange  callback when search input changes
 *  onSectionChange callback when section dropdown changes
 *  sections        sorted list of unique section codes to populate the dropdown
 */

export interface StudentSearchFilterProps {
  searchValue:      string;
  sectionValue:     string;
  onSearchChange:   (value: string) => void;
  onSectionChange:  (value: string) => void;
  sections:         string[];
}

export default function StudentSearchFilter({
  searchValue,
  sectionValue,
  onSearchChange,
  onSectionChange,
  sections,
}: StudentSearchFilterProps) {
  return (
    <div className="ssf-bar" role="search" aria-label="Filter students">
      {/* Name search */}
      <div className="ssf-search-wrap">
        <svg className="ssf-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          className="ssf-search-input"
          placeholder="Search by student name…"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="Search by student name"
        />
        {searchValue && (
          <button
            type="button"
            className="ssf-clear-btn"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* Section dropdown */}
      <div className="ssf-select-wrap">
        <select
          className="ssf-select"
          value={sectionValue}
          onChange={e => onSectionChange(e.target.value)}
          aria-label="Filter by section"
        >
          <option value="">All sections</option>
          {sections.map(sec => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
        <svg className="ssf-select-chevron" width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
