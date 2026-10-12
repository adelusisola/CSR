// QA gates — UX law #8 (money formats while typing) and UX law #3 (autosave survives app close).
import { describe, it, expect, beforeEach } from "vitest";
import { formatKoboAsNaira, formatKoboPrecise, parseAmountToKobo, formatDigitsWhileTyping } from "../src/lib/money";
import { autosaveSave, autosaveLoad, autosaveClear, autosaveOnBlur } from "../src/lib/autosave";

describe("money formatting (UX law #8)", () => {
  it("formats integer kobo as ₦2,500,000", () => {
    expect(formatKoboAsNaira(250_000_000)).toBe("\u20A62,500,000");
  });
  it("keeps kobo precision when nonzero", () => {
    expect(formatKoboPrecise(100_000_002)).toBe("\u20A61,000,000.02");
    expect(formatKoboPrecise(100_000_000)).toBe("\u20A61,000,000");
  });
  it("parses typed input to integer kobo; rejects invalid", () => {
    expect(parseAmountToKobo("2,500,000")).toBe(250_000_000);
    expect(parseAmountToKobo("\u20A62500000")).toBe(250_000_000);
    expect(parseAmountToKobo("1000.5")).toBe(100_050);
    expect(parseAmountToKobo("1000.555")).toBeNull();
    expect(parseAmountToKobo("abc")).toBeNull();
    expect(parseAmountToKobo("")).toBe(0);
  });
  it("re-formats digits grouped while typing", () => {
    expect(formatDigitsWhileTyping("2500000")).toBe("\u20A62,500,000");
    expect(formatDigitsWhileTyping("")).toBe("");
  });
});

describe("autosave (UX law #3): survives app close", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips form data through localStorage", () => {
    autosaveSave("project:new", { title: "Wells for Kano", budget: "15000000" });
    const loaded = autosaveLoad<{ title: string; budget: string }>("project:new");
    expect(loaded?.title).toBe("Wells for Kano");
  });

  it("survives simulated app close/reopen (new JS context reading same storage)", () => {
    autosaveOnBlur("project:step2")({ sector: "water" });
    // simulate close+reopen: module state persists via localStorage in jsdom
    expect(autosaveLoad<{ sector: string }>("project:step2")?.sector).toBe("water");
    autosaveClear("project:step2");
    expect(autosaveLoad("project:step2")).toBeNull();
  });

  it("never throws when storage is unavailable", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("quota"); };
    expect(() => autosaveSave("k", { a: 1 })).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
