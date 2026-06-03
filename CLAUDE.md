# CLAUDE.md — project context for itsamod.dev

This is **Amod Gehlot's personal portfolio site** — a complete, working static web app. It is production source, not a mockup. Read `README.md` for the full architecture; this file is the quick brief for working in Claude Code.

## What you're working with
- Static files, **no build step required to run**. JSX is compiled in-browser by Babel Standalone.
- React 18 via CDN. Four JSX files load in order: `tweaks-panel.jsx` → `world-map.jsx` → `components.jsx` → `app.jsx`.
- **All content lives in `content.json`** and is fetched at runtime. Components hold no hardcoded copy.
- Theming is attribute/CSS-variable driven from `app.jsx` onto `<html>`; `styles.css` reacts.

## Golden rules
1. **Don't hardcode content in components.** Add/edit copy and data in `content.json` only.
2. **Keep `content.json` a separately-fetched file** even if you precompile — non-devs edit it without rebuilding.
3. **Preserve JSX load order** if you change script tags.
4. Each `<script type="text/babel">` file has its own scope; shared components are exported onto `window` at the end of `components.jsx`. Don't introduce a global `const styles = {}` — names must be unique per file.
5. Serve over HTTP when testing (`python3 -m http.server`); `file://` breaks the `content.json` fetch.

## Likely tasks
- **Deploy:** static host (GitHub Pages / Netlify / Vercel / Cloudflare). No build command, publish the folder root. See README §6.
- **Production hardening:** precompile the 4 `.jsx` files to JS, self-host React + fonts, drop the Babel CDN. See README §7. This is mechanical — preserve behavior and the external `content.json`.
- **Content updates:** edit `content.json` (see the table in README §4).

## Map specifics (world-map.jsx)
- `landmask.json` is a clean 288×144 equirectangular grid (`rows_data[r][c]==='1'` = land).
- City markers geocode via cache → localStorage → OpenStreetMap Nominatim (1 req/sec), then snap to the nearest land cell. Coincident markers fan apart. Don't reintroduce the old fitted projection offsets — the mask is now standard −180..180 / −90..90.

## Don't
- Don't convert `content.json` into hardcoded JSX.
- Don't remove the localStorage visitor-prefs behavior (`itsamod.prefs.v1`) or the theme-attribute system.
- Don't commit secrets — there are none here; Nominatim needs no key.
