import { useConfig } from "../config/ConfigContext.jsx";

export default function Skills() {
  const { skills } = useConfig();
  if (!skills?.enabled) return null;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const h = skills.heading || {};
  const total = skills.items.length;

  return (
    <section id="skills">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{skills.eyebrow}</div>
            <h2>
              {h.before}
              <span className="serif">{h.serif}</span>
              {h.after}
            </h2>
          </div>
          <p className="sub">{skills.sub}</p>
        </div>
        <div className="skills-grid">
          {skills.items.map((s, i) => (
            <div className="skill-card" key={i} onMouseMove={onMove}>
              <div className="cat">
                <span>{s.cat}</span>
                <span className="num">
                  0{i + 1}/0{total}
                </span>
              </div>
              <div className="cat-title">{s.title}</div>
              <div className="tags">
                {s.tags.map((t, j) => (
                  <span key={j} className={t.p ? "primary" : ""}>
                    {t.t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
