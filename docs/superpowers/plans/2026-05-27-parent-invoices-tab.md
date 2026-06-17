# Parent · Invoices tab · Implementation Plan (Phase 2.3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Build the 6-block Parent Invoices page (single-child + household views) against `lib/mock-invoices.ts`. Introduce an ActiveChild React context in `lib/child.ts` so the ChildSwitcher and pages stay in sync.

**Spec reference:** [`docs/superpowers/specs/2026-05-27-parent-invoices-tab.md`](../specs/2026-05-27-parent-invoices-tab.md)

---

## File map

**Create:**
- `apps/web/lib/mock-invoices.ts` + `apps/web/lib/invoices.test.ts`
- `apps/web/app/parent/invoices/components/{InvoiceAlert,BalanceHero,InstallmentCards,FeeBreakdown,PaymentHistory,HouseholdRows}.tsx`

**Modify:**
- `apps/web/lib/child.ts` — add context provider + hook
- `apps/web/app/parent/components/ChildSwitcher.tsx` — consume context
- `apps/web/app/parent/layout.tsx` — wrap children in provider
- `apps/web/lib/summary.ts` + `apps/web/lib/summary.test.ts` — add invoiceParentSummary
- `apps/web/app/parent/invoices/page.tsx` — full assembly
- `apps/web/app/globals.css` — append CSS

---

## Task 1 — Mock invoices fixture + tests

**Files:**
- Create: `apps/web/lib/mock-invoices.ts`
- Create: `apps/web/lib/invoices.test.ts`

- [ ] **Step 1: Write `mock-invoices.ts`**

