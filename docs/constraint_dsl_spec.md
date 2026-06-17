# CP-SAT constraint DSL — spec

## Plain-English summary (read this first)

When the principal types "Mr Gericke needs Tuesday afternoons free for department meetings" into the Manhaj chat, three things happen behind the scenes:

1. **The AI (Claude Sonnet) reads it** and tries to figure out what the principal means in computer-friendly terms — what teacher, what days, what kind of restriction.
2. **The AI is forced to fill out a strict form** rather than writing free text back. The form has named slots: who, what kind of constraint, when, why. This document is the form.
3. **The form is handed to the scheduling engine** (a separate piece of software called CP-SAT — a constraint-satisfaction solver) which re-arranges the timetable to obey the new rule.

**Why we don't skip the form and let the AI talk to the solver directly:** AI text is fuzzy. Solver math is precise. If we feed fuzzy AI text into a math engine, weird things happen — the solver might silently drop classes, or interpret "free" as "absent" and mark the teacher as on leave for the day. The form is a safety belt: it has a small, finite list of allowed shapes, and every AI suggestion gets validated against the form before the solver sees it. If the AI tries to invent a new constraint type, validation rejects it and the principal is asked to rephrase.

The terms:
- **CP-SAT** = a Google open-source scheduling engine (part of OR-Tools). Picks values for many variables at once to satisfy a list of rules. Think Sudoku-solver but for "who teaches what when".
- **DSL** = "Domain-Specific Language". A small, focused vocabulary for one job. JSON in our case.
- **Constraint** = a rule the timetable must obey. Examples below.

---

## Design principles

1. **JSON only.** The AI returns a JSON object matching one of the schemas below. No prose, no markdown, no "let me explain". Strict mode (`response_format: { type: "json_schema" }`).
2. **Closed set of constraint types.** The AI cannot invent new types. New types are added by humans editing this spec + the corresponding solver-side handler.
3. **Every constraint carries `source` metadata.** Who asked, when, what natural-language text triggered it, the resolved entities. Used for audit + undo.
4. **Two-pass validation.** First the AI's JSON is schema-checked. Then a Python validator confirms every entity reference (teacher_id, section_id, etc.) actually exists in the current school. Either failure → reject + ask principal to rephrase.
5. **Constraints have severity.** `hard` (solver must obey or fail), `preferred` (solver tries; penalised but not blocked). Default is `preferred` for AI-extracted constraints unless the user explicitly says "must" / "cannot" / "absolutely".
6. **All operations are patch-mode by default.** A constraint addition triggers a *partial* re-solve over the affected teacher/section, not a full timetable regenerate. Full regenerate is opt-in only.

---

## Top-level request envelope

Every AI extraction returns this:

```json
{
  "intent": "add_constraint" | "remove_constraint" | "explain_current" | "test_what_if",
  "source": {
    "user_id": "uuid",
    "natural_language_text": "the original text the user typed",
    "timestamp": "ISO-8601"
  },
  "constraints": [ /* one or more Constraint objects, see below */ ],
  "scope": {
    "academic_year_id": "uuid",
    "applies_from": "YYYY-MM-DD",
    "applies_until": "YYYY-MM-DD | null"
  },
  "ai_confidence": 0.0 - 1.0,
  "ai_notes_for_principal": "string · displayed back so the principal can verify before applying"
}
```

If `ai_confidence` < 0.7, the system **does not apply** and instead asks the principal to confirm: "I read this as X — is that right?"

---

## Constraint types (closed set, v1)

### 1. `teacher_period_block` — teacher cannot teach in given periods

```json
{
  "type": "teacher_period_block",
  "severity": "hard" | "preferred",
  "teacher_id": "uuid",
  "blocked_periods": [
    { "day_of_week": "Tue", "bell_period_ids": ["uuid", "uuid"] }
  ],
  "reason": "department meeting"
}
```
Example trigger: *"Ms Khoury can't take Tuesday P5 or P6 — she runs the math department meeting."*

### 2. `teacher_max_periods_per_day` — cap a teacher's daily load

```json
{
  "type": "teacher_max_periods_per_day",
  "severity": "preferred",
  "teacher_id": "uuid",
  "max_periods": 5,
  "day_of_week": "All" | "Mon" | ...
}
```
Example trigger: *"Mr Aoun shouldn't have more than 5 periods on any given day — he's been burning out."*

### 3. `subject_room_requirement` — subject must run in a specific room type

```json
{
  "type": "subject_room_requirement",
  "severity": "hard",
  "subject_id": "uuid",
  "required_room_types": ["lab"],
  "required_equipment": ["fume_hood"]
}
```
Example trigger: *"Chemistry has to be in a lab — preferably with a fume hood for the senior classes."*

