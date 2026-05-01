import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "../components/Icon.jsx";
import { useConfig } from "../config/ConfigContext.jsx";

function getImages(p) {
  if (Array.isArray(p.images) && p.images.length) {
    return p.images.map((it) => (typeof it === "string" ? { src: it } : it));
  }
  return p.image ? [{ src: p.image }] : [];
}

function ProjectDialog({ project, onClose }) {
  const images = getImages(project);
  const [idx, setIdx] = useState(0);
  const has = images.length > 0;
  const multi = images.length > 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (multi && e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (multi && e.key === "ArrowLeft")  setIdx((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [images.length, multi, onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${project.name} details`}>
      <div className="modal project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="company-meta"><span className="accent">{project.role}</span> · {project.year}</div>
            <h3>{project.name}</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        {has && (
          <div className="pm-carousel">
            <div className="pm-stage">
              <img
                key={images[idx].src}
                src={images[idx].src}
                alt={images[idx].label || `${project.name} screenshot ${idx + 1}`}
              />
              {multi && (
                <>
                  <button
                    className="pm-arrow prev"
                    onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Previous screenshot"
                  >
                    <Icon name="arrow_left" />
                  </button>
                  <button
                    className="pm-arrow next"
                    onClick={() => setIdx((i) => (i + 1) % images.length)}
                    aria-label="Next screenshot"
                  >
                    <Icon name="arrow_right" />
                  </button>
                </>
              )}
            </div>
            {multi && (
              <div className="pm-caption">
                <span>{images[idx].label || `Screenshot ${idx + 1}`}</span>
                <div className="pm-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={"pm-dot" + (i === idx ? " on" : "")}
                      onClick={() => setIdx(i)}
                      aria-label={`Go to screenshot ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="modal-body">
          <h4>About</h4>
          <p className="pm-desc">{project.desc}</p>
          {project.stack?.length > 0 && (
            <>
              <h4>Stack</h4>
              <div className="tech">
                {project.stack.map((s, j) => <span key={j}>{s}</span>)}
              </div>
            </>
          )}
          {(project.href || project.repo) && (
            <>
              <h4>Links</h4>
              <div className="cta-row">
                {project.href && <a href={project.href} target="_blank" rel="noreferrer">Case study <Icon name="arrow_ne" /></a>}
                {project.repo && <a href={project.repo} target="_blank" rel="noreferrer">Repo <Icon name="github" /></a>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { projects } = useConfig();
  const [active, setActive] = useState(null);
  const railRef = useRef(null);
  const pauseRef = useRef({ hover: false, modal: false, userUntil: 0 });

  const items = projects?.items || [];
  const enabled = !!projects?.enabled;
  // Duplicate the list so we can loop seamlessly: when scroll passes the
  // first copy's width, we subtract that width and the user never sees a jump.
  const loopItems = items.length > 1 ? [...items, ...items] : items;

  // Keep modal-pause flag in sync with active state (read inside rAF).
  useEffect(() => { pauseRef.current.modal = !!active; }, [active]);

  useEffect(() => {
    if (!enabled || items.length < 2) return;
    const rail = railRef.current;
    if (!rail) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let lastTs = 0;
    let inView = false;
    const SPEED = 28; // px/sec — slow, ambient drift

    const halfWidth = () => rail.scrollWidth / 2;

    const tick = (ts) => {
      const dt = lastTs ? (ts - lastTs) / 1000 : 0;
      lastTs = ts;
      const { hover, modal, userUntil } = pauseRef.current;
      const paused = hover || modal || ts < userUntil;
      if (inView && !paused && dt > 0 && dt < 0.5) {
        let next = rail.scrollLeft + SPEED * dt;
        const half = halfWidth();
        if (half > 0 && next >= half) next -= half;
        // Disable smooth scroll for the increment to avoid fighting the rAF
        rail.style.scrollBehavior = "auto";
        rail.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(rail);

    const onEnter = () => { pauseRef.current.hover = true; };
    const onLeave = () => { pauseRef.current.hover = false; };
    const bumpUser = () => { pauseRef.current.userUntil = performance.now() + 2500; };

    rail.addEventListener("mouseenter", onEnter);
    rail.addEventListener("mouseleave", onLeave);
    rail.addEventListener("pointerdown", bumpUser);
    rail.addEventListener("wheel", bumpUser, { passive: true });
    rail.addEventListener("touchstart", bumpUser, { passive: true });
    rail.addEventListener("touchmove", bumpUser, { passive: true });

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      rail.removeEventListener("mouseenter", onEnter);
      rail.removeEventListener("mouseleave", onLeave);
      rail.removeEventListener("pointerdown", bumpUser);
      rail.removeEventListener("wheel", bumpUser);
      rail.removeEventListener("touchstart", bumpUser);
      rail.removeEventListener("touchmove", bumpUser);
    };
  }, [enabled, items.length]);

  const onCardKey = useCallback((e, p) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActive(p);
    }
  }, []);

  if (!enabled) return null;
  const h = projects.heading || {};

  return (
    <section id="projects">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{projects.eyebrow}</div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
          </div>
          <p className="sub">{projects.sub}</p>
        </div>

        <div className="projects-rail-wrap">
          <div className="projects-rail" ref={railRef}>
            {loopItems.map((p, i) => (
              <div
                className="project-card"
                key={i}
                role="button"
                tabIndex={i < items.length ? 0 : -1}
                aria-hidden={i >= items.length ? "true" : undefined}
                onClick={() => setActive(p)}
                onKeyDown={(e) => onCardKey(e, p)}
                aria-label={`Open details for ${p.name}`}
              >
                <div
                  className="project-visual"
                  style={{ "--px": `${p.accent?.[0] ?? 30}%`, "--py": `${p.accent?.[1] ?? 30}%` }}
                >
                  {p.image ? (
                    <img className="shot" src={p.image} alt={`${p.name} screenshot`} loading="lazy" decoding="async" />
                  ) : (
                    <div className="pseudo-ui">
                      <div className="row">
                        <div className="bar accent" style={{ width: 60 }}></div>
                        <div className="bar" style={{ width: 30, flex: 1 }}></div>
                      </div>
                      <div className="row">
                        <div className="bar" style={{ width: 80 }}></div>
                        <div className="bar" style={{ width: 50 }}></div>
                        <div className="bar" style={{ width: 35 }}></div>
                      </div>
                      <div className="grid-m">
                        {Array.from({ length: 16 }).map((_, j) => (
                          <span key={j} className={(j * 7 + i * 3) % 5 === 0 ? "on" : ""}></span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="project-body">
                  <div className="meta">
                    <span>{p.role}</span>
                    <span className="year">{p.year}</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                  <div className="stack">
                    {p.stack.map((s, j) => <span key={j}>{s}</span>)}
                  </div>
                  <div className="cta-row">
                    {p.repo && (
                      <a href={p.repo} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer">
                        Repo <Icon name="github" />
                      </a>
                    )}
                    <span className="open-hint">Details <Icon name="arrow_ne" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {active && <ProjectDialog project={active} onClose={() => setActive(null)} />}
    </section>
  );
}
