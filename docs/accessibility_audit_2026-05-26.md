# Accessibility audit — Manhaj · WCAG 2.1 AA · 2026-05-26

Method: computed exact contrast ratios for the full color palette, inspected source for keyboard / ARIA / semantic patterns, ran fresh-eyes review against rendered Vercel + Cloudflare URLs.

## Summary

| Severity | Count |
|---|---|
| 🔴 P1 blocker | **9** |
| 🟡 P2 issue | **11** |
| 🟢 P3 polish | **5** |

Headline: **`--muted` text fails 4.5:1 contrast on every page** (4.26:1), and the heat-strip / heat-cell colored backgrounds with white overlay text fail badly (2.39–2.90:1). These two systemic findings account for most of the failures.

---

## Color contrast (WCAG 1.4.3 normal text 4.5:1 · 1.4.11 graphics/UI 3:1)

Computed via standard relative-luminance formula. Source: `apps/web/app/globals.css` + `demo/assets/styles.css`.

| Pair | Ratio | Normal (4.5:1) | Large (3:1) | Context |
|---|---:|:---:|:---:|---|
| `--ink #1A2440` on white | 15.33:1 | ✅ | ✅ | body, headings |
| `--primary #0B2545` on white | 15.39:1 | ✅ | ✅ | big-num |
| `--accent #3D5A80` on white | 7.06:1 | ✅ | ✅ | links, ghost btn |
| **`--muted #6B7C93` on white** | **4.26:1** | **❌** | ✅ | `.sub`, `.card-label`, `.delta`, `.brand-sub`, captions — EVERYWHERE |
| **`--muted` on `--soft #EEF2F7`** | **3.79:1** | **❌** | ✅ | muted text on card headers |
| **`--muted` on `--bg #F4F6FA`** | **3.94:1** | **❌** | ✅ | muted text on page bg |
| `--danger #C53030` on white | 5.47:1 | ✅ | ✅ | error text |
| `--success #2F855A` on white | 4.54:1 | ✅ | ✅ | success delta (barely passes) |
| `--warning #C05621` on white | 4.57:1 | ✅ | ✅ | warning text (barely passes) |
| **Disabled nav `#A0AEC0` on white** | **2.26:1** | **❌** | **❌** | "soon" nav items — essentially invisible to low-vision users |
| **Soon-pill `#718096` on `#EDF2F7`** | **3.56:1** | **❌** | ✅ | 8.5px text (also fails min-font WCAG) |
| Dark `#2A4365` on h1c `#C5D2E2` | 6.55:1 | ✅ | ✅ | 1-2/wk heat cell (override is correct) |
| **White on h2c `#7B9AC2`** | **2.90:1** | **❌** | **❌** | 3-4/wk heat cell — numbers unreadable |
| White on h3c `#3D5A80` | 7.06:1 | ✅ | ✅ | 5-6/wk heat cell |
| White on h4c `#0B2545` | 15.39:1 | ✅ | ✅ | 7+/wk heat cell |
| **White on green `#48BB78`** | **2.43:1** | **❌** | **❌** | attendance heat strip ≥95% cells |
| **White on amber `#D69E2E`** | **2.39:1** | **❌** | **❌** | attendance heat strip 85-89% cells |
| White on red `#C53030` | 5.47:1 | ✅ | ✅ | attendance heat strip <85% cells |
| `--danger` on `#FED7D7` tag bg | 5.70:1 | ✅ | ✅ | .tag.att labels |

### Contrast findings · WCAG 1.4.3

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | `--muted` fails 4.5:1 on every background variant | 🔴 P1 | Darken to `#5A6B82` → 5.36:1 on white, 4.78:1 on `--soft`. Tiny visual change, fixes ~80% of body-text contrast failures across the app. |
| 2 | Disabled nav `#A0AEC0` fails even 3:1 | 🔴 P1 | Darken to `#718096` → 4.66:1 OR remove the `disabled` styling entirely and use the strikethrough pattern + same color as active. Currently low-vision users can't tell what's disabled. |
| 3 | "Soon" pill text at 8.5px font + 3.56:1 contrast | 🔴 P1 | Bump font to 10px minimum (WCAG informational) AND darken text to `#4A5568` (6.05:1). Or kill the pill and use just italic faded text. |
| 4 | White text on h2c heat cell `#7B9AC2` at 2.90:1 | 🔴 P1 | Switch h2c text to dark navy (same pattern as h1c). Or darken h2c bg to `#5A7AA8` → 4.72:1 with white. |
| 5 | Attendance heat-strip green (≥95%) + amber (85-89%) cells: white text at 2.39-2.43:1 | 🔴 P1 | Darken both colors significantly: green → `#2F855A` (4.54:1), amber → `#9C4221` (5.86:1). Same color band, accessible-grade. |
| 6 | `--success` and `--warning` barely pass at 4.54-4.57:1 | 🟢 P3 | Tighten margin: `--success` → `#276749` (5.46:1), `--warning` → `#9C4221` (5.86:1). |

