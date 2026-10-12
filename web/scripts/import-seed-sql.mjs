// Emits the LGA insert statements for supabase/seed.sql from the manifest
// (single source of truth: scripts/gen-seed.ts). Usage:
//   npx tsx scripts/gen-seed.ts && node scripts/import-seed-sql.mjs > supabase/lga_seed.sql
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../supabase/seed-manifest.json", import.meta.url), "utf8"),
);

const esc = (s) => s.replace(/'/g, "''");
const rows = manifest.lgas
  .map((l) => `('${l.state_code}','${esc(l.name)}')`)
  .join(",\n  ");

process.stdout.write(
  `-- Generated from supabase/seed-manifest.json — do not edit by hand.\n` +
    `insert into lgas (state_code, name) values\n  ${rows};\n`,
);
