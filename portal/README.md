# ISWT Team Portal

A lightweight, dependency-free dashboard that lists all internal ISWT Team
portals and tools. Pure static files — no build step, no backend.

## Features

- **Search** — filter portals instantly by name, category, description, or URL
  (press `/` to jump to the search box).
- **Category filters** — one-click chips to narrow the list.
- **Register a portal** — add a new portal (name, URL, category, description).
  On submit the card appears immediately *and* the portal opens in a new browser
  tab.
- **Open in a new tab** — clicking any card launches that portal in a new tab.
- **Shared data** — the canonical list lives in [`portals.json`](portals.json).

## Files

| File          | Purpose                                  |
|---------------|------------------------------------------|
| `index.html`  | Markup / layout                          |
| `styles.css`  | Design system & responsive styling       |
| `app.js`      | Search, filter, register, export logic   |
| `portals.json`| Shared list of portals (source of truth) |

## How registering works (shared JSON, no backend)

Because this is a static site, newly registered portals are kept in **your
browser** (localStorage) so they survive a refresh and show an *"unsaved"*
badge. To make them part of the shared list for everyone:

1. Click **Register Portal**, fill in the form, and submit.
2. Click **Export portals.json** — this downloads the merged file (and copies it
   to your clipboard).
3. Replace [`portals.json`](portals.json) with the exported file, commit, and push.

Once a portal exists in `portals.json`, its local/unsaved copy is dropped
automatically.

## Register via a GitHub Issue (no checkout needed)

Anyone can add a portal straight from GitHub:

1. Open a new issue using the **🔗 Register a portal** template.
2. Fill in name, URL, category, and description, then submit.
3. A workflow ([`.github/workflows/register-portal.yml`](../.github/workflows/register-portal.yml))
   parses the issue, appends the entry to [`portals.json`](portals.json),
   commits it, and closes the issue with a confirmation comment. Invalid
   submissions get a comment explaining what to fix — edit the issue and it
   retries.

> **Note:** GitHub runs `issues`-triggered workflows from the **default
> branch**, so this file must be merged to `main` before issue registration
> works.

## Deploy to GitHub Pages

[`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
publishes this `portal/` folder to GitHub Pages.

**One-time setup:** in the repo, go to **Settings → Pages → Build and
deployment → Source** and select **GitHub Actions**.

After that, every push to `main` that touches `portal/**` (including the
auto-commits from issue registration) redeploys the site. The portal uses only
relative paths, so it works correctly at a project URL like
`https://<user>.github.io/code-server/`. You can also trigger a deploy manually
from the **Actions** tab (**Run workflow**).

## Running locally

Open `index.html` directly, or serve the folder (recommended, so `fetch` of
`portals.json` works under `file://` restrictions):

```bash
cd portal
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Editing the list directly

You can also edit [`portals.json`](portals.json) by hand. Each entry:

```json
{
  "id": "unique-slug",
  "name": "Display name",
  "url": "https://tool.internal.iswt.local",
  "category": "Monitoring",
  "description": "Short description."
}
```
