-- Manhaj schema · 005_seed_iso_pilot.sql
-- ============================================================================
-- TENANT DATA SEED (not a schema migration)
-- ----------------------------------------------------------------------------
-- Seeds International School of Oman as the pilot tenant.
-- One-time bootstrap. Idempotent — re-runs are harmless via ON CONFLICT clauses.
-- Captured here for provenance + so a fresh Supabase project can be re-bootstrapped
-- by running schema/001..004 then this seed.
-- ============================================================================

BEGIN;

-- 1. School row
INSERT INTO schools (name, country_code, timezone)
VALUES ('International School of Oman', 'OM', 'Asia/Muscat')
ON CONFLICT DO NOTHING;

-- 2. Academic year 2026-2027 marked as current
INSERT INTO academic_years (school_id, label, starts_on, ends_on, is_current)
SELECT id, '2026-2027', '2026-09-01', '2027-06-30', true
FROM schools WHERE name = 'International School of Oman'
ON CONFLICT (school_id, label) DO NOTHING;

-- 3. Install the Manhaj IP (6-axis rubric + 17 communication templates)
SELECT seed_manhaj_ip(id) FROM schools WHERE name = 'International School of Oman';

-- 4. Sanity-check counts (should return: 1, 1, 1, 6, 17)
SELECT
  (SELECT count(*) FROM schools)                                AS schools,
  (SELECT count(*) FROM academic_years)                         AS academic_years,
  (SELECT count(*) FROM rubrics WHERE is_manhaj_default)        AS rubric,
  (SELECT count(*) FROM rubric_criteria)                        AS rubric_axes,
  (SELECT count(*) FROM comm_templates WHERE is_manhaj_default) AS comm_templates;

COMMIT;