### 4. `section_subject_min_gap` — minimum days between back-to-back sessions

```json
{
  "type": "section_subject_min_gap",
  "severity": "preferred",
  "section_id": "uuid",
  "subject_id": "uuid",
  "min_days_between": 1
}
```
Example trigger: *"Don't put 10A's Arabic on two consecutive days — they need time to digest."*

### 5. `co_section_lock` — two sections must run a subject at the same time

```json
{
  "type": "co_section_lock",
  "severity": "hard",
  "section_ids": ["uuid", "uuid"],
  "subject_id": "uuid",
  "reason": "shared teacher across both sections"
}
```
Example trigger: *"G11 AS Physics has to be at the same time as G11A regular Physics so they share Dr Saab."*

### 6. `period_consecutive_required` — a subject needs N consecutive periods

```json
{
  "type": "period_consecutive_required",
  "severity": "hard",
  "section_id": "uuid",
  "subject_id": "uuid",
  "consecutive_count": 2,
  "reason": "double-period lab"
}
```
Example trigger: *"Science labs need double periods, not single."*

### 7. `teacher_section_lock` — pin a specific teacher to a specific section's subject

```json
{
  "type": "teacher_section_lock",
  "severity": "hard",
  "teacher_id": "uuid",
  "section_id": "uuid",
  "subject_id": "uuid"
}
```
Example trigger: *"Make sure Ms Khoury keeps her G9A class — she's been with them all year."*

### 8. `forbidden_period_for_subject` — subject can't run in certain periods (e.g. PE before lunch)

```json
{
  "type": "forbidden_period_for_subject",
  "severity": "preferred",
  "subject_id": "uuid",
  "forbidden_periods": [
    { "day_of_week": "All", "period_numbers": [7, 8] }
  ],
  "reason": "Arabic is heavy — bad fit for last periods"
}
```

---

## What's intentionally NOT in v1

These look tempting but are deferred until the solver handles them cleanly:

- Multi-week patterns (only single-week schedules in v1)
- Soft preferences expressed as costs (we use severity = preferred/hard, no per-unit cost weights yet)
- Cross-tenant constraints (irrelevant for pilot)
- Per-student constraints (out of pilot scope; would need to model individual student schedules)

---

## Validation steps (Python service)

After receiving the JSON from the AI:

```python
def validate_request(req: dict) -> ValidationResult:
    # 1. JSON schema check (uses jsonschema library against the closed type list)
    if not matches_schema(req): return Reject("malformed JSON")

    # 2. Entity resolution: every UUID must exist for this school
    for c in req["constraints"]:
        if c["type"] == "teacher_period_block":
            if not teacher_exists(c["teacher_id"], school_id): return Reject(...)
            for bp in c["blocked_periods"]:
                for pid in bp["bell_period_ids"]:
                    if not bell_period_exists(pid, school_id): return Reject(...)
        # ... per-type checks

    # 3. Confidence gate
    if req["ai_confidence"] < 0.7:
        return RequireConfirmation(req["ai_notes_for_principal"])

    # 4. Feasibility pre-check (cheap heuristic before invoking CP-SAT)
    if would_make_solver_infeasible(req, current_schedule):
        return Reject("This rule conflicts with hard rules already in place: ...")

    return Accept(req)
```

If any of steps 1-3 fail, the user sees a friendly message: *"I'm not sure I understood — could you rephrase?"* Step 4 produces *"Adding this would mean these other rules can't all be satisfied: …"* — surfaced to the principal with the conflicting rules listed.

---

## What the solver returns

After applying a constraint and re-solving:

```json
{
  "outcome": "solved" | "infeasible" | "timeout",
  "diff": [
    { "section_id": "uuid", "subject_id": "uuid", "from_slot": "uuid", "to_slot": "uuid", "teacher_id": "uuid" }
  ],
  "constraints_satisfied": ["new_constraint_id", "existing_constraint_id", ...],
  "constraints_relaxed": [],
  "solve_time_ms": 1234
}
```

If `outcome` is `infeasible`, the principal sees a list of which constraints couldn't all be satisfied and can pick one to relax.

---

## Logging & audit

Every accepted request writes a row in `audit_log` with:
- `action = "add_scheduling_constraint"`
- `object_kind = "constraint"`, `object_id` = generated UUID
- `metadata` = the full envelope above + the solver diff

Every AI extraction also writes a row in `ai_usage_ledger` with `request_kind = "constraint_extract"` for cost tracking.

---

## Versioning

This spec is v1. Changes are SemVer:
- **Major** (v2): break the request envelope or remove constraint types
- **Minor** (v1.x): add new constraint types, add optional fields
- **Patch** (v1.0.x): clarify wording, fix examples

Every constraint stored in DB has a `dsl_version` column so future migrations know how to interpret old data.
