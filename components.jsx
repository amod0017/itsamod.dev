// components.jsx — section components for itsamod.dev.
// All copy lives in content.json — these components are pure renderers.

const ContentCtx = React.createContext(null);
window.ContentCtx = ContentCtx;
const useContent = () => React.useContext(ContentCtx);

// ── Inline markup ───────────────────────────────────────────────────
// Converts a plain-text string with simple inline marks into React nodes.
//   *phrase*  →  <em class="serif">phrase</em>   (serif italic emphasis)
//   \n        →  <br/>                            (hard line break)
// The renderer treats unmatched asterisks as literal text, so unrelated
// punctuation can't accidentally trigger italic.
function Markup({ text }) {
  if (text == null) return null;
  const lines = String(text).split('\n');
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*[^*\n]+\*)/g).map((part, i) => {
            if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
              return <em key={i} className="serif">{part.slice(1, -1)}</em>;
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </React.Fragment>
      ))}
    </>
  );
}

// ── Icons ───────────────────────────────────────────────────────────
const IconGithub = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
  </svg>
);
const IconLinkedin = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H18.4v-5.45c0-1.3-.02-2.97-1.8-2.97-1.8 0-2.08 1.4-2.08 2.87V21H10V9Z"/>
  </svg>
);
const IconMail = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
    <path d="m4 7 8 6 8-6"/>
  </svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12 12 4M5 4h7v7"/>
  </svg>
);
const IconBlog = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 4h11l5 5v11H4z"/>
    <path d="M14 4v6h6M8 14h8M8 18h5"/>
  </svg>
);

const IconSun = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);
const IconMoon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconSystem = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
       strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
);

// String→icon resolver so content.json can reference icons by name.
const ICONS = {
  github:   IconGithub,
  linkedin: IconLinkedin,
  mail:     IconMail,
  arrow:    IconArrow,
  blog:     IconBlog,
};
const Icon = ({ name, ...p }) => {
  const C = ICONS[name];
  return C ? <C {...p} /> : null;
};

