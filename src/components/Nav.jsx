import Icon from "./Icon.jsx";
import env from "@env";

export default function Nav() {
  const { nav, profile, assets } = env;
  if (!nav?.enabled) return null;

  const initial = (profile.name || "K").trim().charAt(0).toUpperCase();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand">
          <span className="mark" data-letter={initial}></span>
          <span>
            {profile.name.split(" ")[0]}{" "}
            <span className="handle">/{profile.handle}</span>
          </span>
        </a>
        <nav className="nav-links">
          {nav.links.map((l, i) => (
            <a key={l.h} href={l.h}>
              <span className="dot">0{i + 1}</span>
              {l.t}
            </a>
          ))}
        </nav>
        <div className="nav-ctas">
          <div className="icon-links">
            {profile.social.github && (
              <a className="icon-btn" href={profile.social.github} aria-label="GitHub" target="_blank" rel="noreferrer">
                <Icon name="github" />
              </a>
            )}
            {profile.social.linkedin && (
              <a className="icon-btn" href={profile.social.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer">
                <Icon name="linkedin" />
              </a>
            )}
            {profile.social.x && (
              <a className="icon-btn" href={profile.social.x} aria-label="X" target="_blank" rel="noreferrer">
                <Icon name="x" />
              </a>
            )}
            {profile.social.instagram && (
              <a className="icon-btn" href={profile.social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <Icon name="instagram" />
              </a>
            )}
          </div>
          {nav.showResumeButton && assets.resume && (
            <a className="btn ghost small" href={assets.resume} download>
              <Icon name="download" /> Résumé
            </a>
          )}
          {nav.showContactButton && (
            <a className="btn primary small" href="#contact">
              <Icon name="arrow" /> Let's talk
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
