-- Manhaj schema · 006_section_mapping.sql
-- ============================================================================
-- WHAT THIS DOES (plain English)
-- ----------------------------------------------------------------------------
-- The school's section codes ("KG1A", "11 AS", "1-2 AL", etc.) follow the
-- school's own conventions. Earlier the ETL tried to guess what each code
-- meant (grade level, stream, etc.). That guess was OK for ISO but is
-- per-school and shouldn't be hard-coded as ground truth.
--
-- This migration:
--   - Makes grade_level/label/stream/capacity NULLABLE so the ETL can insert
--     section rows without assigning meaning.
--   - Adds is_mapped (default false) so the UI knows which sections still
--     need human confirmation.
--   - Adds mapped_at / mapped_by for audit (when, by which staff user).
--   - Adds notes for free-text annotations the principal might want to add.
--
-- The mapping page (demo/admin/section-mapping.html) writes the human-confirmed
-- values into these columns.
-- ============================================================================

ALTER TABLE sections ALTER COLUMN grade_level DROP NOT NULL;

ALTER TABLE sections
    ADD COLUMN IF NOT EXISTS is_mapped boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS mapped_at timestamptz,
    ADD COLUMN IF NOT EXISTS mapped_by uuid,  -- auth.users(id) once Supabase Auth wired
    ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN sections.is_mapped IS
    'FALSE = grade_level/label/stream are unconfirmed (ETL guess or blank). TRUE = a human has reviewed and saved.';
COMMENT ON COLUMN sections.mapped_at IS
    'Timestamp of last human confirmation via the section-mapping UI.';