// ── Nav ─────────────────────────────────────────────────────────────
function Nav() {
  const c = useContent().nav;
  return (
    <nav className="nav">
      <div className="nav__inner">
        <a href="#top" className="nav__brand">
          <span className="nav__dot" />{c.brand}
        </a>
        <div className="nav__links">
          {c.links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

// Theme toggle button — cycles system → light → dark.
const __THEME_CYCLE = ['system', 'light', 'dark'];
const __THEME_ICON = { system: IconSystem, light: IconSun, dark: IconMoon };
const __THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };

function ThemeToggle() {
  // Access useTweak/TweakCtx from window — they're defined in app.jsx which
  // loads after components.jsx, so a direct reference would be undefined at
  // parse time. By the time ThemeToggle renders, window.useTweak exists.
  const { t, setTweak } = window.useTweak();
  const next = () => {
    const i = __THEME_CYCLE.indexOf(t.theme);
    setTweak('theme', __THEME_CYCLE[(i + 1) % __THEME_CYCLE.length]);
  };
  const Ico = __THEME_ICON[t.theme] || IconSystem;
  const nextTheme = __THEME_CYCLE[(__THEME_CYCLE.indexOf(t.theme) + 1) % 3];
  return (
    <button type="button" className="theme-toggle" onClick={next}
            title={`${__THEME_LABEL[t.theme]} → ${__THEME_LABEL[nextTheme]}`}
            aria-label={`Theme: ${t.theme}. Click to cycle.`}>
      <Ico />
    </button>
  );
}

// ── Hero ────────────────────────────────────────────────────────────
function Hero() {
  const c = useContent().hero;
  const subWithDots = c.sub.flatMap((s, i) =>
    i === 0 ? [<span key={i}>{s}</span>] : [<i key={'i'+i} />, <span key={i}>{s}</span>]
  );
  return (
    <header className="hero" id="top">
      <div className="hero__eyebrow fade-up" style={{animationDelay: '40ms'}}>
        <span className="hero__pulse" />{c.eyebrow}
      </div>

      <h1 className="hero__headline fade-up" style={{animationDelay: '120ms'}}>
        <Markup text={c.headline} />
      </h1>

      <div className="hero__sub fade-up" style={{animationDelay: '220ms'}}>
        {subWithDots}
      </div>

      <div className="hero__cta fade-up" style={{animationDelay: '320ms'}}>
        <a href={c.cta.href} className="btn">
          {c.cta.label}
          <IconArrow className="btn__arrow" style={{width:14, height:14}}/>
        </a>
        <div className="hero__links">
          {c.links.map((l) => (
            <a key={l.label} href={l.href}
               target={l.href.startsWith('http') ? '_blank' : undefined}
               rel={l.href.startsWith('http') ? 'noreferrer' : undefined}>
              <Icon name={l.icon} /> {l.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}

// ── About ───────────────────────────────────────────────────────────
function About() {
  const c = useContent().about;
  const photo = c.photo;
  return (
    <section className="section about fade-up" id="about"
             style={{animationDelay: '420ms'}}>
      <h2 className="section__label">{c.label}</h2>
      {photo && (
        <image-slot
          class="about__photo"
          id={photo.id || 'amod-portrait'}
          shape={photo.shape || 'circle'}
          src={photo.src || undefined}
          placeholder={photo.placeholder || 'Drop a photo'}
          style={{width: (photo.size || 132) + 'px',
                  height: (photo.size || 132) + 'px'}}
        />
      )}
      {c.paragraphs.map((p, i) => (
        <p key={i}><Markup text={p} /></p>
      ))}
    </section>
  );
}

// ── Work ────────────────────────────────────────────────────────────
function Work() {
  const c = useContent().work;
  return (
    <section className="section work" id="work">
      <h2 className="section__label">{c.label}</h2>
      <div className="work__list">
        {c.items.map((w, i) => {
          const paras = Array.isArray(w.paragraphs) ? w.paragraphs : [];
          const tags = Array.isArray(w.tags) ? w.tags : [];
          const compact = paras.length === 0 && tags.length === 0;
          return (
            <article className={`work__item${compact ? ' work__item--compact' : ''}`} key={i}>
              <div className="work__when">{w.when}</div>
              <div>
                <h3 className="work__heading">{w.org}</h3>
                <div className="work__role">{w.role}</div>
                {paras.length > 0 && (
                  <div className="work__body">
                    {paras.map((p, j) => (
                      <p key={j}><Markup text={p} /></p>
                    ))}
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="work__tags">
                    {tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ── Projects ────────────────────────────────────────────────────────
function Projects() {
  const c = useContent().projects;
  return (
    <section className="section projects" id="projects">
      <h2 className="section__label">{c.label}</h2>
      <div className="projects__list">
        {c.items.map((p) => (
          <a key={p.name} className="project" href={p.href}
             target={p.href.startsWith('http') ? '_blank' : undefined}
             rel={p.href.startsWith('http') ? 'noreferrer' : undefined}>
            <div className="project__top">
              <span className="project__name">{p.name}</span>
              <span className="project__status">{p.status}</span>
              <IconArrow className="project__arrow"
                         style={{width: 14, height: 14}}/>
            </div>
            <p className="project__desc"><Markup text={p.desc} /></p>
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Map section ─────────────────────────────────────────────────────
function MapSection() {
  const c = useContent().map;
  return (
    <section className="section map-section" id="map">
      <h2 className="section__label">{c.label}</h2>
      <p style={{color: 'var(--fg-muted)', fontSize: 15, marginBottom: 18,
                 maxWidth: 520}}>
        <Markup text={c.intro} />
      </p>
      <WorldMap cities={c.cities} />
      <div className="map__legend">
        <span className="map__legend-item">{c.legendLabel}</span>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────
function Footer() {
  const c = useContent().footer;
  return (
    <footer className="footer" id="contact">
      <h2 className="section__label">{c.label}</h2>
      <p style={{fontSize: 18, color: 'var(--fg-soft)', marginBottom: 28,
                 maxWidth: 540}}>
        <Markup text={c.intro} />
      </p>
      <div className="footer__row">
        {c.links.map((l) => (
          <a key={l.label} href={l.href} className="footer__icon"
             aria-label={l.label} title={l.label}
             target={l.href.startsWith('http') ? '_blank' : undefined}
             rel={l.href.startsWith('http') ? 'noreferrer' : undefined}>
            <Icon name={l.icon} />
          </a>
        ))}
      </div>
      <div className="footer__meta">
        <span>© {new Date().getFullYear()} <b>{c.copyright}</b></span>
        <span>{c.tagline}</span>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Nav, Hero, About, Work, Projects, MapSection, Footer,
  ContentCtx, useContent, Markup,
});
