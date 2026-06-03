# itsamod.dev — Personal Portfolio

A complete, working static website for **Amod Gehlot** (Software Engineer / Agentic Builder). This bundle is **production-ready source**, not a design mockup — it runs as-is on any static host. The goal of this handoff is to **deploy it** and, optionally, harden it for production (precompile the JSX).

---

## 1. What this is

A single-page personal site built as **vanilla static files**: one HTML entry point, one CSS file, and a few React components written in JSX. There is **no build step required to run it** — the page compiles its JSX in the browser via Babel Standalone. All content is data-driven from a single `content.json` file.

Sections (in order): Hero → About → Work → Projects → Global Impact (dotted world map) → Footer. Plus a floating **Tweaks** panel for theme / accent / font / density, persisted per-visitor in `localStorage`.

---

## 2. File map

| File | Role |
|---|---|
| `index.html` | Entry point. Loads fonts, React + Babel, and the app scripts. |
| `styles.css` | All styling. CSS custom properties drive theming (light/dark, accent, density, font-pair). |
| `app.jsx` | Root. Fetches `content.json`, sets up theme/tweak state, renders the app, mounts the Tweaks panel. |
| `components.jsx` | All section components (Nav, Hero, About, Work, Projects, MapSection, Footer) + inline SVG icons. |
| `world-map.jsx` | The dotted impact map: renders the land grid, geocodes city names, projects + snaps markers. |
| `tweaks-panel.jsx` | The Tweaks panel UI shell and controls. |
| `image-slot.js` | `<image-slot>` web component — drag-and-drop photo holder (used for the About portrait). |
| `content.json` | **Single source of truth for ALL copy and data.** Edit this to change the site. |
| `geocache.json` | Cache of place-name → lat/lng for the map. Auto-managed; safe to delete (it re-resolves). |
| `landmask.json` | 288×144 equirectangular land grid (from Natural Earth) that draws the dotted continents. |
| `portrait.jpg` | The About photo (referenced by `content.json` → `about.photo.src`). |

---

## 3. Architecture notes

- **Data-driven:** Every visible string and list comes from `content.json` via a React context (`useContent()`). Components contain no hardcoded portfolio copy — only UI chrome (panel labels, icon shapes, error text).
- **Theming:** `app.jsx` writes `data-theme`, `data-fontpair`, `data-density` attributes and `--accent` CSS variables onto `<html>`. `styles.css` reacts to those. Dark-mode accent shades are auto-derived from any hex (no code edit needed to add a new accent).
- **Visitor prefs:** The Tweaks panel saves choices to `localStorage` (`itsamod.prefs.v1`). `content.json → defaults` sets the author's initial values for first-time visitors.
- **The map:** `world-map.jsx` draws one dot per land cell from `landmask.json` (clean −180..180 / −90..90 equirectangular). City markers are geocoded (cached file → localStorage → OpenStreetMap Nominatim, 1 req/sec) and **snapped to the nearest land cell** so they rest on the dotted landmass. Coincident markers (e.g. Espoo/Helsinki) fan apart so each stays visible.

---

## 4. Editing content

Everything is in `content.json`. No code changes needed for any of this:

| To change… | Edit in `content.json` |
|---|---|
| Browser tab title + SEO description | `meta.title`, `meta.description` |
| Nav brand + links | `nav` |
| Hero eyebrow / headline / tags / CTA / social links | `hero` |
| About label, photo, paragraphs | `about` |
| Work history | `work.items[]` — `when`, `org`, `role` (add `tags[]` / `paragraphs[]` for a full entry, omit them for a compact one-liner) |
| Projects | `projects.items[]` — `name`, `status`, `desc`, `href` |
| Map locations | `map.cities[]` — just add `{ "place": "City, Country" }`; it geocodes & snaps automatically |
| Footer intro, social logos, copyright | `footer` |
| Default theme / accent palette / font / density | `defaults` |

**Text markup:** wrap a phrase in `*asterisks*` to render it in the accent/italic display style (see existing entries). `\n` in the hero headline forces a line break.

**Accent colors:** `defaults.accentOptions` is the swatch list shown in Tweaks. Add any hex; a dark-mode variant is derived automatically.

---

## 5. Run locally

Because the app `fetch`es `content.json`, you must serve it over HTTP (opening `index.html` via `file://` will fail CORS). Any static server works:

```bash
# from inside this folder
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

---

## 6. Deploy

It's pure static files — deploy the folder to any static host. No build, no server.

**GitHub Pages** (matches the existing `amod0017.github.io` setup):
```bash
git init && git add . && git commit -m "itsamod.dev portfolio"
git branch -M main
git remote add origin git@github.com:amod0017/<repo>.git
git push -u origin main
# In repo Settings → Pages → deploy from main / root
```

**Netlify / Vercel / Cloudflare Pages:** drag-and-drop the folder, or connect the repo. Set **build command: (none)** and **publish/output directory: the folder root**. Custom domain `itsamod.dev` → point DNS at the host per their docs.

**Requirements at runtime:** the page loads React, Babel, and Google Fonts from CDNs, and the map calls OpenStreetMap Nominatim for any place not already in `geocache.json`. All current cities are pre-cached, so the map works offline-of-Nominatim out of the box.

---

## 7. Recommended for production: precompile the JSX

Running Babel in the browser is fine for a personal site but adds a CDN dependency and a brief compile delay on first paint (and logs a dev warning). For a faster, dependency-light production build, precompile the four `.jsx` files to plain JS and self-host React:

- Transpile `tweaks-panel.jsx`, `world-map.jsx`, `components.jsx`, `app.jsx` (in that order) with Babel/esbuild/Vite.
- Swap the `<script type="text/babel" src="…jsx">` tags in `index.html` for plain `<script src="…js">` (keep the load order), and drop the Babel CDN tag.
- Optionally self-host React and the Google Fonts to remove external runtime dependencies.

This is a mechanical change that preserves behavior; the in-browser version stays the editable reference. **Keep `content.json` as a separately-fetched file** (don't inline it) so non-developers can still edit content without rebuilding.

---

## 8. Known details / gotchas

- **`file://` won't work** — must be served over HTTP (see §5).
- **`geocache.json` is auto-managed.** When previewing in the original editor it gets rewritten as new places resolve; on a static deploy that write is a harmless no-op and `localStorage` covers repeat visitors. Safe to delete — it rebuilds from Nominatim.
- **Map performance:** ~12.5k SVG dots. Smooth on modern devices; if you ever need it lighter, regenerate `landmask.json` at a lower resolution (the grid is `{cols, rows, rows_data}` where `rows_data[r][c]==='1'` marks land).
- **Email/social links** live in `content.json → footer.links` and `hero.links`. Current email button uses `mailto:amod0017@gmail.com`.
- **Portrait:** swap `portrait.jpg` (or change `about.photo.src`). The `<image-slot>` also lets you drag a new photo in the browser, but that persists only to the local browser — for the deployed site, replace the file.
