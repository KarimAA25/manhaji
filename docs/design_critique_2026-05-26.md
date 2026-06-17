# Design critique — Manhaj Tier 0 + Tier 1 · 2026-05-26

Reviewer's lens: a school principal sees this for 90 seconds before deciding "is this worth my CSM's time?" Most calls are about that 90 seconds.

## Overall impression

The product is **visually competent and feels coherent across pages** — the navy/grey palette + card system + tabular layouts read as serious enterprise software, not a hacked demo. That's the biggest win. But:

- Three pages bleed engineering jargon into the parent/principal-facing copy ("Tier 1 preview", "service-role", "Postgres", "ETL", "Generate SQL"). Each instance is a 5-second drain of confidence.
- Information density is high — the admin dashboard at first scroll has **4 hero cards + 6-bar load chart + summary tiles + 1107-cell heatmap + AI chat**. Even a sophisticated principal needs a "where do I start" anchor.
- Mobile responsiveness is a known gap — every page is desktop-first with explicit pixel widths. The parent course-selection form is the riskiest (parents open from WhatsApp links, mostly on phones).
- The "soon" nav-pill pattern is honest but at 4-of-7 disabled, it shifts the narrative from "look what you can do" to "look at what's missing."

## Page-by-page findings

### 1. Landing (`/` on Vercel)

| Finding | Severity | Fix |
|---|---|---|
| **Sub-line under wordmark says "Tier 1 preview"** | 🔴 P1 | Remove. The school doesn't know or care about Tier nomenclature. Replace with the school's name or AY label. |
| **Pill above hero: "Live pilot · ISO · Postgres-backed"** | 🔴 P1 | Drop "Postgres-backed" — it leaks the database choice. Keep "Live pilot · ISO". |
| **Hero body mentions "Postgres data layer"** | 🟡 P2 | Rephrase: "stitched together by a data layer schools running PowerSchool + Google Classroom + Excel can't replicate." Same point, no jargon. |
| **Footer: "Pages with an external link still live on the Tier 0 static demo. Migration in progress."** | 🔴 P1 | Delete entirely. This text exists for the dev (me), not the principal. The principal sees: "this product is half-built." |
| **Stat tiles (69 · 41 · 32 · 453) lack context for what "load assignments" means** | 🟡 P2 | Tooltip on hover OR rename to "teacher periods" (more intuitive) |
| **All 4 role cards have the same icon style — A, S, P, R** | 🟢 P3 | The repeated single-letter circle is fine, but cards for "Principal" and "Admin" both go to admin areas — confusing taxonomy. Group as "Admin" / "Parent" with sub-links. |
| **Card hover: transform + box-shadow** | ✅ Works | Subtle, professional |
| **Visual hierarchy**: eye goes Wordmark → Pill → Headline → Stats → Cards. Correct. | ✅ Works | |

### 2. Login (`/login` on Vercel)

| Finding | Severity | Fix |
|---|---|---|
| **First paint on slow connections shows literal "Loading…" text — no spinner, no skeleton** | 🟡 P2 | Replace Suspense fallback with a centered animated spinner + branded card outline. Or pre-render the form shell server-side and lazy-load only useSearchParams logic. |
| **"Pilot phase: any email works to sign up. Once we onboard ISO formally..." footer text** | 🔴 P1 | This text reveals to the user that they're in a pilot AND that "you're not really our customer yet." Reframe as a security feature: "Closed beta — only invited emails accepted." (Even though tech-wise any email works for now.) |
| **No "what is this thing?" context for someone who lands here cold** | 🟡 P2 | Add a one-line product description above the form: "Manhaj — Admin login for International School of Oman." |
| **"Send magic link" button copy** | ✅ Works | Clear action verb |
| **No password field = no friction, good for staff who'd forget** | ✅ Works | |
| **Email field is autoFocused** | ✅ Works | |
| **Error display ("Sign-in failed (exchange_failed). exchange_failed: 80-char reason")** | 🟢 P3 | Friendly-fy the messages. "exchange_failed" means nothing to a user — translate to "That link has expired. Click Send again." |

### 3. Parent course-selection wizard (`/parent/select-courses` on Vercel)

