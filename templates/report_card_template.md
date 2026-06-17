# Manhaj Report Card Template — proprietary IP

The end-of-term report card. One per term, bilingual EN/AR, signed digitally by the homeroom teacher and head-of-section, delivered to parents via the Manhaj parent PWA + a WhatsApp link.

Schools do not design this — we ship a single Manhaj template across all customers. Schools can tune the school crest, brand colours, and one optional "Head of School" message slot.

## Layout (1 page per term, A4)

### Top band (cover)
- School crest + name (EN + AR), term label, academic year
- Student photo (optional), full name (EN + AR), grade, section, student ID
- Term-level KPI strip: weighted GPA · attendance % · rubric composite (out of 5) · homework on-time rate

### Section 1 — Term narrative (~120 words)
- AI-drafted, teacher-edited, head-of-section-approved
- Three required beats: (1) overall trajectory, (2) strongest area + evidence, (3) area to build + evidence
- Two automatic guardrails: no comparison to specific peers; no diagnostic language ("appears anxious" → blocked)

### Section 2 — Subject grid
- One row per subject taken this term
- Columns:
  - Subject (EN / AR)
  - Term grade (school's grade band — A*/A/B+/etc., or 0–100 if school doesn't use bands)
  - Trend vs last term (▲/—/▼ with delta)
  - Class context (class avg + percentile)
  - Rubric mini-bar showing the 6-axis composite (small inline radar or single-bar)
  - Teacher initials (clickable to expand subject narrative on the PWA)

### Section 3 — Rubric profile (full radar)
- The Manhaj 6-axis radar across all subjects (averaged)
- Per-axis numeric score (1.0–5.0) with band label (Emerging → Mastering)
- One-line term-level descriptor per axis

### Section 4 — Per-subject narrative (collapsed by default in PWA, expanded in PDF)
- One short paragraph per subject (~50 words), AI-drafted from the teacher's voice memos + rubric scores, then teacher-edited
- Each ends with one concrete next-term focus item

### Section 5 — Attendance + behaviour
- Days present / absent / late
- Sectioned by reason if school captures: medical, family, other
- Behaviour notes count (positive + concerns) — link to behaviour log if any flags

### Section 6 — University-fit early indicator (G9 and above only)
- Profile-strength score (0–100)
- Historical placement bands from the school's own alumni data (top 3 tiers)
- Strongest-fit fields
- Watch list (gaps that would block specific applications)
- **Always shown as historical bands, never as a prediction.** Disclaimer line is mandatory.

### Section 7 — Improvement plan (carry-forward)
- The three actions from the most recent monthly report, with status: completed / in-progress / not-started
- Next term's three actions, auto-drafted from rubric trends + teacher input

### Signatures band (footer)
- Homeroom teacher: digital signature + initials block
- Head of section: digital signature + initials block
- Parent acknowledgement: tick + timestamp on PWA
- Generated date + Manhaj traceability code

## Voice / tone rules (enforced by AI drafting layer)

- **Specific over generic** — "scored 92% on the equilibrium quiz" beats "did well in Chemistry"
- **Behaviour focus on actions, not personality** — "did not submit 3 homeworks" not "lacks discipline"
- **Forward-looking** — every section ends with what's next, not what was wrong
- **One concrete next step** per concern — never list-of-five
- **No comparisons to named peers** — only class average + percentile
- **No diagnostic language** — no "anxious", "lazy", "gifted"; replace with observable behaviours
- **Bilingual consistency** — both EN and AR pass through Manhaj's bilingual terminology glossary so meaning matches across the two columns

## Cadence

| Step | Who | When |
|---|---|---|
| AI draft generated | Manhaj system | Day after last assessment of the term enters the system |
| Teacher edits + approves subject narratives | Subject teachers | Within 5 working days of draft |
| Head of section reviews + signs | Head of section | Within 2 working days of teacher sign-off |
| Released to parents | Automatic | On term-end release date set by school |
| Parent acknowledgement deadline | Parents | 14 days after release |

## Why this template will close the school's mind

- **Signal-rich without being long** — one A4 page captures grades, rubric, narrative, attendance, university signal. Competitors print 6 pages of repetitive boilerplate.
- **Defensible AI** — every paragraph has named teacher + head approver. Parents see the AI-drafted-then-human-approved chain.
- **Bilingual on equal footing** — EN and AR rendered side-by-side from the same canonical source, not Google-translated post-hoc.
- **University-fit baked into the report card itself** — not a separate "guidance" service the school has to sell on top.
