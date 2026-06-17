-- Manhaj schema · 002_rls.sql
-- ============================================================================
-- WHAT THIS FILE DOES (plain English)
-- ----------------------------------------------------------------------------
-- This migration switches on the database's tenant-isolation rules. After it
-- runs, the database itself refuses to return data from school A when a user
-- from school B is querying — even if the application code asked for it. The
-- rule is enforced inside Postgres, not in our app code, which means a coding
-- mistake in the Next.js app cannot leak data across tenants.
--
-- It also installs two helper functions that future migrations and the app
-- code rely on:
--   1. tenant_id() — reads the current logged-in user's school_id from the
--      auth token (JWT). RLS policies call this to decide who sees what.
--   2. set_tenant_search_path(school_id uuid) — the "walk into the right
--      drawer" instruction (see docs/migration_single_to_hybrid.md). Today
--      it falls back to the shared 'public' drawer because no school has its
--      own drawer yet. Day 100, when we cut a school over to its own schema,
--      the same function routes them automatically without app-code changes.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Helper: read the school_id of the currently logged-in user from JWT
-- ---------------------------------------------------------------------------
-- Supabase Auth puts custom claims under request.jwt.claims. We expect
-- school_id to be set in app_metadata.school_id when a staff user is created.
-- Returns NULL if no JWT (e.g. background jobs running as service role).
create or replace function tenant_id() returns uuid as $$
declare
    raw_claims jsonb;
    school    text;
begin
    raw_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
    if raw_claims is null then
        return null;
    end if;
    school := raw_claims->'app_metadata'->>'school_id';
    if school is null or school = '' then
        return null;
    end if;
    return school::uuid;
exception when others then
    return null;
end;
$$ language plpgsql stable;

comment on function tenant_id() is
    'Returns the school_id of the JWT-authenticated user, or NULL for unauthenticated/service-role contexts.';

-- ---------------------------------------------------------------------------
-- 2. Helper: route DB session to the tenant''s own schema if it exists.
--    Day 1: every tenant falls back to `public` (the EXCEPTION branch fires).
--    Day 100: once we create tenant_<uuid> schemas for hot tables, this
--             function routes there transparently. No app-code changes.
-- ---------------------------------------------------------------------------
create or replace function set_tenant_search_path(p_school_id uuid) returns void as $$
declare
    schema_name text;
begin
    if p_school_id is null then
        set search_path to public;
        return;
    end if;
    -- Postgres schema names with dashes need quoting; replace - with _ to be safe
    schema_name := 'tenant_' || replace(p_school_id::text, '-', '_');
    execute format('set search_path to %I, public', schema_name);
exception
    when invalid_schema_name then
        -- Tenant doesn't have its own schema yet (the normal case before hybrid migration)
        set search_path to public;
    when others then
        set search_path to public;
end;
$$ language plpgsql;

comment on function set_tenant_search_path(uuid) is
    'Sets the session search_path to the tenant''s own schema if it exists, else falls back to public. The cheap version of multi-tenant routing; survives the future hybrid migration without app changes.';

-- ---------------------------------------------------------------------------
-- 3. Enable RLS + add the tenant-isolation policy on every multi-tenant table
-- ---------------------------------------------------------------------------
-- Pattern for every table that has a school_id column:
--   - Enable row-level security
--   - Create a single policy that requires school_id = tenant_id() for both
--     read (USING) and write (WITH CHECK). One policy per table.
--
-- The 'schools' and 'academic_years' tables get slightly different policies
-- because schools is the tenant table itself (a user sees their own school
-- only) and academic_years cascades from there.
-- ---------------------------------------------------------------------------

-- Tables from 001_init.sql:
alter table schools             enable row level security;
alter table academic_years      enable row level security;
alter table teachers            enable row level security;
alter table students            enable row level security;
alter table parents             enable row level security;
alter table student_parents     enable row level security;
alter table subjects            enable row level security;
alter table course_catalog      enable row level security;
alter table elective_bundles    enable row level security;
alter table elective_options    enable row level security;
alter table sections            enable row level security;
alter table section_subjects    enable row level security;
alter table student_enrollments enable row level security;
alter table teacher_contracts   enable row level security;
alter table teacher_section_subject enable row level security;
alter table course_selection_forms  enable row level security;
alter table course_selection_picks  enable row level security;
alter table source_imports      enable row level security;

