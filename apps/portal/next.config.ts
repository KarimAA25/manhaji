import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Monorepo root (two levels up from apps/portal). Lets Next's output-file
// tracing reach shared data files at the repo root, above this app's directory.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const config: NextConfig = {
  transpilePackages: [
    "@manhaj/lib",
    "@manhaj/ui",
    "@manhaj/auth",
    "@manhaj/admin",
    "@manhaj/teacher",
    "@manhaj/student",
    "@manhaj/parent",
  ],

  // Portal is the deployed app; it re-exports the admin Schedule page at
  // /admin/schedule. That page reads data/processed/tt_2526/derived/*.json via
  // `fs` (packages/lib/src/queries/cover.ts). Trace those repo-root files into
  // the serverless function so the Cover planner works on Vercel.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/admin/schedule": [
      "../../data/processed/tt_2526/derived/cover_plans.json",
      "../../data/processed/tt_2526/derived/bells.json",
    ],
  },
};

export default config;
