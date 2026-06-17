# Source-file inventory — what we actually have

Pilot school: **International School of Oman** (ISO), Al Athaiba, Muscat. C.R. 1/04824/7.
Curriculum: KG → G12, IGCSE (G9–G10), AS (G11), A2 (G12).

## File 1 — `24-25 provisional_18-8-2024.xlsx`

40 sheets. A multi-year evolving timetable workbook with historical versions from 2019-20 onward. **Only two sheets matter for us right now:**

### Sheet `26-27A` (next year's plan, 285×158)

Structure: teacher-load matrix.

- **Rows**: teachers (multi-row blocks; one teacher every ~4 rows)
- **Columns**: ~40 class-sections grouped 3–5 columns each (sub-columns = subjects taught in that section)
- **Cells**: weekly period count

Column-header literals (the section codes we'll persist verbatim):
```
KG: K1A KG1B KG2C KG2A KG2B
G1-2: 1A 1B 1C 2A 2B 2C 1-2 AL
G3-4: 3A 3B 3C 4A 4B 4C 3-4 AL
G5-6: 5A 5B 5C 5-6 AL 6A 6B 6C
G7-8: 7A 7B 7C 8A 8B
G9-10: 9A 9B 10A 10B
G11-12: 11A 11B 11 AS 12A 12B 12 A2
```

`AL` suffix on combined-grade rows likely = Arabic Literature / Arabic-track group.
`AS`/`A2` = AS-Level / A2 cohorts. **TODO: confirm with school.**

Top-level teacher columns: `S#` (serial), `TEACHER`, `max # of lessons` (cap, typically 30), subject string, `T#P` (total assigned).

### Sheet `Faculty` (60×32 clean crosstab)

Cleanest source of teacher × subject load. Rows = 60 teachers. Columns grouped by department:

| Dept            | Subject codes |
|-----------------|---------------|
| Arabic          | A3, Ar       |
| English         | En, ER, ES   |
| French          | F2, F3       |
| Social-English  | SSE, Hi, CV, dv, Ec, BS |
| Social-Arabic   | SSA, IS      |
| Science         | Sc, Bi, Bi AP, Bi SS, Ch, Ch AP, Ph, Ph AP, IT |
| Math            | Ma, Ma AP, MS |
| Recreational    | Mu, PE, rt    |
| Assessment      | Ex, lb        |

Cell value = weekly periods that teacher delivers in that subject across all sections.

## Files 2–5 — Course Selection Circulars G9–G12 (.doc)

Bilingual EN/AR parent letters with subject lists. Used to populate `course_catalog` + `elective_bundles`.

### Compulsory (all grades)
Math, English, Arabic (or French at G10+ as substitute), Islamic Studies. + Civics at G11/G12. + Arabic Social Studies at G9/G10.

### G9 — choose **5** from these bundles (IGCSE entry)
1. Physics | Business Studies
2. Chemistry | Environmental Management
3. Biology | ICT
4. Economics | History | IGCSE Art & Design
5. PE | Art

### G10 — choose **5** (IGCSE finish)
1. Physics | Biology
2. Chemistry | Environmental Management
3. ICT | Business | IGCSE Art & Design
4. History | Biology Self-Study | Economics
5. PE | Art

### G11 — choose **3** (AS/GDE)
1. Physics | Business Studies
2. Chemistry | Economics
3. Biology | ICT
4. PE | Art

### G12 — choose **3** (A2/GDE)
1. Physics | Biology
2. Chemistry | Economics
3. Business | Biology Self-Study | ICT
4. Art | PE

## What's NOT in these files (must be sourced separately)

- Student roster (names, IDs, dates of birth, sections, contacts)
- Parent contacts (phone, email, WhatsApp opt-in)
- Day × period × room timetable (only the **load** is in the workbook, not the period grid)
- Attendance, grades, assessments, fee balances
- Past parent-report content / report-card narratives
- Alumni placement history (for the university-fit signal in classroom module)
