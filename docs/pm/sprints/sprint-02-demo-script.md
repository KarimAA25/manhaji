# ISO Pilot — Demo Script (walkthrough)

**For:** Elias, presenting to the ISO principal · **Site:** `https://manhaji-portal.vercel.app`
**Status:** the platform runs on **ISO's real data** (745 students, 78 teachers, real timetable).

---

## Before you start
- **Logins:**
  - **Admin:** `admin@manhaj-demo.com` / `Admin2026!`
  - **Parent:** `azrin.abaziz@demo.manhaj.school` / *(the password you set)* — the **Ab Aziz** family (Aara 4A + Aarieq 7A)
  - **Student:** `aara.abaziz@demo.manhaj.school` / *(password you set)*
- **One-liner framing to open with:** *"This is your school — your real staff, students, and timetable — running live. I'll show you what's working today, and we've got a short list of data we need from you to switch on the rest."*

## The walkthrough (suggested order)

**1. Admin dashboard** — *"Good morning, Principal."*
Open on the real school at a glance. Set the tone: this isn't a mock-up, it's ISO.

**2. Faculty** *(the cleanest win)* — `/admin/faculty`
- **78 teachers**, each in their **real department** (English, Mathematics, Arabic, Sciences…), with their **real weekly teaching load**.
- Talk track: *"Every teacher, their department and their load, pulled straight from your timetable."*

**3. Students** — `/admin/students`
- **745 students** enrolled across your KG-to-Grade-12 sections.
- *"Your full roster is in — names, classes, and family links."*

**4. Schedule → Cover planner** *(the headline "self-healing timetable")* — `/admin/schedule` → **Cover planner** tab
- Defaults to: *"If **Sahar Mohamad** is absent on **Tuesday**, Manhaj auto-covers **9 of 9 lessons**"* — 9 qualified substitutes, each free that period.
- Switch the day to **Wednesday** to show the honest case: *"7 of 9 covered · 2 periods need a manual decision"* (flagged in red).
- Talk track: *"The moment a teacher is out, the system proposes who covers each class — same-subject where possible — and tells you honestly where it needs your call."*
- ⚠️ **This tab needs the hosted-deploy fix (see caveat) — until then, demo it on a local run.**

**5. Parent view** — log in as **Azrin Ab Aziz**
- The **weekly digest**, then **Sibling comparison** (Aara + Aarieq side by side).
- *"This is what a parent sees — one clear view of each child."*

## Be honest about what's next (builds trust)
*"A few things are still demo data because we're waiting on it from you"* — pull up the **data request** (the PDF + spreadsheet we're sending): parent **contacts**, **attendance**, **grades**, **fees**. *"Send us these and we switch on the parent portal, messaging, and reporting."*

## Known limits (don't demo these as finished)
- **Ask Manhaj / AI** buttons — not switched on yet (Phase 2).
- **Cover planner on the hosted site** — needs the file-bundling fix first (works locally now).
- Parent contacts / attendance / grades / fees — demo data pending the school's data.
