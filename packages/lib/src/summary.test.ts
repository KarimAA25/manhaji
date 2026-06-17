import { describe, expect, it } from "vitest";
import type { DashboardData } from "./data";
import { composeSummary } from "./summary";

const EMPTY: DashboardData = {
  school_id: null, teachers: [], sections: [], subjects: [], load: [],
  stats: {
    n_teachers: 0, n_sections: 0, n_subjects: 0, n_load: 0,
    total_cap: 0, total_assigned: 0,
    over_capacity: 0, at_capacity: 0, under_utilised: 0, healthy: 0,
    unmapped_sections: 0, vacant_roles: 0,
  },
};

function withStats(overrides: Partial<DashboardData["stats"]>): DashboardData {
  return { ...EMPTY, stats: { ...EMPTY.stats, ...overrides } };
}

describe("composeSummary · admin", () => {
  it("leads with unmapped sections when present", () => {
    const s = composeSummary("admin", withStats({ unmapped_sections: 12, n_sections: 41 }));
    expect(s.headline).toContain("12");
    expect(s.headline.toLowerCase()).toContain("section");
  });

  it("leads with over-capacity when sections are mapped", () => {
    const s = composeSummary("admin", withStats({ over_capacity: 3, unmapped_sections: 0 }));
    expect(s.headline.toLowerCase()).toContain("over capacity");
  });

  it("gives a balanced headline when there are no flags", () => {
    const s = composeSummary("admin", withStats({}));
    expect(s.headline.toLowerCase()).toContain("balanced");
  });

  it("always returns today / this_week / this_month fields", () => {
    const s = composeSummary("admin", withStats({ unmapped_sections: 5 }));
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });
});

describe("composeSummary · student", () => {
  it("returns a student-framed headline", () => {
    const s = composeSummary("student", EMPTY);
    expect(s.headline.toLowerCase()).toMatch(/here.s how|good morning|welcome/);
  });
});

describe("composeSummary · parent", () => {
  it("returns a parent-framed headline", () => {
    const s = composeSummary("parent", EMPTY);
    expect(s.headline.toLowerCase()).toMatch(/celebrate|support|here.s/);
  });
});

import {
  MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS,
} from "./mock-students";
import { studentsCohortSummary } from "./summary";

describe("studentsCohortSummary", () => {
  it("returns a Summary with all 4 required fields", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    expect(s.headline).toBeTruthy();
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });

  it("headline mentions support count when students need support", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, [], []);
    expect(s.headline.toLowerCase()).toMatch(/support|flagged/);
  });

  it("ai_suggested_action surfaces a named high-risk student", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    // At least one student in the fixture has risk_score >= 65 (Omar Saadi 78, Hala Mohsen 71, Khalid Rashid 65).
    expect(s.ai_suggested_action).toBeTruthy();
    expect(s.ai_suggested_action!.toLowerCase()).toMatch(/omar|hala|khalid/);
  });

  it("today field counts incidents in the last 7 days", () => {
    const s = studentsCohortSummary(MOCK_STUDENTS, MOCK_INCIDENTS, MOCK_ADMISSIONS);
    expect(s.today).toMatch(/incident|risk/i);
  });

  it("no CTA when there are no high-risk students", () => {
    const safe = MOCK_STUDENTS.map(s => ({ ...s, risk_score: 10 }));
    const s = studentsCohortSummary(safe, [], []);
    expect(s.ai_suggested_action).toBeUndefined();
  });
});

import {
  ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS,
} from "./mock-attendance";
import { attendanceCohortSummary } from "./summary";

describe("attendanceCohortSummary", () => {
  it("returns a Summary with all 4 required fields", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline).toBeTruthy();
    expect(s.today).toBeTruthy();
    expect(s.this_week).toBeTruthy();
    expect(s.this_month).toBeTruthy();
  });

  it("headline names the worst section when one falls below 90", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline).toContain("10B");
    expect(s.headline.toLowerCase()).toContain("87");
  });

  it("ai_suggested_action mentions the worst section", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.ai_suggested_action).toBeTruthy();
    expect(s.ai_suggested_action!.toLowerCase()).toContain("10b");
  });

  it("falls back to steady headline when all sections are above 90", () => {
    const sections = ATT_SECTIONS.map(x => ({ ...x, week_pct: 95 }));
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, sections, ATT_CHRONIC, ATT_KPIS);
    expect(s.headline.toLowerCase()).toMatch(/steady|on track/);
    expect(s.ai_suggested_action).toBeUndefined();
  });

  it("today line counts late arrivals + sub coverage", () => {
    const s = attendanceCohortSummary(ATT_DAILY, ATT_CAUSES, ATT_SECTIONS, ATT_CHRONIC, ATT_KPIS);
    expect(s.today).toContain("14");
    expect(s.today).toContain("2");
  });
});

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
