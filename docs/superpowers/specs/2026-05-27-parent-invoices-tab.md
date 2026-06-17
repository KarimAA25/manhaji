# Parent · Invoices tab · design spec (Phase 2.3)

| | |
|---|---|
| **Date** | 2026-05-27 |
| **Status** | Approved · ready for implementation plan |
| **Parent spec** | [`2026-05-26-three-role-ia-design.md`](2026-05-26-three-role-ia-design.md) |
| **Brainstorm mockup** | `~/dev/manhaj/.superpowers/brainstorm/.../content/parent-multi-child.html` |

---

## 1. Background

Phase 1 left `/parent/invoices` as a `<PlaceholderPage />`. This spec turns it into a fully-rendered invoices page with **maximalist scope (all 6 brainstorm blocks)** backed by synthetic data in `lib/mock-invoices.ts`. Critically, this PR also introduces an **ActiveChild React context** in `lib/child.ts` so the ChildSwitcher and any parent page stay in sync — this benefits every Phase 2.4+ parent page.

## 2. Goals

1. **All 6 brainstorm blocks** render against synthetic data:
   1. AI alert banner about the outstanding balance
   2. Balance hero card with Pay-now / Split-into-3 / Download statement actions
   3. Installment plan (3 term cards: Term 1 paid / Term 2 partial / Term 3 scheduled)
   4. Fee breakdown table (tuition / books / transport / clubs / trips)
   5. Payment history table with downloadable PDF receipts
   6. Household per-child view (when ChildSwitcher = "All children")
2. **Page reacts to the active child** via the new `useActiveChild()` hook. Switching child in the ChildSwitcher re-renders the page contents.
3. **Reusable ActiveChild context** — every future parent page can opt in without reimplementing the localStorage-and-event subscription dance.

## 3. Non-goals

- Real payment processing. Pay-now button is wired to console.
- New schema or RPCs.
- Currency localisation. Hard-coded `OMR`.
- Drill-into-installment detail page.
- Receipt PDFs are placeholder links.

## 4. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Scope | **Maximalist** — all 6 blocks. |
| 2 | Data source | New `apps/web/lib/mock-invoices.ts`. References children by ID from `lib/child.ts`. |
| 3 | Active-child state | New React context in `lib/child.ts` with `ActiveChildProvider` + `useActiveChild()` hook. Wraps in `app/parent/layout.tsx`. ChildSwitcher refactored to consume the context. |
| 4 | Page rendering | Child-aware: `"all"` → household hero + per-child rows; single child → single-child hero + installments + breakdown + history. |
| 5 | Currency | OMR, no localisation. Format: `OMR 1,250.00` (with thousands separator). |
| 6 | Per-child invoice realism | Layla outstanding OMR 750 (Term 2 partial), Omar outstanding OMR 1,070 (Term 2 with transport), Yasmin paid in full (KG2 fees lower). Household total OMR 1,820. |

## 5. File map

**Create:**
- `apps/web/lib/mock-invoices.ts` — fixture + types
- `apps/web/lib/invoices.test.ts` — vitest tests
- `apps/web/app/parent/invoices/components/InvoiceAlert.tsx` — AI banner
- `apps/web/app/parent/invoices/components/BalanceHero.tsx` — single-child + household variants
- `apps/web/app/parent/invoices/components/InstallmentCards.tsx` — 3 term cards
- `apps/web/app/parent/invoices/components/FeeBreakdown.tsx` — line items table
- `apps/web/app/parent/invoices/components/PaymentHistory.tsx` — history table
- `apps/web/app/parent/invoices/components/HouseholdRows.tsx` — per-child rows for All Children mode

**Modify:**
- `apps/web/lib/child.ts` — add `ActiveChildContext` + `ActiveChildProvider` + `useActiveChild()` hook
- `apps/web/lib/child.test.ts` — keep existing tests; add tests for the new hook (jsdom env if needed)
- `apps/web/app/parent/layout.tsx` — wrap `{children}` in `<ActiveChildProvider>`
- `apps/web/app/parent/components/ChildSwitcher.tsx` — consume context instead of own useState
- `apps/web/lib/summary.ts` — add `invoiceParentSummary()` export
- `apps/web/lib/summary.test.ts` — tests
- `apps/web/app/parent/invoices/page.tsx` — replace placeholder
- `apps/web/app/globals.css` — append CSS for each new component

## 6. Data shape

`apps/web/lib/mock-invoices.ts` exports:

