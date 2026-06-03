// app.jsx — root of itsamod.dev.
// Fetches content.json once, then mounts the real app with `content.defaults`
// as the initial tweak state. Visitor changes persist in localStorage so
// theme/accent stick across reloads on the deployed site too.

const TWEAK_FALLBACK = /*EDITMODE-BEGIN*/{
  "accent": "#c2410c",
  "theme": "system",
  "fontPair": "editorial",
  "density": "regular"
}/*EDITMODE-END*/;

const ACCENT_DARK_MAP = {
  "#c2410c": "#ef885a",  // rust
  "#2563eb": "#7aa7ff",  // electric blue
  "#15803d": "#5fd49a",  // forest
  "#9333ea": "#c79cff",  // royal purple
};

const PREFS_KEY = 'itsamod.prefs.v1';
const TweakCtx = React.createContext({ t: TWEAK_FALLBACK, setTweak: () => {} });
const useTweak = () => React.useContext(TweakCtx);
window.TweakCtx = TweakCtx;
window.useTweak = useTweak;

// ── Loader ──────────────────────────────────────────────────────────
function App() {
  const [content, setContent] = React.useState(null);
  const [contentError, setContentError] = React.useState(null);

  React.useEffect(() => {
    fetch('content.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((data) => {
        setContent(data);
        if (data?.meta?.title) document.title = data.meta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data?.meta?.description) {
          metaDesc.setAttribute('content', data.meta.description);
        }
      })
      .catch((err) => setContentError(String(err)));
  }, []);

  if (contentError) {
    return (
      <div style={{padding: '60px 28px', maxWidth: 600, margin: '0 auto',
                   fontFamily: 'var(--font-mono)', fontSize: 14,
                   color: 'var(--fg-soft)'}}>
        <p style={{color: 'var(--accent)'}}>Couldn't load content.json</p>
        <pre style={{whiteSpace: 'pre-wrap', fontSize: 12,
                     opacity: 0.7}}>{contentError}</pre>
      </div>
    );
  }

  if (!content) return null;
  return <AppCore content={content} />;
}

// ── Core ────────────────────────────────────────────────────────────
function AppCore({ content }) {
  // Initial tweak state: content.defaults → overridden by anything the
  // visitor has saved in localStorage. content.json is the *author's*
  // default; localStorage is the *visitor's* preference.
  const initial = React.useMemo(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); }
      catch (_) { return {}; }
    })();
    return {
      ...TWEAK_FALLBACK,
      ...(content.defaults || {}),
      ...stored,
    };
  }, [content]);

  const [t, setTweakRaw] = useTweaks(initial);

  // Wrap setTweak to ALSO persist to localStorage on every change. The host
  // postMessage already keeps the EDITMODE block in sync for author preview;
  // localStorage covers the deployed site for visitors.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setTweakRaw(edits);
    try {
      const prev = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, ...edits }));
    } catch (_) {}
  }, [setTweakRaw]);

  // Apply tweak values as data-attrs / CSS vars on <html>.
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-fontpair', t.fontPair);
    root.setAttribute('data-density', t.density);

    if (t.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t.theme);

    const lightAccent = t.accent;
    const darkAccent = ACCENT_DARK_MAP[t.accent] || lightenForDark(t.accent);
    const effectiveDark = t.theme === 'dark' ||
      (t.theme === 'system' &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);
    const acc = effectiveDark ? darkAccent : lightAccent;
    root.style.setProperty('--accent', acc);
    root.style.setProperty('--accent-soft',
      effectiveDark
        ? hexToRgba(darkAccent, 0.18)
        : hexToRgba(lightAccent, 0.10));
  }, [t.accent, t.theme, t.fontPair, t.density]);

  // Re-apply accent on system theme flip (only matters in system mode).
  React.useEffect(() => {
    if (t.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const darkAccent = ACCENT_DARK_MAP[t.accent] || lightenForDark(t.accent);
      const acc = mq.matches ? darkAccent : t.accent;
      document.documentElement.style.setProperty('--accent', acc);
      document.documentElement.style.setProperty('--accent-soft',
        mq.matches ? hexToRgba(darkAccent, 0.18) : hexToRgba(t.accent, 0.10));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [t.accent, t.theme]);

  const accentOptions = content.defaults?.accentOptions
                       || ['#c2410c','#2563eb','#15803d','#9333ea'];

  return (
    <ContentCtx.Provider value={content}>
      <TweakCtx.Provider value={{ t, setTweak }}>
        <Nav />
        <main className="site">
          <Hero />
          <About />
          <Work />
          <Projects />
          <MapSection />
          <Footer />
        </main>

        <TweaksPanel title="Tweaks">
          <TweakSection label="Theme" />
          <TweakRadio label="Mode" value={t.theme}
                      options={['system','light','dark']}
                      onChange={(v) => setTweak('theme', v)} />
          <TweakColor label="Accent" value={t.accent}
                      options={accentOptions}
                      onChange={(v) => setTweak('accent', v)} />

          <TweakSection label="Type" />
          <TweakSelect label="Font pair" value={t.fontPair}
                       options={[
                         { value: 'editorial', label: 'Editorial · Serif + Geist' },
                         { value: 'literary',  label: 'Literary · Newsreader' },
                         { value: 'terminal',  label: 'Terminal · JetBrains Mono' },
                       ]}
                       onChange={(v) => setTweak('fontPair', v)} />

          <TweakSection label="Layout" />
          <TweakRadio label="Density" value={t.density}
                      options={['compact','regular','comfy']}
                      onChange={(v) => setTweak('density', v)} />
        </TweaksPanel>
      </TweakCtx.Provider>
    </ContentCtx.Provider>
  );
}

function hexToRgba(hex, a) {
  const h = String(hex).replace('#','');
  const v = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(v, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Auto-derive a dark-mode-friendly accent (lighter, slightly desaturated) for
// any accent not in ACCENT_DARK_MAP — so new accents added in content.json
// work in both themes without touching code.
function lightenForDark(hex) {
  const h = String(hex).replace('#','');
  const v = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(v, 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let s = 0, l = (max + min) / 2, hh = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh /= 6;
  }
  l = Math.min(0.72, l + 0.28);
  s = s * 0.85;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let R, G, B;
  if (s === 0) { R = G = B = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    R = hue2rgb(p, q, hh + 1/3); G = hue2rgb(p, q, hh); B = hue2rgb(p, q, hh - 1/3);
  }
  const toHex = (x) => ('0' + Math.round(x * 255).toString(16)).slice(-2);
  return '#' + toHex(R) + toHex(G) + toHex(B);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
