-- Manhaj schema · 003_spine.sql
-- ============================================================================
-- WHAT THIS FILE DOES (plain English)
-- ----------------------------------------------------------------------------
-- The first migration (001_init.sql) covered curriculum + people + the
-- teacher-load-matrix tables — enough to power the static demo. This file
-- adds the "spine" tables the architecture brief calls out: the rooms a class
-- can run in, the bell schedule, the actual timetable, attendance, the
-- Manhaj-IP rubric tables, the assessments tables, lesson plans, comm
-- templates, AI cost ledger, and an audit log.
--
-- A few rules followed throughout:
--   - Every table has a school_id column for RLS isolation (002_rls.sql adds
--     the policies in a follow-up).
--   - "Hot" tables (attendance_marks, rubric_scores, ai_usage_ledger,
--     audit_log) are designed so that someday moving them to per-tenant
--     schemas is a 1-week migration, not a 4-week one. See
--     docs/migration_single_to_hybrid.md.
--   - Finance tables (gl_accounts, budgets, transactions) are intentionally
--     deferred to schema/005_finance.sql until we actually pilot the Finance
--     module.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- ROOMS · where a class can physically run
-- ---------------------------------------------------------------------------
create table rooms (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    code            text not null,                  -- school's own room ID, e.g. "R-101"
    name            text,                           -- "Year 9A Homeroom"
    capacity        int,                            -- max students
    room_type       text,                           -- 'classroom'|'lab'|'gym'|'music'|'library'|'art'|'other'
    floor_building  text,
    equipment       text[],                         -- e.g. ['smartboard','projector','sink']
    is_schedulable  boolean default true,           -- N for offices/storage
    notes           text,
    unique (school_id, code)
);
comment on table rooms is 'Physical rooms the timetable engine can place classes in.';

-- ---------------------------------------------------------------------------
-- TERMS · academic calendar
-- ---------------------------------------------------------------------------
create type term_kind as enum ('term','holiday','break','exam-week');

create table terms (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    kind            term_kind not null,
    label           text not null,                  -- "Term 1", "Eid al-Adha", etc.
    starts_on       date not null,
    ends_on         date not null,
    notes           text,
    unique (school_id, academic_year_id, label)
);
comment on table terms is 'Term boundaries + holidays + exam weeks. Drives the report cadence and attendance norms.';

-- ---------------------------------------------------------------------------
-- BELL SCHEDULE · the timing of periods within a school day
-- ---------------------------------------------------------------------------
create table bell_periods (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    day_of_week     text not null,                  -- 'Mon'..'Sun' or 'All' if same every day
    period_number   int not null,                   -- 1, 2, 3...
    period_label    text,                           -- "P1", "Recess", "Lunch"
    starts_at       time not null,
    ends_at         time not null,
    is_teaching     boolean default true,           -- N for recess/lunch/assembly
    unique (school_id, academic_year_id, day_of_week, period_number)
);
comment on table bell_periods is 'The daily bell schedule. Powers the CP-SAT timetabling engine + attendance windows.';

-- ---------------------------------------------------------------------------
-- TIMETABLE_SLOTS · the actual period-by-period schedule
-- (CP-SAT solver writes here; humans can override; one row per slot per week)
-- ---------------------------------------------------------------------------
create table timetable_slots (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    academic_year_id uuid not null references academic_years(id),
    section_id      uuid not null references sections(id),
    subject_id      uuid not null references subjects(id),
    teacher_id      uuid not null references teachers(id),
    room_id         uuid references rooms(id),
    bell_period_id  uuid not null references bell_periods(id),
    is_locked       boolean default false,          -- human-locked, solver can't move
    source          text default 'solver',          -- 'solver'|'human'|'patch'
    notes           text,
    unique (school_id, academic_year_id, section_id, bell_period_id)
);
comment on table timetable_slots is 'The actual timetable. Initial fill comes from the CP-SAT solver against teacher_section_subject load matrix; human edits + patch-mode constraint updates land here too.';