---

## Keyboard navigation (WCAG 2.1.1, 2.4.3, 2.4.7)

| # | Issue | Severity | Fix |
|---|---|---|---|
| 7 | **No visible focus indicator** on most interactive elements | 🔴 P1 | Add global `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` to globals.css. Currently `outline:0` on form inputs + reliance on box-shadow that's 3px at 15% opacity — essentially invisible. |
| 8 | Disabled nav items have no `aria-disabled="true"` and no `tabindex="-1"` — focusable but inert | 🟡 P2 | Add both attributes OR (better) change to `<span>` since they're not navigable anyway. |
| 9 | Heat-cells have title tooltips but no keyboard access to the tooltip | 🟡 P2 | Either add `tabindex="0"` + on-focus aria-describedby pattern, OR provide a "Show data table view" toggle that exposes the same info in a navigable table. |
| 10 | No skip-to-content link on any page | 🟡 P2 | Add `<a href="#main" className="skip-link">Skip to content</a>` at the top of layout.tsx. Hidden until focused. AT-users with screen readers benefit. |
| 11 | Section-mapping table has 41 rows × 6 form fields each = 246+ tab stops in a single page | 🟡 P2 | Add a "Confirm all → save" keyboard shortcut (Cmd+Shift+S). Logical column tab-order inside rows. |
| 12 | Parent course-selection: clicking choice chip is keyboard accessible (`<button>`) | ✅ Works | |

---

## Semantic HTML + ARIA (WCAG 4.1.2, 1.3.1)

| # | Issue | Severity | Fix |
|---|---|---|---|
| 13 | **No `<main>` landmark** on any page; topbar is `<div className="topbar">` not `<header>` | 🟡 P2 | Wrap page content in `<main>`, change `.topbar` to `<header>`, change `.nav` to `<nav>`. Screen-reader users can skip directly to main content. |
| 14 | Login form: server-action errors show in a div with no `role="alert"` or `aria-live` | 🔴 P1 | Add `<div role="alert" aria-live="polite">` around the error message. Screen readers currently silent on submit failure. |
| 15 | Parent wizard: same — step validation errors silent on AT | 🔴 P1 | Same fix. Add ARIA live region for the error banner. |
| 16 | Radar SVG on `/parent/report` has no accessible name | 🔴 P1 | Add `<title>` element inside SVG + `role="img"` + `aria-labelledby` referencing the title. Better: provide a `<table>` data-equivalent of the 6 axis values, visually hidden, for SR users. |
| 17 | Role-card on landing wraps icon + heading + body in `<a>` — the "A/S/P/R" letter inside is decorative | 🟢 P3 | Add `aria-hidden="true"` to the icon span. SR currently says "A Principal Admin module Teacher load..." (the A is confusing noise). |
| 18 | Heatmap cells convey state via color alone (empty vs h1c/h2c/h3c/h4c gradient) | 🟡 P2 | Already include the number inside each cell, except for "empty" which is "·". For SR users, change to `aria-label="0 periods"` on empty cells. WCAG 1.4.1 — color cannot be the sole carrier of information. |
| 19 | Section-mapping status column uses `⊙` / `✓` glyphs without text labels | 🟡 P2 | Add `aria-label="pending"` / `aria-label="confirmed"` to the status cells. The visual symbol alone isn't accessible. |

---

## Bilingual / RTL (WCAG 3.1.2)

