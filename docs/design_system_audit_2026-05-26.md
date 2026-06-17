# Design system audit — Manhaj · 2026-05-26

The product has **no documented design system** as of today. Tokens + components exist in CSS but are scattered across 6 files (2 baseline + 4 inline `<style>` blocks). Drift has crept in.

This audit catalogs what exists, flags inconsistencies (esp. dangerous ones), and proposes a single-source-of-truth `design-tokens.json` for convergence.

---

## Summary

| Metric | Value |
|---|---|
| **Files with styles** | 6 (2 shared CSS + 4 inline `<style>` blocks) |
| **Components reviewed** | 14 |
| **Tokens defined** | 13 colors + ad-hoc spacing/typography (no scale) |
| **Critical inconsistencies (P1)** | **4** |
| **Drift (P2)** | **7** |
| **Polish (P3)** | **5** |
| **Estimated tokenization score** | 38 / 100 |

The biggest gap: ad-hoc spacing values (8px, 14px, 18px, 24px, 28px, 36px) used inconsistently. The biggest risk: heat-cell h1c text color differs between Tier 0 and Tier 1 (one is unreadable, the other is fine).

---

## Where styles live today

| File | Role | Scope |
|---|---|---|
| `demo/assets/styles.css` | Tier 0 shared (linked by every demo HTML) | Topbar, cards, buttons, banners, tables, forms |
| `apps/web/app/globals.css` | Tier 1 baseline (Next.js) | Same as Tier 0 + heatmap CSS + filter-bar + Tailwind 4 `@theme inline` block |
| `demo/admin/dashboard.html` `<style>` | Inline page-specific | .hero-row, .mini, .grid, .filters, .heat-grid (own copy), .heat-cell, .h1c..h4c (no text color), .legend, .summary-rows |
| `demo/admin/attendance.html` `<style>` | Inline page-specific | .hero-row, .mini, .heat-strip (different from heatmap!), .heat-row (own shape), .heat-cell (good/ok/warn/bad — different palette), .grid-2/3, .att-tbl, .week-bar, .abs-row, .badge, .ai-alert, .sparkline |
| `demo/admin/section-mapping.html` `<style>` | Inline page-specific | .map-tbl, .filter-bar (own copy), .progress, .modal, .sql-block, .copied-toast |
| `demo/parent/report.html` `<style>` | Inline page-specific | .page, .cover, .perf-grid, .perf-card, .radar-wrap, .radar-legend, .rubric-table, .rs1..rs5, .plan-grid, .plan-card, .uni-band, .footer-meta, .narrative, .ip-banner |
| `apps/web/app/admin/components/SectionHeatmap.tsx` | Component-scoped (Tailwind 4 utility + inline style for grid-template) | Sorted, theme-aware |
| `apps/web/app/parent/select-courses/page.tsx` | Inline React style objects (no CSS file) | All form/banner/button styles defined per element |

---

## Token inventory + drift

### Color tokens (shared)

| Token | Value | Tier 0 | Tier 1 | Drift |
|---|---|---|---|---|
| `--primary` | `#0B2545` | ✅ | ✅ | identical |
| `--accent` | `#3D5A80` | ✅ | ✅ | identical |
| `--ink` | `#1A2440` | ✅ | ✅ | identical |
| `--muted` | `#6B7C93` | ✅ | ✅ | identical |
| `--border` | `#E5EAF0` | ✅ | ✅ | identical |
| `--soft` | `#EEF2F7` | ✅ | ✅ | identical |
| `--bg` | `#F4F6FA` | ✅ | ✅ | identical |
| `--card` | `#FFFFFF` | ✅ | ✅ | identical |
| `--success` | `#2F855A` | ✅ | ✅ | identical |
| `--warning` | `#C05621` | ✅ | ✅ | identical |
| `--danger` | `#C53030` | ✅ | ✅ | identical |
| `--warn` | `#D69E2E` | ✅ | ✅ | (semantic dupe with `--warning` — see below) |
| `--good`/`--bad` (Tier 0 only) | dupes of success/danger | ✅ | ❌ missing | Tier 0 has `--good: #2F855A; --bad: #C53030` aliases; Tier 1 dropped them. Minor. |

