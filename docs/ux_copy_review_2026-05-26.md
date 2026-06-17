# UX copy review — Manhaj · 2026-05-26

Audience map:
- **Principal** = professional, time-poor, evaluating us. Reads in 30-second bursts between meetings.
- **Parent** = bilingual EN/AR, mobile-first via WhatsApp, often anxious about their child. Reading on a phone in a car.

Every sentence in the product is being read by one of these two people. Engineering-side context belongs in `docs/`, not the UI.

---

## 1. Jargon leaks — flat-out delete these

Every instance below leaks technical context to a user who doesn't care and shouldn't have to.

| # | Location | Current | Why broken | Replacement |
|---|---|---|---|---|
| 1 | Landing topbar sub-line | `Manhaj · Tier 1 preview` | "Tier 1" = our internal nomenclature | `Manhaj · International School of Oman` |
| 2 | Landing hero pill | `Live pilot · International School of Oman · Postgres-backed` | "Postgres-backed" = our infra choice | `Live pilot · International School of Oman` |
| 3 | Landing hero body | `…stitched together by a Postgres data layer schools running PowerSchool…` | "Postgres data layer" = jargon | `…stitched together by a single data layer schools running PowerSchool…` |
| 4 | Landing hero body | `This page reads live counts from Supabase.` | We don't need to explain our stack | DELETE the sentence entirely |
| 5 | Landing footer | `Tier 1 build · pages with an external link still live on the Tier 0 static demo. Migration in progress.` | Tells the user "we're half-built" | DELETE the entire line |
| 6 | Login banner — pilot phase | `Pilot phase: any email works to sign up. Once we onboard ISO formally, this will be restricted to school-issued email addresses + SSO.` | Tells user they're not a real customer | `Closed beta — invitation-only emails accepted. Contact your school administrator for access if you weren't expected to land here.` |
| 7 | Login error | `Sign-in failed (exchange_failed). exchange_failed: 80-char reason` | Raw error code surfaced | `That link has expired or already been used. Send a fresh link.` |
| 8 | Parent course-selection banner | `Tier 1 live · Submitting this form actually writes a row to Supabase Postgres (course_selection_forms + course_selection_picks). Use any student name — if none exists in the roster yet, a stub student record is created automatically.` | Engineering side-talk in a parent flow | DELETE entirely. A parent doesn't need a banner here at all. Maybe a quiet single-line note: `New enrolment for AY 2026/27.` |
| 9 | Parent course-selection submit button (review step) | `Submit · save to database` | "save to database" = leak | `Submit selection` (EN) / `إرسال الاختيار` (AR) |
| 10 | Parent course-selection submitting state | `Saving to Supabase…` | Vendor name | `Saving…` (EN) / `جارٍ الحفظ…` (AR) |
| 11 | Parent course-selection success card | `Form ID: 14b2c9d8…` / `Student ID: 7f9a1c2e…` / `Picks saved: 5` / `Stub student created (no roster yet).` | UUIDs + "stub" leaked | `Reference: ISO-1B2C3D` (first 6 chars formatted) / hide IDs / drop "stub" note entirely |
| 12 | Admin dashboard sub | `Live read from Supabase Postgres · school_id 94e4ca02…` | Vendor + UUID | `Live data · International School of Oman · last refreshed [timestamp]` |
| 13 | Admin dashboard banner | `Tier 1 preview — every number on this page comes from Postgres at request time. Filter the load distribution by department or status; filter the heatmap by grade band.` | "Tier 1 preview" + "Postgres" | DELETE the first sentence; keep the second as a tip: `Tip: filter the load distribution by department or status; filter the heatmap by grade band.` |
| 14 | Section mapping banner — instructions | `…click **"Generate SQL"** and paste the result into Supabase SQL Editor to save.` | Asks the principal to be a DBA | After we ship the save-API endpoint: `Click Save when you're done.` Until then, hide the SQL flow behind a "Show advanced (developer)" toggle and have the default button be `Save mapping` (which until the API ships, shows a polite "Coming soon" toast — better than exposing SQL). |
| 15 | Section mapping success | `Success. <span id="sql-row-count">N</span> rows affected.` | "rows affected" = engineering | `Saved. N sections updated.` |
| 16 | Attendance dashboard hero | `Live read from attendance_marks — updates as teachers submit AM register` | Table name | `Daily register — updates as teachers submit attendance` |
| 17 | Attendance AI alerts | `pattern p < 0.05` | Statistical jargon | `We're confident this isn't random.` |
| 18 | Attendance AI alerts | `Detected by anomaly model · last update 2h ago` | "anomaly model" | `Detected by Manhaj · refreshed 2h ago` |
| 19 | Parent report byline | `Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026` | ✅ This is actually perfect — keep | (no change) |
| 20 | Parent report URL footer | `Reply on WhatsApp · +961 XX XXX XXX` | Placeholder phone | Replace with real number or `[school contact]` until then |
| 21 | "Tier 1 preview" sub-line in `/admin` Tier 1 hero | `Live pilot · International School of Oman · Postgres-backed` | Same as #2 | Same fix |