| Finding | Severity | Fix |
|---|---|---|
| **Step indicator shows "1 2 3 4" numerically — no labels for what each step is** | 🔴 P1 | Add step names: "Student info · Compulsory · Electives · Review". Parents need to know how many steps to commit to. |
| **Green "Tier 1 live · Submitting this form actually writes a row to Supabase Postgres" banner** | 🔴 P1 | DELETE this banner entirely for the parent flow. A parent doesn't know what Postgres is, doesn't need to know writes happen, and the message creates the impression of being a guinea pig. |
| **No saved/draft state — refresh = lose all picks** | 🔴 P1 | localStorage backup, restored on page load with a "We saved your draft, continue?" prompt. Critical for parents on mobile who might Alt-tab to check a message. |
| **Bilingual toggle in topbar is two small buttons (EN / العربية)** | 🟡 P2 | Default to AR if browser lang is ar-* (or if school is in MENA). Otherwise EN. Persist choice in localStorage. |
| **The "(compulsory)" notation on language pref** | ✅ Works | Clear |
| **Submit button on review step: "Submit · save to database"** | 🔴 P1 | "save to database" again leaks. Change to: "Submit selection" (in EN) / "إرسال الاختيار" (in AR). |
| **Success card shows "form_id" + "student_id" as UUIDs** | 🔴 P1 | Remove the UUID display entirely. Parents don't need IDs. Replace with: "Reference number: ABC-123" (derived from the UUID first 6 chars, formatted readable) |
| **No "what happens next" guidance after submission** | 🟡 P2 | Add: "The school administration will review your selection. If anything needs to change, they'll contact you on WhatsApp/email by [date]." |
| **Mobile**: form width is responsive but the topbar's language toggle + brand may overflow on <360px screens | 🟡 P2 | Stack vertically on narrow viewports OR drop the long subdomain text below 480px |
| **Bundle pick UI: chips wrap, selected state is navy fill** | ✅ Works | Clean, immediately tappable, works on touch |

### 4. Admin dashboard (`/admin` Tier 1 + the equivalent Tier 0)

This is where information density bites hardest.

| Finding | Severity | Fix |
|---|---|---|
| **No "where to look first" anchor** | 🔴 P1 | Add a single-sentence "headline" above the hero row: "3 sections need mapping, 2 teachers over capacity, Math department is balanced." Let an LLM compose this from the data each load. The principal scans one line and knows what's important. |
| **4 hero cards all use the same big-num + delta + 2 rows pattern** | 🟡 P2 | The "Workbook assignments: 453" card is the least actionable — it's a vanity metric. Replace with something the principal can DO something about, e.g. "Unmapped sections: 41 (Open mapping)" |
| **Section × subject heatmap has 1107 cells visible by default** | 🔴 P1 | Default the grade-band filter to "HS only" (smaller, more actionable view) and let the principal expand. 1107 cells is for "I want to find anomalies"; not for first-load. |
| **Heatmap has 27 column headers in vertical text — small + hard to scan** | 🟡 P2 | Group column headers by department with a colored band above (Arabic / English / Science / etc.) so the eye finds the right column faster |
| **Top over-capacity / Most slack lists in the summary card show 5 rows but no link to "see all"** | 🟡 P2 | Add "See all 12 over-cap teachers →" |
| **AI suggestion line: "rebalance X's overflow into Y's slack" — text-only, no action** | 🟢 P3 | Make "Simulate →" pill clickable + add a "Why this matters" tooltip |
| **AI chat box is at the bottom of the page** | 🔴 P1 | The chat box is the most distinctive feature of the product (no competitor has it) but it's buried below 1700px of dashboard. Move it to a floating bottom-right button OR pin to the top below the hero. |
| **Red "X sections need mapping" banner shown only at top** | ✅ Works | Highly visible, links to action |
| **No "last updated" timestamp on the data** | 🟡 P2 | Footer text: "Data refreshed from workbook 2 hours ago · re-run ETL". Sets expectations that this is a snapshot, not real-time. |

### 5. Attendance mockup (`/admin/attendance` Tier 0)

Mostly aspirational — this is the best-designed page in the set IMO.

| Finding | Severity | Fix |
|---|---|---|
| **Banner "Mockup preview — synthesised data..." is appropriately clear** | ✅ Works | Best mockup-disclosure I've seen across the set |
| **AI-flagged-patterns panel: "G8-B Tuesday spike pattern... pattern p < 0.05"** | 🔴 P1 | "p < 0.05" is statistical jargon. A non-technical principal doesn't know what it means. Translate: "We're confident this is a real pattern, not random." |
| **AI alert color-coding (high/med/low border)** | ✅ Works | Subtle but readable |
| **"Likely cause (AI): Math quiz announced Mon"** | ✅ Works | Brilliant — gives the principal a hypothesis they can test, not just data |
| **5-day pattern bars are tiny** | 🟢 P3 | At 18px height they're barely readable on a 4K display. Bump to 24px and add tooltips with the actual %. |
| **41-section heat strip cells show numbers (96, 94, etc.) — small text** | 🟡 P2 | At 9px the text is below WCAG. Either make the cells bigger OR hide the numbers and rely on color alone with tooltip on hover. |
| **Today's absences list shows 6 of 59 with "View all 59 →" link** | ✅ Works | Right pattern |

