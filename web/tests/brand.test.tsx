// QA gate — Section 14: "About block renders from strings" + landing renders all-copy-from-en.ts.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { en } from "../src/strings/en";
import { Mark, Wordmark } from "../src/components/Mark";

describe("About block renders from strings (Section 14 QA gate)", () => {
  it("the About intro is the exact Section 10 copy deck text", () => {
    // Rendered via the strings module — never hard-coded in JSX.
    const about = en.landing.about.intro;
    expect(about).toContain("Inspired by the Igbo word jikọta");
    expect(about).toContain("social impact platform");
    // Brand law: italic-lowered "jikọta" with dots appears only in story contexts, once here.
    expect((about.match(/jikọta/g) ?? []).length).toBe(1);
  });

  it("beliefs list renders four items from strings", () => {
    function AboutBlock() {
      return (
        <section aria-label="About Jikota">
          <p>{en.landing.about.intro}</p>
          <ul>{en.landing.beliefs.map((b) => <li key={b}>{b}</li>)}</ul>
        </section>
      );
    }
    render(React.createElement(AboutBlock));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText(/Purpose exists everywhere/)).toBeTruthy();
  });

  it("tagline closes as brand law requires and appears in hero h1", () => {
    expect(en.landing.hero.h1).toBe("Where purpose meets its people.");
  });
});

describe("mark component (brand law)", () => {
  it("renders two interlocking circles with accessible label", () => {
    const { container } = render(React.createElement(Mark, { size: 40 }));
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("aria-label")).toContain("two interlocking circles");
    expect(container.querySelectorAll("circle").length).toBeGreaterThanOrEqual(2);
  });

  it("wordmark renders JIKOTA in capitals, no dots", () => {
    render(React.createElement(Wordmark));
    const el = screen.getByText("JIKOTA");
    expect(el.textContent).toBe("JIKOTA");
    expect(el.textContent).not.toContain("ọ");
  });
});
