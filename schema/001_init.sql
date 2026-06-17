-- School Ops Platform — initial schema
-- Pilot school: International School of Oman (ISO), Al Athaiba, Muscat
-- Source files this schema is grounded in:
--   data/source/24-25 provisional_18-8-2024.xlsx  (sheet "26-27A", "Faculty")
--   data/source/Course Selection Circular_G{9..12}_AY 2026-2027.doc
--
-- Column comments include the literal source field where applicable, so the
-- ETL job can be regenerated mechanically if the school's sheet layout changes.
--
-- Conventions:
--   - All tables are tenant-scoped via school_id (RLS in a later migration).
--   - codes/labels are kept verbatim from school side; canonical fk in parallel.

set search_path = public;

-- =====================================================================
-- 0. Tenant + academic year
-- =====================================================================

create table schools (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,                  -- "International School of Oman"
    country_code    text not null,                  -- "OM"
    timezone        text not null default 'Asia/Muscat'
);

create table academic_years (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    label           text not null,                  -- "2026-2027" (matches sheet "26-27A")
    starts_on       date,
    ends_on         date,
    is_current      boolean not null default false,
    unique (school_id, label)
);

-- =====================================================================
-- 1. People: teachers, students, parents
-- =====================================================================

create table teachers (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    full_name       text not null,                  -- Faculty sheet col 0; 26-27A col 1 "TEACHER"
    display_name    text,                           -- normalised, title-cased
    primary_dept    text,                           -- inferred from Faculty sheet col group: Arabic|English|French|Social-English|Social-Arabic|Science|Math|Recreational|Assessment
    primary_subject_text text,                      -- 26-27A col 3 raw string (e.g. "ENGLISH", "ESS G2 COOR")
    employment_status text default 'active',
    notes           text,
    unique (school_id, full_name)
);

create table students (
    -- NB: NO student-level data exists in the source files.
    -- This table is a stub; populated from a separate roster import (CSV from school) in a later step.
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    external_ref    text,                           -- school's own student ID
    full_name_en    text not null,
    full_name_ar    text,
    gender          text,
    date_of_birth   date,
    nationality     text,
    enrolled_on     date,
    withdrawn_on    date,
    unique (school_id, external_ref)
);

create table parents (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    full_name       text not null,
    phone_e164      text,
    email           text,
    preferred_lang  text default 'en'               -- circulars are bilingual EN/AR → assume both supported
);

create table student_parents (
    student_id      uuid not null references students(id) on delete cascade,
    parent_id       uuid not null references parents(id) on delete cascade,
    relationship    text not null,                  -- 'father'|'mother'|'guardian'
    is_primary      boolean default false,
    primary key (student_id, parent_id)
);

-- =====================================================================
-- 2. Curriculum: subjects, course catalog, electives
-- =====================================================================

create table subjects (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    code            text not null,                  -- Faculty sheet row 2: A3, Ar, En, ER, ES, F2, F3, SSE, Hi, CV, dv, Ec, BS, SSA, IS, Sc, Bi, "Bi AP", "Bi SS", Ch, "Ch AP", Ph, "Ph AP", IT, Ma, "Ma AP", MS, Mu, PE, rt, Ex, lb
    name_en         text not null,                  -- mapped from circular wording (Physics, Chemistry, Biology, Business Studies, ICT, Economics, History, Environmental Management, Art & Design, PE, Art, Math, English, Arabic, French, Islamic Studies, Civics, Arabic Social Studies)
    name_ar         text,
    department      text,                           -- Faculty sheet row 1 group
    is_ap           boolean default false,          -- "Bi AP" / "Ma AP" / "Ch AP" / "Ph AP" → AP variant
    is_self_study   boolean default false,          -- "Bi SS" → self-study (appears in G10 elective options)
    unique (school_id, code)
);

create type curriculum_stage as enum ('EY','PRIMARY','MIDDLE','IGCSE','AS','A2');
create type elective_kind   as enum ('compulsory','elective_pick_one','elective_pair','pe_art');

create table course_catalog (
    -- One row per (academic_year × grade × subject). Drives "what's on offer" + the parent form.
    -- Populated from G9..G12 circulars and from sheet "26-27A" column structure for K..G8.
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    grade_level     text not null,                  -- 'KG1'|'KG2'|'1'..'12'
    stage           curriculum_stage not null,
    subject_id      uuid not null references subjects(id),
    kind            elective_kind not null,
    elective_bundle_id uuid,                        -- nullable; set for elective_pick_one members
    notes           text,
    unique (school_id, academic_year_id, grade_level, subject_id)
);

create table elective_bundles (
    -- A "choose one of these" group, e.g. G10 bundle = {Physics, Biology}
    -- G9  bundles: {Physics|Business}, {Chemistry|Env Mgmt}, {Bio|ICT}, {Economics|History|Art&Design}, {PE|Art}
    -- G10 bundles: {Physics|Biology}, {Chemistry|Env Mgmt}, {ICT|Business|Art&Design}, {History|Bio SS|Economics}, {PE|Art}
    -- G11 bundles: {Physics|Business}, {Chemistry|Economics}, {Biology|ICT}, {PE|Art}
    -- G12 bundles: {Physics|Biology}, {Chemistry|Economics}, {Business|Bio SS|ICT}, {Art|PE}
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    grade_level     text not null,
    label           text not null,                  -- "G10 Science Bundle 1" — human-readable
    pick_count      int  not null default 1,        -- student picks N of the options
    display_order   int
);

create table elective_options (
    bundle_id       uuid not null references elective_bundles(id) on delete cascade,
    subject_id      uuid not null references subjects(id),
    display_order   int,
    primary key (bundle_id, subject_id)
);