---

## 2. Anxiety-inducing copy — these undermine sale

Phrases that signal "we're not a finished product" to someone deciding whether to use us.

| # | Location | Current | Fix |
|---|---|---|---|
| A1 | Landing footer | "Migration in progress" | DELETE (covered above) |
| A2 | Landing role-card subtitle | `body="Sample monthly report driven by the Manhaj six-axis rubric framework — the strengths/weaknesses signal nobody else in K-12 ships."` | The "nobody else in K-12 ships" reads like a sales-deck claim to the wrong audience. Soften: `body="Monthly report with the Manhaj 6-axis rubric profile — strengths, areas to build, and university-fit signal."` |
| A3 | Login footer | "Once we onboard ISO formally…" | DELETE/reframe (covered above) |
| A4 | Parent wizard banner | "Tier 1 live" + Postgres talk | DELETE |
| A5 | Multiple admin pages | "Tier 1 preview / Tier 1 next" pills on disabled nav | Currently 4 of 7 tabs marked "soon" with grey pills. The cumulative effect is "this product is half-finished." Either reduce to 1-2 visible pills max, or remove all the disabled items entirely and just hide them. Show only what works. |
| A6 | Section mapping banner | `…doesn't assume what each one means — schools use different conventions.` | The framing is defensive ("we don't know"). Reframe as a positive — `Each school's section codes mean different things. Tell Manhaj how yours map.` |
| A7 | Admin dashboard red banner | `41 of 41 sections still need mapping — a human needs to confirm what each section code means.` | "a human needs to confirm" sounds clinical. Reframe: `41 sections waiting for review. Confirm what each code means to unlock reports.` |
| A8 | Attendance dashboard | `Mockup preview — this page shows what attendance will look like once teachers start submitting daily registers via the Manhaj teacher PWA (Tier 2). Numbers below are synthesised for visual reference; real attendance_marks rows arrive once the school enables the daily-register flow.` | Wordy + leaks "PWA", "Tier 2", "attendance_marks". Rewrite: `Preview only — sample numbers. Live attendance data starts flowing once teachers begin submitting the daily register from the Manhaj teacher app.` |

---

## 3. Compulsory / imperative tone — soften, explain why

Schools work in collaborative-management mode. The tone should be advisory, not commanding.

| # | Location | Current | Fix |
|---|---|---|---|
| B1 | Section mapping `Confirm row` button | `Confirm row` | Fine if hover tooltip explains: `Confirm row — locks this section's grade and stream in.` |
| B2 | Section mapping banner | `What to do: review the suggested grade / label / stream for each section. Edit if wrong. Click "Confirm row" when correct (or "Confirm all visible" at the bottom).` | Step-by-step but condescending. Trim: `Review each row. Manhaj's best guess is pre-filled — adjust where needed, then confirm.` |
| B3 | Parent wizard step 2 hint | `These are required for all students at this grade. You'll choose electives next.` | Fine, but lead with reassurance: `Standard subjects every student takes at this grade — no choice needed. You'll pick the electives on the next screen.` |
| B4 | Course-selection submit button (Continue) | `Continue →` | Fine. ✅ |
| B5 | Login "Send magic link" button | `Send magic link` | Fine if user knows what a magic link is. For school staff unfamiliar with the term, consider: `Email me a sign-in link` (more literal, more friendly). |

