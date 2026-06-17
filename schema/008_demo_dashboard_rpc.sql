-- Manhaj schema · 008_demo_dashboard_rpc.sql
-- ============================================================================
-- WHAT THIS DOES (plain English)
-- ----------------------------------------------------------------------------
-- The Vercel app uses a password gate for demos (like the Cloudflare Tier 0
-- demo), NOT magic-link auth. That means visitors are not signed in to
-- Supabase, so RLS blocks all their reads.
--
-- This migration adds two SECURITY DEFINER RPCs that let anonymous callers
-- (using only the publishable key) read the data they need:
--
--   1. manhaj_dashboard_data_public(school_name) — returns the full bundle
--      of teachers / contracts / sections / subjects / load matrix that the
--      admin dashboard needs. RLS bypassed inside the function only.
--
--   2. manhaj_log_ai_usage(...) — lets /api/chat log Claude API costs to
--      ai_usage_ledger without requiring a logged-in user.
--
-- Magic-link auth + JWT-driven RLS (schema/007) still works — both paths
-- coexist. Production switches to magic-link by enforcing the proxy and
-- removing the password gate; demo uses the gate + these RPCs.
-- ============================================================================

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1. Bundle the dashboard data as one JSONB blob
-- ---------------------------------------------------------------------------
create or replace function manhaj_dashboard_data_public(p_school_name text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_school_id uuid;
    v_result jsonb;
begin
    select id into v_school_id from schools where name = p_school_name;
    if v_school_id is null then
        return jsonb_build_object(
            'school_id', null,
            'teachers',  '[]'::jsonb,
            'contracts', '[]'::jsonb,
            'sections',  '[]'::jsonb,
            'subjects',  '[]'::jsonb,
            'load',      '[]'::jsonb
        );
    end if;

    select jsonb_build_object(
        'school_id', v_school_id,
        'teachers', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id',                   t.id,
                'full_name',            t.full_name,
                'primary_subject_text', t.primary_subject_text
            ) order by t.full_name)
            from teachers t
            where t.school_id = v_school_id
        ), '[]'::jsonb),
        'contracts', coalesce((
            select jsonb_agg(jsonb_build_object(
                'teacher_id',         tc.teacher_id,
                'weekly_period_cap',  tc.weekly_period_cap
            ))
            from teacher_contracts tc
            join teachers t on t.id = tc.teacher_id
            where t.school_id = v_school_id
        ), '[]'::jsonb),
        'sections', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id',          s.id,
                'code',        s.code,
                'grade_level', s.grade_level,
                'label',       s.label,
                'stream',      s.stream,
                'is_mapped',   s.is_mapped
            ) order by s.code)
            from sections s
            where s.school_id = v_school_id
        ), '[]'::jsonb),
        'subjects', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id',         s.id,
                'code',       s.code,
                'name_en',    s.name_en,
                'department', s.department
            ) order by s.code)
            from subjects s
            where s.school_id = v_school_id
        ), '[]'::jsonb),
        'load', coalesce((
            select jsonb_agg(jsonb_build_object(
                'teacher_id',     tss.teacher_id,
                'section_id',     tss.section_id,
                'subject_id',     tss.subject_id,
                'weekly_periods', tss.weekly_periods
            ))
            from teacher_section_subject tss
            join teachers t on t.id = tss.teacher_id
            where t.school_id = v_school_id
        ), '[]'::jsonb)
    ) into v_result;

    return v_result;
end;
$$;

grant execute on function manhaj_dashboard_data_public(text) to anon, authenticated;

comment on function manhaj_dashboard_data_public(text) is
    'Anonymous bundle read of the admin-dashboard tables for the password-gated demo. SECURITY DEFINER. Returns one JSONB with school_id + teachers + contracts + sections + subjects + load.';

-- ---------------------------------------------------------------------------
-- 2. Log an AI call to ai_usage_ledger without requiring auth
-- ---------------------------------------------------------------------------
create or replace function manhaj_log_ai_usage(
    p_school_name text,
    p_request_kind text,
    p_model text,
    p_input_tokens int,
    p_output_tokens int,
    p_cost_usd numeric,
    p_cache_hit boolean,
    p_is_background boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_school_id uuid;
begin
    select id into v_school_id from schools where name = p_school_name;
    if v_school_id is null then
        return; -- silent — logging shouldn't break the calling action
    end if;

    insert into ai_usage_ledger (
        school_id, request_kind, model,
        input_tokens, output_tokens, cost_usd,
        cache_hit, is_background
    )
    values (
        v_school_id, p_request_kind, p_model,
        coalesce(p_input_tokens, 0), coalesce(p_output_tokens, 0), coalesce(p_cost_usd, 0),
        coalesce(p_cache_hit, false), coalesce(p_is_background, false)
    );
end;
$$;

grant execute on function manhaj_log_ai_usage(text, text, text, int, int, numeric, boolean, boolean) to anon, authenticated;

comment on function manhaj_log_ai_usage is
    'Anon-callable bridge to write ai_usage_ledger rows. Used by /api/chat in demo mode where the caller is not signed-in. Validation: requires a known school_name.';
