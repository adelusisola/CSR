// Brand lint (Module 0 requirement): blocks banned words in ALL strings and
// enforces the signoff line on every outbound email/SMS template.
// Run: npm run lint:brand  (exit non-zero on any violation)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

// Section 4.2 — banned in all strings.
const BANNED_WORDS = [
  "revolutionary",
  "game-changing",
  "seamless",
  "world-class",
  "cutting-edge",
  "solutions provider",
];

// Any emoji is banned (Section 4.2). Broad Unicode emoji ranges.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

const SIGNOFF = "Jikota. Where purpose meets its people.";
// SMS may use the short form only where character limits force it.
const SMS_SHORT_SIGNOFF = "Jikota.";
// Mirrors `const end` in src/strings/emailTemplates.ts
const end = `\n\n${SIGNOFF}`;

interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const violations: Violation[] = [];

// --- Rule 1: banned words + emoji in every source file -----------------------
for (const file of walk(ROOT)) {
  // The linter itself necessarily contains the banned words as its blocklist.
  if (relative(ROOT, file) === "scripts/brand-lint.ts") continue;
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const w of BANNED_WORDS) {
      if (lower.includes(w)) {
        violations.push({ file: rel, line: i + 1, rule: `banned word "${w}"`, text: line.trim() });
      }
    }
    if (EMOJI_RE.test(line)) {
      violations.push({ file: rel, line: i + 1, rule: "emoji banned", text: line.trim() });
    }
  });
}

// --- Rule 2: outbound templates must end with the signoff ---------------------
// Outbound templates live in src/strings/emailTemplates.ts and are objects with
// { subject, body } (email) or { sms } fields. Emails must END with the signoff.
const tplPath = join(ROOT, "src/strings/emailTemplates.ts");
if (statSync(tplPath)) {
  const src = readFileSync(tplPath, "utf8");
  // crude but deterministic: capture body: `...` template literals per exported const
  const emailBlocks = [...src.matchAll(/export const (\w+): EmailTemplate = \{([\s\S]*?)\n\};/g)];
  for (const [, name, block] of emailBlocks) {
    const bodyMatch = block.match(/body:\s*`([\s\S]*?)`/);
    if (!bodyMatch) {
      violations.push({ file: "src/strings/emailTemplates.ts", line: 0, rule: `email ${name}: missing body`, text: "" });
      continue;
    }
    // Expand template-literal interpolations before checking:
    // ${end} renders as "\n\n" + SIGNOFF; ${SIGNOFF} renders as the signoff itself.
    const bodyEnd = bodyMatch[1]
      .replace(/\$\{end\}/g, end)
      .replace(/\$\{SIGNOFF\}/g, SIGNOFF)
      .trimEnd();
    if (!bodyEnd.endsWith(SIGNOFF)) {
      violations.push({ file: "src/strings/emailTemplates.ts", line: 0, rule: `email ${name}: does not end with signoff`, text: bodyEnd.slice(-60) });
    }
  }
  const smsBlocks = [...src.matchAll(/export const (\w+): SmsTemplate = \{([\s\S]*?)\n\};/g)];
  for (const [, name, block] of smsBlocks) {
    const bodyMatch = block.match(/sms:\s*`([\s\S]*?)`/);
    if (!bodyMatch) continue;
    const txt = bodyMatch[1].trim();
    // Spec Section 10/11: every outbound email AND SMS ends with the signoff;
    // SMS may use the short form "Jikota." only where character limits force it.
    const endsShortForm = txt.endsWith(SMS_SHORT_SIGNOFF);
    if (!endsShortForm && !txt.endsWith(SIGNOFF)) {
      violations.push({ file: "src/strings/emailTemplates.ts", line: 0, rule: `sms ${name}: missing "Jikota:" short-form prefix or full signoff`, text: txt.slice(0, 60) });
    }
  }
}

// --- Rule 3: fee wall — fee vocabulary confined to funder surfaces ------------
// Words "delivery protection", "protection share", "fee" must not appear in
// NGO-surface modules (src/pages/ngo/**) — enforced here at build-lint level.
const ngoDir = join(ROOT, "src/pages/ngo");
let ngoFiles: string[] = [];
try {
  ngoFiles = walk(ngoDir);
} catch {
  /* directory created later modules */
}
for (const file of ngoFiles) {
  const rel = relative(ROOT, file);
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      const lower = line.toLowerCase();
      if (/\bdelivery protection\b|\bprotection share\b|\bfee\b/.test(lower)) {
        violations.push({ file: rel, line: i + 1, rule: "fee wall: fee vocabulary on NGO surface", text: line.trim() });
      }
    });
}

if (violations.length > 0) {
  console.error(`Brand lint FAILED (${violations.length} violation(s)):`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.rule}${v.text ? ` | ${v.text}` : ""}`);
  }
  process.exit(1);
} else {
  console.log("Brand lint passed: no banned words, no emoji, signoffs present, fee wall intact.");
}
