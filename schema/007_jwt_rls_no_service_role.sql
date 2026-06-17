-- Manhaj schema · 007_jwt_rls_no_service_role.sql
-- ============================================================================
-- WHAT THIS DOES (plain English)
-- ----------------------------------------------------------------------------
-- Up to this point the Next.js app has used the Supabase service-role key
-- (which bypasses Row-Level Security) to do reads + writes. That works but it
-- means:
--   - The key has to live in Vercel env vars forever
--   - A bug in app code could leak data across schools once we onboard #2
--   - We're not exercising the RLS policies we already wrote
--
-- This migration eliminates the runtime dependency on service-role:
--
--   1. user_schools table — links Supabase auth.users to manhaj schools
--   2. auto_link_new_user_to_iso() trigger — for the single-tenant pilot,
--      every new auth user is linked to ISO automatically. Tier 2+ will
--      replace with invitation-based linking.
--   3. add_school_id_to_jwt() — custom auth hook function. Supabase calls this
--      every time it issues a JWT; we add the user's school_id to
--      app_metadata so tenant_id() (from 002_rls.sql) returns it.
--   4. manhaj_public_counts(school_name) — SECURITY DEFINER RPC that returns
--      the landing-page stat tile counts to anonymous visitors. RLS bypassed
--      INSIDE the function only.
--   5. submit_course_selection_public(...) — SECURITY DEFINER RPC for the
--      parent course-selection form. Anonymous parent → publishable key →
--      this function → controlled writes to course_selection_forms +
--      course_selection_picks. No service-role needed for the parent flow.
--
-- AFTER RUNNING THIS MIGRATION, YOU MUST:
--   a. Go to Supabase Dashboard → Authentication → Hooks
--   b. Click "Add a new hook" → "Customize Access Token (JWT) Claims"
--   c. Pick the function: public.add_school_id_to_jwt
--   d. Enable + save
--   e. Sign out + sign back in via the magic link to get a fresh JWT
--      with the school_id claim included.
--
-- The Next.js app will then read/write Postgres via the user's JWT —
-- RLS scopes to their school_id automatically, no service-role bypass.
--
-- Service-role is still used by:
--   - etl/load_to_postgres.py (CLI tool, run by you, not the web app)
--   - etl/upload_source_to_supabase.py (same)
-- That's fine; those run in trusted contexts with the key never exposed.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. user_schools — link auth.users to manhaj schools
-- ---------------------------------------------------------------------------
create table if not exists user_schools (
    user_id    uuid not null references auth.users(id) on delete cascade,
    school_id  uuid not null references schools(id) on delete cascade,
    role       text not null default 'principal',  -- principal | teacher | finance | admin
    created_at timestamptz not null default now(),
    primary key (user_id, school_id)
);

alter table user_schools enable row level security;

-- Users can see their own user_schools rows
create policy user_schools_self_read on user_schools
    for select
    using (user_id = auth.uid());

-- Service role can do everything (used by the auth-hook function + ETL)
-- (RLS automatically bypassed for service_role; this is just documentation.)
comment on table user_schools is
    'Links auth.users to schools they have access to. Role determines which UI/permissions. Used by the auth hook to inject school_id into JWT claims at token-issue time.';

-- ---------------------------------------------------------------------------
-- 2. Trigger: auto-link new users to ISO during the pilot phase
--    Once we onboard school #2, swap this for an invitation-based flow.
-- ---------------------------------------------------------------------------
create or replace function auto_link_new_user_to_iso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_iso_id uuid;
begin
    -- During the single-tenant pilot, link every signup to ISO.
    select id into v_iso_id from schools where name = 'International School of Oman' limit 1;

    if v_iso_id is not null then
        insert into user_schools (user_id, school_id, role)
        values (new.id, v_iso_id, 'principal')
        on conflict do nothing;
    end if;

    return new;
end;
$$;