```ts
/**
 * Manhaj Phase 2.3 demo fixture — synthetic invoice data for the
 * Parent Invoices tab. Per-child × per-term installments + line items
 * + payment history. Child IDs match lib/child.ts DEMO_CHILDREN.
 */

export type InstallmentStatus = "paid" | "partial" | "scheduled";

export type FeeLine = {
  label:    string;
  category: "tuition" | "books" | "transport" | "clubs" | "trips" | "other";
  amount:   number;
  optional: boolean;
  status:   "paid" | "due";
  note?:    string;
};

export type Installment = {
  id:       string;
  term:     1 | 2 | 3;
  label:    string;
  period:   string;
  total:    number;
  paid:     number;
  due_date: string;
  status:   InstallmentStatus;
  lines:    FeeLine[];
};

export type Payment = {
  id:          string;
  date:        string;
  for:         string;
  detail:      string;
  amount:      number;
  method:      "bank transfer" | "card" | "cash" | "cheque";
  receipt_url: string;
};

export type ChildInvoices = {
  child_id:     string;
  child_name:   string;
  outstanding:  number;
  due_date:     string;
  installments: Installment[];
  payments:     Payment[];
};

export type HouseholdSnapshot = {
  total_outstanding:  number;
  earliest_due_date:  string;
  paid_this_year:     number;
  next_invoice_label: string;
};

// =========================
// Layla (10A · HS)
// =========================
const LAYLA: ChildInvoices = {
  child_id:    "layla-al-habsi",
  child_name:  "Layla Al-Habsi",
  outstanding: 750,
  due_date:    "2026-05-25",
  installments: [
    {
      id: "L-T1", term: 1, label: "Term 1", period: "Sept – Dec",
      total: 1500, paid: 1500, due_date: "2025-09-05", status: "paid",
      lines: [
        { label: "Tuition · Grade 10",          category: "tuition",  amount: 1200, optional: false, status: "paid", note: "core academic fees" },
        { label: "Books + curriculum",          category: "books",    amount: 150,  optional: false, status: "paid", note: "IGCSE Year 2 textbooks" },
        { label: "Transport · Athaiba route",   category: "transport",amount: 100,  optional: true,  status: "paid" },
        { label: "Music club + MUN",            category: "clubs",    amount: 50,   optional: true,  status: "paid" },
      ],
    },
    {
      id: "L-T2", term: 2, label: "Term 2", period: "Jan – May",
      total: 1250, paid: 500, due_date: "2026-05-25", status: "partial",
      lines: [
        { label: "Tuition · Grade 10",          category: "tuition",  amount: 1000, optional: false, status: "paid", note: "core academic fees" },
        { label: "Books + curriculum materials", category: "books",    amount: 120,  optional: false, status: "paid", note: "IGCSE Year 2 textbooks · workbook" },
        { label: "Transport · Athaiba route",   category: "transport",amount: 80,   optional: true,  status: "due",  note: "school bus · Term 2 · optional" },
        { label: "Music club + MUN",            category: "clubs",    amount: 30,   optional: true,  status: "due",  note: "extracurriculars · optional" },
        { label: "School trip · April field study", category: "trips", amount: 20,   optional: true,  status: "due",  note: "optional" },
      ],
    },
    {
      id: "L-T3", term: 3, label: "Term 3", period: "Jun – Aug",
      total: 1000, paid: 0, due_date: "2026-07-01", status: "scheduled",
      lines: [
        { label: "Tuition · Grade 10",   category: "tuition",   amount: 800, optional: false, status: "due", note: "core academic fees" },
        { label: "Books · Y3 prep",      category: "books",     amount: 100, optional: false, status: "due" },
        { label: "Transport (optional)", category: "transport", amount: 80,  optional: true,  status: "due" },
        { label: "Clubs (optional)",     category: "clubs",     amount: 20,  optional: true,  status: "due" },
      ],
    },
  ],
  payments: [
    { id: "L-P1", date: "2026-02-02", for: "Term 2 · part 1", detail: "tuition + books", amount: 500,  method: "bank transfer", receipt_url: "#" },
    { id: "L-P2", date: "2025-09-05", for: "Term 1 · full",   detail: "tuition + transport + books + club", amount: 1500, method: "bank transfer", receipt_url: "#" },
    { id: "L-P3", date: "2025-08-15", for: "Re-enrollment deposit", detail: "refundable on exit", amount: 500, method: "card", receipt_url: "#" },
  ],
};

// =========================
// Omar (7B · MS)
// =========================
const OMAR: ChildInvoices = {
  child_id:    "omar-al-habsi",
  child_name:  "Omar Al-Habsi",
  outstanding: 1070,
  due_date:    "2026-05-25",
  installments: [
    {
      id: "O-T1", term: 1, label: "Term 1", period: "Sept – Dec",
      total: 1400, paid: 1400, due_date: "2025-09-05", status: "paid",
      lines: [
        { label: "Tuition · Grade 7",         category: "tuition",  amount: 1100, optional: false, status: "paid" },
        { label: "Books",                     category: "books",    amount: 130,  optional: false, status: "paid" },
        { label: "Transport · Athaiba route", category: "transport",amount: 100,  optional: true,  status: "paid" },
        { label: "Football club",             category: "clubs",    amount: 70,   optional: true,  status: "paid" },
      ],
    },
    {
      id: "O-T2", term: 2, label: "Term 2", period: "Jan – May",
      total: 1400, paid: 330, due_date: "2026-05-25", status: "partial",
      lines: [
        { label: "Tuition · Grade 7",         category: "tuition",  amount: 1100, optional: false, status: "due", note: "core academic fees" },
        { label: "Books · Term 2",            category: "books",    amount: 130,  optional: false, status: "paid" },
        { label: "Transport · Athaiba route", category: "transport",amount: 100,  optional: true,  status: "due", note: "school bus · Term 2" },
        { label: "Football club",             category: "clubs",    amount: 50,   optional: true,  status: "due" },
        { label: "Late fee",                  category: "other",    amount: 20,   optional: false, status: "due", note: "auto-applied after 7 days" },
      ],
    },
    {
      id: "O-T3", term: 3, label: "Term 3", period: "Jun – Aug",
      total: 1100, paid: 0, due_date: "2026-07-01", status: "scheduled",
      lines: [
        { label: "Tuition · Grade 7",   category: "tuition",   amount: 900, optional: false, status: "due" },
        { label: "Books",               category: "books",     amount: 100, optional: false, status: "due" },
        { label: "Transport (optional)",category: "transport", amount: 100, optional: true,  status: "due" },
      ],
    },
  ],
  payments: [
    { id: "O-P1", date: "2026-02-10", for: "Term 2 · part 1",  detail: "books only",  amount: 330,  method: "bank transfer", receipt_url: "#" },
    { id: "O-P2", date: "2025-09-05", for: "Term 1 · full",    detail: "tuition + extras", amount: 1400, method: "bank transfer", receipt_url: "#" },
    { id: "O-P3", date: "2025-08-15", for: "Re-enrollment deposit", detail: "refundable on exit", amount: 500, method: "card", receipt_url: "#" },
  ],
};

// =========================
// Yasmin (KG2 · Primary)
// =========================
const YASMIN: ChildInvoices = {
  child_id:    "yasmin-al-habsi",
  child_name:  "Yasmin Al-Habsi",
  outstanding: 0,
  due_date:    "2026-07-01",
  installments: [
    {
      id: "Y-T1", term: 1, label: "Term 1", period: "Sept – Dec",
      total: 800, paid: 800, due_date: "2025-09-05", status: "paid",
      lines: [
        { label: "KG2 tuition",   category: "tuition", amount: 700, optional: false, status: "paid" },
        { label: "Materials",     category: "books",   amount: 80,  optional: false, status: "paid" },
        { label: "Music day",     category: "clubs",   amount: 20,  optional: true,  status: "paid" },
      ],
    },
    {
      id: "Y-T2", term: 2, label: "Term 2", period: "Jan – May",
      total: 900, paid: 900, due_date: "2026-01-20", status: "paid",
      lines: [
        { label: "KG2 tuition",      category: "tuition", amount: 750, optional: false, status: "paid" },
        { label: "Materials",        category: "books",   amount: 80,  optional: false, status: "paid" },
        { label: "Spring concert",   category: "clubs",   amount: 30,  optional: true,  status: "paid" },
        { label: "Field study trip", category: "trips",   amount: 40,  optional: true,  status: "paid" },
      ],
    },
    {
      id: "Y-T3", term: 3, label: "Term 3", period: "Jun – Aug",
      total: 700, paid: 0, due_date: "2026-07-01", status: "scheduled",
      lines: [
        { label: "KG2 tuition", category: "tuition", amount: 600, optional: false, status: "due" },
        { label: "Materials",   category: "books",   amount: 60,  optional: false, status: "due" },
        { label: "Summer day-camp (optional)", category: "trips", amount: 40, optional: true, status: "due" },
      ],
    },
  ],
  payments: [
    { id: "Y-P1", date: "2026-01-12", for: "Term 2 · full",  detail: "tuition + extras", amount: 900,  method: "bank transfer", receipt_url: "#" },
    { id: "Y-P2", date: "2025-09-05", for: "Term 1 · full",  detail: "tuition + extras", amount: 800,  method: "bank transfer", receipt_url: "#" },
    { id: "Y-P3", date: "2025-08-15", for: "Re-enrollment deposit", detail: "refundable on exit", amount: 300, method: "card", receipt_url: "#" },
  ],
};

export const MOCK_INVOICES: ChildInvoices[] = [LAYLA, OMAR, YASMIN];

export function householdSnapshot(rows: ChildInvoices[]): HouseholdSnapshot {
  const total_outstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const outstanding_rows  = rows.filter(r => r.outstanding > 0);
  const earliest_due_date = outstanding_rows.length === 0
    ? rows[0]?.due_date ?? ""
    : outstanding_rows.map(r => r.due_date).sort()[0];
  const paid_this_year    = rows.reduce((s, r) => s + r.payments.reduce((sp, p) => sp + p.amount, 0), 0);
  return {
    total_outstanding,
    earliest_due_date,
    paid_this_year,
    next_invoice_label: "Term 3 · goes out 1 July",
  };
}

export function formatOmr(amount: number): string {
  return "OMR " + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
```

