// Money formatting — UX law #8: "Money formats as ₦2,500,000 while typing."
// Money is integer kobo everywhere (Section 6). Never floats.

/** Format integer kobo as whole-naira display: 250_000_000 -> "₦2,500,000". */
export function formatKoboAsNaira(kobo: number): string {
  const naira = Math.round(kobo / 100);
  return "\u20A6" + naira.toLocaleString("en-NG");
}

/** Format integer kobo with kobo precision when nonzero: 100_000_002 -> "₦1,000,000.02". */
export function formatKoboPrecise(kobo: number): string {
  const naira = Math.floor(kobo / 100);
  const remainder = kobo % 100;
  const whole = "\u20A6" + naira.toLocaleString("en-NG");
  return remainder === 0 ? whole : `${whole}.${String(remainder).padStart(2, "0")}`;
}

/**
 * Parse typed digits into integer kobo, keeping the display formatted while typing.
 * Input: raw user text (digits, commas, optional decimal). Output: kobo integer or null if invalid.
 */
export function parseAmountToKobo(input: string): number | null {
  const cleaned = input.replace(/[,\s\u20A6]/g, "");
  if (cleaned === "") return 0;
  if (!/^\d{1,12}(\.\d{0,2})?$/.test(cleaned)) return null;
  if (cleaned.includes(".")) {
    const [w, f = ""] = cleaned.split(".");
    return Number(w) * 100 + Number(f.padEnd(2, "0"));
  }
  return Number(cleaned) * 100;
}

/** Re-format a digit string as grouped naira for display while typing (no decimals shown). */
export function formatDigitsWhileTyping(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits === "") return "";
  return "\u20A6" + BigInt(digits).toLocaleString("en-NG");
}