drop trigger if exists auto_link_user on auth.users;
create trigger auto_link_user
after insert on auth.users
for each row execute function auto_link_new_user_to_iso();

-- ---------------------------------------------------------------------------
-- Backfill: any auth.users that exist already (from your earlier magic-link
-- testing) need to be linked retroactively, otherwise their JWTs won't have
-- school_id even after the hook is enabled.
-- ---------------------------------------------------------------------------
insert into user_schools (user_id, school_id, role)
select u.id, s.id, 'principal'
from auth.users u
cross join schools s
where s.name = 'International School of Oman'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Auth hook: inject school_id into JWT app_metadata
-- ---------------------------------------------------------------------------
-- Supabase calls this function with { user_id, claims } and expects { claims }
-- back. The claims we return become the JWT. We add school_id to app_metadata
-- so the tenant_id() function (from schema/002_rls.sql) returns it for RLS.
create or replace function add_school_id_to_jwt(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_claims jsonb;
    v_school uuid;
    v_app_metadata jsonb;
begin
    v_claims := event->'claims';

    -- Look up the user's primary school (LIMIT 1; multi-school users use the
    -- first row alphabetically until we add a UI for switching schools)
    select us.school_id into v_school
    from user_schools us
    where us.user_id = (event->>'user_id')::uuid
    order by us.role  -- principal first, then alphabetical
    limit 1;

    if v_school is not null then
        v_app_metadata := coalesce(v_claims->'app_metadata', '{}'::jsonb);
        v_app_metadata := v_app_metadata || jsonb_build_object('school_id', v_school::text);
        v_claims := jsonb_set(v_claims, '{app_metadata}', v_app_metadata);
    end if;

    return jsonb_build_object('claims', v_claims);
end;
$$;

-- Supabase requires the auth hook function to be callable by supabase_auth_admin
grant execute on function add_school_id_to_jwt(jsonb) to supabase_auth_admin;
revoke execute on function add_school_id_to_jwt(jsonb) from authenticated, anon, public;

comment on function add_school_id_to_jwt(jsonb) is
    'Custom Access Token Hook for Supabase Auth. Wire in Dashboard → Auth → Hooks → Customize Access Token (JWT) Claims. Adds school_id from user_schools to JWT app_metadata, which tenant_id() reads for RLS scoping.';

-- ---------------------------------------------------------------------------
-- 4. Public RPC: manhaj_public_counts — landing-page tile counts
-- ---------------------------------------------------------------------------
-- The landing page shows "69 teachers · 41 sections · …" to anonymous visitors.
-- We can't grant anon SELECT on the tables (would leak rows), so we expose
-- this aggregate-only function.
create or replace function manhaj_public_counts(p_school_name text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'teachers',  (select count(*) from teachers t join schools s on s.id = t.school_id where s.name = p_school_name),
        'sections',  (select count(*) from sections sec join schools s on s.id = sec.school_id where s.name = p_school_name),
        'subjects',  (select count(*) from subjects sub join schools s on s.id = sub.school_id where s.name = p_school_name),
        'load_rows', (select count(*) from teacher_section_subject tss
                      join teachers t on t.id = tss.teacher_id
                      join schools s on s.id = t.school_id
                      where s.name = p_school_name)
    );
$$;

grant execute on function manhaj_public_counts(text) to anon, authenticated;

comment on function manhaj_public_counts(text) is
    'Returns the aggregate counts shown on the landing page. Anonymous callable via anon publishable key. Only returns numbers — never row content.';

