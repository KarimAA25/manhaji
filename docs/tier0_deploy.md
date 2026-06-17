# Tier 0 deploy guide — get a shareable URL up (≤ 1 day)

The goal: a private URL you can send the principal of ISO. They click it, see a password prompt, type the password you gave them, and the demo loads.

## Plain-English glossary first

- **Static site** = a website made of pre-built files (HTML, CSS, JS, JSON). No server runs queries in the background. Everything the visitor sees was written down before they showed up. Tier 0 is a static site.
- **Cloudflare Pages** = a free service that takes a folder of static files and puts them on a public URL with HTTPS. We're picking it over Vercel/Netlify because Cloudflare has a free "Access" gate for adding email-based login on top.
- **Hosting** = whose computers serve the files to visitors. We're not running our own; Cloudflare's servers do it for free.
- **DNS** = the phonebook that converts `manhaj.app` → "the IP address where Cloudflare keeps your files". A domain (like `manhaj.app`) costs ~$10-20/yr.

## What's already done in this repo

✓ Demo files (`demo/`) are self-contained — paths all relative to `demo/`
✓ `demo/data/processed/*.json` is a copy of the ETL output so the demo doesn't need to look outside its own folder
✓ Password gate (`demo/assets/gate.js`) blocks the demo until correct password is entered
✓ `demo/healthz.json` — a build-info file you can hit in the browser to verify which version is deployed

## Default password

The password is currently **`manhaj-demo`**. To change it before going public:

```bash
# 1. Pick a new password and hash it
echo -n "your-new-password-here" | shasum -a 256

# 2. Take the 64-character output and replace EXPECTED_HASH in:
#    demo/assets/gate.js  (line near the top — clearly commented)

# 3. Commit + push
git add demo/assets/gate.js && git commit -m "Update demo password" && git push
```

The password itself is never stored in the code — only its fingerprint. People who read the code see the fingerprint, which doesn't reveal the password.

## Step-by-step deploy to Cloudflare Pages (about 30 minutes, one-time)

### Prerequisite — make sure the repo is on GitHub

If you haven't pushed yet, do the steps from the last conversation (`gh auth login` then `gh repo create manhaj --private --source=. --remote=origin --push`). The rest of this guide assumes the repo `<yourGitHub>/manhaj` exists on GitHub.

### Step 1 — Sign up for Cloudflare (free)

Go to **https://dash.cloudflare.com/sign-up** → create an account with your email. Confirm the email. No payment method needed for Pages.

### Step 2 — Create a Pages project

1. In the Cloudflare dashboard, left sidebar: **Workers & Pages**
2. Click **Create application** → **Pages** tab → **Connect to Git**
3. Authorize Cloudflare to read your GitHub account. When it asks which repos to grant access to, pick **Only select repositories** → select **manhaj**. Click Install & Authorize.
4. Back in Cloudflare, your `manhaj` repo now appears in the list. Click **Begin setup**.
5. **Project name:** `manhaj` (this becomes part of the URL: `manhaj.pages.dev`)
6. **Production branch:** `main`
7. **Build settings:**
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `demo`
   - *(Plain English: we tell Cloudflare "don't run any build, just serve the contents of the demo folder as a website")*
8. Click **Save and Deploy**. Wait ~1 minute for the first deploy.

### Step 3 — Visit the URL

After the deploy finishes, Cloudflare shows you a URL like `https://manhaj.pages.dev`. Click it.

**What you should see:**
- The password gate appears
- Enter `manhaj-demo` (or your new password)
- The demo landing page loads with the role picker

**Sanity check:** visit `https://manhaj.pages.dev/healthz.json` in the browser — you should see the JSON contents of the file. This proves the deploy includes all files.

### Step 4 — Buy a real domain (optional but recommended)

If you want the URL to be `iso-pilot.manhaj.app` instead of `manhaj.pages.dev`:

1. Buy `manhaj.app` from **Cloudflare Registrar** (cheapest, no markup): in Cloudflare dashboard → **Domain Registration** → **Register Domains** → search `manhaj.app`. About $10-20/yr. Use a card.
2. Back in Workers & Pages → your `manhaj` project → **Custom domains** tab → **Set up a custom domain** → type `iso-pilot.manhaj.app`. Cloudflare adds the DNS record automatically (it manages the domain too, so this is zero-config).
3. Wait ~1 minute. The URL is live with auto-HTTPS.

### Step 5 — Verify everything works

Open these URLs in the browser (whichever URL you settled on):

- `/index.html` — landing page; should show real teacher/section/subject counts
- `/admin/dashboard.html` — principal dashboard; load bars should render
- `/parent/select-courses.html` — course selection form; G9-G12 dropdown should work
- `/parent/report.html` — monthly report sample
- `/healthz.json` — JSON file with build info

If any page is blank or shows "Failed to fetch":
- Open browser dev tools (right-click → Inspect → Console tab)
- Look for red errors
- Most common cause: relative path wrong. Send me the console error and I'll fix it.

## Updating the demo after deploy

Any time you push to `main` on GitHub, Cloudflare Pages automatically rebuilds and re-deploys (within ~30 seconds). So the workflow becomes:

```bash
# Make a change in ~/dev/manhaj/
git add -A && git commit -m "Description of change" && git push
# Cloudflare picks it up automatically. Refresh the browser to see the new version.
```

## What's intentionally NOT in Tier 0

- No login system (just the password gate)
- No database (the demo reads from static JSON files)
- No form submission persistence — the parent course-selection form just shows a "Submitted ✓" screen; nothing is saved
- No real parent contact / WhatsApp / email
- No multi-school support (this is hard-coded to ISO data)

These are all in Tier 1. Tier 0 exists for one purpose: send a URL to the principal before Friday's meeting.
