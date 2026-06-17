# Design audit synthesis — Manhaj · 2026-05-26

Combined findings from four plugin reviews. Use this as the single source of truth; the four child docs (`design_critique_*.md`, `accessibility_audit_*.md`, `ux_copy_review_*.md`, `design_system_audit_*.md`) have full detail per category.

---

## Top-line read

The product **looks like real software** — that's the win. The same review surfaced **9 P1 accessibility blockers, 6 P1 design-critique blockers, ~15 jargon leaks in user-facing copy, and a 38/100 design-system score**. Most fixes are CSS one-liners. The combined "must do this week" list is ~6 hours of work and would lift the product from "obviously a prototype" to "ship-ready demo."

### The single biggest finding (touches every page)

**`--muted` text at #6B7C93 fails WCAG 4.5:1 contrast (it's 4.26:1).** This color is used for `.sub`, `.card-label`, `.delta`, `.brand-sub`, captions — EVERYWHERE. Darken to `#5A6B82` (5.36:1) in one line of CSS in both tier files. Fixes ~30 instances across the app.

### The single biggest credibility leak (touches user trust)

**~15 phrases like "Tier 1 preview", "saved to Postgres", "Generate SQL", "stub student created", "form_id ABC123…"** leak engineering language into user-facing surfaces. 20-minute text-only editing pass; massive perception lift.

---

## Combined action list, ranked by (impact ÷ effort)

### 🔴 Must do this week (~6 hours total)

| # | Action | From | Effort | Impact |
|---|---|---|---|---|
| 1 | **Strip every "Tier 1/0", "Postgres", "Supabase", "ETL", "SQL", "database", UUID-as-text from user-facing pages** | ux-copy #1-22 | 30 min | Huge — fixes "we're half-built" perception |
| 2 | **Darken `--muted` from #6B7C93 → #5A6B82** (one-line in both globals.css + styles.css) | a11y #1 | 2 min | Fixes 30+ contrast failures app-wide |
| 3 | **Fix heat-cell text contrast** — h2c white-on-blue fails 2.90:1. Add `.heat-cell.h2c { color: #2A4365 }` (mirrors the h1c fix already in Tier 1 globals) | a11y #4 + ds #8 | 5 min | Heatmap numbers become readable |
| 4 | **Backport h1c text-color fix to Tier 0 dashboard.html** — currently white-on-#C5D2E2 (1.53:1, unreadable) in Tier 0; the Tier 1 globals fixed it | ds P1 #8 | 5 min | Tier 0 demo heatmap legible |
| 5 | **Recolor attendance heat-strip** — green #48BB78 + amber #D69E2E with white text both fail. Darken to #2F855A + #9C4221 | a11y #5 | 10 min | Attendance heat strip readable |
| 6 | **Add named steps to parent wizard progress dots** ("Student · Compulsory · Electives · Review") | critique #4 | 15 min | Removes the "how long is this gonna take?" anxiety |
| 7 | **Delete the "Tier 1 live · Submitting this form writes to Supabase Postgres" banner** on parent course-selection | ux-copy #8 + critique #4 | 1 min | One less wtf moment in the parent flow |
| 8 | **Change submit button copy from "Submit · save to database" to "Submit selection"** (EN) / `إرسال الاختيار` (AR) | ux-copy #9 | 1 min | Removes the last jargon leak from the parent flow |
| 9 | **Add LLM-composed dashboard headline** ("3 sections need mapping, 2 teachers over capacity, Math is balanced") at the top of /admin | critique #1 (admin) | 30 min impl + claude wire | Transforms "data dump" into "decision support" |
| 10 | **Default heatmap filter to HS-only** instead of all-grades | critique #3 (admin) | 5 min | Cuts initial cognitive load by ~75% |
| 11 | **Translate AI's statistical jargon** ("p < 0.05" → "We're confident this isn't random") | critique #1 (attendance) + ux-copy #17 | 5 min | Attendance AI alerts read like a colleague, not a stats prof |
| 12 | **Rewrite login error** ("Sign-in failed (exchange_failed). exchange_failed: ...") → "That link has expired. Send a fresh one." | ux-copy E1 | 1 min | Stops scaring failed-login users |
| 13 | **Add `*:focus-visible { outline: 2px solid var(--accent); offset: 2px }`** globally | a11y #7 | 2 min | Keyboard users can actually see focus |
| 14 | **Wrap server-action errors in `role="alert"` aria-live** (login, parent wizard) | a11y #14-15 | 5 min | Screen readers announce errors |
| 15 | **Update `<html lang/dir>` when parent wizard toggles AR** (currently only updates inline style.direction) | a11y #20 | 3 min | Screen readers use AR voice for AR content |
| 16 | **Login footer rewrite** ("Pilot phase: any email works..." → "Closed beta — invitation-only emails accepted.") | ux-copy A3 | 1 min | Frames us as exclusive, not unfinished |
| 17 | **Remove "Tier 1 preview" sub-line + footer migration text on landing** | ux-copy #1, #5 | 1 min | Landing page reads as a finished product |

