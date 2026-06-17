# Moving everything off OneDrive — workflow

**Principle:** code lives in `~/dev/<project>/`, tracked by git, mirrored to GitHub Private. OneDrive is for non-code only (photos, shared docs, signed PDFs the school sends back).

## Why

- OneDrive locks files mid-sync (this project hit it — `school-ops/` ended up unreadable while `school-ops 2/` was the real working copy)
- OneDrive duplicates on conflict; you can lose work
- OneDrive can't show diffs, branches, history
- A code editor with file watchers + OneDrive sync = race condition

## The pattern, per project

For each existing project currently in `~/OneDrive-Personal/<name>/`:

```bash
# 1. Move (don't copy, so OneDrive stops syncing it)
mv "/Users/eliasmouawad/Library/CloudStorage/OneDrive-Personal/<name>" ~/dev/<name>
cd ~/dev/<name>

# 2. Init git (if not already)
git init -b main

# 3. Drop a sensible .gitignore (template at ~/dev/manhaj/.gitignore)
cp ~/dev/manhaj/.gitignore .

# 4. First commit
git add -A
git commit -m "initial commit · migrated from OneDrive"

# 5. Create private GitHub repo and push
gh repo create <name> --private --source=. --remote=origin --push
```

## Active projects per memory (run the pattern for each)

Order by how often you touch them:

| OneDrive path | New local path | Repo name | Status |
|---|---|---|---|
| `Job Applications/` | `~/dev/job-applications/` | `job-applications` (private) | Active per memory; v2 CLI in use |
| `Maw3ads/` (the SaaS) | `~/dev/maw3ads/` | `maw3ads` (private) | Active per memory; phase 1 day 4 done |
| `school-ops 2/` → done | `~/dev/manhaj/` | `manhaj` (private) | ✓ Done in this session |
| Arbitrage finder workspace (if any code) | `~/dev/arbitrage-uae/` | `arbitrage-uae` (private) | Active per memory; design phase |
| BTC HA backtest | `~/dev/btc-ha-backtest/` | `btc-ha-backtest` (private) | Active per memory; one run done |

For *each* of these, the same 5-step pattern works. Do them one at a time as you next touch each project — don't batch-migrate now, because un-touched migrations often surface broken paths or stale state you only notice when you open the project.

## What stays in OneDrive

| Keep in OneDrive | Why |
|---|---|
| Raw school files the school sends (xlsx, doc, signed PDFs) before they're checked into a project repo | OneDrive is fine for inbox-style document handoff |
| Personal docs (passport scans, signed contracts) | Not code |
| Photos / media you don't want in git | Storage cost; git is wrong tool |
| The handover xlsx output (we send it from `~/dev/manhaj/handover/`) | Build artefact, but a copy in OneDrive for emailing is fine |

## Sanity rules going forward

- Never `cd` into anything under `~/Library/CloudStorage/OneDrive-Personal/` to edit code. If you're editing code, you're in `~/dev/<project>/`.
- If a teammate sends you a code-bearing OneDrive link, your first move is to move it to `~/dev/` and init git.
- When you copy files between OneDrive and `~/dev/`, prefer `mv` over `cp` so the OneDrive copy disappears and there's only one source of truth.
- Don't run servers (Next.js dev, Python http.server, etc.) against paths in OneDrive — file-watcher and OneDrive's pseudo-FS will cause weird stalls.

## Today's migration that already happened

This project: `Library/CloudStorage/OneDrive-Personal/school-ops 2/` → `~/dev/manhaj/` (this directory). The OneDrive `school-ops/` and `school-ops 2/` directories should be deleted after the first push to GitHub succeeds and you've verified the repo is intact.
