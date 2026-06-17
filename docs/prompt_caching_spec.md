# Prompt caching scope — spec

## Plain-English summary

The architecture brief calls for "aggressive prompt caching" so we don't pay the AI to re-read the same context every time. Caching = the AI provider (Anthropic) stores the long boring boilerplate ("here are all the teachers, here are all the subjects, here's how Manhaj rubrics work") and only charges full price when something NEW is asked.

The cheap part is the **delta** (what's new in this question). The expensive part is the **stable scaffolding** (who/what/how is this school set up). Caching means we pay once per scaffolding-refresh, not once per question. At reasonable volumes this is 80-90% cost saving.

But it only works if we **separate the two clearly**. If we mix the principal's question and the school's setup in the same blob, every question invalidates the cache. This doc defines what goes where.

Terms:
- **System prompt** = the always-included context Claude sees at the top of every conversation. "You are Manhaj, an AI assistant for school principals…"
- **Cache breakpoint** = a marker we add to the prompt that tells Anthropic "everything above this is stable; please cache it." We can have up to 4 breakpoints.
- **Cache hit** = a request that re-uses the cached prefix. Roughly 10% the cost of the same tokens without caching.

---

## The three layers

Every conversation is built from three concentric layers, each with its own cache lifetime.

### Layer 1: Manhaj product context (cached for ~1 hour, shared across all schools)

What it contains:
- Manhaj's purpose ("you are an AI assistant for K-12 school principals…")
- The 6-axis rubric framework (axes, descriptions, scale)
- The 17 communication-template catalog (names, channels, when to suggest each)
- The constraint DSL spec for scheduling actions (types + JSON shapes)
- Safety rules (no comparisons to named peers, no diagnostic language, etc.)
- General response format rules

Size: ~6-8k tokens, stable across deploys.
Refreshes when: we ship a new version of Manhaj. So basically: never within a term.
Cache key: `manhaj_system:v{semver}`.

### Layer 2: School-specific context (cached for ~1 hour, per school)

What it contains:
- School name, country, timezone, brand sign-off style
- Subject catalog (codes + EN/AR names for this school)
- Sections list (KG1A → 12A2 — 41 rows for ISO)
- Teacher list (names + departments + cap — 69 rows for ISO)
- Bell schedule (period times)
- Room list (codes + types)
- Current academic year + term boundaries
- Tenant-specific overrides (custom rubric descriptors, custom template tones)

Size: ~10-15k tokens for ISO.
Refreshes when: timetable workbook is re-ingested, roster is updated, teacher is added/removed. Typically once a day during planning season, once a week in steady state.
Cache key: `school:{school_id}:v{snapshot_id}`. Bumping snapshot_id invalidates the cache.

### Layer 3: Current question + recent context (NOT cached)

What it contains:
- The user's actual message
- Last 5-10 messages of the conversation thread (the "scrollback")
- Any per-question dynamic context (e.g. "the current at-risk students list" if the question is about that)

Size: highly variable, 500-3000 tokens.
Cached: no — this changes every turn.

---

## How they're glued together in the API call

Using Anthropic's prompt caching:

```python
client.messages.create(
    model="claude-sonnet-4-6",
    system=[
        {
            "type": "text",
            "text": MANHAJ_PRODUCT_CONTEXT,          # Layer 1
            "cache_control": {"type": "ephemeral"}   # ← breakpoint 1
        },
        {
            "type": "text",
            "text": school_context_for(school_id),    # Layer 2
            "cache_control": {"type": "ephemeral"}   # ← breakpoint 2
        }
    ],
    messages=[
        # Layer 3: recent conversation + current question, no cache_control
        *recent_messages(thread_id),
        {"role": "user", "content": user_question},
    ],
)
```

The two `cache_control` markers create two breakpoints. The first request fully writes the cache (more expensive). Every subsequent request within the cache TTL re-uses both layers at ~10% the original cost.

---

## Refresh discipline (so we keep getting hits)

The biggest enemy of cache hit rate is **non-determinism in supposedly-stable layers**. Rules:

| Layer | Rule | Why |
|---|---|---|
| 1 | Never include a timestamp or date inline | "Today is Tuesday 8 May 2026" invalidates the cache on the next day |
| 1 | Version the prompt explicitly (`Manhaj system v1.3`) | Lets us deploy without immediately tanking hit rate; old cached prefix still works for in-flight conversations |
| 2 | Snapshot the school context atomically | If teachers + sections come from separate queries with even 1 sec apart, they can be inconsistent on cache rebuild |
| 2 | Bump `snapshot_id` deterministically | Bump when roster / timetable / teacher data changes. Don't bump on every read |
| 2 | Sort everything | Teacher list `ORDER BY id` so identical state → identical bytes |
| 3 | Truncate scrollback consistently | "Last 10 messages" not "fits in 2k tokens" — predictable bytes |

---

## Target hit rate

- **Steady-state interactive (principal chat):** ≥ 90% cache hit on Layer 1+2 combined.
- **Background batch jobs (monthly reports):** ≥ 95% on Layer 1+2, because we process all students in one window.

Measured via the `cache_hit` boolean in `ai_usage_ledger`. Weekly report from a Supabase view.

---

## What this saves us

Rough numbers at pilot scale (1 school, ~500 students):

| Workload | Without caching | With caching | Saving |
|---|---|---|---|
| Principal chat (10 questions/day × 20 school days) | $40-80/mo | $5-10/mo | ~85% |
| Monthly parent report (500 students × 10 subjects × ~3k tokens output) | $200-400/mo | $30-60/mo | ~85% |
| Communication-draft suggestions (30/teacher/week × 30 teachers) | $80-150/mo | $10-20/mo | ~85% |

Total monthly AI cost difference: roughly **$320-630/mo → $45-90/mo** at pilot scale. Real, not theoretical — this is why caching is non-negotiable, not "nice to have".

---

## Cost-cap enforcement (overlap with `ai_usage_ledger`)

Caching is the cost-control optimisation. The cost-cap is the cost-control safety belt. They work together:

- Caching reduces what we spend per call
- The cap (`$150/tenant/month` default for background) refuses calls past the limit

A cache miss on a backgrounded job is the dangerous case — it eats budget fast. The pre-call check that consults `ai_usage_ledger` happens BEFORE we make the API call, so a miss + over-budget = the call never goes out. Failure mode is graceful (we serve a template-only report with a note) rather than runaway spend.

---

## When this spec changes

When we add a new module (Classroom V2, Finance) and want to include its context in Layer 1 or 2, we bump the spec version + the cache key. Document the change in the decisions log so cache hit-rate dips have a known cause.