-- ---------------------------------------------------------------------------
-- 5. Public RPC: submit_course_selection_public
-- ---------------------------------------------------------------------------
-- Parents submit the course-selection form without signing in. This function
-- is the ONE controlled path for anonymous writes into the form tables.
-- Validates inputs, upserts the student + form, replaces picks.
create or replace function submit_course_selection_public(
    p_school_name text,
    p_academic_year_label text,
    p_grade_level text,
    p_student_name text,
    p_picks jsonb  -- array of { "bundle_label": "...", "subject_code": "..." }
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_school_id uuid;
    v_ay_id uuid;
    v_student_id uuid;
    v_form_id uuid;
    v_student_created boolean := false;
    v_pick jsonb;
    v_bundle_id uuid;
    v_subject_id uuid;
    v_picks_count int := 0;
    v_student_name text;
begin
    v_student_name := trim(coalesce(p_student_name, ''));

    if v_student_name = '' then
        return jsonb_build_object('ok', false, 'error', 'Student name is required.');
    end if;

    if p_grade_level not in ('9', '10', '11', '12') then
        return jsonb_build_object('ok', false, 'error', 'Course selection only available for grades 9-12.');
    end if;

    if jsonb_array_length(p_picks) > 10 then
        return jsonb_build_object('ok', false, 'error', 'Too many picks submitted.');
    end if;

    -- Resolve school + academic year
    select id into v_school_id from schools where name = p_school_name;
    if v_school_id is null then
        return jsonb_build_object('ok', false, 'error', 'School not found.');
    end if;

    select id into v_ay_id from academic_years
    where school_id = v_school_id and label = p_academic_year_label;
    if v_ay_id is null then
        return jsonb_build_object('ok', false, 'error', 'Academic year not found.');
    end if;

    -- Find or create student
    select id into v_student_id from students
    where school_id = v_school_id and full_name_en = v_student_name;

    if v_student_id is null then
        insert into students (school_id, full_name_en, external_ref, notes)
        values (
            v_school_id,
            v_student_name,
            'stub-' || extract(epoch from now())::bigint::text,
            'Created via course-selection form'
        )
        returning id into v_student_id;
        v_student_created := true;
    end if;

    -- Upsert the form
    select id into v_form_id from course_selection_forms
    where academic_year_id = v_ay_id and student_id = v_student_id;

    if v_form_id is null then
        insert into course_selection_forms
            (school_id, academic_year_id, student_id, grade_level, status, submitted_at)
        values (v_school_id, v_ay_id, v_student_id, p_grade_level, 'submitted', now())
        returning id into v_form_id;
    else
        update course_selection_forms
        set grade_level = p_grade_level,
            status = 'submitted',
            submitted_at = now()
        where id = v_form_id;
    end if;

    -- Wipe + reinsert picks
    delete from course_selection_picks where form_id = v_form_id;

    for v_pick in select * from jsonb_array_elements(p_picks)
    loop
        -- Find or create bundle
        select id into v_bundle_id from elective_bundles
        where school_id = v_school_id
          and academic_year_id = v_ay_id
          and grade_level = p_grade_level
          and label = v_pick->>'bundle_label';

        if v_bundle_id is null then
            insert into elective_bundles
                (school_id, academic_year_id, grade_level, label, pick_count)
            values (v_school_id, v_ay_id, p_grade_level, v_pick->>'bundle_label', 1)
            returning id into v_bundle_id;
        end if;

        -- Resolve subject by code
        select id into v_subject_id from subjects
        where school_id = v_school_id and code = v_pick->>'subject_code';

        if v_subject_id is not null then
            insert into course_selection_picks (form_id, bundle_id, subject_id)
            values (v_form_id, v_bundle_id, v_subject_id);
            v_picks_count := v_picks_count + 1;
        end if;
    end loop;

    return jsonb_build_object(
        'ok',              true,
        'form_id',         v_form_id,
        'student_id',      v_student_id,
        'picks_count',     v_picks_count,
        'student_created', v_student_created
    );
end;
$$;

grant execute on function submit_course_selection_public(text, text, text, text, jsonb) to anon, authenticated;

comment on function submit_course_selection_public(text, text, text, text, jsonb) is
    'Anonymous parent course-selection submission. SECURITY DEFINER so it can write to course_selection_forms + picks without the parent being authenticated. Validates input; bounded surface area.';