**Total**: ~110 minutes of code/text, hours-not-days. Ship Friday.

### 🟡 Should do next week (~2 days)

| # | Action | From | Effort |
|---|---|---|---|
| 18 | **Add `<main>`, `<header>`, `<nav>` landmarks** to all layouts | a11y #13 | 30 min |
| 19 | **Add skip-to-content link** at top of layout.tsx | a11y #10 | 10 min |
| 20 | **Add `<title>` element + `role="img"` to the radar SVG** | a11y #16 | 10 min |
| 21 | **Add `aria-busy` to forms during submission** + `aria-live="polite"` to status messages | a11y #23-25 | 30 min |
| 22 | **Replace section-mapping "Generate SQL" output with a direct save API call** (server action that writes to Postgres directly) | critique #5 (mapping) | 2-3 hrs |
| 23 | **Add localStorage draft auto-save** to parent course-selection wizard | critique #6 (parent) | 1 hr |
| 24 | **Reduce "soon" nav pills** from 4 to 1-2 (or hide entirely) | critique cross-page | 5 min |
| 25 | **Reposition AI chat box** on /admin — move to floating bottom-right or pin to top | critique #1 (admin) | 30 min |
| 26 | **Bump touch targets** for dropdowns, sign-out button, choice chips to ≥44px | a11y touch-targets | 15 min |
| 27 | **Add empty states** to all data lists (load list filter empty, heatmap empty, etc.) | ux-copy F1-F6 | 1 hr |
| 28 | **Add "what happens next" panel** to parent course-selection success screen | ux-copy M3 | 15 min |

### 🟢 Polish (3-7 days more, when time)

