import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useConfig } from "../config/ConfigContext.jsx";

function ExpModal({ exp, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="company-meta"><span className="accent">{exp.period}</span></div>
            <h3>{exp.role}</h3>
            <div className="company-meta">{exp.company} · {exp.location}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <h4>Overview</h4>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 0 }}>{exp.summary}</p>
          <h4>Highlights</h4>
          <ul>{exp.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
          <h4>Stack</h4>
          <div className="tech">{exp.stack.map((s, i) => <span key={i}>{s}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Experience() {
  const { experience } = useConfig();
  const [active, setActive] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = active !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!experience?.enabled) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  const h = experience.heading || {};

  return (
    <section id="experience">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{experience.eyebrow}</div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
          </div>
          <p className="sub">{experience.sub}</p>
        </div>

        <div className="timeline-wrap">
          <div className="timeline-scroll" ref={scrollRef}>
            <div className="timeline-track">
              {experience.items.map((e, i) => (
                <div className="tl-item" key={i}>
                  <div className="rail">
                    <div className={`node ${i > 0 ? "past" : ""}`}></div>
                    <div className="date"><strong>{e.year}</strong></div>
                  </div>
                  <div className="tl-card" onClick={() => setActive(i)}>
                    <div className="badge-top">● {e.year}</div>
                    <div className="company-row">
                      <div className="company-mark">{e.mark}</div>
                      <div className="company">{e.company}</div>
                    </div>
                    <h3>{e.role}</h3>
                    <p className="summary">{e.summary}</p>
                    <div className="meta">
                      <span>{e.location}</span>
                      <span className="more">More <Icon name="arrow_ne" /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="timeline-hint">
            <span>← Scroll · drag · {experience.items.length} roles</span>
            <div className="arrows">
              <button onClick={() => scroll(-1)} aria-label="Previous"><Icon name="arrow_left" /></button>
              <button onClick={() => scroll(1)} aria-label="Next"><Icon name="arrow_right" /></button>
            </div>
          </div>
        </div>
      </div>

      {active !== null && (
        <ExpModal exp={experience.items[active]} onClose={() => setActive(null)} />
      )}
    </section>
  );
}