alter table course_catalog
    add constraint course_catalog_bundle_fk
        foreign key (elective_bundle_id) references elective_bundles(id);

-- =====================================================================
-- 3. Class sections (the columns in "26-27A")
-- =====================================================================

create table sections (
    -- Class sections, e.g. "KG1A", "KG2C", "1A", "9A", "11 AS", "12 A2", "1-2 AL", "3-4 AL", "5-6 AL"
    -- "AL" suffix on combined-grade rows = Arabic Literature / Arabic stream group; "AS"/"A2" = AS/A-Level stream.
    -- TODO: verify "AL" meaning with school — provisional interpretation.
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    code            text not null,                  -- 26-27A sheet col header literal (e.g. "9A", "11 AS")
    grade_level     text not null,                  -- parsed: '9' from '9A', '11' from '11 AS'
    label           text,                           -- parsed: 'A' from '9A', 'AS' from '11 AS'
    stream          text,                           -- 'regular' | 'AS' | 'A2' | 'AL_combined'
    capacity        int,
    head_teacher_id uuid references teachers(id),
    unique (school_id, academic_year_id, code)
);

create table section_subjects (
    -- The sub-columns under each class header in 26-27A (e.g. KG2A → En/Ma/Mu/rt).
    -- Defines which subjects are scheduled for that section this year and at what weekly volume.
    id              uuid primary key default gen_random_uuid(),
    section_id      uuid not null references sections(id) on delete cascade,
    subject_id      uuid not null references subjects(id),
    weekly_periods  int not null,                   -- sum of teacher contributions for this (section, subject)
    unique (section_id, subject_id)
);

create table student_enrollments (
    -- Student → section assignment (a student is in one home section per year).
    student_id      uuid not null references students(id) on delete cascade,
    section_id      uuid not null references sections(id),
    enrolled_on     date,
    primary key (student_id, section_id)
);

-- =====================================================================
-- 4. Teacher load / assignment matrix
-- This is the *core* of the 26-27A sheet.
-- =====================================================================

create table teacher_contracts (
    teacher_id          uuid primary key references teachers(id) on delete cascade,
    academic_year_id    uuid not null references academic_years(id),
    weekly_period_cap   int not null,               -- 26-27A col 2 "max # of lessons" (typically 30)
    weekly_period_assigned int generated always as (0) stored,  -- placeholder; recompute via view
    contract_type       text,                       -- 'full_time'|'part_time'
    notes               text
);

create table teacher_section_subject (
    -- The cell values in 26-27A: how many weekly periods teacher X teaches subject S in section C.
    -- This is the load-planning fact table.
    id              uuid primary key default gen_random_uuid(),
    teacher_id      uuid not null references teachers(id) on delete cascade,
    section_id      uuid not null references sections(id) on delete cascade,
    subject_id      uuid not null references subjects(id),
    weekly_periods  int not null check (weekly_periods > 0),
    source_cell     text,                           -- e.g. "26-27A!R2C5" for traceability back to xlsx
    unique (teacher_id, section_id, subject_id)
);

-- Convenience view: assigned load per teacher
create view v_teacher_load as
    select  tc.teacher_id,
            tc.weekly_period_cap,
            coalesce(sum(tss.weekly_periods), 0) as weekly_period_assigned,
            tc.weekly_period_cap - coalesce(sum(tss.weekly_periods), 0) as slack
    from teacher_contracts tc
    left join teacher_section_subject tss on tss.teacher_id = tc.teacher_id
    group by tc.teacher_id, tc.weekly_period_cap;

-- =====================================================================
-- 5. Course selection (student-facing replacement of the .doc forms)
-- =====================================================================

create type selection_status as enum ('draft','submitted','locked','overridden');

create table course_selection_forms (
    -- One per (student, academic_year). Replaces the .doc PDF circulars.
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    student_id      uuid not null references students(id),
    grade_level     text not null,
    status          selection_status not null default 'draft',
    submitted_at    timestamptz,
    submitted_by_parent_id uuid references parents(id),
    locked_by_admin_id uuid references teachers(id), -- admin who finalised; teachers table reused for staff
    unique (academic_year_id, student_id)
);

create table course_selection_picks (
    -- Records which option the student chose for each elective bundle.
    form_id         uuid not null references course_selection_forms(id) on delete cascade,
    bundle_id       uuid not null references elective_bundles(id),
    subject_id      uuid not null references subjects(id),  -- the picked subject from the bundle
    primary key (form_id, bundle_id, subject_id)
);

-- Demand-rollup view: how many students picked each elective option
create view v_elective_demand as
    select  cs.academic_year_id,
            eb.grade_level,
            eb.label as bundle_label,
            s.code as subject_code,
            s.name_en as subject_name,
            count(*) as picks
    from course_selection_picks p
    join course_selection_forms cs on cs.id = p.form_id
    join elective_bundles eb on eb.id = p.bundle_id
    join subjects s on s.id = p.subject_id
    where cs.status in ('submitted','locked')
    group by cs.academic_year_id, eb.grade_level, eb.label, s.code, s.name_en;

-- =====================================================================
-- 6. Source-file provenance (for reproducible re-imports)
-- =====================================================================

create table source_imports (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    filename        text not null,                  -- e.g. "24-25 provisional_18-8-2024.xlsx"
    sheet_name      text,                           -- e.g. "26-27A"
    file_sha256     text not null,
    imported_at     timestamptz not null default now(),
    imported_by     uuid,
    row_count       int,
    notes           text
);