| # | Action | From | Effort |
|---|---|---|---|
| 29 | **Tokenize spacing scale** — replace 23+ ad-hoc px values with 4/8/12/16/24/32 scale | design-system Phase 1 | 1 day |
| 30 | **Tokenize typography scale** — collapse 20+ font sizes to 10 named tiers | design-system Phase 1 | 1 day |
| 31 | **Extract `<Card>`, `<HeatCell>`, `<StatusCell>`, `<KeyValueRow>`, `<Chip>` components** | design-system Phase 3 | 2 days |
| 32 | **Build `/design` storybook page** | design-system Phase 4 | 4 hrs |
| 33 | **Mobile-first redesign of /parent/* pages** | critique mobile | 1 day |
| 34 | **Add reduced-motion `@media (prefers-reduced-motion)` blocks** | a11y limitations | 30 min |
| 35 | **Convert parent course-selection from inline React style objects to Tailwind utility classes** | design-system #5 | 4 hrs |
| 36 | **Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) in AR mode** | ux-copy bilingual | 30 min |
| 37 | **Download-as-PDF button on parent report** | ux-copy + critique | 4 hrs |
| 38 | **Dark mode** | a11y limitations | 2 days |

---

## Color contrast — the actual ratios

Computed via standard WCAG formula. **Bold rows fail.**

| Pair | Ratio | Normal (4.5:1) | Large (3:1) | Action |
|---|---:|:---:|:---:|---|
| `--ink #1A2440` on white | 15.33:1 | ✅ | ✅ | — |
| `--primary #0B2545` on white | 15.39:1 | ✅ | ✅ | — |
| `--accent #3D5A80` on white | 7.06:1 | ✅ | ✅ | — |
| **`--muted` on white** | **4.26:1** | **❌** | ✅ | **Darken to #5A6B82** |
| **`--muted` on `--soft`** | **3.79:1** | **❌** | ✅ | (same fix covers) |
| **Disabled nav #A0AEC0** | **2.26:1** | **❌** | **❌** | **Darken to #718096** |
| **Soon-pill #718096 on #EDF2F7** | **3.56:1** | **❌** | ✅ | **Darken text + bump font ≥10px** |
| **White on h2c #7B9AC2** | **2.90:1** | **❌** | **❌** | **Switch text to dark navy (#2A4365)** |
| White on h1c (Tier 0) | 1.53:1 | ❌ | ❌ | **Backport Tier 1's text-color fix** |
| Dark on h1c (Tier 1) | 6.55:1 | ✅ | ✅ | — |
| **White on attendance green #48BB78** | **2.43:1** | **❌** | **❌** | **Darken green to #2F855A** |
| **White on attendance amber #D69E2E** | **2.39:1** | **❌** | **❌** | **Darken amber to #9C4221** |
| White on attendance red #C53030 | 5.47:1 | ✅ | ✅ | — |
| White on h3c, h4c | 7-15:1 | ✅ | ✅ | — |
| `--success` on white | 4.54:1 | ✅ | ✅ | (margin tight; could tighten) |
| `--warning` on white | 4.57:1 | ✅ | ✅ | (margin tight; could tighten) |
| `--danger` on white | 5.47:1 | ✅ | ✅ | — |

**Headline**: 6 of 18 important pairs fail. Most fail because of color choices that can be one-character-each darker.

---

## Cross-tier drift

| # | Tier 0 | Tier 1 | Severity | Action |
|---|---|---|---|---|
| 1 | Heat-cell h1c: white text (1.53:1 fail) | Heat-cell h1c: dark text (6.55:1 pass) | 🔴 P1 | Backport text-color override to Tier 0 |
| 2 | Heat-cell defined 3x (dashboard inline, attendance inline, Tier 1 globals) | Heat-cell defined once in globals.css | 🟡 P2 | Tier 0 should `@import` from styles.css; remove inline duplication |
| 3 | `.filter-bar { gap: 10px }` (section-mapping) | `.filter-bar { gap: 8px }` (globals.css) | 🟡 P2 | Pick one (8px) and use everywhere |
| 4 | Attendance uses `.heat-cell.good/.ok/.warn/.bad` (status semantics) | Tier 1 has `.heat-cell.h1c..h4c` (intensity semantics) | 🟢 P3 (intentional but should be renamed for clarity) | Rename to `<DensityCell>` + `<StatusCell>` (two components) |
| 5 | `.banner` red/green variants are inline-styled overrides | Same | 🟡 P2 | Promote to `.banner.danger / .banner.success` named variants |
| 6 | `.card.mini` defined in dashboard.html AND attendance.html (identical) | Not in globals.css | 🟡 P2 | Move to shared CSS, delete the dupe |

---

## What's working (positive findings — preserve these)

From critique, a11y, copy, and ds combined:

- **`Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026`** byline — the gold standard for AI attribution. Replicate everywhere AI content appears.
- **The 6-axis rubric radar on the parent report** — visually distinctive, semantically meaningful, defensibly novel. The differentiator.
- **The universal navy/grey palette + card system** — coherent across pages, reads as serious enterprise software.
- **The `(preview)` qualifier on AI suggestions** — appropriately humble.
- **The "Manhaj" product name used everywhere** instead of "the system" or "the app" — keeps the product personable.
- **The progress + counter pattern on the section-mapping page** — gives a clear sense of "X of 41 done".
- **Bilingual EN/AR support on the parent flow** — translations are natural and parents will find AR mode usable.
- **The "Likely cause (AI)" column on the attendance page** — concise hypothesis instead of raw data.
- **The university-fit signal disclaimer** ("historical bands, not predictions") — legally + ethically right.

---

## Recommended sequencing

If you want to ship the visible fixes in one tight bundle: do items 1-8 from the P1 list (the user-facing copy + contrast + parent wizard fixes) as **one PR**. They're all 1-30 minute changes, no architectural risk, and the perception shift between before/after is dramatic.

Then a second PR with items 9-17 (the slightly larger admin headline + dashboard polish + a11y aria additions).

Then schedule a "design-system week" to tackle items 29-32 once the urgent stuff is done.

---

## Files produced by this audit cycle

| File | Purpose |
|---|---|
| `docs/design_critique_2026-05-26.md` | Full UX/UI critique per page |
| `docs/accessibility_audit_2026-05-26.md` | WCAG 2.1 AA with computed contrast ratios |
| `docs/ux_copy_review_2026-05-26.md` | Every copy issue with proposed rewrite |
| `docs/design_system_audit_2026-05-26.md` | Token inventory + drift + canonical `design-tokens.json` |
| `docs/design_audit_synthesis_2026-05-26.md` | **This file — start here** |

Total reading time across all 4 docs: ~35 minutes. Total fixing time for the P1 list: ~6 hours.
