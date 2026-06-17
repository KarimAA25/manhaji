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
