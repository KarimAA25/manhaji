# Universal schema mapper — spec

## Plain-English summary

When a school sends us their files (timetable xlsx, student roster csv, grade-book Excel, whatever), every school's format is different. ISO's load matrix is a wide grid with subject codes in odd places. School #2 will send something completely different — maybe a normal table, maybe a multi-tab workbook, maybe a CSV with column headers in Arabic.

We can't hard-code the parser per school — that's how SaaS companies die. Each new school would mean a week of engineering before they can use the product.

**The fix:** a single mapper that, for any uploaded file, figures out how it maps onto our canonical Postgres schema. The work splits into three jobs:

1. **Inspector** (pure code, no AI): reads the file, identifies sheets, rough column types, row counts. Produces a "structural fingerprint."
2. **Proposer** (AI — Claude Haiku 4.5): takes the fingerprint + our canonical schema + an example of a known-good mapping (ISO's, as the first one). Returns a *proposed mapping config* in a structured format we define below.
3. **Human review**: principal sees a side-by-side view in the Manhaj UI — their file on the left, what canonical rows the mapping would produce on the right. One click to approve, or click into a cell to override the mapping.

After approval, the mapping is stored per school and reused for every future upload from that school. Re-running is a single click. The school never sees JSON or SQL.

---

## Why this approach (vs the alternatives we considered)

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Hard-code per school** | Predictable, easy to debug | Doesn't scale; ~1 week of eng per onboarding | ❌ Dies at school #3 |
| **Pure LLM auto-ingest** (Claude reads file → writes canonical rows directly) | Fastest onboarding | LLM hallucinations end up in the DB; no audit trail; no determinism for re-uploads | ❌ Unsafe |
| **LLM proposes config, human approves, deterministic ETL runs it** | Fast onboarding (~15 min), deterministic re-runs, human-audited, reusable | One extra UI screen | ✅ **Pick this** |

This is the same pattern Workato, Zapier and Fivetran use for "smart mapping" — the LLM is a productivity tool for the human, not a replacement for them.

---

## Architecture

```
   ┌─────────────────────┐
   │ School uploads file │  via Manhaj admin UI
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ 1. INSPECTOR        │  Pure Python, deterministic
   │  - file type        │  → emits StructuralFingerprint JSON
   │  - sheets / tables  │
   │  - rough col types  │
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ 2. MAPPER PROPOSER  │  Claude Haiku 4.5, JSON-mode strict
   │  - input: fingerprint + canonical schema + ISO few-shot
   │  - output: MappingConfig (typed YAML/JSON)
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ 3. VALIDATOR        │  Pure Python
   │  - schema-check     │
   │  - entity-check     │  (every canonical field exists)
   │  - feasibility      │  (can it actually run?)
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ 4. HUMAN APPROVAL   │  Side-by-side UI: file vs preview-canonical-rows
   │  - approve as-is    │  → stored in source_mapping_configs (per school)
   │  - edit then approve│  → diff vs proposed logged
   │  - reject + retry   │
   └──────────┬──────────┘
              ▼
   ┌─────────────────────┐
   │ 5. GENERIC ETL RUNNER │  Pure Python
   │  - file + mapping → canonical Postgres rows
   │  - source_imports row recorded with provenance
   └─────────────────────┘
```

---

## Component detail

### 1. Inspector (Python, no LLM)

Reads any of: `.xlsx`, `.xls`, `.csv`, `.tsv`, `.doc`, `.docx`, `.pdf`, `.json`. Emits a `StructuralFingerprint`:

```python
{
  "file": {"name": "...", "size_bytes": 12345, "sha256": "abc..."},
  "kind": "xlsx",  # auto-detected
  "sheets": [
    {
      "name": "26-27A",
      "row_count": 285,
      "col_count": 158,
      "first_30_rows": [[...],[...]],  # raw cell values
      "header_candidates": [0, 1, 2],  # rows that look like headers
      "structure_hint": "matrix",       # or "tabular", "form", "key-value"
      "non_empty_cell_density": 0.18,
      "merged_cells": [{...}]
    },
    {"name": "Faculty", ...}
  ]
}
```

This is mechanical; no AI. The proposer below uses it as input.

### 2. Mapper proposer (Claude Haiku 4.5, strict JSON mode)

Inputs (cached per term):
- The canonical schema description (machine-readable extract of `schema/001_init.sql` + `schema/003_spine.sql`)
- The ISO mapping config (as few-shot example v1)
- The Inspector's `StructuralFingerprint` for the new file

Output: a `MappingConfig` (typed JSON, schema below). The LLM is in `response_format: json_schema` mode — it cannot return free text.

System prompt sits at Layer 1 of prompt caching (see `docs/prompt_caching_spec.md`); school-specific input is the delta.

### 3. MappingConfig format

```yaml
mapping_config:
  version: 1.0
  school_id: <uuid>
  source_kind: timetable_workbook | student_roster | gradebook | comm_history | ...
  applies_to_file_pattern: "*.xlsx"

  source_inspection:
    file_kind: xlsx
    sheets_used: ["26-27A", "Faculty"]

  rules:
    # Rule 1: extract teachers from rows of the "26-27A" sheet
    - rule_id: teachers_from_26_27a
      source:
        sheet: "26-27A"
        row_block: { detector: "first_col_is_int" }
      target_table: teachers
      target_fields:
        full_name: { source_col: 1, transform: trim }
        weekly_period_cap: { source_col: 2, default: 30, transform: int }
        primary_subject_text: { source_col: 3, transform: trim }

    # Rule 2: extract the teacher×section×subject load matrix
    - rule_id: load_matrix_from_26_27a
      source:
        sheet: "26-27A"
        structure: matrix
        row_axis: { detector: "first_col_is_int" }      # teacher rows
        col_axis:
          header_row: 0
          header_pattern: "section_code"                 # KG1A, 9A, 11 AS, etc.
          sub_header_row: 1
          sub_header_pattern: "subject_code_short"       # En, Ma, Ph, etc.
          default_group_width: 4
      target_table: teacher_section_subject
      target_fields:
        teacher_id:   { from_row_ref: teachers_from_26_27a, key: full_name }
        section_code: { from_col_axis: header }
        subject_code: { from_col_axis: sub_header, transform: normalize_subject_code }
        weekly_periods: { from_cell: value, type: int, min: 1 }

  transforms:
    # Custom transforms can be defined per school
    normalize_subject_code:
      kind: lookup
      table:
        "EN": En
        "MA": Ma
        "PHY": Ph
        "BIO": Bi
        # ... school-specific quirks
```

Stored in a Postgres table `source_mapping_configs` (added to `schema/005_mapping.sql` later):

```sql
CREATE TABLE source_mapping_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid NOT NULL REFERENCES schools(id),
  source_kind     text NOT NULL,
  version         int NOT NULL DEFAULT 1,
  is_active       boolean DEFAULT true,
  config          jsonb NOT NULL,         -- the YAML serialised to JSON
  ai_proposal     jsonb,                  -- what the LLM originally proposed
  human_edits     jsonb,                  -- diff between AI proposal and approved version
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (school_id, source_kind, version)
);
```

### 4. Validator (pure Python)

- **Schema-check**: every target_table and target_field exists in the canonical Postgres schema
- **Entity-check**: every `transform` referenced is defined; every `from_row_ref` points at a rule in the same config
- **Feasibility pre-check**: dry-run the mapping over the first 5 rows; if any row produces invalid types or violates a NOT NULL constraint, reject with a specific error

Failure surfaces a friendly UI message:
> "I'm reading this as a teacher-load matrix with 41 sections × 32 subjects. But for row 4, column 9, the value 'TBC' isn't a number — I'd expect weekly_periods to be an integer. Could be that 'TBC' means 'to be confirmed' and we should skip it?"

### 5. Human approval UI (Manhaj admin app, Tier 2)

Side-by-side:
- **Left:** the school's uploaded file rendered as-is (spreadsheet view)
- **Right:** what the canonical Postgres rows would look like after the mapping runs (5-row preview table per target table)
- **Top:** the LLM's confidence (0-100%) + plain-English summary of what it thinks the file is
- **Per-cell override:** click any mapping arrow to retarget; the change is logged and the preview updates

One "Approve & ingest" button. After approval, the mapping is stored; the runner kicks off; rows land in canonical tables.

### 6. Generic ETL runner (pure Python, deterministic)

Takes `(file, mapping_config) → canonical Postgres rows`. Idempotent; re-running with the same file produces the same rows. Records a `source_imports` row with file sha256, mapping_config version used, row counts per target table, any rows rejected during ingest.

---

## What carries forward from today's ETL

`etl/parse_workbook.py` is hard-coded for ISO's specific 26-27A sheet layout. When we build the universal mapper, ISO's mapping becomes the **first row in `source_mapping_configs`** — the ISO-specific code becomes pure config. The runner is generic; the ISO-specific behaviour is data.

That's the migration:
1. Extract ISO's hard-coded rules from `parse_workbook.py` into a `mapping_config` YAML
2. Implement the generic runner that consumes any `mapping_config`
3. Verify: running the generic runner against ISO's mapping_config produces the same JSON output as today's hard-coded `parse_workbook.py`
4. Implement Inspector + Proposer + Validator + UI
5. Onboard school #2 with the full flow (Inspector → Proposer → human approves → runner ingests)

---

## Where this lives in the build sequence

- **Tier 0 (now):** out of scope. Hard-coded ETL is fine for ISO.
- **Tier 1 (live pilot):** still out of scope. Run the hard-coded ETL on ISO via the new Supabase path.
- **Tier 2 (school #2 onboarding):** **build it.** This is the trigger.
- **Tier 2.5+:** every additional school onboards through the same flow. Mapping config gets stored, reused, improved.

Estimated build cost when triggered: ~3 engineer-weeks (Inspector: 3 days, Proposer prompt + few-shots: 2 days, Validator: 3 days, runner: 5 days, UI: 5 days, end-to-end test with synthetic file: 2 days). Cheaper than hard-coding 3 more schools.

---

## Cost per school onboarding (target, Tier 2+)

- **LLM:** ~$0.03 per file (Haiku, 5k input / 2k output, with prompt cache)
- **Human:** ~15 min review for a standard timetable; ~30 min for unusual formats
- **Engineering:** 0 (config-driven; no code change)

Compared to today's hard-coded approach (~5 days of engineering per new school), this is the killer feature for scaling beyond ISO.

---

## Open questions for later

- Does the proposer benefit from seeing 2-3 example mappings as few-shot (not just ISO), or is one enough? Run the experiment at school #2.
- Should the runner support incremental ingest (only changed rows since last import)? Defer until a school re-uploads weekly.
- How do we version mapping configs when the canonical schema changes? `applies_to_canonical_version` field on the config; mark stale; force re-approval.
