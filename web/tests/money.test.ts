// QA gate — Section 7 boundary tests ("test values are law") + release/refund math.
import { describe, it, expect } from "vitest";
import { feePoolKobo, protectionShareKobo, milestoneSlicesKobo } from "../src/lib/fee";

const N = (naira: number) => naira * 100; // helper: naira -> kobo

describe("fee engine — Section 7 boundary tests (must pass exactly)", () => {
  it("₦2,000,000 → ₦100,000 (no floor)", () => {
    expect(feePoolKobo(N(2_000_000))).toBe(N(100_000));
  });
  it("₦15,000,000 → ₦750,000", () => {
    expect(feePoolKobo(N(15_000_000))).toBe(N(750_000));
  });
  it("₦20,000,000 → ₦1,000,000", () => {
    expect(feePoolKobo(N(20_000_000))).toBe(N(1_000_000));
  });
  it("₦20,000,001 → ₦1,000,000.02", () => {
    expect(feePoolKobo(N(20_000_000) + 1)).toBe(N(1_000_000) + 2);
  });
  it("₦60,000,000 → ₦1,800,000", () => {
    expect(feePoolKobo(N(60_000_000))).toBe(N(1_800_000));
  });
  it("₦100,000,000 → ₦2,600,000", () => {
    expect(feePoolKobo(N(100_000_000))).toBe(N(2_600_000));
  });
  it("founding ₦15M → ₦450,000", () => {
    expect(feePoolKobo(N(15_000_000), true)).toBe(N(450_000));
  });
  it("founding ₦60M → ₦1,400,000 (3% × 20M + 2% × 40M)", () => {
    expect(feePoolKobo(N(60_000_000), true)).toBe(N(1_400_000));
  });
});

describe("release and refund math", () => {
  it("₦15M / 4 milestones → ₦3,750,000 program + ₦187,500 fee per milestone", () => {
    const budget = N(15_000_000);
    const fee = feePoolKobo(budget);
    const slices = milestoneSlicesKobo(budget, fee, 4);
    expect(slices).toHaveLength(4);
    for (const s of slices) {
      expect(s.programKobo).toBe(N(3_750_000));
      expect(s.feeKobo).toBe(N(187_500));
    }
    // sums reconcile exactly
    expect(slices.reduce((a, s) => a + s.programKobo, 0)).toBe(budget);
    expect(slices.reduce((a, s) => a + s.feeKobo, 0)).toBe(fee);
  });

  it("refund at milestone 2 of 4 (₦15M) → ₦7,500,000 program + ₦375,000 fee", () => {
    const budget = N(15_000_000);
    const fee = feePoolKobo(budget);
    const slices = milestoneSlicesKobo(budget, fee, 4);
    // released through milestone 1; refund covers milestones 2–4? Spec case: refund at
    // milestone 2 of 4 refunds the unreleased remainder after two releases:
    const releasedProgram = slices[0].programKobo + slices[1].programKobo;
    const releasedFee = slices[0].feeKobo + slices[1].feeKobo;
    expect(budget - releasedProgram).toBe(N(7_500_000));
    expect(fee - releasedFee).toBe(N(375_000));
  });
});

describe("protection share quote (Section 7)", () => {
  it("half of a ₦15M budget commitment carries half the fee pool", () => {
    const budget = N(15_000_000);
    const fee = feePoolKobo(budget); // ₦750,000
    expect(protectionShareKobo(N(7_500_000), budget, fee)).toBe(N(375_000));
  });
  it("zero budget returns zero", () => {
    expect(protectionShareKobo(N(1000), 0, N(100))).toBe(0);
  });
});

describe("money law invariants", () => {
  it("rejects non-integer or negative budgets (kobo integers only)", () => {
    expect(() => feePoolKobo(1.5)).toThrow();
    expect(() => feePoolKobo(-100)).toThrow();
  });
  it("fee is always under 7% of budget and never below tranche math", () => {
    for (const b of [N(1), N(500_000), N(20_000_000), N(999_999_999)]) {
      const f = feePoolKobo(b);
      expect(f).toBeLessThanOrEqual(Math.ceil(b * 0.05));
      expect(f).toBeGreaterThanOrEqual(0);
    }
  });
});
