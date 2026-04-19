import Icon from "../components/Icon.jsx";
import env from "@env";

export default function Education() {
  const { education } = env;
  if (!education?.enabled) return null;
  const h = education.heading || {};

  return (
    <section id="education">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{education.eyebrow}</div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
          </div>
          <p className="sub">{education.sub}</p>
        </div>
        <div className="edu-grid">
          {education.items.map((e, i) => (
            <div className="edu-card" key={i}>
              <div className="edu-icon"><Icon name={e.icon || "cap"} cls="i xl" /></div>
              <div>
                <div className="year">{e.year}</div>
                <h3>{e.degree}</h3>
                <div className="school">{e.school}</div>
                <div className="detail">{e.detail}</div>
                {e.grade && <div className="grade">{e.grade}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