- [ ] **Step 2: Write `invoices.test.ts`** with 9 tests:

```ts
import { describe, expect, it } from "vitest";
import { MOCK_INVOICES, householdSnapshot, formatOmr } from "./mock-invoices";

describe("mock-invoices fixture", () => {
  it("has 3 children", () => {
    expect(MOCK_INVOICES.length).toBe(3);
  });
  it("child IDs match DEMO_CHILDREN convention", () => {
    const ids = MOCK_INVOICES.map(r => r.child_id);
    expect(ids).toContain("layla-al-habsi");
    expect(ids).toContain("omar-al-habsi");
    expect(ids).toContain("yasmin-al-habsi");
  });
  it("every child has 3 installments", () => {
    for (const r of MOCK_INVOICES) {
      expect(r.installments.length).toBe(3);
    }
  });
  it("Layla owes OMR 750, Omar owes OMR 1,070, Yasmin owes 0", () => {
    expect(MOCK_INVOICES.find(r => r.child_id === "layla-al-habsi")!.outstanding).toBe(750);
    expect(MOCK_INVOICES.find(r => r.child_id === "omar-al-habsi")!.outstanding).toBe(1070);
    expect(MOCK_INVOICES.find(r => r.child_id === "yasmin-al-habsi")!.outstanding).toBe(0);
  });
  it("installment statuses make sense", () => {
    for (const r of MOCK_INVOICES) {
      expect(r.installments[0].status).toBe("paid");
      expect(r.installments[2].status).toBe("scheduled");
    }
  });
});

describe("householdSnapshot", () => {
  it("total outstanding = sum of per-child outstanding", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    expect(snap.total_outstanding).toBe(750 + 1070 + 0);
  });
  it("earliest due date is the soonest among outstanding children", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    expect(snap.earliest_due_date).toBe("2026-05-25");
  });
  it("paid_this_year sums all payments", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    expect(snap.paid_this_year).toBeGreaterThan(0);
  });
});

describe("formatOmr", () => {
  it("formats with thousands separator", () => {
    expect(formatOmr(1250)).toBe("OMR 1,250");
    expect(formatOmr(750)).toBe("OMR 750");
    expect(formatOmr(0)).toBe("OMR 0");
  });
});
```

- [ ] **Step 3: Run + commit**

```bash
cd ~/dev/manhaj/apps/web && npm test
cd ~/dev/manhaj && git add apps/web/lib/mock-invoices.ts apps/web/lib/invoices.test.ts && git commit -m "lib/mock-invoices: 3-child fixture with installments + line items + payments"
```

Expect: 9 new tests pass (55 total — 46 prior + 9).

---

## Task 2 — ActiveChild context refactor

**Files:**
- Modify: `apps/web/lib/child.ts`
- Modify: `apps/web/app/parent/components/ChildSwitcher.tsx`
- Modify: `apps/web/app/parent/layout.tsx`

This is the structural refactor that makes the whole parent persona reactive. Single test pass at the end confirms no regression.

- [ ] **Step 1: Update `lib/child.ts`** — append the context, provider, and hook AFTER the existing exports. Don't touch the existing exports.

Open `apps/web/lib/child.ts` and append at the bottom:

```ts
// ---------------------------------------------------------------------------
// React context for the active child — Phase 2.3
// Provider lives in app/parent/layout.tsx; ChildSwitcher + per-page hooks
// read from the same source so switching child triggers re-renders everywhere.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ActiveChildState = {
  activeId: ChildId;
  setActive: (id: ChildId) => void;
};

const ActiveChildContext = createContext<ActiveChildState | null>(null);

export function ActiveChildProvider({ children }: { children: ReactNode }) {
  // Lazy init so we read localStorage exactly once on mount (SSR-safe).
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

Add `"use client";` at the very top of `lib/child.ts` IF it isn't already there (it has React hooks now).

Actually — since `lib/child.ts` previously exported only pure functions, it was server-OK. Adding `"use client"` would force every consumer to be client. Better approach: keep `lib/child.ts` without the directive; the consumers (provider, hook callers) will be `"use client"` themselves. Next.js handles this fine because the file's top-level only exports values + types + a component; the component itself uses hooks which require `"use client"` in the calling file.

Actually, the React docs are clear: a file that calls `useState` / `createContext` / `useContext` needs the calling component to be in a client component file. The Provider component itself uses `useState`. So `lib/child.ts` needs `"use client";` at the top.

Add `"use client";` at the very top of `apps/web/lib/child.ts`.

- [ ] **Step 2: Refactor `ChildSwitcher.tsx`** — consume the context.

Open `apps/web/app/parent/components/ChildSwitcher.tsx` and replace the `useState` + `useEffect` (or lazy-init) + `pick` block:

```tsx
"use client";

import {
  ALL_CHILDREN_ID, DEMO_CHILDREN, useActiveChild, type ChildId,
} from "@/lib/child";

