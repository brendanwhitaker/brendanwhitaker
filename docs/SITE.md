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
├── CNAME                 # Custom domain for GitHub Pages
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
deployment**, set **Source: Deploy from a branch**, then choose `main` and the
`/ (root)` folder. Every push to that branch rebuilds the site.

Until a custom domain resolves, the site serves from the project URL:
<https://brendanwhitaker.github.io/brendanwhitaker/>.

### Custom domain

The `CNAME` file pins the site to `www.brendanwhitaker.com`, which GitHub reads
at build time and mirrors into **Settings → Pages → Custom domain**. It only
takes effect once DNS points at GitHub Pages:

| Host  | Type    | Value                                                                  |
| ----- | ------- | ---------------------------------------------------------------------- |
| `@`   | `A`     | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `@`   | `AAAA`  | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| `www` | `CNAME` | `brendanwhitaker.github.io.`                                            |

GitHub then redirects the apex to `www` and issues the TLS certificate (tick
**Enforce HTTPS** once it's provisioned). Set DNS *before* the custom domain
goes live, or both hostnames 404 in the gap.

## Notes

- The contact form has no backend (static hosting). Submitting it composes an
  email to `hello@brendanwhitaker.com` via the visitor's mail client. Swap in a
  form service (Formspree, Netlify Forms, etc.) if you want server-side capture.
- Photography and the "BW" monogram are Brendan's own assets, mirrored from the
  live site into `assets/images/`.
