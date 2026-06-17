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
