// Fee engine — Section 7 (Money law, never change). Pure function; integer kobo.
// fee_pool(budget_kobo, founding):
//   tranche1 = min(budget, 20_000_000_00)   // ₦20M in kobo
//   tranche2 = max(0, budget − 20_000_000_00)
//   rate1 = founding ? 0.03 : 0.05
//   return tranche1 × rate1 + tranche2 × 0.02  (integer kobo; round half-up per tranche)
// No minimum fee (Section 4.1: "no floor").

export const TRANCHE1_KOBO = 2_000_000_00; // ₦20,000,000.00 in kobo

/** Round half-up to integer kobo (per tranche, per Section 7). */
function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5);
}

/**
 * Compute the fee pool in integer kobo for a given budget in kobo.
 * @param budgetKobo project budget, integer kobo (>= 0)
 * @param founding true for the first 10 funded projects (3% founding rate on tranche 1)
 */
export function feePoolKobo(budgetKobo: number, founding: boolean = false): number {
  if (!Number.isInteger(budgetKobo) || budgetKobo < 0) {
    throw new Error("feePoolKobo: budget must be a non-negative integer (kobo)");
  }
  const tranche1 = Math.min(budgetKobo, TRANCHE1_KOBO);
  const tranche2 = Math.max(0, budgetKobo - TRANCHE1_KOBO);
  const rate1 = founding ? 0.03 : 0.05;
  return roundHalfUp(tranche1 * rate1) + roundHalfUp(tranche2 * 0.02);
}

/**
 * Quote protection share for a partial commitment (Section 7):
 * protection_share = fee_pool × (amount ÷ budget).
 * Label as "estimate" until gap = 0 (caller supplies that flag for display).
 */
export function protectionShareKobo(
  amountKobo: number,
  budgetKobo: number,
  feePoolStoredOrEstimatedKobo: number,
): number {
  if (budgetKobo <= 0) return 0;
  return roundHalfUp(feePoolStoredOrEstimatedKobo * (amountKobo / budgetKobo));
}

/**
 * Release math (Section 7): equal milestone slices.
 * Per milestone: program = budget ÷ n, fee = fee_pool ÷ n (round half-up; caller
 * reconciles remainder on the final milestone so sums are exact).
 */
export function milestoneSlicesKobo(
  budgetKobo: number,
  feePoolKobo_: number,
  milestoneCount: number,
): { programKobo: number; feeKobo: number }[] {
  if (milestoneCount <= 0 || !Number.isInteger(milestoneCount)) {
    throw new Error("milestoneSlicesKobo: milestoneCount must be a positive integer");
  }
  const slices: { programKobo: number; feeKobo: number }[] = [];
  let programLeft = budgetKobo;
  let feeLeft = feePoolKobo_;
  for (let i = 0; i < milestoneCount; i++) {
    const remaining = milestoneCount - i;
    if (remaining === 1) {
      slices.push({ programKobo: programLeft, feeKobo: feeLeft });
    } else {
      const p = roundHalfUp(budgetKobo / milestoneCount);
      const f = roundHalfUp(feePoolKobo_ / milestoneCount);
      const program = Math.min(p, programLeft);
      const fee = Math.min(f, feeLeft);
      slices.push({ programKobo: program, feeKobo: fee });
      programLeft -= program;
      feeLeft -= fee;
    }
  }
  return slices;
}
