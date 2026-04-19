import Icon from "../components/Icon.jsx";
import { useConfig } from "../config/ConfigContext.jsx";

export default function Footer() {
  const { footer, profile } = useConfig();
  if (!footer?.enabled) return null;
  const s = profile.social || {};

  return (
    <footer>
      <div className="container footer-inner">
        <div className="legal">{footer.legal}</div>
        <div className="icon-links" style={{ display: "flex", gap: 6 }}>
          {s.github   && <a className="icon-btn" href={s.github}   aria-label="GitHub"   target="_blank" rel="noreferrer"><Icon name="github" /></a>}
          {s.linkedin && <a className="icon-btn" href={s.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer"><Icon name="linkedin" /></a>}
          {s.x         && <a className="icon-btn" href={s.x}         aria-label="X"         target="_blank" rel="noreferrer"><Icon name="x" /></a>}
          {s.instagram && <a className="icon-btn" href={s.instagram} aria-label="Instagram" target="_blank" rel="noreferrer"><Icon name="instagram" /></a>}
          {s.mail      && <a className="icon-btn" href={s.mail}      aria-label="Email"><Icon name="mail" /></a>}
        </div>
      </div>
    </footer>
  );
}
