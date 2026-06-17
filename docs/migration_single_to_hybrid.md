# Single-schema → hybrid migration: actual cost when we trigger it

**Decision (locked):** start with single-schema + RLS for all tenants. Move "hot" tables to schema-per-tenant only when we hit a real scale signal (default trigger: school #5, or sustained p95 latency degradation on hot-table queries due to cross-tenant index bloat, whichever first).

This doc exists so the cost of "do single now, hybrid later" is documented up front and not a surprise.

## Plain-English summary (read this first)

Picture our database (where all school data is kept) as a **big filing cabinet**.

- A **drawer** in that cabinet is what database people call a "**schema**". Today there's only one drawer, named `public`. Everyone's files are in it; we put a tag on every file saying which school it belongs to ("school_id"), and a rule (RLS = "Row Level Security") says you only see files tagged with your own school.
- A **folder** in a drawer is a "**table**". Examples: `attendance`, `students`, `teachers`.
- The future "**hybrid**" setup means each school gets *its own drawer* for the busy folders (attendance, grades), while still sharing the `public` drawer for the quiet folders (subject catalog, comm templates). This is what we want eventually for performance + stronger isolation, but it's overkill now.

The risk we're avoiding: if every line of our code hard-codes "go to the `public` drawer and grab the `attendance` folder", then the day we give each school their own drawer, we have to find and rewrite every one of those lines. That's a 2-3 week emergency.

We avoid it with **two rules** the application code follows from day 1:

1. **Never hard-code the drawer name.** Code says "get the `attendance` folder", not "get `public.attendance`". The system figures out which drawer to look in.
2. **Walk into the right drawer first.** Every time a user logs in, the system runs a tiny instruction that says "stand in this school's drawer". Today that drawer doesn't exist yet so the instruction has a fallback ("if your drawer's missing, just stand in `public`"). Day 100, when we give a school its own drawer, the same instruction now routes them correctly — without us editing any other code.

These two rules are **zero cost today and save us 1-2 weeks the day we trigger the migration.** They're enforced by:
- A helper Postgres function `set_tenant_search_path(school_id)` shipped in `schema/002_rls.sql` (the "walk into the drawer" instruction with the EXCEPTION fallback)
- A wrapper `withTenantContext(schoolId, ...)` in the Next.js app code that wraps every database call
- An ESLint rule that fails the build if anyone writes `public.attendance_marks` instead of just `attendance_marks`

**Bottom line:** waiting to do hybrid costs ~$0 in engineering today. Doing it later, if we followed the rules, takes about **1 working week (~34 hours)** for a typical batch of 5-10 schools. If we didn't follow the rules, add 1-2 weeks. So we follow the rules.

The rest of this doc is the engineering detail.

---


## What "hybrid" actually means in our setup

The architecture brief's hybrid pattern: shared `public` schema (RLS-filtered) for warm/cold data (curriculum, comms, finance, audit), schema-per-tenant for hot data — currently the candidates:

| Hot table | Why it benefits from per-tenant isolation |
|---|---|
| `attendance_marks` | Highest row count growth; ~500 students × ~180 days = 90k/yr per school. Index bloat across tenants hurts the cross-tenant queries that scan it (date-range filters) |
| `assessment_results` | High write burst at term-end; bursts from one school shouldn't lock indexes used by another |
| `lesson_artifacts` | Large rows (smart-board content blobs, voice memo transcripts). Toast / wal noise per tenant |
| `ai_usage_ledger` | Hot writes (every Claude call). Per-tenant rollup queries get faster when scanning your-own-schema only |
| `audit_log` | Append-only, very hot, queried per-tenant by principals. Classic per-tenant candidate |
| `comm_history` | If we keep raw message blobs for AI training, can grow fast per school |

## Migration mechanics (one table at a time, e.g. `attendance_marks`)

For each tenant `t`:

```sql
-- 1. Create the tenant schema (idempotent)
CREATE SCHEMA IF NOT EXISTS tenant_<t_id>;

-- 2. Clone the table DDL into the tenant schema (no school_id column needed now)
CREATE TABLE tenant_<t_id>.attendance_marks (LIKE public.attendance_marks INCLUDING ALL);
ALTER TABLE tenant_<t_id>.attendance_marks DROP COLUMN school_id;

-- 3. Copy this tenant's rows
INSERT INTO tenant_<t_id>.attendance_marks
SELECT (everything except school_id) FROM public.attendance_marks
WHERE school_id = <t_id>;

-- 4. Verify counts match
SELECT count(*) FROM tenant_<t_id>.attendance_marks;
SELECT count(*) FROM public.attendance_marks WHERE school_id = <t_id>;

-- 5. Drop the rows from public (or keep mirrored for a few days as fallback)
DELETE FROM public.attendance_marks WHERE school_id = <t_id>;
```

Application-side, the only change needed if we do this right from day 1:

```sql
-- On every session login, after auth resolves school_id:
SET search_path TO tenant_<school_id>, public;
```

Then `SELECT * FROM attendance_marks` resolves to `tenant_42.attendance_marks` automatically. **No application code change needed if we follow the rules below.**

## The two rules that make this migration cheap

We must follow these from the day we start writing application code. If we do:

### Rule 1 — never schema-qualify table names in application code
- ❌ `from public.attendance_marks` (breaks the schema route)
- ❌ `db.from('public.attendance_marks')` (same)
- ✅ `from attendance_marks` (`search_path` resolves it)

If we use Supabase's JS client, `.from('attendance_marks')` defaults to `public` unless `schema()` is called. **We will write a `tenantQuery(table)` helper from day 1** that prepends the right schema, so the migration is "change the helper" not "find every call site".

### Rule 2 — every session sets `search_path` after auth

In our Next.js server actions / route handlers:

```ts
async function withTenantContext<T>(schoolId: string, fn: () => Promise<T>) {
  const client = getSupabaseClient();
  // Pre-hybrid: this is a no-op (search_path resolves to public).
  // Post-hybrid: this routes to tenant_<schoolId>.
  await client.rpc('set_tenant_search_path', { school_id: schoolId });
  return fn();
}
```

The `set_tenant_search_path` Postgres function:
```sql
CREATE OR REPLACE FUNCTION set_tenant_search_path(school_id uuid) RETURNS void AS $$
BEGIN
  EXECUTE format('SET search_path TO %I, public', 'tenant_' || school_id::text);
EXCEPTION WHEN invalid_schema_name THEN
  -- Pre-hybrid: tenant schema doesn't exist yet, fall back to public-only
  SET search_path TO public;
END;
$$ LANGUAGE plpgsql;
```

Day 1, the `EXCEPTION WHEN` branch fires for every tenant (no per-tenant schemas exist). Cost: zero. Day 100, when we cut over school #1 to its own schema, the function does the routing automatically. No application code changes.

## Realistic effort estimate when we trigger the migration

Assuming we've followed the two rules, for migrating ~6 hot tables for ~5 tenants:

| Work | Hours |
|---|---|
| Tenant-schema clone script (parameterised, idempotent) | 4 |
| Per-table data move + verify routine | 6 |
| Test fixtures for cross-tenant query paths (rollups, billing) | 4 |
| Cross-tenant aggregate via `UNION ALL` materialized view (for "all-schools" admin queries) | 4 |
| Migration runner update (apply schema migrations to every tenant schema, not just `public`) | 8 |
| Run + verify on staging | 4 |
| Production cutover with read-only window | 4 |
| **Total** | **~34 hours / ~1 working week** |

If we **don't** follow the two rules and have schema-qualified table names scattered through application code: **add 1-2 weeks** of search-and-replace + every-feature regression testing.

## When NOT to trigger the migration

- Only at school #5 because the brief says so. The actual signal is **measured** — p95 latency on hot-table queries trending past 200ms with the per-tenant query that's our SLA target, or noisy-neighbour write storms degrading reads.
- "School #5" is shorthand; if at school #5 the perf is fine, defer further. If at school #3 we have a noisy neighbour, trigger early.

## What we lose by waiting (versus going hybrid day 1)

- Slightly noisier indexes on a few hot tables. Measurable but immaterial at 1-3 tenants.
- Cross-tenant aggregate queries are *easier* in single-schema (one `SELECT` vs UNION ALL). That's a positive for the pilot phase.
- We carry an `id_school` column on every hot-table row that we'll later drop. Cheap.

**Net:** waiting costs ~$0 in engineering time today. The migration when we trigger it is ~1 week if we followed the two rules. That's the deal.

## What we lock in today to make this cheap

Add to the schema:
1. `set_tenant_search_path(uuid)` Postgres function with the EXCEPTION fallback above — ship it in `schema/002_rls.sql`.
2. A `tenant_id()` SQL helper that returns the JWT's school_id — used by every RLS policy. Same migration.
3. App-layer rule: **never schema-qualify**. Codified in a lint rule (`eslint-plugin-no-schema-qualified-sql`) in the Next.js repo.
4. App-layer rule: every server action / route handler wraps the DB calls in `withTenantContext(schoolId, ...)`. Codified in a code-review checklist + a unit-test fixture that fails if any session forgets it.

These four are zero-cost today, week-saving later.