-- ---------------------------------------------------------------------------
-- ATTENDANCE · the highest-volume hot table
-- (per student per period per day. Hybrid migration candidate at scale.)
-- ---------------------------------------------------------------------------
create type attendance_status as enum ('present','absent','late','excused','unknown');

create table attendance_marks (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    student_id      uuid not null references students(id),
    section_id      uuid references sections(id),
    bell_period_id  uuid references bell_periods(id),
    marked_on       date not null,
    status          attendance_status not null,
    marked_by_teacher_id uuid references teachers(id),
    reason          text,                           -- 'medical'|'family'|'other' for absences
    notes           text,
    created_at      timestamptz default now(),
    unique (student_id, marked_on, bell_period_id)
);
create index idx_attendance_school_date on attendance_marks (school_id, marked_on);
create index idx_attendance_student_date on attendance_marks (student_id, marked_on);
comment on table attendance_marks is 'One row per student per period per day. Highest growth table. Hybrid-schema migration candidate at school #5+.';

-- ---------------------------------------------------------------------------
-- ASSESSMENTS · graded items (quizzes, tests, exams, projects)
-- ---------------------------------------------------------------------------
create type assessment_kind as enum ('quiz','test','exam','project','homework','presentation');

create table assessments (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    section_id      uuid not null references sections(id),
    subject_id      uuid not null references subjects(id),
    teacher_id      uuid references teachers(id),
    label           text not null,                  -- "Term 1 quiz 1"
    kind            assessment_kind not null,
    held_on         date,
    max_score       numeric not null,
    weight_in_term  numeric default 0.1,            -- 0.0–1.0
    notes           text,
    created_at      timestamptz default now()
);
create index idx_assessments_section on assessments (school_id, section_id);

create table assessment_results (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    assessment_id   uuid not null references assessments(id) on delete cascade,
    student_id      uuid not null references students(id),
    score           numeric,                        -- nullable for absent students
    is_excused      boolean default false,
    teacher_comment text,
    recorded_at     timestamptz default now(),
    unique (assessment_id, student_id)
);
create index idx_results_student on assessment_results (school_id, student_id);

-- ---------------------------------------------------------------------------
-- RUBRICS · the Manhaj 6-axis IP, stored as data
-- (One "rubric" per school = the Manhaj default rubric, with the 6 axes.
-- Schools can later add custom rubrics for special programs but the default
-- is locked.)
-- ---------------------------------------------------------------------------
create table rubrics (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    name            text not null,                  -- "Manhaj Universal Rubric"
    version         text not null default '1.0',
    is_manhaj_default boolean default false,        -- TRUE for the shipped Manhaj IP
    description     text,
    created_at      timestamptz default now(),
    unique (school_id, name, version)
);

create table rubric_criteria (
    id              uuid primary key default gen_random_uuid(),
    rubric_id       uuid not null references rubrics(id) on delete cascade,
    axis_code       text not null,                  -- 'analytical'|'creative'|'oral'|'written'|'participation'|'homework'
    axis_name_en    text not null,
    axis_name_ar    text not null,
    description_en  text,                           -- what "strong" evidence looks like
    description_ar  text,
    scale_min       numeric not null default 1.0,
    scale_max       numeric not null default 5.0,
    display_order   int,
    unique (rubric_id, axis_code)
);

create table rubric_scores (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    student_id      uuid not null references students(id),
    subject_id      uuid references subjects(id),   -- nullable for cross-subject scores
    rubric_id       uuid not null references rubrics(id),
    axis_code       text not null,
    score           numeric not null check (score >= 1.0 and score <= 5.0),
    scored_for_month date not null,                 -- normalise to YYYY-MM-01
    scored_by_teacher_id uuid references teachers(id),
    notes           text,
    created_at      timestamptz default now(),
    unique (student_id, subject_id, rubric_id, axis_code, scored_for_month)
);
create index idx_rubric_scores_student_month on rubric_scores (school_id, student_id, scored_for_month);
comment on table rubric_scores is 'Per-student-subject-axis-month rubric scores. Hot at term boundaries. Hybrid-migration candidate.';

