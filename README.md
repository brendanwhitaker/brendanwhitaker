# brendanwhitaker.com

A fast, dependency-free static recreation of [brendanwhitaker.com](https://www.brendanwhitaker.com) —
the personal site of Brendan Whitaker, who builds infrastructure for founders,
institutions, and coalitions from Washington, DC.

Hand-written HTML, CSS, and a small amount of vanilla JavaScript. No build step,
no framework, no runtime dependencies — just static files you can host anywhere.

## Structure

```
.
├── index.html            # The single-page site
├── 404.html              # Custom not-found page
├── assets/
│   ├── css/styles.css    # All styling (design tokens, layout, responsive, motion)
│   ├── js/main.js        # Nav toggle, scroll reveal, contact form
│   └── images/           # Photography + brand mark + favicons
├── CNAME                 # Custom domain for GitHub Pages (brendanwhitaker.com)
├── robots.txt
├── sitemap.xml
├── .nojekyll             # Serve files as-is (skip Jekyll processing)
└── .github/workflows/deploy.yml  # GitHub Pages deploy on push to main
```

## Design

- **Type:** Instrument Serif (display), Inter (body), Overpass (labels) via Google Fonts.
- **Palette:** ink `#141210`, warm paper `#FBF9F5`, bronze accent `#A17C5A`.
- **Sections:** hero → mission ("Build What Matters") → testimonials → work
  (the ecosystem: The Upskilling Labs, Levy, Folkmark) → contact.
- Responsive down to small phones, keyboard-accessible, respects
  `prefers-reduced-motion`, and uses semantic landmarks with a skip link.

## Run locally

It's plain static files, so any static server works:

```bash
# Python
python3 -m http.server 8000
# or Node
npx serve .
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

Two supported paths — pick one:

**A. GitHub Actions (recommended, already configured)**
1. Push to the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` publishes the site on every push to `main`.

**B. Deploy from a branch (no workflow)**
1. **Settings → Pages → Source: Deploy from a branch**.
2. Choose the branch and the `/ (root)` folder.

### Custom domain

The `CNAME` file points Pages at `brendanwhitaker.com`. To use it, add the DNS
records GitHub lists under **Settings → Pages → Custom domain** (an `ALIAS`/`A`
records for the apex plus a `CNAME` for `www`). If you'd rather serve at the
default `*.github.io` URL, delete the `CNAME` file.

## Notes

- The contact form has no backend (static hosting). Submitting it composes an
  email to `hello@brendanwhitaker.com` via the visitor's mail client. Swap in a
  form service (Formspree, Netlify Forms, etc.) if you want server-side capture.
- Photography and the "BW" monogram are Brendan's own assets, mirrored from the
  live site into `assets/images/`.
