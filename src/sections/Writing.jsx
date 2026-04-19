import Icon from "../components/Icon.jsx";
import { useConfig } from "../config/ConfigContext.jsx";

export default function Writing() {
  const { writing } = useConfig();
  if (!writing?.enabled) return null;
  const h = writing.heading || {};

  return (
    <section id="writing">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{writing.eyebrow}</div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
          </div>
          {writing.allPostsHref && (
            <a href={writing.allPostsHref} className="btn ghost small">
              All posts <Icon name="arrow" />
            </a>
          )}
        </div>
        <div className="blog-grid">
          {writing.posts.map((p, i) => (
            <a className="blog-card" href={p.href || "#"} key={i}>
              <div className="meta">
                <span className="cat">{p.cat}</span>
                <span>{p.date} · {p.read}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.excerpt}</p>
              <span className="read">Read post <Icon name="arrow_ne" /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