| # | Issue | Severity | Fix |
|---|---|---|---|
| 20 | Parent course-selection toggles RTL via inline `style={{ direction: 'rtl' }}` but **doesn't update `<html lang="ar" dir="rtl">`** | 🔴 P1 | When language flips to Arabic, set `document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'`. Screen readers currently announce Arabic text in English voice synthesis (mangled). |
| 21 | Arabic content has no `lang="ar"` attribute on the Arabic-language elements when the page is in EN mode | 🟡 P2 | Wrap Arabic strings in `<span lang="ar">…</span>` so SR switches voice mid-content. |
| 22 | Bilingual brand text "Manhaj · International School of Oman" — mixed direction, no `dir="auto"` | 🟢 P3 | Add `dir="auto"` to dynamic bilingual strings. |

---

## Touch targets (WCAG 2.5.5 — min 44×44 CSS pixels)

| Element | Approx size | Status | Fix |
|---|---|---|---|
| Login email + Send button | 40px+ | ✅ | |
| Parent wizard form fields | 36-40px | ⚠️ | Bump padding to 12px (currently 8px) → ~44px |
| Filter dropdowns (admin dashboard, mapping) | ~25-28px | ❌ P2 | Increase padding to 10px+ |
| Sign-out button (admin topbar) | ~26px | ❌ P2 | Bump padding to `8px 14px` |
| Heat-cells (24px) | non-interactive | ✅ | OK because no click handler |
| Choice chips on parent wizard | ~32px | ⚠️ P2 | Bump padding to `12px 16px` |
| Role cards on landing | 200×140 | ✅ | |
| Disabled nav items | small | ✅ | Don't matter; not interactive |
| Hamburger / language toggle | <30px | ❌ P2 | Bigger touch zones for top-bar mini-buttons |

---

## Loading states + announcements (WCAG 4.1.3 Status Messages)

| # | Issue | Severity | Fix |
|---|---|---|---|
| 23 | `/login` Suspense fallback "Loading…" no `role="status"` or `aria-live` | 🟡 P2 | Wrap in `<div role="status" aria-live="polite">`. |
| 24 | Course-selection "Saving to Supabase…" button state — change announced to AT? | 🟡 P2 | Button text changes from "Submit · save to database" to "Saving to Supabase…" — but SR may not pick up the text-content swap. Add `aria-busy="true"` on the form during submission. |
| 25 | Success card after submission appears without `aria-live` | 🟡 P2 | Wrap the success container in `<div role="status" aria-live="polite">`. |

---

## Other findings

| # | Issue | Severity | Fix |
|---|---|---|---|
| 26 | Heat cells use `aspect-ratio: 1` — 8.5–10px text inside | 🟢 P3 | Either enlarge cell minimum to 32px OR drop numbers and rely on tooltip (with tooltip being keyboard-accessible per #9 above). |
| 27 | "Soon" pill at 8.5px font | 🔴 P1 (combo with #3) | WCAG 1.4.4 — text should be resizable to 200% without loss of content. 8.5px text after a 200% zoom is 17px — passable but barely. The 1.4.4 issue plus the 1.4.3 contrast failure means low-vision users effectively can't read these labels. Fix together. |
| 28 | `outline:0` on form fields kills default focus ring for keyboard users | 🔴 P1 (combo with #7) | Already noted; replacement focus style is too subtle. |
| 29 | The auto-generated stub student message ("Stub student created — no roster yet") on submit success | 🟢 P3 | Will be confusing to a parent; cosmetic. Already flagged in design critique. |

---

## Priority fixes (ranked by impact ÷ effort)

### Must do (P1) — ~3 hours of CSS + a few ARIA attribute changes

1. **Darken `--muted` to `#5A6B82`** — one-line change in both `globals.css` files. Fixes ~80% of contrast failures app-wide.
2. **Replace disabled-nav `#A0AEC0` with `#718096`** AND ensure "soon" pill text is ≥10px. One CSS edit per file.
3. **Fix heat-cell h2c text** — switch white→dark navy (same as h1c). One CSS line.
4. **Recolor attendance heat strip** — green `#48BB78` → `#2F855A`, amber `#D69E2E` → `#9C4221`. One CSS edit.
5. **Add global `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`** to globals.css.
6. **Wrap error/success banners in `role="alert"` / `role="status"` with `aria-live`** — login, parent wizard, success cards.
7. **Add `<title>` element + `role="img"` to the radar SVG** on the parent report.
8. **Update `<html lang/dir>` when parent wizard toggles AR** — one-line useEffect in the client component.

### Should do (P2) — ~4 hours

9. **Add `<main>`, `<header>`, `<nav>` landmarks** to layouts.
10. **Add `aria-disabled="true"` to "soon" nav items** OR convert them to `<span>` elements.
11. **Add skip-to-content link** at top of layout.tsx.
12. **Bump touch targets** for dropdowns, sign-out button, choice chips to ≥44px.
13. **Add `aria-busy` to forms during submission** + `aria-live="polite"` to status messages.
14. **`aria-label` on heat-cell empty cells** ("0 periods scheduled").

### Polish (P3) — when there's time

15. **`aria-hidden="true"` on decorative icons** (the A/S/P/R letters).
16. **`dir="auto"` on mixed-language strings**.
17. **Cell size + text alternatives in heatmap** for very small data points.

---

## What this audit didn't catch (limitations)

- **Real screen-reader testing** with VoiceOver or NVDA. I inferred from source + WAI-ARIA spec; live AT might surface speech-quality issues I can't predict.
- **High-contrast OS mode** behavior (Windows High Contrast / macOS Increase Contrast). The colored cards may invert badly.
- **Reduced-motion preference** — no `@media (prefers-reduced-motion)` blocks anywhere in the CSS. Cards have transition animations on hover that should respect this.
- **Keyboard trap testing** — once we have a modal (e.g. section-mapping's SQL output modal), need to verify focus stays inside until close.
- **Auto-zoom to 200%** — visual breakage at high zoom levels untested.

These should be picked up by manual testing once the app is in real-user hands (or by a 1-hour follow-up session with a dedicated screen reader).