-- Schools: a user can only see their own school
create policy tenant_isolation_schools on schools
    for all
    using (id = tenant_id())
    with check (id = tenant_id());

-- Helper macro-style: standard policy for tables with a school_id column
do $$
declare
    tbl text;
    school_id_tables text[] := array[
        'academic_years','teachers','students','parents','subjects',
        'course_catalog','elective_bundles','sections',
        'course_selection_forms','source_imports'
    ];
begin
    foreach tbl in array school_id_tables loop
        execute format(
            'create policy tenant_isolation_%I on %I for all using (school_id = tenant_id()) with check (school_id = tenant_id())',
            tbl, tbl
        );
    end loop;
end $$;

-- Tables without a direct school_id column inherit via their FK:
-- student_parents → students.school_id
create policy tenant_isolation_student_parents on student_parents for all
    using (exists (select 1 from students s where s.id = student_parents.student_id and s.school_id = tenant_id()))
    with check (exists (select 1 from students s where s.id = student_parents.student_id and s.school_id = tenant_id()));

-- elective_options → elective_bundles.school_id
create policy tenant_isolation_elective_options on elective_options for all
    using (exists (select 1 from elective_bundles eb where eb.id = elective_options.bundle_id and eb.school_id = tenant_id()))
    with check (exists (select 1 from elective_bundles eb where eb.id = elective_options.bundle_id and eb.school_id = tenant_id()));

-- section_subjects → sections.school_id
create policy tenant_isolation_section_subjects on section_subjects for all
    using (exists (select 1 from sections s where s.id = section_subjects.section_id and s.school_id = tenant_id()))
    with check (exists (select 1 from sections s where s.id = section_subjects.section_id and s.school_id = tenant_id()));

-- student_enrollments → students.school_id
create policy tenant_isolation_student_enrollments on student_enrollments for all
    using (exists (select 1 from students s where s.id = student_enrollments.student_id and s.school_id = tenant_id()))
    with check (exists (select 1 from students s where s.id = student_enrollments.student_id and s.school_id = tenant_id()));

-- teacher_contracts → teachers.school_id
create policy tenant_isolation_teacher_contracts on teacher_contracts for all
    using (exists (select 1 from teachers t where t.id = teacher_contracts.teacher_id and t.school_id = tenant_id()))
    with check (exists (select 1 from teachers t where t.id = teacher_contracts.teacher_id and t.school_id = tenant_id()));

-- teacher_section_subject → teachers.school_id
create policy tenant_isolation_tss on teacher_section_subject for all
    using (exists (select 1 from teachers t where t.id = teacher_section_subject.teacher_id and t.school_id = tenant_id()))
    with check (exists (select 1 from teachers t where t.id = teacher_section_subject.teacher_id and t.school_id = tenant_id()));

-- course_selection_picks → course_selection_forms.school_id
create policy tenant_isolation_csp on course_selection_picks for all
    using (exists (select 1 from course_selection_forms f where f.id = course_selection_picks.form_id and f.school_id = tenant_id()))
    with check (exists (select 1 from course_selection_forms f where f.id = course_selection_picks.form_id and f.school_id = tenant_id()));

-- ---------------------------------------------------------------------------
-- 4. Service role bypass — backend jobs (ETL, monthly reports) need to bypass
--    RLS using Supabase's service_role key. Service role is exempt from RLS
--    automatically when connecting with that key; no policy work needed here.
-- ---------------------------------------------------------------------------

comment on schema public is
    'Manhaj shared-schema multi-tenant DB. All app-level access goes through RLS using tenant_id(). Service-role access (background jobs) bypasses RLS — see ETL + report-generation code for explicit school_id filtering.';