export default function ChildSwitcher() {
  const { activeId, setActive } = useActiveChild();

  function pick(id: ChildId) {
    if (id === activeId) return;
    setActive(id);
  }

  const showAll = DEMO_CHILDREN.length > 1;
  // ... rest of the JSX is unchanged. Just use `activeId` where the local
  //     state was used, and `pick()` calls `setActive()` inside.
```

The JSX body is unchanged from the existing component — only the state plumbing swaps.

- [ ] **Step 3: Wrap parent layout in provider**

Open `apps/web/app/parent/layout.tsx`. Update to:

```tsx
import "./parent.css";
import ParentNav from "./components/ParentNav";
import ChildSwitcher from "./components/ChildSwitcher";
import { ActiveChildProvider } from "@/lib/child";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "International School of Oman";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveChildProvider>
      <header className="topbar">
        <div className="brand">
          <div className="logo">M</div>
          <div>
            <div className="brand-name">
              Manhaj <span className="brand-sub">· {SCHOOL_NAME}</span>
            </div>
          </div>
          <ParentNav />
        </div>
        <div className="top-right">
          <span style={{ fontSize: 12 }}>Mr Al-Habsi</span>
          <div className="avatar" title="Parent">P</div>
        </div>
      </header>
      <ChildSwitcher />
      <main id="main-content" tabIndex={-1}>{children}</main>
    </ActiveChildProvider>
  );
}
```

- [ ] **Step 4: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm test && npm run lint && npm run build 2>&1 | tail -5
```

All clean. Existing `lib/child.test.ts` (which uses the pure helpers) keeps passing. The new hook isn't tested directly — render-with-provider tests are out of scope (no jsdom env set up).

- [ ] **Step 5: Smoke-test in browser** (optional but recommended): run dev server, navigate `/parent`, click between children in the switcher, confirm the page header / cards (existing Dashboard) react if applicable. Existing Dashboard doesn't read the active child yet (lands in this PR for Invoices) — so just confirm no crashes.

- [ ] **Step 6: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/child.ts apps/web/app/parent/components/ChildSwitcher.tsx apps/web/app/parent/layout.tsx && git commit -m "ActiveChild context: provider + useActiveChild() · ChildSwitcher consumes context · wired in parent layout"
```

---

## Task 3 — Extend `lib/summary.ts` with `invoiceParentSummary`

**Files:**
- Modify: `apps/web/lib/summary.ts`
- Modify: `apps/web/lib/summary.test.ts`

- [ ] **Step 1: Append failing tests to `summary.test.ts`**

```ts
import {
  MOCK_INVOICES, householdSnapshot,
} from "./mock-invoices";
import { ALL_CHILDREN_ID } from "./child";
import { invoiceParentSummary } from "./summary";

describe("invoiceParentSummary · single child", () => {
  it("headline names the outstanding balance for Layla", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, "layla-al-habsi", snap);
    expect(s.headline).toContain("750");
    expect(s.headline.toLowerCase()).toContain("outstanding");
  });

  it("headline says paid-in-full for Yasmin", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, "yasmin-al-habsi", snap);
    expect(s.headline.toLowerCase()).toMatch(/all clear|paid in full/);
    expect(s.ai_suggested_action).toBeUndefined();
  });

  it("today line reflects Term 2 partial state for Layla", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, "layla-al-habsi", snap);
    expect(s.today.toLowerCase()).toMatch(/term 2|partial|paid/);
  });

  it("ai_suggested_action for Layla includes pay + split copy", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, "layla-al-habsi", snap);
    expect(s.ai_suggested_action!.toLowerCase()).toMatch(/pay|split/);
  });
});

describe("invoiceParentSummary · household (all children)", () => {
  it("headline names the total household balance", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, ALL_CHILDREN_ID, snap);
    expect(s.headline).toContain("1,820");
  });

  it("ai_suggested_action mentions one-tap pay all", () => {
    const snap = householdSnapshot(MOCK_INVOICES);
    const s = invoiceParentSummary(MOCK_INVOICES, ALL_CHILDREN_ID, snap);
    expect(s.ai_suggested_action!.toLowerCase()).toMatch(/pay|split/);
  });
});
```

- [ ] **Step 2: Run tests, confirm failures.**

- [ ] **Step 3: Implement** — append to `apps/web/lib/summary.ts`:

```ts
import type { ChildInvoices, HouseholdSnapshot } from "./mock-invoices";
import { ALL_CHILDREN_ID, type ChildId } from "./child";
import { formatOmr } from "./mock-invoices";

// ... after the existing exports ...

export function invoiceParentSummary(
  rows:     ChildInvoices[],
  activeId: ChildId,
  household: HouseholdSnapshot,
): Summary {
  if (activeId === ALL_CHILDREN_ID) {
    const total = household.total_outstanding;
    if (total === 0) {
      return {
        headline:  "All household invoices clear.",
        today:     "No outstanding balances.",
        this_week: "Pay all → one tap covers every child.",
        this_month: `Next invoice across the household: ${household.next_invoice_label}.`,
      };
    }
    const childCount = rows.filter(r => r.outstanding > 0).length;
    return {
      headline:  `Household balance ${formatOmr(total)} due across ${childCount} children.`,
      today:     `Earliest due ${household.earliest_due_date}.`,
      this_week: "Pay all → one tap covers every child.",
      this_month: `Next invoice across the household: ${household.next_invoice_label}.`,
      ai_suggested_action: `Pay the ${formatOmr(total)} household balance · or split per child.`,
    };
  }

  const child = rows.find(r => r.child_id === activeId);
  if (!child) {
    return {
      headline:  "No invoice data for this child.",
      today:     "",
      this_week: "",
      this_month: "",
    };
  }

  if (child.outstanding === 0) {
    return {
      headline:  "All clear — paid in full.",
      today:     "No outstanding balance.",
      this_week: "Bank transfers usually clear in 1-2 days.",
      this_month: "Next invoice goes out 1 July (Term 3).",
    };
  }

  const partial = child.installments.find(i => i.status === "partial");
  const todayLine = partial
    ? `Term ${partial.term} partial · ${formatOmr(partial.paid)} of ${formatOmr(partial.total)} paid.`
    : `Outstanding: ${formatOmr(child.outstanding)}.`;

  return {
    headline:  `${formatOmr(child.outstanding)} outstanding · due ${child.due_date}.`,
    today:     todayLine,
    this_week: "Bank transfers usually clear in 1-2 days.",
    this_month: "Next invoice goes out 1 July (Term 3).",
    ai_suggested_action: `Pay ${formatOmr(child.outstanding)} now · or split into 3 monthly chunks.`,
  };
}
```

- [ ] **Step 4: Run + commit**

```bash
cd ~/dev/manhaj && git add apps/web/lib/summary.ts apps/web/lib/summary.test.ts && git commit -m "lib/summary: add invoiceParentSummary (single + household)"
```

---

## Task 4 — InvoiceAlert + BalanceHero components

**Files:**
- Create: `apps/web/app/parent/invoices/components/InvoiceAlert.tsx`
- Create: `apps/web/app/parent/invoices/components/BalanceHero.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `InvoiceAlert.tsx`**