-- ---------------------------------------------------------------------------
-- BEHAVIOUR · lightweight engagement notes
-- ---------------------------------------------------------------------------
create type behaviour_kind as enum ('positive','concern','observation');

create table behaviour_notes (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    student_id      uuid not null references students(id),
    teacher_id      uuid references teachers(id),
    section_id      uuid references sections(id),
    observed_on     date not null,
    kind            behaviour_kind not null,
    note            text not null,
    created_at      timestamptz default now()
);
create index idx_behaviour_student_date on behaviour_notes (school_id, student_id, observed_on);

-- ---------------------------------------------------------------------------
-- LESSONS · plans + objectives (artifacts deferred until smartboard discovery)
-- ---------------------------------------------------------------------------
create table lessons (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    timetable_slot_id uuid references timetable_slots(id),
    section_id      uuid not null references sections(id),
    subject_id      uuid not null references subjects(id),
    teacher_id      uuid references teachers(id),
    held_on         date not null,
    topic           text,
    learning_objective text,
    resources_url   text,
    teacher_voice_memo_path text,                   -- Supabase Storage path (deferred)
    smartboard_artifact_path text,                  -- deferred
    created_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- COMMUNICATION · the Manhaj template catalog (data) + drafts + sent log
-- ---------------------------------------------------------------------------
create type comm_channel as enum ('whatsapp','email','both');
create type comm_tone    as enum ('warm','formal','urgent','celebratory');

create table comm_templates (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    template_code   text not null,                  -- 'absent_today', 'well_done_milestone', etc.
    name_en         text not null,
    name_ar         text,
    channel         comm_channel not null,
    tone            comm_tone,
    length_cap_words int,
    is_manhaj_default boolean default false,        -- TRUE for shipped Manhaj templates
    required_slots  text[],                         -- e.g. ['student_name','date']
    guardrails      text[],                         -- e.g. ['no_emojis','no_diagnosis_language']
    ai_prompt_en    text,                           -- system prompt template (EN)
    ai_prompt_ar    text,                           -- system prompt template (AR)
    display_order   int,
    created_at      timestamptz default now(),
    unique (school_id, template_code)
);

create type comm_draft_status as enum ('draft','sent','discarded','snoozed');

create table comm_drafts (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    template_id     uuid references comm_templates(id),
    teacher_id      uuid references teachers(id),
    student_id      uuid references students(id),
    parent_id       uuid references parents(id),
    slot_values     jsonb,                          -- {student_name: "Layla", date: "8 May"}
    drafted_en      text,
    drafted_ar      text,
    edited_en       text,
    edited_ar       text,
    status          comm_draft_status default 'draft',
    snoozed_until   timestamptz,
    sent_at         timestamptz,
    sent_via        comm_channel,
    sent_message_id text,                           -- vendor message ID (Resend, 360dialog)
    created_at      timestamptz default now()
);
create index idx_drafts_teacher_status on comm_drafts (school_id, teacher_id, status);

-- ---------------------------------------------------------------------------
-- CONSENT · per student per AY, parent + student (>13)
-- ---------------------------------------------------------------------------
create type consent_kind as enum ('whatsapp_comms','ai_drafted_reports','lecture_recording','data_processing');

create table consent_records (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    student_id      uuid not null references students(id),
    academic_year_id uuid not null references academic_years(id),
    parent_id       uuid references parents(id),
    consent_kind    consent_kind not null,
    granted         boolean not null,
    granted_at      timestamptz default now(),
    granted_via     text,                           -- 'whatsapp_form','paper_signed','email_reply'
    revoked_at      timestamptz,
    notes           text,
    unique (student_id, academic_year_id, parent_id, consent_kind)
);
comment on table consent_records is 'PDPL Oman + UAE / KSA DPL friendly: every AI- or data-use action checks consent_records before proceeding.';

-- ---------------------------------------------------------------------------
-- AI USAGE LEDGER · the cost-cap enforcement table
-- (Every Claude / Haiku / Sonnet call writes a row. Pre-call check sums
-- month-to-date and refuses past the cap.)
-- ---------------------------------------------------------------------------
create table ai_usage_ledger (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    request_kind    text not null,                  -- 'principal_chat'|'parent_report'|'comm_draft'|'constraint_extract'|...
    model           text not null,                  -- 'claude-sonnet-4-6'|'claude-haiku-4-5'
    input_tokens    int not null default 0,
    output_tokens   int not null default 0,
    cost_usd        numeric(10,4) not null default 0,
    cache_hit       boolean default false,
    is_background   boolean not null,               -- TRUE = subject to hard cap, FALSE = fail-open
    error_code      text,                           -- non-null if call failed (rate limit, refused at cap, etc.)
    created_at      timestamptz default now()
);
create index idx_ai_usage_school_month on ai_usage_ledger (school_id, created_at);
comment on table ai_usage_ledger is 'Every Claude API call writes a row. Background jobs (parent reports, recaps) pre-check sum(cost_usd) for the month and refuse past the per-tenant cap. Interactive (principal chat) logs but never blocks.';

-- ---------------------------------------------------------------------------
-- AUDIT LOG · who saw which student record when
-- ---------------------------------------------------------------------------
create table audit_log (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references schools(id),
    actor_user_id   uuid,                           -- the Supabase auth user
    actor_label     text,                           -- denormalised display ("Ms Sandra Swart")
    action          text not null,                  -- 'view_student','export_csv','send_parent_msg', etc.
    object_kind     text,                           -- 'student','section','report','parent'
    object_id       uuid,
    metadata        jsonb,
    occurred_at     timestamptz default now()
);
create index idx_audit_school_time on audit_log (school_id, occurred_at);
create index idx_audit_object on audit_log (school_id, object_kind, object_id);
comment on table audit_log is 'Append-only audit trail. Principal-only view answers "who saw my students data and when" — required for PDPL compliance.';

-- ---------------------------------------------------------------------------
-- The new tables also need RLS. Enable + add policies for them now.
-- (002_rls.sql handled the tables that already existed in 001_init.sql;
-- this section handles the ones we just added.)
-- ---------------------------------------------------------------------------
alter table rooms              enable row level security;
alter table terms              enable row level security;
alter table bell_periods       enable row level security;
alter table timetable_slots    enable row level security;
alter table attendance_marks   enable row level security;
alter table assessments        enable row level security;
alter table assessment_results enable row level security;
alter table rubrics            enable row level security;
alter table rubric_criteria    enable row level security;
alter table rubric_scores      enable row level security;
alter table behaviour_notes    enable row level security;
alter table lessons            enable row level security;
alter table comm_templates     enable row level security;
alter table comm_drafts        enable row level security;
alter table consent_records    enable row level security;
alter table ai_usage_ledger    enable row level security;
alter table audit_log          enable row level security;

do $$
declare
    tbl text;
    school_id_tables text[] := array[
        'rooms','terms','bell_periods','timetable_slots','attendance_marks',
        'assessments','assessment_results','rubrics','rubric_scores',
        'behaviour_notes','lessons','comm_templates','comm_drafts',
        'consent_records','ai_usage_ledger','audit_log'
    ];
begin
    foreach tbl in array school_id_tables loop
        execute format(
            'create policy tenant_isolation_%I on %I for all using (school_id = tenant_id()) with check (school_id = tenant_id())',
            tbl, tbl
        );
    end loop;
end $$;

-- rubric_criteria via rubrics
create policy tenant_isolation_rubric_criteria on rubric_criteria for all
    using (exists (select 1 from rubrics r where r.id = rubric_criteria.rubric_id and r.school_id = tenant_id()))
    with check (exists (select 1 from rubrics r where r.id = rubric_criteria.rubric_id and r.school_id = tenant_id()));