### 6. Section mapping (`/admin/section-mapping` Tier 0)

The workflow is unusual — it asks the principal to be data-curator. UX is rough.

| Finding | Severity | Fix |
|---|---|---|
| **"Click Generate SQL · paste into Supabase SQL Editor → Run" instructions in the banner** | 🔴 P1 | This is asking the principal to be a database admin. Show the SQL only in a dev/debug toggle. The default flow should be: click Save → it just works (calls the API). Add the API endpoint as part of Task 17/18. |
| **Banner has ~70 words of explanation before the table** | 🟡 P2 | Cut to: "Manhaj parsed 41 section codes from your workbook. Confirm what each one is." Move the longer explanation to a "What's this?" tooltip. |
| **Table has 8 columns + 41 rows — wide + tall** | 🟡 P2 | On smaller laptops, the table will horizontally scroll. Consider collapsing "Notes" + "Status" into a single secondary row that expands on click. |
| **Status column shows ⊙ / ✓ symbols** | 🟡 P2 | Symbols without color cue are weak. Add green background tint on confirmed rows (already present) + a green dot icon — make confirmed state unmistakable. |
| **"Re-suggest all from codes" button — what does it do?** | 🟡 P2 | The button name doesn't explain. Rename: "Reset to Manhaj's auto-suggestions" + add a confirm dialog warning that user edits will be lost. |
| **"Confirm all visible" + "Generate SQL" buttons are similar weight** | 🟡 P2 | Make "Confirm all visible" ghost-style, "Generate SQL" primary. Hierarchy. |
| **No undo for "Confirm row"** | 🟡 P2 | Clicking the green "Confirmed" button should toggle back to "Confirm row" — it does currently in code. Add a subtle "↺ undo" affordance. |
| **The progress bar + counter at top is great** | ✅ Works | Gives a clear sense of "you've done X of 41" |

### 7. Monthly parent report (`/parent/report` Tier 0)

The visual flagship of the product. Strongest design across the set.

| Finding | Severity | Fix |
|---|---|---|
| **The 6-axis rubric radar is the differentiator** | ✅ Works | Beautifully executed, axis-labeled scores beside the radar are smart |
| **Cover-band gradient navy is striking** | ✅ Works | Sets up "this is a serious document" tone |
| **University-fit signal: "Profile strength · top 28%" + historical tiers** | ✅ Works | The strongest unique selling proposition on any page — frame this more prominently. |
| **"Drafted by Manhaj · reviewed and approved by Ms Sandra Swart" byline** | ✅ Works | This single line communicates the entire "AI-drafts-human-approves" trust story. Replicate the pattern on every AI-generated surface. |
| **6 subject cards in the performance grid take a lot of vertical space** | 🟢 P3 | Consider collapsing to a compact table for parents who want to scan; expand each card on click for detail |
| **"Bilingual EN/AR" isn't visible on this page** | 🟡 P2 | The static version doesn't have a language toggle. Add one (same pattern as the parent form) — parents may want to share with grandparents who only read Arabic. |
| **"View larger PDF version" / "Download" affordance missing** | 🟡 P2 | Add a download button — parents want to email this to spouses or print for school files. |

## Cross-page findings

| Finding | Severity | Where | Fix |
|---|---|---|---|
| **"soon" pills on 4 of 7 nav items** | 🟡 P2 | All admin pages | Either reduce to 1-2 "soon" items (focused promise) or remove pills entirely and just hide the unbuilt items. The current "look at all the things we don't have yet" signal is anti-marketing. |
| **External-link arrow icon missing on links to manhaj.pages.dev** | 🟢 P3 | Tier 1 admin layout | Sections/Attendance links open Tier 0 in a new tab — the user doesn't know they're leaving the app. Add ↗ icon + tooltip. |
| **No global loading skeleton — Suspense fallbacks show plain "Loading…" text** | 🟡 P2 | Tier 1 pages | Adopt a 3-line shimmer skeleton matching the page structure. |
| **No dark mode** | 🟢 P3 | All pages | Some principals work late; the bright bg hurts at night. Could be a future polish. |
| **No focus rings visible on tab navigation** | 🟡 P2 | All pages | Default browser focus rings are removed by `outline:0`. Replace with custom focus-visible styles. Keyboard users currently can't see where they are. |
| **No `<lang>` attribute switch when bilingual toggle hits AR** | 🟡 P2 | Parent course-selection | Screen readers get confused. Set `<html lang="ar" dir="rtl">` dynamically. |
| **Topbar 60px height + 14px container padding** | ✅ Works | All pages | Density is on-brand for enterprise |
| **Color palette is restricted but coherent** | ✅ Works | All pages | Easy to scan; doesn't visually fatigue |