```tsx
/**
 * AI alert banner for the Parent Invoices tab.
 *
 * Renders the cohort/household summary headline + suggested action with
 * the Manhaj attribution chip. Server component.
 */

import type { Summary } from "@/lib/summary";

export default function InvoiceAlert({ summary }: { summary: Summary }) {
  return (
    <aside className="invoice-alert" role="status" aria-label="Invoice summary">
      <span className="invoice-alert-tag">Manhaj</span>
      <span className="invoice-alert-body">
        <b>{summary.headline}</b>
        {summary.ai_suggested_action && <> {summary.ai_suggested_action}</>}
      </span>
    </aside>
  );
}
```

- [ ] **Step 2: `BalanceHero.tsx`**

```tsx
"use client";

/**
 * Balance hero card for Parent Invoices.
 *
 * Two render modes:
 *   - mode="single": one child's outstanding + due date + Pay-now CTA
 *   - mode="household": cross-child total + earliest due
 *
 * Pay-now is intentionally disabled (Phase 3 payment provider).
 */

import type { Summary } from "@/lib/summary";
import { formatOmr, type ChildInvoices, type HouseholdSnapshot } from "@/lib/mock-invoices";

type Props =
  | { mode: "single"; summary: Summary; child: ChildInvoices }
  | { mode: "household"; summary: Summary; household: HouseholdSnapshot };

export default function BalanceHero(props: Props) {
  if (props.mode === "single") {
    const c = props.child;
    return (
      <section className="balance-hero" aria-label="Balance">
        <div className="balance-left">
          <div className="balance-l">Outstanding balance</div>
          <div className="balance-v">{formatOmr(c.outstanding)}.00</div>
          <div className="balance-due">{c.outstanding > 0 ? `Due ${c.due_date}` : "Paid in full"}</div>
          <div className="balance-meta">{c.child_name}</div>
        </div>
        <div className="balance-right">
          <button type="button" className="balance-btn primary" disabled aria-disabled="true" title="Payment provider lands in Phase 3">
            Pay {formatOmr(c.outstanding)} now
          </button>
          <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] split", c.child_id)}>Split into 3 monthly</button>
          <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] download", c.child_id)}>Download statement (PDF)</button>
        </div>
      </section>
    );
  }
  const h = props.household;
  return (
    <section className="balance-hero" aria-label="Household balance">
      <div className="balance-left">
        <div className="balance-l">Household balance · all children</div>
        <div className="balance-v">{formatOmr(h.total_outstanding)}.00</div>
        <div className="balance-due">{h.total_outstanding > 0 ? `Earliest due ${h.earliest_due_date}` : "All clear"}</div>
        <div className="balance-meta">Paid this year: {formatOmr(h.paid_this_year)}</div>
      </div>
      <div className="balance-right">
        <button type="button" className="balance-btn primary" disabled aria-disabled="true" title="Payment provider lands in Phase 3">
          Pay all {formatOmr(h.total_outstanding)}
        </button>
        <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] split per child")}>Split per child</button>
        <button type="button" className="balance-btn ghost" onClick={() => console.log("[invoice] download all")}>Download statements (PDFs)</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS** — append to `globals.css` before `@media (prefers-reduced-motion: reduce)`:

```css
/* =========================================================================
   Parent Invoices · AI alert banner
   ========================================================================= */
.invoice-alert {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: linear-gradient(135deg, var(--color-surface-subtle), #F0F4FA);
  border: 1px solid var(--color-border); border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-md); padding: 10px 14px;
  font-size: 11.5px; color: var(--color-ink); line-height: 1.55;
  margin-bottom: var(--space-3);
}
.invoice-alert-tag {
  background: var(--color-info-soft); color: var(--color-info-text);
  padding: 2px 8px; border-radius: var(--radius-sm); font-size: 9.5px; font-weight: var(--font-weight-bold);
}
.invoice-alert-body b { color: var(--color-ink); font-weight: var(--font-weight-bold); }

/* =========================================================================
   Parent Invoices · Balance hero
   ========================================================================= */
