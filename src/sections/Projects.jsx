import Icon from "../components/Icon.jsx";
import env from "@env";

export default function Projects() {
  const { projects } = env;
  if (!projects?.enabled) return null;
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
        <div className="projects-grid">
          {projects.items.map((p, i) => (
            <div className="project-card" key={i}>
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
                  {p.href && <a href={p.href}>Case study <Icon name="arrow_ne" /></a>}
                  {p.repo && <a href={p.repo}>Repo <Icon name="github" /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
