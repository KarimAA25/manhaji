import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Monorepo root (two levels up from apps/admin). Needed so Next's output-file
// tracing is allowed to reach shared data files that live at the repo root,
// above this app's directory.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const config: NextConfig = {
  transpilePackages: ["@manhaj/lib", "@manhaj/ui"],

  // The Schedule "Cover planner" reads the pre-computed cover plans from
  // `data/processed/tt_2526/derived/*.json` via `fs` at runtime (see
  // packages/lib/src/queries/cover.ts). Those files sit at the monorepo root
  // and are NOT auto-traced into the Vercel serverless function — so the
  // hosted deploy 404s the data. Force them into the schedule route's bundle.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/schedule": [
      "../../data/processed/tt_2526/derived/cover_plans.json",
      "../../data/processed/tt_2526/derived/bells.json",
    ],
  },
};

export default config;
