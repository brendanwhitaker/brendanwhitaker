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
├── robots.txt
├── sitemap.xml
└── .nojekyll             # Serve files as-is (skip Jekyll processing)
```

## Design

A faithful reproduction of the live site's visual system: an ultra-minimal,
magazine-style layout on a fixed 5-column grid.

- **Type:** Instrument Serif (display), Inter 300 (body), Overpass 800 (the red
  "Build What Matters" heading), Inter uppercase-letterspaced (labels).
- **Palette:** black `#0a0a0a` on white `#ffffff`, one red `#ED0C0C` display
  heading, blue `#1666C4` for the venture links, black footer.
- **Grid:** 5-column modular layout — small uppercase labels sit in the far-left
  column, content is indented, and hairline rules extend across section heads.
  Sharp-cornered, borderless images; no cards, shadows, or rounded corners.
- **Sections:** hero → mission ("Build What Matters") → testimonials → work
  (the ecosystem: The Upskilling Labs, Levy, Folkmark) → contact.
- Collapses to a single column on mobile, keyboard-accessible, respects
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

The site is published with GitHub Pages' built-in **"Deploy from a branch"**
build — no custom workflow needed. Under **Settings → Pages → Build and
deployment**, set **Source: Deploy from a branch**, then choose the branch and
the `/ (root)` folder. Every push to that branch rebuilds the site.

### Custom domain

To serve at `brendanwhitaker.com`, add a `CNAME` file containing the domain (or
set it under **Settings → Pages → Custom domain**) and add the DNS records
GitHub lists — `A`/`ALIAS` records for the apex plus a `CNAME` for `www`.
Without it, the site serves at the default `*.github.io` URL.

## Notes

- The contact form has no backend (static hosting). Submitting it composes an
  email to `hello@brendanwhitaker.com` via the visitor's mail client. Swap in a
  form service (Formspree, Netlify Forms, etc.) if you want server-side capture.
- Photography and the "BW" monogram are Brendan's own assets, mirrored from the
  live site into `assets/images/`.