```ts
export type InstallmentStatus = "paid" | "partial" | "scheduled";

export type FeeLine = {
  label:    string;       // "Tuition · Grade 10"
  category: "tuition" | "books" | "transport" | "clubs" | "trips" | "other";
  amount:   number;       // OMR
  optional: boolean;
  status:   "paid" | "due";
  note?:    string;       // "core academic fees"
};

export type Installment = {
  id:      string;            // "L-T1"
  term:    1 | 2 | 3;
  label:   string;            // "Term 1", "Term 2", "Term 3"
  period:  string;            // "Sept – Dec"
  total:   number;            // OMR for the term
  paid:    number;            // OMR paid so far
  due_date: string;           // ISO date
  status:  InstallmentStatus;
  lines:   FeeLine[];
};

export type Payment = {
  id:       string;
  date:     string;             // ISO date
  for:      string;             // "Term 2 · part 1"
  detail:   string;             // "tuition + books"
  amount:   number;
  method:   "bank transfer" | "card" | "cash" | "cheque";
  receipt_url: string;          // "#" placeholder for Phase 2
};

export type ChildInvoices = {
  child_id:      string;        // matches lib/child.ts DEMO_CHILDREN ids
  child_name:    string;
  outstanding:   number;
  due_date:      string;        // ISO
  installments:  Installment[];
  payments:      Payment[];
};

// Aggregates
export type HouseholdSnapshot = {
  total_outstanding:   number;
  earliest_due_date:   string;
  paid_this_year:      number;
  next_invoice_label:  string;
};

// Exports
export const MOCK_INVOICES: ChildInvoices[];  // 3 children
export function householdSnapshot(rows: ChildInvoices[]): HouseholdSnapshot;
export function formatOmr(amount: number): string;  // "OMR 1,250"
```

**Realism rules:**
- 3 children referenced by ID exactly matching `DEMO_CHILDREN` in `lib/child.ts`: `layla-al-habsi`, `omar-al-habsi`, `yasmin-al-habsi`.
- Layla: Term 1 paid in full (OMR 1,500), Term 2 partial (paid 500 of 1,250 · OMR 750 outstanding · due 25 May), Term 3 scheduled (OMR 1,000 · 1 July).
- Omar: Term 1 paid in full (OMR 1,400), Term 2 partial (paid 330 of 1,400 · OMR 1,070 outstanding · due 25 May · transport line missed), Term 3 scheduled (OMR 1,100 · 1 July).
- Yasmin: Term 1 paid in full (OMR 800), Term 2 paid in full (OMR 900), Term 3 scheduled (OMR 700 · 1 July). No outstanding.
- Each installment has 4-6 line items.
- Payment history: at least 4 payments per outstanding child including the initial Term 1 payment + Term 2 partial.

## 7. ActiveChild context (lib/child.ts additions)

The current `lib/child.ts` exports `readActiveChildId` / `writeActiveChildId` / `DEMO_CHILDREN` / `ALL_CHILDREN_ID` / `ChildId`. We add:

```ts
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ActiveChildState = {
  activeId: ChildId;
  setActive: (id: ChildId) => void;
};

const ActiveChildContext = createContext<ActiveChildState | null>(null);

export function ActiveChildProvider({ children }: { children: ReactNode }) {
  // Initial state read once via lazy useState init (SSR-safe)
  const [activeId, setActiveId] = useState<ChildId>(() => {
    if (typeof window === "undefined") return ALL_CHILDREN_ID;
    return readActiveChildId();
  });

  const setActive = useCallback((id: ChildId) => {
    setActiveId(id);
    writeActiveChildId(id);
  }, []);

  return (
    <ActiveChildContext.Provider value={{ activeId, setActive }}>
      {children}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild(): ActiveChildState {
  const ctx = useContext(ActiveChildContext);
  if (!ctx) throw new Error("useActiveChild must be used inside <ActiveChildProvider>");
  return ctx;
}

/** Resolve the active child object — or null when the household view is active. */
export function getActiveChild(activeId: ChildId): DemoChild | null {
  if (activeId === ALL_CHILDREN_ID) return null;
  return DEMO_CHILDREN.find(c => c.id === activeId) ?? null;
}
```

The provider component is `"use client";` (uses `useState`).

**`ChildSwitcher` refactor** — replace its own `useState` with `useActiveChild()`:

```tsx
const { activeId, setActive } = useActiveChild();
// ... use activeId / setActive instead of the previous local state
```

**`app/parent/layout.tsx` refactor** — wrap the body:

