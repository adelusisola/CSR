// Jikota app entry — Module 0. Hash router (no extra deps): screens for landing,
// signup, and the email-confirmation return leg. All copy renders from strings/en.ts.
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initObservability } from "./lib/observability";
import { cssVariables } from "./lib/tokens";

initObservability();

// Inject design tokens as CSS variables (single source of truth: lib/tokens.ts).
const style = document.createElement("style");
style.textContent = cssVariables + `
  * { box-sizing: border-box; }
  body { font-family: var(--jk-font-ui); color: var(--jk-ink); }
  @media (min-width: 720px) { .jk-btn-full { width: auto; } }
  @media (max-width: 719px) { .jk-btn-full { width: 100%; } }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