## Mobile responsiveness

| Page | Mobile readiness |
|---|---|
| Landing | ⚠️ Hero grid breaks below 760px — cards stack but stats row overflows |
| Login | ✅ Card is mobile-friendly (380px max-width centered) |
| Parent course-selection | ✅ Form mostly fine; topbar language toggle may crowd |
| Admin dashboard | ❌ Hero grid-template-columns:repeat(4,1fr) doesn't gracefully collapse; heatmap is horizontal scroll only |
| Attendance | ❌ Same hero issue; heat strip 41 columns × 22px = horizontal scroll required even on iPad |
| Section mapping | ❌ 8-column table demands desktop |
| Parent report | ⚠️ Radar SVG is fixed 320px; perf grid drops to 1-col but section sizes don't adapt |

**Recommendation**: don't try to make /admin work on mobile — it's a principal-at-desk tool. But /parent/* pages MUST work on mobile because parents arrive via WhatsApp links. Right now /parent/select-courses is the only one passing.

## Priority recommendations (the actionable shortlist)

1. **🔴 P1 · Strip all "Tier 1 preview / Tier 0 / Postgres / database / ETL / SQL" copy from user-facing pages.** Quickest, most impactful confidence boost. 30-min editing pass across the landing, login, parent form, mapping page. Engineering language goes in `docs/`, not in the UI.

2. **🔴 P1 · Add named steps to the parent wizard progress indicator.** "Student info · Compulsory · Electives · Review" — single 10-min change, removes the "how long is this going to take?" anxiety.

3. **🔴 P1 · Add an LLM-composed headline to the admin dashboard.** "3 sections need mapping, 2 teachers over capacity, Math department is balanced." One sentence at the top. This is the difference between "data dump" and "decision support."

4. **🔴 P1 · Default the heatmap to the most actionable filter (HS-only or showing-gaps-only) rather than all 41 sections.** Cuts initial cognitive load by ~75%.

5. **🔴 P1 · Replace the section-mapping "Generate SQL" output with a direct save API call.** Asking the principal to paste SQL into Supabase is the single most "this is a hacky prototype" moment in the product. Build the API endpoint as part of an auth follow-up.

6. **🔴 P1 · Add draft auto-save to the parent course-selection wizard.** Parents WILL navigate away, get a WhatsApp, and come back. Currently they lose everything.

7. **🟡 P2 · Tighten "soon" nav pills to 1-2 items max, hide the rest.** Or build a single combined "More coming" tab instead of N greyed-out items.

8. **🟡 P2 · Translate the AI's statistical language ("p < 0.05") into plain English on the attendance mockup.** "We're confident this isn't random" is exactly the right tone.

9. **🟡 P2 · Mobile-first redesign of `/parent/*` pages.** WhatsApp distribution = phone-first usage. Currently passing but not optimized.

10. **🟢 P3 · Add an LLM-style "What you can do here" tooltip on each major card.** First-time users will skip features they don't understand; a single-sentence "?" tooltip handles 80% of that.

## What works (don't break these)

- The 6-axis rubric radar — visually distinctive, semantically meaningful, defensibly novel
- The "drafted by Manhaj · approved by [teacher]" byline pattern on AI-generated content
- The universal navy/grey/red/green palette across all pages
- The card-based information architecture
- The bilingual EN/AR support on the parent flow
- The progress indicator + status counter on the section-mapping page
- The "Likely cause (AI)" column on the attendance page — concise hypothesis instead of just data
- The pricing-free, no-trial-banner positioning — feels like a real product, not a startup landing page

## How I'd phase the fixes

**Week 1 (copy-only — no engineering)**: P1 items 1, 2, 6 partial (warn before navigate). All editing, no code changes beyond text. Could ship in 2-3 hours.

**Week 2 (small engineering)**: P1 items 3 (headline), 4 (heatmap default), localStorage draft save. P2 items: friendly error copy, focus rings.

**Week 3 (medium engineering)**: P1 item 5 (section-mapping API endpoint, drop SQL paste). Mobile polish on /parent/*. AI chat box repositioning on /admin.

**Week 4+ (Tier 2 stretch)**: Dark mode, download-as-PDF for reports, language detection on first visit.
