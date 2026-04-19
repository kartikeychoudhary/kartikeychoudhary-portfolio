import Icon from "../components/Icon.jsx";
import { RichText } from "../utils/richText.jsx";
import env from "@env";

export default function Hero() {
  const { hero, profile, site, assets } = env;
  if (!hero?.enabled) return null;

  const variant = site.heroVariant || "split";
  const t = hero.title || {};

  return (
    <section id="top" className={`hero variant-${variant}`}>
      <div className="container">
        <div className="eyebrow-wrap">
          <span className="eyebrow">
            <span className="pulse"></span> {hero.eyebrow || profile.availability}
          </span>
        </div>
        <div className="hero-grid">
          <div>
            <h1>
              {t.before}
              <span className="serif">{t.serif}</span>
              {t.middle}
              <span className="stroke">{t.stroke}</span>
              {t.after}
            </h1>
            <p className="lead">
              <RichText text={hero.lead} />
            </p>
            <div className="cta-row">
              {hero.primaryCta && (
                <a href={hero.primaryCta.href} className="btn primary">
                  {hero.primaryCta.label} <Icon name="arrow" />
                </a>
              )}
              {hero.ghostCta && (
                <a href={hero.ghostCta.href || assets.resume} className="btn ghost">
                  <Icon name="download" /> {hero.ghostCta.label}
                </a>
              )}
            </div>

            {variant === "terminal" && (
              <div className="term">
                <div className="head">
                  <div className="dots"><span /><span /><span /></div>
                  <span>~/{profile.handle.split(".")[0]} — zsh</span>
                </div>
                <div className="body">
                  <div><span className="p">›</span> <span className="c">whoami</span></div>
                  <div>{profile.name.toLowerCase().replace(/\s+/g, "_")} <span className="g">// {profile.role.toLowerCase()}</span></div>
                  <div><span className="p">›</span> <span className="c">cat</span> profile.json</div>
                  <div>{"{"} <span className="s">"role"</span>: <span className="s">"{profile.role}"</span>, <span className="s">"location"</span>: <span className="s">"{profile.location}"</span> {"}"}</div>
                  <div><span className="p">›</span> <span className="c">echo</span> "ready to build" <span className="g">// returns 0</span></div>
                </div>
              </div>
            )}

            <div className="hero-stats">
              {profile.stats.map((s, i) => (
                <div className="stat" key={i}>
                  <div className="n">
                    {s.n}
                    <em>{s.suffix}</em>
                  </div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {variant === "split" && (
            <div className="hero-visual">
              <div className="portrait">
                {assets.portrait ? (
                  <img
                    src={typeof assets.portrait === "string" ? assets.portrait : assets.portrait.src}
                    srcSet={typeof assets.portrait === "object" ? assets.portrait.srcSet : undefined}
                    sizes={typeof assets.portrait === "object" ? assets.portrait.sizes : undefined}
                    alt={profile.name}
                    className="portrait-img"
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="silhouette">
                    <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="currentColor" stopOpacity=".9" />
                          <stop offset="1" stopColor="currentColor" stopOpacity=".25" />
                        </linearGradient>
                      </defs>
                      <circle cx="100" cy="80" r="44" fill="url(#sg)" />
                      <path d="M28 240c0-48 32-78 72-78s72 30 72 78" fill="url(#sg)" />
                    </svg>
                  </div>
                )}
                <div className="scanline"></div>
                <div className="label">
                  <span>// portrait</span>
                  <span>v2.4.1</span>
                </div>
              </div>
              {(hero.chips || []).map((c, i) => (
                <div key={i} className={`chip ${c.pos || ""}`}>
                  <span className="tag">{c.tag}</span>
                  <span className="v">{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