```tsx
<ActiveChildProvider>
  <header className="topbar">...</header>
  <ChildSwitcher />
  <main id="main-content" tabIndex={-1}>{children}</main>
</ActiveChildProvider>
```

## 8. AI summary

`lib/summary.ts` gets `invoiceParentSummary()`:

```ts
export function invoiceParentSummary(
  rows:    ChildInvoices[],
  activeId: ChildId,
  household: HouseholdSnapshot,
): Summary;
```

Rules (single-child active):
- **headline**: `"OMR {outstanding} outstanding · due {due_date_human}."` or `"All clear — paid in full."` when no outstanding.
- **today**: Current installment status (e.g. `"Term 2 partial · OMR 500 of OMR 1,250 paid."`)
- **this_week**: `"Bank transfers usually clear in 1-2 days."`
- **this_month**: `"Next invoice goes out 1 July (Term 3)."`
- **ai_suggested_action**: `"Pay OMR {outstanding} now · or split into 3 monthly chunks."` when outstanding > 0.

Rules (`"all"` active):
- **headline**: `"Household balance OMR {total_outstanding} due across {n} children."` or `"All household invoices clear."`
- **today**: `"Earliest due {due_date_human}."`
- **this_week**: `"Pay all → one tap covers every child."`
- **this_month**: `"Next invoice across the household: {next_invoice_label}."`
- **ai_suggested_action**: `"Pay the OMR {total} household balance · or split per child."` when total > 0.

## 9. Page rendering logic

```tsx
"use client";
const { activeId } = useActiveChild();
const child = getActiveChild(activeId);
const summary = invoiceParentSummary(MOCK_INVOICES, activeId, householdSnapshot(MOCK_INVOICES));

return (
  <div className="container">
    <InvoiceAlert summary={summary} />

    {activeId === ALL_CHILDREN_ID ? (
      <>
        <BalanceHero mode="household" summary={summary} household={householdSnapshot(MOCK_INVOICES)} />
        <HouseholdRows rows={MOCK_INVOICES} />
      </>
    ) : child ? (
      <>
        <BalanceHero mode="single" summary={summary} child={MOCK_INVOICES.find(r => r.child_id === activeId)!} />
        <InstallmentCards rows={MOCK_INVOICES.find(r => r.child_id === activeId)!.installments} />
        <FeeBreakdown installment={MOCK_INVOICES.find(r => r.child_id === activeId)!.installments.find(i => i.status !== "paid")!} />
        <PaymentHistory rows={MOCK_INVOICES.find(r => r.child_id === activeId)!.payments} />
      </>
    ) : (
      <p>Unknown child.</p>
    )}
  </div>
);
```

## 10. Acceptance criteria

- [ ] `/parent/invoices` renders all 6 blocks against `MOCK_INVOICES`.
- [ ] Switching child in the ChildSwitcher re-renders the page (no manual refresh).
- [ ] "All children" mode shows household balance hero + per-child rows.
- [ ] Single-child mode shows installments + fee breakdown + payment history.
- [ ] `OMR 1,250.00` style formatting consistent.
- [ ] Pay-now button is **disabled** (placeholder until Phase 3 payment provider).
- [ ] Split-into-3 + Download-statement buttons present (log to console).
- [ ] Mobile (375 px) renders without horizontal overflow. Tables scroll horizontally if needed.
- [ ] Build + tsc + lint clean. Tests pass.
- [ ] The ChildSwitcher refactor doesn't break the existing parent-persona Dashboard.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Existing ChildSwitcher tests break when it stops managing its own state | Update tests to wrap in `<ActiveChildProvider>` (or remove component tests; we still cover `readActiveChildId` directly). |
| Context provider in a Server-Component-wrapped layout | Provider is `"use client";` — Next.js handles the boundary cleanly. The layout itself stays a server component; the Provider wraps `{children}` and renders client-only. |
| Other parent pages (e.g. Dashboard) call `useActiveChild()` before the provider is set up | Hook throws if context is missing — fast feedback. Wrap the layout (Task 3 in plan) before consuming the hook anywhere. |

## 12. Self-review

- ✓ No "TBD" / placeholder language.
- ✓ Types in §6 + §7 match imports in §9 and §10.
- ✓ Scope: 6 blocks. The 6th is explicit (HouseholdRows for All Children mode).
- ✓ Active-child plumbing is its own task in the plan — separate from the page assembly so it can be reviewed independently.
- ✓ Pay-now stays disabled — provider decision is Phase 3 per the parent spec §13.

Ready to write the implementation plan.