### Hardcoded color leaks (not in tokens)

These hex values appear inline across files and should be promoted to tokens:

| Hex | Where used | Suggested token |
|---|---|---|
| `#FAFCFE` | hover row bg, empty heat-cell bg, ai-alert bg, perf-card bg, uni-band bg, footer-meta bg | `--surface-subtle` |
| `#EDF1F7` | bar-track bg, radar-legend bar bg | (same as `--soft`? no — slightly different. Drop in favor of `--soft #EEF2F7`) |
| `#E1E8F0` | pill hover bg, ghost-btn hover bg | `--soft-hover` |
| `#A0AEC0` | disabled-nav text, soon-pill text variant | `--muted-disabled` |
| `#718096` | soon-pill text | `--muted-disabled` (consolidate w/ A0AEC0) |
| `#FED7D7` | banner-red bg, .tag.att, .badge.unk, gap heat-cell | `--danger-soft` |
| `#FC8181` | banner-red border | `--danger-soft-border` |
| `#742A2A` | banner-red text | `--danger-text-on-soft` |
| `#9B2C2C` | .tag.att, gap heat-cell text, .badge.unk text | (dupe with #742A2A — same intent, different shade) |
| `#FFF8E1` | banner-yellow bg, ip-banner bg | `--warning-soft` |
| `#F6E05E` | banner-yellow border | `--warning-soft-border` |
| `#744210` | banner-yellow text | `--warning-text-on-soft` |
| `#FAF089` | .tag.fee, .badge.fam | `--neutral-soft` |
| `#FEEBC8` | .tag.beh | (intermediate — likely consolidate) |
| `#7B341E` | banner text strong, .badge.beh | (likely drop — banner uses 744210 mostly) |
| `#C6F6D5` | .tag.gr, .badge.cont, attendance "good" | `--success-soft` |
| `#22543D` | .tag.gr text, .badge.cont text, attendance ok-text | `--success-text-on-soft` |
| `#48BB78` | attendance "good" cell, progress-fill end | `--success-bright` |
| `#9AE6B4` | attendance "ok" cell | `--success-soft-bright` |
| `#BEE3F8` | .badge.med | `--info-soft` |
| `#2A4365` | .badge.med text, heat-cell h1c text override | `--info-text-on-soft` |
| `#F0FFF4` | confirmed row bg | `--success-soft-bg` |
| `#E6FCEC` | confirmed row hover bg | `--success-soft-bg-hover` |
| `#F0F2F8` | report body bg (different from `--bg`) | (likely should consolidate with --bg) |
| `#E5E5E5` to `#C7D2DC` | avatar bg, scrollbar | (decorative; OK to keep) |
| `#C5D2E2` / `#7B9AC2` | heat-cell h1c/h2c bg | `--heat-cell-1` / `--heat-cell-2` |
| Heat cell rs1-rs5 colors `#C53030 / #DD6B20 / #D69E2E / #3D5A80 / #0B2545` | rubric matrix cells | Already a 5-step ramp — promote to `--rs-band-1..5` |

**Finding 1 (P2):** ~25 hex literals not tokenized. Most appear in only one file but the .tag/.badge family overlaps significantly. Consolidate.

### Spacing tokens (none — completely ad-hoc)

The codebase uses these pixel values without any system:
- **Vertical padding/margin**: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40 px
- **Horizontal padding**: same range
- **Gap**: 2, 3, 4, 5, 6, 8, 10, 12, 14, 18, 24 px

**Finding 2 (P1):** 23+ distinct spacing values, no scale. Compare to Tailwind's 4-based scale (4/8/12/16/24/32/40) which would cover everything we need. The values 5, 7, 9, 11, 13 etc. are arbitrary — bet they were eyeballed.

**Recommended scale (proposal):**
```
--space-0:  0
--space-1:  4px    (Tailwind 1)
--space-2:  8px    (2)
--space-3:  12px   (3)
--space-4:  16px   (4)
--space-5:  20px   (5)
--space-6:  24px   (6)
--space-8:  32px   (8)
--space-10: 40px   (10)
--space-14: 56px   (14)
```

Migrate non-aligned values: 14 → 16 (closer match), 18 → 16, 22 → 24, 26 → 24, 28 → 24 OR 32. Visual impact minimal; consistency gain large.

### Typography (no scale)

Sizes in active use (from grep across all files):
- 8.5px (soon-pill) — below WCAG min — should be ≥10px
- 9px (heat-cell numbers)
- 9.5px (badges, heat-hdr)
- 10px (table th, badge variants)
- 10.5px (card-label, sub, captions, brand-sub, pill, footer-meta)
- 11px (delta, mini-row, week-bar, perf-band)
- 11.5px (.sub variant, mini-row .row, AI alert, abs-row)
- 12px (body, table td, table th, button, banner)
- 12.5px (nav, choice, draft-row, narrative)
- 13px (logo, brand-name, card-title, body, sec-title)
- 14px (cover school-name)
- 15px (subj, sec-title, h2)
- 16px / 17px / 18px (rarely used)
- 20px (h1)
- 24px (perf-grade, summary-row .v, uni-fit-num)
- 30px (cover h1)
- 32px (big-num)
- 36px (landing hero h1)

**Finding 3 (P1):** 20+ font sizes in use without a defined scale. The `.sub` class alone has TWO variants (12px in styles.css, 11.5px in some inline) — same name, different size.

**Recommended scale (proposal):**
```
--font-size-xs:    10px  (badges, soon-pill — raise from 8.5)
--font-size-sm:    11px  (captions, delta)
--font-size-base:  13px  (body)
--font-size-md:    14px  (subheadings)
--font-size-lg:    16px  (callouts)
--font-size-xl:    20px  (h1)
--font-size-2xl:   24px  (big numbers)
--font-size-3xl:   30px  (cover h1)
--font-size-4xl:   36px  (landing hero)

--font-weight-normal:    400
--font-weight-medium:    500  (rarely used today)
--font-weight-semibold:  600
--font-weight-bold:      700
--font-weight-black:     800  (used for big-num + h1)

--line-height-tight:  1.0
--line-height-snug:   1.45  (body default)
--line-height-loose:  1.7   (narrative)
```

### Border radius

Values in use: 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16 px.

**Recommended scale:**
```
--radius-sm: 4px   (badges, small chips)
--radius:    8px   (buttons, fields)
--radius-md: 10px  (banners, large cards)
--radius-lg: 12px  (card)
--radius-xl: 14px  (modals, hero cards)
--radius-full: 9999px
```

### Shadows

| Token | Value | Where |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(15,30,60,.04)` | .card |
| `--shadow-md` | `0 4px 12px rgba(15,30,60,.06)` | .ai-chat |
| `--shadow-lg` | `0 8px 24px rgba(15,30,60,.2)` | .copied-toast |
| `--shadow-xl` | `0 8px 30px rgba(15,30,60,.08)` | .page (report) |
| `--shadow-2xl` | `0 20px 60px rgba(15,30,60,.3)` | .modal, .gate overlay |

5 shadow elevations in use; not yet tokenized but consistent enough. Promote to tokens.

---

## Component drift findings

### 🔴 P1: Heat-cell h1c text color (Tier 0 broken, Tier 1 fixed)

| | Tier 0 (`demo/admin/dashboard.html`) | Tier 1 (`apps/web/app/globals.css`) |
|---|---|---|
| `.heat-cell` | `color: #fff` (white default) | `color: #fff` (white default) |
| `.h1c` | `background: #C5D2E2` — inherits white | `background: #C5D2E2; color: #2A4365` — overrides to dark |
| Contrast | **1.53:1** (white on #C5D2E2) — FAIL | **6.55:1** (dark navy on #C5D2E2) — PASS |

**Tier 0 dashboard heatmap is currently unreadable for the 1-2/wk cells.** This is the most user-impactful drift. Backport the override.

### 🔴 P2: Heat-cell h2c text color (both broken)

Both tiers use `white on #7B9AC2` for the 3-4/wk cells: **contrast 2.90:1, FAIL**.

Fix in both: change to dark navy text (same pattern as h1c override).

### 🔴 P1: Attendance heat-strip white text on green/amber

`demo/admin/attendance.html` lines 19-23:
- `.heat-cell.good { background: #48BB78; }` — inherits white text — 2.43:1 FAIL
- `.heat-cell.warn { background: #D69E2E; }` — inherits white text — 2.39:1 FAIL

Fix: darken backgrounds or switch text to a dark tone.

### 🔴 P1: `.heat-cell` defined THREE different ways

| File | Definition |
|---|---|
| `demo/admin/dashboard.html` | `.heat-cell { aspect-ratio:1; ... min-height: 24px; }` + sub-classes `.h1c/.h2c/.h3c/.h4c` (background ONLY, no text color) |
| `demo/admin/attendance.html` | `.heat-cell { ... min-height: 22px; cursor: default }` + sub-classes `.good/.ok/.warn/.bad` (different sub-class naming + colors) |
| `apps/web/app/globals.css` | `.heat-cell { ... min-height: 24px; }` + sub-classes `.heat-cell.empty/.gap/.h1c/.h2c/.h3c/.h4c` (with text color overrides) |

The component is the same conceptual thing (data-density grid cell) but implemented 3 times with subtle differences:
- min-height: 22px vs 24px (drift)
- sub-class naming convention: bare `.h1c` vs `.heat-cell.h1c` (CSS specificity differs)
- attendance uses semantic naming (good/ok/warn/bad) while dashboard uses intensity (h1c/h2c/h3c/h4c)

**Recommendation:** rename to communicate semantics:
- `<HeatCell intensity={1..4} />` for the section heatmap (intensity meaning "how dense")
- `<StatusCell status="good|warn|bad" />` for the attendance heat strip (status meaning "is this OK")

Two different components for two different semantics. Don't reuse one class.

### 🟡 P2: `.filter-bar` defined TWICE

| File | Definition |
|---|---|
| `demo/admin/section-mapping.html` | `.filter-bar { display:flex; gap:10px; ... }` + `.filter-bar .stat`, `.filter-bar select` |
| `apps/web/app/globals.css` | `.filter-bar { display: flex; gap: 8px; ... }` + `.filter-bar select { padding: 6px 10px; ... }` |

Drift: gap is 10px vs 8px. Padding/font-size slightly different.

**Recommendation:** consolidate. Move to shared token: gap = 8px.

### 🟡 P2: Card variants don't share a base

Today's "cards" all do their own thing:
- `.card` (shared) — generic
- `.card.tall` (shared) — generic + min-height
- `.card.mini` (only in dashboard.html + attendance.html) — defined twice with same body
- `.perf-card` (report.html only) — different bg (#FAFCFE), different border, smaller padding
- `.plan-card` (report.html only) — white bg, larger padding
- `.choice-group` (styles.css) — card-like but for form pick groups
- `.ai-alert` (attendance.html only) — card-like but with border-left accent

**Recommendation:** define `<Card variant="default|mini|alert|choice" />` once, propagate.

### 🟡 P2: `.banner` has 3 colored variants but only 1 is named

`demo/assets/styles.css` defines `.banner` as yellow-warning style. Then both dashboards and section-mapping override with inline `style="background:#FED7D7;border-color:#FC8181;color:#742A2A"` for the red variant. The green variant on attendance.html is also inline (`#E6FFFA / #4FD1C5 / #234E52`).

**Recommendation:** named variants:
- `.banner.info` — yellow (current default)
- `.banner.danger` — red
- `.banner.success` — green
- `.banner.neutral` — grey

### 🟡 P2: Report page (`parent/report.html`) has 13 unique components

None are shared with other pages. `.perf-card`, `.plan-card`, `.uni-band`, `.narrative`, `.cover`, `.rs1..rs5`, `.radar-legend`, `.rubric-table`, etc. — all defined inline, all unique.

This is OK if the report stays a one-off, but the architecture brief implies term reports, monthly reports, and maybe pdf-export versions will share visual language.

**Recommendation:** extract a `report.css` (or `<ReportPage>` Next.js component) that exposes the cover, narrative, perf-card, plan-card, uni-band as named components. Other report variants will need them.

### 🟢 P3: Inline React styles in `parent/select-courses/page.tsx`

The Tier 1 course-selection page uses React `style={{...}}` objects throughout instead of class-based styles. This works but:
- Loses Tailwind class autocomplete + design-system enforcement
- Loses ability to override via CSS hover/focus pseudo-classes for some elements
- Verbose (every style is 5-10 lines of object literal)

**Recommendation:** convert to Tailwind utility classes referencing the `@theme inline` tokens in globals.css. Keeps the design system canonical.

### 🟢 P3: `.pill` redefined in `parent/report.html` cover

The Tier 0 `.pill` is grey/blue. The cover pills on the report ARE re-defined inside `.cover .pill` to be white/transparent on the navy gradient. This is OK (scoped via parent class) but confusing naming.

**Recommendation:** rename cover pills to `.cover-pill` or use a `<Pill variant="inverted" />` modifier.

### 🟢 P3: `.tag` (dashboard) vs `.badge` (attendance) — same concept, different names

Both are small uppercase tinted labels (att/fee/beh/gr vs med/fam/unk/cont). The semantic meaning differs (.tag = data category; .badge = state). But visually they're 95% identical.

**Recommendation:** unify under `<Chip variant="att|fee|beh|gr|med|fam|unk|cont" />`. Or split tighter:
- `<Tag>` for dimension labels
- `<Badge>` for status labels
- Both built on the same base styles, just different palette variants.

### 🟢 P3: Mini-row / row-info / pick-row / abs-row — same component, 4 names

All these are "left label, right value, dashed border" rows used across cards/lists. Same visual, 4 different class names:
- `.mini .row` (dashboard mini-cards)
- `.row-info` (finance mockup — not yet built but documented)
- `.pick-row` (parent course-selection review step)
- `.abs-row` (attendance absences list)

**Recommendation:** unify under `<KeyValueRow label="..." value="..." />`.

---

## Naming inconsistencies

| Class A | Class B | What they share | Recommendation |
|---|---|---|---|
| `.tag.att` | `.badge.unk` | Same visual (uppercase chip) | Rename `.tag.*` → `.badge.*` everywhere |
| `.heat-cell.h1c..h4c` | `.heat-cell.good/.ok/.warn/.bad` | Same component (colored grid cell) | Separate components: `<DensityCell />` + `<StatusCell />` |
| `.bar-fill.over/.ok/.under/.full` | `.summary-rows .v.over/.full/.ok/.under` | Same status semantics | Share a `--status-*` color set |
| `.btn.primary` / `.btn.ghost` | (no other variants) | Need: `.btn.danger`, `.btn.success`? | Specify variants up front |
| `.warning` / `.warn` | Both exist as color tokens | Same color (semantic warning) | Pick one. Drop `.warn`. |
| `.good` / `.success` | Both exist as token aliases | Same intent | Drop `.good`. |
| `.bad` / `.danger` | Both exist as token aliases | Same intent | Drop `.bad`. |

---

## Recommended consolidation plan

### Phase 1 — Tokenize (1 day)

1. Create `apps/web/lib/design-tokens.json` (canonical machine-readable source).
2. Generate `apps/web/app/globals.css` `:root { ... }` + `@theme inline { ... }` from the JSON.
3. Generate `demo/assets/styles.css` `:root { ... }` from the same JSON (manual sync until we have a build step).
4. Migrate the 25+ hardcoded hex values to tokens.
5. Add the spacing scale + typography scale to globals.css; gradually migrate inline pixel values.

### Phase 2 — Backport contrast fixes (1 hour)

1. Tier 0 `demo/admin/dashboard.html`: add `color: #2A4365` to `.h1c`, `color: #2A4365` to `.h2c` (override the white inherited from `.heat-cell`).
2. Tier 0 `demo/admin/attendance.html`: change `.heat-cell.good { background: #2F855A; }`, `.heat-cell.warn { background: #9C4221; }` (darker bg, keeps white text).
3. Tier 1 `apps/web/app/globals.css`: same fix for `.heat-cell.h2c` (currently white on #7B9AC2 fails).

### Phase 3 — Componentize (2-3 days)

1. Move every `.banner` variant inline-style call into named classes (`.banner.info / .danger / .success`).
2. Extract a `<Card>` React component with variants (default/mini/alert/choice) — port both tiers to use it.
3. Extract `<HeatCell>` + `<StatusCell>` (separate concerns).
4. Extract `<KeyValueRow>` (4-name collapse).
5. Extract `<Chip>` (the .tag/.badge collapse).
6. Convert parent course-selection inline styles to utility-class-based.

### Phase 4 — Document (half day)

1. Build a single-page Storybook (or just a static `/design` route in Tier 1) showing every component + variant + props.
2. Reference from README + new contributors' docs.

---

## Proposed canonical `design-tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "brand": {
      "primary":  { "value": "#0B2545", "type": "color" },
      "accent":   { "value": "#3D5A80", "type": "color" }
    },
    "neutral": {
      "ink":            { "value": "#1A2440", "type": "color" },
      "muted":          { "value": "#5A6B82", "type": "color", "comment": "darkened from #6B7C93 for WCAG AA (4.5:1)" },
      "muted-disabled": { "value": "#718096", "type": "color", "comment": "for disabled / 'soon' states" },
      "border":         { "value": "#E5EAF0", "type": "color" },
      "soft":           { "value": "#EEF2F7", "type": "color" },
      "soft-hover":     { "value": "#E1E8F0", "type": "color" },
      "subtle":         { "value": "#FAFCFE", "type": "color", "comment": "very light card fill / row hover bg" },
      "bg":             { "value": "#F4F6FA", "type": "color" },
      "card":           { "value": "#FFFFFF", "type": "color" }
    },
    "semantic": {
      "success":          { "value": "#276749", "type": "color", "comment": "darkened for AA on white" },
      "success-bright":   { "value": "#2F855A", "type": "color" },
      "success-soft":     { "value": "#C6F6D5", "type": "color" },
      "success-soft-bg":  { "value": "#F0FFF4", "type": "color" },
      "success-on-soft":  { "value": "#22543D", "type": "color" },

      "warning":          { "value": "#9C4221", "type": "color", "comment": "darkened for AA on white" },
      "warning-bright":   { "value": "#C05621", "type": "color" },
      "warning-soft":     { "value": "#FFF8E1", "type": "color" },
      "warning-on-soft":  { "value": "#744210", "type": "color" },
      "warning-soft-border": { "value": "#F6E05E", "type": "color" },

      "danger":           { "value": "#C53030", "type": "color" },
      "danger-bright":    { "value": "#E53E3E", "type": "color" },
      "danger-soft":      { "value": "#FED7D7", "type": "color" },
      "danger-on-soft":   { "value": "#742A2A", "type": "color" },
      "danger-soft-border": { "value": "#FC8181", "type": "color" },

      "info-soft":        { "value": "#BEE3F8", "type": "color" },
      "info-on-soft":     { "value": "#2A4365", "type": "color" },

      "neutral-soft":     { "value": "#FAF089", "type": "color", "comment": "for non-status chips" }
    },
    "heat": {
      "intensity-0":      { "value": "#FAFCFE", "type": "color", "comment": "empty cell bg" },
      "intensity-1":      { "value": "#C5D2E2", "type": "color" },
      "intensity-2":      { "value": "#7B9AC2", "type": "color" },
      "intensity-3":      { "value": "#3D5A80", "type": "color" },
      "intensity-4":      { "value": "#0B2545", "type": "color" },
      "intensity-1-text": { "value": "#2A4365", "type": "color" },
      "intensity-2-text": { "value": "#1A2440", "type": "color", "comment": "dark — needed for AA" }
    },
    "rubric": {
      "band-1": { "value": "#C53030", "type": "color", "comment": "emerging" },
      "band-2": { "value": "#9C4221", "type": "color", "comment": "approaching (darkened from #DD6B20)" },
      "band-3": { "value": "#9C4221", "type": "color", "comment": "meeting (darkened from #D69E2E)" },
      "band-4": { "value": "#3D5A80", "type": "color", "comment": "exceeding" },
      "band-5": { "value": "#0B2545", "type": "color", "comment": "mastering" }
    }
  },
  "space": {
    "0":  { "value": "0",    "type": "dimension" },
    "1":  { "value": "4px",  "type": "dimension" },
    "2":  { "value": "8px",  "type": "dimension" },
    "3":  { "value": "12px", "type": "dimension" },
    "4":  { "value": "16px", "type": "dimension" },
    "5":  { "value": "20px", "type": "dimension" },
    "6":  { "value": "24px", "type": "dimension" },
    "8":  { "value": "32px", "type": "dimension" },
    "10": { "value": "40px", "type": "dimension" },
    "14": { "value": "56px", "type": "dimension" }
  },
  "radius": {
    "sm":   { "value": "4px",   "type": "dimension" },
    "md":   { "value": "8px",   "type": "dimension" },
    "lg":   { "value": "10px",  "type": "dimension" },
    "xl":   { "value": "12px",  "type": "dimension" },
    "2xl":  { "value": "14px",  "type": "dimension" },
    "full": { "value": "9999px","type": "dimension" }
  },
  "shadow": {
    "sm":   { "value": "0 1px 2px rgba(15,30,60,.04)",   "type": "shadow" },
    "md":   { "value": "0 4px 12px rgba(15,30,60,.06)",  "type": "shadow" },
    "lg":   { "value": "0 8px 24px rgba(15,30,60,.2)",   "type": "shadow" },
    "xl":   { "value": "0 8px 30px rgba(15,30,60,.08)",  "type": "shadow" },
    "2xl":  { "value": "0 20px 60px rgba(15,30,60,.3)",  "type": "shadow" }
  },
  "type": {
    "family": {
      "sans": { "value": "-apple-system, system-ui, 'Helvetica Neue', sans-serif", "type": "fontFamily" },
      "mono": { "value": "'SF Mono', 'Menlo', monospace", "type": "fontFamily" }
    },
    "size": {
      "xs":   { "value": "10px", "type": "dimension" },
      "sm":   { "value": "11px", "type": "dimension" },
      "base": { "value": "13px", "type": "dimension" },
      "md":   { "value": "14px", "type": "dimension" },
      "lg":   { "value": "16px", "type": "dimension" },
      "xl":   { "value": "20px", "type": "dimension" },
      "2xl":  { "value": "24px", "type": "dimension" },
      "3xl":  { "value": "30px", "type": "dimension" },
      "4xl":  { "value": "36px", "type": "dimension" }
    },
    "weight": {
      "normal":   { "value": "400", "type": "fontWeight" },
      "medium":   { "value": "500", "type": "fontWeight" },
      "semibold": { "value": "600", "type": "fontWeight" },
      "bold":     { "value": "700", "type": "fontWeight" },
      "black":    { "value": "800", "type": "fontWeight" }
    },
    "lineHeight": {
      "tight": { "value": "1.0",  "type": "number" },
      "snug":  { "value": "1.45", "type": "number" },
      "loose": { "value": "1.7",  "type": "number" }
    }
  }
}
```

---

## Score breakdown

| Category | Score | Why |
|---|---|---|
| Color consistency (Tier 0 ↔ Tier 1) | 9/10 | All base color tokens identical |
| Spacing scale | 2/10 | 23+ ad-hoc values, no system |
| Typography scale | 3/10 | 20+ sizes, two `.sub` variants |
| Component documentation | 0/10 | No docs |
| Cross-tier component drift | 4/10 | Heat-cell variants drift, .filter-bar duplicated, .banner inconsistent |
| Naming consistency | 5/10 | .tag vs .badge, .heat-cell vs .heat-cell.good naming, .warn vs .warning |
| Tokens promoted to vars | 4/10 | Color tokens great; spacing/type not at all |
| **Overall** | **38 / 100** | Bones are good; scaffolding work needed |

A 38 isn't bad for an undocumented system that's ~3 weeks old. With Phases 1-4 above, this could be at 80+ in a week.