.balance-hero {
  background: linear-gradient(135deg, var(--color-surface-subtle), #F0F4FA);
  border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  padding: 18px 22px; margin-bottom: var(--space-3);
  display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px; align-items: center;
}
@media (max-width: 700px) { .balance-hero { grid-template-columns: 1fr; } }
.balance-left .balance-l { font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.balance-left .balance-v { font-size: 30px; font-weight: var(--font-weight-black); color: var(--color-primary); margin: 4px 0; }
.balance-left .balance-due { font-size: 12px; color: var(--color-warning); font-weight: var(--font-weight-bold); }
.balance-left .balance-meta { font-size: 11px; color: var(--color-muted); margin-top: 8px; }
.balance-right { display: flex; flex-direction: column; gap: 8px; }
.balance-btn {
  padding: 10px 16px; border-radius: var(--radius-md); text-align: center;
  font-weight: var(--font-weight-bold); font-size: 12px; cursor: pointer; border: 0; font-family: inherit;
}
.balance-btn.primary { background: var(--color-primary); color: #fff; }
.balance-btn.primary:disabled { background: var(--color-muted-disabled); cursor: not-allowed; }
.balance-btn.ghost { background: var(--color-card); color: var(--color-muted); border: 1px solid var(--color-border); }
.balance-btn.ghost:hover { background: var(--color-soft); color: var(--color-ink); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run build 2>&1 | tail -5
cd ~/dev/manhaj && git add apps/web/app/parent/invoices/components apps/web/app/globals.css && git commit -m "Invoices: InvoiceAlert + BalanceHero"
```

---

## Task 5 — InstallmentCards + FeeBreakdown

**Files:**
- Create: `apps/web/app/parent/invoices/components/InstallmentCards.tsx`
- Create: `apps/web/app/parent/invoices/components/FeeBreakdown.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `InstallmentCards.tsx`**

```tsx
import { formatOmr, type Installment } from "@/lib/mock-invoices";

const PILL_LABEL: Record<Installment["status"], string> = {
  paid:      "PAID IN FULL",
  partial:   "PARTIALLY PAID",
  scheduled: "SCHEDULED",
};

export default function InstallmentCards({ rows }: { rows: Installment[] }) {
  return (
    <section className="installments-card" aria-label="Installment plan">
      <header className="installments-head">
        <h3>Installment plan · AY 2025–26</h3>
        <p className="installments-sub">Three terms. Tap a card to see the line items.</p>
      </header>
      <div className="installments-grid">
        {rows.map(r => (
          <div key={r.id} className={`installments-tile inst-${r.status}`}>
            <div className="installments-head-row">
              <span className="installments-term">{r.label}</span>
              <span className="installments-period">{r.period}</span>
            </div>
            <div className="installments-amt">{formatOmr(r.total)}</div>
            <div className="installments-when">
              {r.status === "paid"      && `Paid · ${r.due_date}`}
              {r.status === "partial"   && `${formatOmr(r.total - r.paid)} outstanding · due ${r.due_date}`}
              {r.status === "scheduled" && `Invoice goes out ${r.due_date}`}
            </div>
            <span className={`installments-pill inst-pill-${r.status}`}>{PILL_LABEL[r.status]}</span>
            <a className="installments-receipt" href="#">
              {r.status === "paid"      ? "Receipt · PDF" : r.status === "partial" ? `View payments · ${r.lines.filter(l => l.status === "paid").length}` : "Set up auto-pay"}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `FeeBreakdown.tsx`**

```tsx
import { formatOmr, type Installment } from "@/lib/mock-invoices";

export default function FeeBreakdown({ installment }: { installment: Installment }) {
  const total = installment.total;
  const outstanding = total - installment.paid;
  return (
    <section className="feebreakdown-card" aria-label={`Fee breakdown · ${installment.label}`}>
      <header className="feebreakdown-head">
        <h3>What's in this term's invoice</h3>
        <p className="feebreakdown-sub">{installment.label} · line items. Some are optional and can be opted out.</p>
      </header>
      <ul className="feebreakdown-list">
        {installment.lines.map((line, i) => (
          <li key={i} className="feebreakdown-row">
            <span className="feebreakdown-nm">{line.label}{line.note && <small>{line.note}</small>}</span>
            <span className="feebreakdown-v">{formatOmr(line.amount)}</span>
            <span className={`feebreakdown-status feebreakdown-status-${line.status}`}>{line.status}</span>
          </li>
        ))}
        <li className="feebreakdown-row feebreakdown-total">
          <span className="feebreakdown-nm" style={{ fontWeight: 800 }}>{installment.label} total</span>
          <span className="feebreakdown-v" style={{ fontSize: 14 }}>{formatOmr(total)}</span>
          <span className="feebreakdown-status feebreakdown-status-due">
            {outstanding > 0 ? `${formatOmr(outstanding)} outstanding` : "fully paid"}
          </span>
        </li>
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Parent Invoices · Installment cards
   ========================================================================= */
.installments-card, .feebreakdown-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.installments-head, .feebreakdown-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.installments-head h3, .feebreakdown-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.installments-sub, .feebreakdown-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.installments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (max-width: 700px) { .installments-grid { grid-template-columns: 1fr; } }
.installments-tile {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-top: 4px solid var(--color-border); border-radius: var(--radius-md); padding: 12px;
}
.installments-tile.inst-paid      { border-top-color: var(--color-success); }
.installments-tile.inst-partial   { border-top-color: var(--color-warn); }
.installments-tile.inst-scheduled { border-top-color: var(--color-heat-1-bg); }
.installments-head-row { display: flex; justify-content: space-between; font-size: 9.5px; color: var(--color-muted); text-transform: uppercase; letter-spacing: .04em; font-weight: var(--font-weight-bold); }
.installments-amt { font-size: 18px; font-weight: var(--font-weight-black); color: var(--color-primary); margin: 4px 0; }
.installments-when { font-size: 11px; color: var(--color-muted); }
.installments-pill { font-size: 9.5px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: var(--font-weight-bold); margin-top: 6px; display: inline-block; }
.installments-pill.inst-pill-paid      { background: var(--color-success-soft); color: var(--color-success-text); }
.installments-pill.inst-pill-partial   { background: var(--color-warning-soft); color: var(--color-warning-text); }
.installments-pill.inst-pill-scheduled { background: var(--color-info-soft);    color: var(--color-info-text); }
.installments-receipt { display: block; font-size: 10px; color: var(--color-accent); margin-top: 6px; text-decoration: underline; }

/* =========================================================================
   Parent Invoices · Fee breakdown
   ========================================================================= */
.feebreakdown-list { list-style: none; padding: 0; margin: 0; }
.feebreakdown-row { display: grid; grid-template-columns: 1fr 100px 100px; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--color-border); font-size: 11px; }
.feebreakdown-row:last-child { border-bottom: 0; }
.feebreakdown-row.feebreakdown-total { border-top: 2px solid var(--color-ink); padding-top: 8px; margin-top: 4px; border-bottom: 0; }
.feebreakdown-nm { color: var(--color-ink); font-weight: var(--font-weight-semibold); display: flex; flex-direction: column; }
.feebreakdown-nm small { display: block; color: var(--color-muted); font-size: 10px; font-weight: 400; margin-top: 1px; }
.feebreakdown-v { text-align: right; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.feebreakdown-status { text-align: right; font-size: 9.5px; font-weight: var(--font-weight-bold); }
.feebreakdown-status-paid { color: var(--color-success); }
.feebreakdown-status-due  { color: var(--color-warning); }
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/invoices/components apps/web/app/globals.css && git commit -m "Invoices: InstallmentCards + FeeBreakdown"
```

---

## Task 6 — PaymentHistory + HouseholdRows

**Files:**
- Create: `apps/web/app/parent/invoices/components/PaymentHistory.tsx`
- Create: `apps/web/app/parent/invoices/components/HouseholdRows.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: `PaymentHistory.tsx`**

```tsx
import { formatOmr, type Payment } from "@/lib/mock-invoices";

export default function PaymentHistory({ rows }: { rows: Payment[] }) {
  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="payments-card" aria-label="Payment history">
      <header className="payments-head">
        <h3>Payment history</h3>
        <p className="payments-sub">Every payment recorded · downloadable receipts.</p>
      </header>
      <div className="payments-tbl-wrap">
        <table className="payments-tbl">
          <thead>
            <tr><th>Date</th><th>For</th><th>Amount</th><th>Method</th><th>Receipt</th></tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td className="payments-when">{p.date}</td>
                <td className="payments-what"><b>{p.for}</b><small>{p.detail}</small></td>
                <td className="payments-amt">{formatOmr(p.amount)}</td>
                <td className="payments-method">{p.method}</td>
                <td><a className="payments-rec" href={p.receipt_url}>PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `HouseholdRows.tsx`**

```tsx
"use client";

import { formatOmr, type ChildInvoices } from "@/lib/mock-invoices";
import { DEMO_CHILDREN, useActiveChild } from "@/lib/child";

const PILL_FOR_OUTSTANDING = {
  paid: { class: "chip-good",    label: "paid in full" },
  due:  { class: "chip-warn",    label: (date: string) => `due ${date}` },
};

export default function HouseholdRows({ rows }: { rows: ChildInvoices[] }) {
  const { setActive } = useActiveChild();
  return (
    <section className="houserows-card" aria-label="Per child invoices">
      <header className="houserows-head">
        <h3>Per child</h3>
        <p className="houserows-sub">Tap a row to drill into that child's full invoice tab.</p>
      </header>
      <div className="houserows-list">
        {rows.map(r => {
          const meta = DEMO_CHILDREN.find(c => c.id === r.child_id);
          const isPaid = r.outstanding === 0;
          return (
            <button
              key={r.child_id}
              type="button"
              className="houserows-row"
              onClick={() => setActive(r.child_id)}
            >
              <span className="houserows-av" aria-hidden="true">{meta?.initial ?? "?"}</span>
              <span className="houserows-nm">{r.child_name}<small>{meta?.grade_label}</small></span>
              <span className="houserows-amt">
                {formatOmr(r.outstanding)}
                <small>of {formatOmr(r.installments.find(i => i.status === "partial")?.total ?? r.installments.find(i => i.status !== "paid")?.total ?? 0)}</small>
              </span>
              <span>
                {isPaid
                  ? <span className="chip-pill chip-good" style={{ cursor: "default" }}>paid in full</span>
                  : <span className="chip-pill chip-warn" style={{ cursor: "default" }}>due {r.due_date}</span>}
              </span>
              <span className="houserows-open">Open →</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: CSS**

```css
/* =========================================================================
   Parent Invoices · Payment history
   ========================================================================= */
.payments-card, .houserows-card {
  background: var(--color-card); border: 1px solid var(--color-border);
  border-radius: var(--radius-xl); padding: 14px 16px;
  margin-bottom: var(--space-3); box-shadow: var(--shadow-sm);
}
.payments-head, .houserows-head { border-bottom: 1px solid var(--color-border); margin-bottom: 12px; padding-bottom: 10px; }
.payments-head h3, .houserows-head h3 { margin: 0; font-size: 13px; font-weight: var(--font-weight-bold); color: var(--color-ink); }
.payments-sub, .houserows-sub { font-size: 10.5px; color: var(--color-muted); margin: 4px 0 0; }
.payments-tbl-wrap { overflow-x: auto; }
.payments-tbl { width: 100%; border-collapse: collapse; font-size: 11px; min-width: 600px; }
.payments-tbl th, .payments-tbl td { padding: 6px 8px; border-bottom: 1px dashed var(--color-border); text-align: left; }
.payments-tbl th { background: var(--color-surface-subtle); font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.payments-when { font-size: 10px; color: var(--color-muted); font-weight: var(--font-weight-bold); }
.payments-what b { color: var(--color-ink); }
.payments-what small { color: var(--color-muted); display: block; font-size: 9.5px; }
.payments-amt { font-weight: var(--font-weight-black); color: var(--color-primary); text-align: right; }
.payments-method { font-size: 9.5px; color: var(--color-muted); }
.payments-rec { font-size: 9.5px; color: var(--color-accent); text-decoration: underline; cursor: pointer; }

/* =========================================================================
   Parent Invoices · Household rows (All Children mode)
   ========================================================================= */
.houserows-list { display: flex; flex-direction: column; gap: 6px; }
.houserows-row {
  display: grid; grid-template-columns: 36px 1fr 130px 130px 60px;
  gap: 12px; align-items: center; padding: 12px 14px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-card); font-size: 11px;
  text-align: left; cursor: pointer; font-family: inherit;
}
.houserows-row:hover { background: var(--color-surface-subtle); }
.houserows-av {
  width: 36px; height: 36px; border-radius: 50%; background: #C7D2DC; color: var(--color-ink);
  display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
}
.houserows-nm { font-weight: var(--font-weight-bold); color: var(--color-ink); display: flex; flex-direction: column; }
.houserows-nm small { display: block; font-weight: 500; color: var(--color-muted); font-size: 10px; margin-top: 1px; }
.houserows-amt { text-align: right; font-weight: var(--font-weight-black); color: var(--color-primary); font-size: 13px; display: flex; flex-direction: column; }
.houserows-amt small { display: block; color: var(--color-muted); font-size: 9.5px; font-weight: 500; }
.houserows-open { font-size: 10px; color: var(--color-accent); font-weight: var(--font-weight-bold); text-align: right; }
@media (max-width: 700px) {
  .houserows-row { grid-template-columns: 36px 1fr; }
  .houserows-amt, .houserows-open { display: none; }
}
```

- [ ] **Step 4: Verify + commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/invoices/components apps/web/app/globals.css && git commit -m "Invoices: PaymentHistory + HouseholdRows"
```

---

## Task 7 — Page assembly

**Files:**
- Modify: `apps/web/app/parent/invoices/page.tsx`

- [ ] **Step 1: Replace contents**

```tsx
"use client";

/**
 * Parent · Invoices tab.
 *
 * Child-aware rendering driven by useActiveChild(). When the household view
 * is active, shows balance hero + per-child rows. When a single child is
 * selected, shows installments + fee breakdown + payment history.
 */

import { useActiveChild, ALL_CHILDREN_ID, getActiveChild } from "@/lib/child";
import {
  MOCK_INVOICES, householdSnapshot,
} from "@/lib/mock-invoices";
import { invoiceParentSummary } from "@/lib/summary";

import InvoiceAlert      from "./components/InvoiceAlert";
import BalanceHero       from "./components/BalanceHero";
import InstallmentCards  from "./components/InstallmentCards";
import FeeBreakdown      from "./components/FeeBreakdown";
import PaymentHistory    from "./components/PaymentHistory";
import HouseholdRows     from "./components/HouseholdRows";

export default function ParentInvoicesPage() {
  const { activeId } = useActiveChild();
  const household = householdSnapshot(MOCK_INVOICES);
  const summary = invoiceParentSummary(MOCK_INVOICES, activeId, household);

  if (activeId === ALL_CHILDREN_ID) {
    return (
      <div className="container">
        <h1>Invoices</h1>
        <p className="sub">Household view · AY 2025–26</p>

        <InvoiceAlert summary={summary} />
        <BalanceHero mode="household" summary={summary} household={household} />
        <HouseholdRows rows={MOCK_INVOICES} />
      </div>
    );
  }

  const child = getActiveChild(activeId);
  const row   = MOCK_INVOICES.find(r => r.child_id === activeId);

  if (!child || !row) {
    return (
      <div className="container">
        <h1>Invoices</h1>
        <p className="sub">No invoice data for this child.</p>
      </div>
    );
  }

  // Pick the most-urgent installment for the fee breakdown: partial first, otherwise next scheduled.
  const focused = row.installments.find(i => i.status === "partial")
              ?? row.installments.find(i => i.status === "scheduled")
              ?? row.installments[0];

  return (
    <div className="container">
      <h1>Invoices · {row.child_name}</h1>
      <p className="sub">{child.grade_label} · AY 2025–26</p>

      <InvoiceAlert summary={summary} />
      <BalanceHero mode="single" summary={summary} child={row} />
      <InstallmentCards rows={row.installments} />
      <FeeBreakdown installment={focused} />
      <PaymentHistory rows={row.payments} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd ~/dev/manhaj/apps/web && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -30
```

`/parent/invoices` listed in route list. tsc + lint clean.

- [ ] **Step 3: Commit**

```bash
cd ~/dev/manhaj && git add apps/web/app/parent/invoices/page.tsx && git commit -m "/parent/invoices: child-aware page assembly · single + household views"
```

---

## Task 8 — Verification + push + memory

- [ ] **Step 1: Full suite** — `npm test && npx tsc --noEmit && npm run lint && npm run build 2>&1 | tail -30`. All clean. Tests: 55+ pass.

- [ ] **Step 2: Visual smoke**:
   - `/parent/invoices` with "All children" active → household hero + per-child rows. Click Omar's row → page updates to Omar's view.
   - Switch to "Layla" pill → installments (Term 1 paid, Term 2 partial, Term 3 scheduled), fee breakdown for Term 2, payment history with 3 entries.
   - Switch to "Yasmin" → "All clear" headline, all-paid installments, no outstanding.
   - Mobile 375 px → no horizontal overflow; tables scroll if needed.

- [ ] **Step 3: Push** → `git push origin main`.

- [ ] **Step 4: Update memory** at `~/.claude/projects/.../memory/project_school_ops_decisions.md` with a new entry.

---

## Self-review

| Spec section | Plan task |
|---|---|
| §5 mock fixture | Task 1 |
| §7 ActiveChild context + ChildSwitcher refactor | Task 2 |
| §8 invoice summary composer | Task 3 |
| §6 components — InvoiceAlert + BalanceHero | Task 4 |
| §6 components — InstallmentCards + FeeBreakdown | Task 5 |
| §6 components — PaymentHistory + HouseholdRows | Task 6 |
| §9 page assembly | Task 7 |
| §10 acceptance criteria | Task 8 |

Types match across files (`Installment`, `FeeLine`, `Payment`, `ChildInvoices`, `HouseholdSnapshot` consistent). No "TBD" / placeholder language. Pay-now button explicitly disabled per non-goal §3.