---

## 4. Error messages — rewrite all of them

Errors should follow: **What happened · Why · How to fix.**

| # | Location | Current | Fix |
|---|---|---|---|
| E1 | Login callback failure | `Sign-in failed (exchange_failed). exchange_failed: 80-char reason` | `That link has expired or was already used. Send yourself a fresh link.` |
| E2 | Login | `missing_code` | `That link looks incomplete. Try sending yourself a new one.` |
| E3 | Login | `Please enter a valid email address.` | ✅ Fine |
| E4 | Parent wizard validation | `Please pick one option per row. 2 pending.` | ✅ Mostly fine; tighten: `Pick one in each row — 2 still to go.` |
| E5 | Parent wizard server-side | `Missing pick for bundle "Science 1".` | Bundle labels are an internal concept. User-facing: `Pick one option in the "Science 1" row.` |
| E6 | Parent wizard server-side | `Could not create student row: <pg error>.` | `Couldn't save the form. Please try again — if the problem persists, contact the school office.` |
| E7 | Parent wizard server-side | `Invalid pick "X" for "Science 1".` | `That choice doesn't match the available options. Refresh the page and try again.` |
| E8 | Section mapping clipboard fail | `Could not copy to clipboard. Select the SQL block manually and copy.` | (When the SQL flow goes away this disappears) For now: `Couldn't copy — select the text and use Cmd+C / Ctrl+C.` |
| E9 | Admin dashboard error (no service-role key) | `No data returned from Supabase. Most likely cause: SUPABASE_SERVICE_ROLE_KEY isn't set in apps/web/.env.local. The publishable key alone can't read Postgres (RLS blocks it). Add the service-role key from Supabase Dashboard → Settings → API → service_role, then restart the dev server.` | This is dev-only — users will never see it in production. But leave it as-is for dev (it's actually helpful for the developer). Hide on prod via env check: `process.env.NODE_ENV === 'production'`. |

---

## 5. Empty states — add these (currently missing)

The product has none. Every list / table that could be empty should have a friendly state.

| # | Location | Suggested copy |
|---|---|---|
| F1 | Teacher load list — no teachers match filter | **`No teachers match these filters.`** sub: `Try clearing the department or status filter, or check that this academic year has teachers assigned.` |
| F2 | Section heatmap — no sections in current grade band | **`No sections in this grade band yet.`** sub: `Switch to "All grades" to see everything, or add sections via the workbook ingest.` |
| F3 | Section mapping — first-time visit, all unconfirmed | **`41 sections to review.`** sub: `Manhaj pre-filled each row with a best guess — usually it's right. Confirm rows that look correct, edit the ones that don't.` |
| F4 | Course selection (no electives needed for grade — hypothetical) | **`No electives to pick at this grade.`** sub: `Your child's grade only has compulsory subjects this year. You're all set — submit to confirm.` |
| F5 | Today's absences (Tier 2 future) | **`No absences today.`** sub: `Every student in attendance — quiet day!` |
| F6 | AI-flagged patterns (Tier 2 future) | **`Nothing unusual this week.`** sub: `Manhaj watches for attendance dips, late-arrival clusters, and similar patterns. Nothing flagged in the last 7 days.` |

---

## 6. Bilingual EN/AR — translation quality

Audit of the AR strings on the parent course-selection wizard:

| EN | Current AR | Notes |
|---|---|---|
| `Course selection · AY 2026/27` | `اختيار المواد الدراسية · العام الدراسي 2026/27` | ✅ Natural |
| `Please select your child's grade for next year to begin.` | `يرجى تحديد صف ابنك/ابنتك للعام المقبل للبدء.` | ✅ Inclusive (son/daughter) |
| `Student name` | `اسم الطالب` | ✅ |
| `Grade in AY 2026/27` | `الصف في العام الدراسي 2026/27` | ✅ |
| `Language preference (compulsory)` | `تفضيل اللغة (إجباري)` | ✅ "(إجباري)" reads naturally |
| `Continue →` | `متابعة →` | ✅ |
| `Compulsory subjects · Grade 9` | `المواد الإلزامية · الصف 9` | ✅ |
| `These are required for all students at this grade. You'll choose electives next.` | `هذه المواد إلزامية لجميع طلاب هذا الصف. ستختار المواد الاختيارية تالياً.` | ✅ |
| `← Back` | `← رجوع` | ✅ |
| `Continue to electives →` | `متابعة إلى المواد الاختيارية →` | ✅ Note: the `→` arrow should mirror to `←` in RTL — check it visually |
| `Electives · pick 5 in total (one per row)` | `المواد الاختيارية · اختر 5 من المجموع` | ⚠️ The "(one per row)" detail is dropped in AR. Add: `اختر ٥ مواد · واحدة من كل صف` |
| `Each row offers a choice. Pick one option per row.` | `كل صف يقدم خياراً. اختر خياراً واحداً لكل صف.` | ✅ |
| `Bundle` | `مجموعة` | ✅ |
| `Review selection →` | `مراجعة الاختيار →` | ✅ |
| `All set — please review and confirm` | `تم — يرجى المراجعة والتأكيد` | ✅ Note: "تم" means "done" — could be `كل شيء جاهز` (everything's ready) for warmer tone |
| `Once submitted, the row lands in Supabase immediately.` | `عند الإرسال، يتم الحفظ في قاعدة البيانات فوراً.` | ❌ "قاعدة البيانات" = "database" — same jargon leak in AR. Replace with: `عند الإرسال، يتم حفظ اختياركم فوراً.` (your choice is saved immediately) |
| `Submit · save to database` | `إرسال · حفظ في قاعدة البيانات` | ❌ Same jargon. → `إرسال الاختيار` (Submit the selection) |
| `Saving to Supabase…` | `جارٍ الحفظ…` | ✅ AR is already clean (only EN leaks the vendor) |
| `Submitted` | `تم الإرسال` | ✅ |
| `Saved to Supabase. The school administration has been notified.` | `تم الحفظ في قاعدة البيانات. تم إبلاغ الإدارة.` | ❌ Again "قاعدة البيانات". → `تم الحفظ. تم إبلاغ إدارة المدرسة.` |
| `Stub student created (no roster yet).` | `تم إنشاء سجل طالب مؤقت.` | ❌ Don't show this at all (English fix #11). |

**Bilingual systemic issues:**
- The AR copy is generally natural and translator-quality. **The leaks come from EN-side that the translator faithfully mirrored.** Fix EN first; AR auto-fixes.
- One mirroring bug to verify: `→` arrows should become `←` in RTL mode (CSS `direction: rtl` doesn't auto-flip arrows in content text).
- Numbers in AR — currently "5" stays as Western Arabic numeral. Eastern Arabic numerals are `٥`. For ISO (Oman) audience, Eastern numerals are more natural in Arabic UI. Worth A/B'ing.

---

## 7. AI-labelling — small but high-stakes

The product's positioning is "AI buys back time so humans can spend more of it on interaction." Every AI surface needs to feel earned, not magical.

| Surface | Current | Assessment | Refinement |
|---|---|---|---|
| Admin dashboard load distribution | `AI suggestion (preview):` | ✅ The "(preview)" is honest — we're not pretending it's a final recommendation. Keep. | Optional: `Manhaj suggests (early read):` — same intent, replaces "AI" with the product name (less robot energy) |
| Admin dashboard | `Ask Manhaj — e.g. "who can take 2 more Math periods at G10?"` | ✅ Example is concrete + actionable. Good. | (no change) |
| Parent report | `Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026` | ✅ **This is the gold standard** — name the AI, name the human approver, date-stamp. Replicate everywhere. | (no change) |
| Attendance "Likely cause (AI)" column header | `Likely cause (AI)` | ✅ Honest framing | Tighter: `Likely cause` with a small `?` tooltip that says "Manhaj's guess — check before acting" |
| Attendance AI alert footer | `Detected by anomaly model · last update 2h ago` | ⚠️ "anomaly model" is jargon | `Spotted by Manhaj · refreshed 2h ago` |
| Attendance AI alert | `pattern p < 0.05` | ❌ Statistical jargon | `We're confident this is a real pattern — not random.` |
| Parent report disclaimer | `Based on Manhaj rubric profile + IGCSE projection compared against International School of Oman's alumni placement history. Shown as historical bands, not predictions. Refreshed monthly.` | ✅ Excellent honesty | Keep as-is. This is exactly the right tone. |
| Parent report university-fit | `Historical placement tiers for this rubric profile:` | ✅ "Historical, not predictive" = legally + ethically right | (no change) |
| AI suggestion pills | `Simulate →` / `Find a sub` / `Rebalance Math` | ✅ Action verbs, no hedge | (no change) |

**Systemic AI-labelling rule** (extract to a brand-voice doc):
> When Manhaj generates content, attribute it: `[Manhaj-drafted · reviewed by <named human> · <date>]`. When Manhaj suggests an action, hedge it: `(early read)` or `(preview)`. When Manhaj infers a probability, translate it: never use p-values, confidence intervals, or "the model thinks" — say "we're confident" / "we think" / "worth checking" in plain English.

---

## 8. Microcopy that's missing entirely

Places where there should be helpful text but there isn't:

| # | Where | Add |
|---|---|---|
| M1 | Login email field placeholder | `you@school.edu` ✅ already there |
| M2 | Login below button | `We'll send a one-click sign-in link to that address.` ✅ already there (good!) |
| M3 | Parent wizard email confirmation | After submit, a "What happens next" panel: `The school administration will review and confirm by 29 January 2026. If anything needs to change, they'll reach you on WhatsApp.` |
| M4 | Section mapping help | A small `?` next to each column header explaining what "Grade level" / "Stream" / "Capacity" mean for the principal. |
| M5 | Heatmap legend | Currently shows color bands. Add: `Hover any cell to see the teacher + subject details.` |
| M6 | Course-selection grade-picker dropdown | After picking, a small inline hint: `IGCSE — pick 5 electives in addition to the 5 compulsory subjects.` |
| M7 | Filters (admin dashboard) | "All departments / All statuses" should explain when nothing changes — `Showing 69 of 69 teachers.` ✅ already there |

---

## Priority rewrites (the must-fix-this-week list)

If you only do five things, do these. Each is a copy-only change, no engineering:

1. **Strip every "Tier 1/0", "Postgres", "Supabase", "ETL", "SQL"** from user-facing pages. Items 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 15, 16, 18 above — ~15 edits total, maybe 20 minutes.

2. **Login footer rewrite:** "Closed beta — invitation-only emails accepted." (Item 6)

3. **Login error message:** "That link has expired or was already used. Send a fresh link." (Item 7 / E1)

4. **Parent wizard banner DELETED + submit button text → "Submit selection"** (Items 8, 9, 10)

5. **AI alert "p < 0.05" → "We're confident this isn't random."** (Item 17)

Once these are done the product reads completely differently. The "we're half-built" anxiety drops dramatically, and the principal/parent gets to focus on what the product actually does.

## Voice / tone reference (extract to a style doc)

| Context | Voice |
|---|---|
| Talking to a principal | Direct, action-first ("3 sections need mapping" not "There appear to be 3 sections that may require mapping") |
| Talking to a parent | Warm, reassuring, concrete ("Your child's report is ready — review and reply if you have questions") |
| Showing AI-generated content | Always name the AI + the human approver + date. Never claim magic. |
| Showing an error | What + Why + Fix, in that order |
| Showing data | If a number can have meaning beyond itself, give that meaning ("76% utilisation · 2 teachers over cap") |
| Showing nothing | Friendly emptiness with a path forward, never "No results" alone |

## What's working really well (don't break)

- **`Drafted by Manhaj · reviewed and approved by Ms Sandra Swart · 8 May 2026`** — gold standard AI attribution pattern
- **`(preview)` qualifier on AI suggestions** — appropriately humble
- **Universal "Manhaj" branding** instead of "the app" or "the system" — keeps the product personable
- **Parent wizard error message tone** (`Please pick one per row`) — directive but not condescending
- **The data-density on /admin** has labels everywhere — almost nothing is unexplained
