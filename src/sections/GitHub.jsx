import { useMemo } from "react";
import Icon from "../components/Icon.jsx";
import env from "@env";

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildGrid(seed) {
  const rand = seededRand(seed);
  const cells = 52 * 7;
  return Array.from({ length: cells }, (_, i) => {
    const r = rand();
    const weekIdx = Math.floor(i / 7);
    const bias = 1 - (Math.abs((weekIdx - 26) / 26) * 0.4);
    const v = r * bias;
    if (v < 0.4)  return 0;
    if (v < 0.6)  return 1;
    if (v < 0.78) return 2;
    if (v < 0.92) return 3;
    return 4;
  });
}

export default function GitHub() {
  const { github } = env;
  const grid = useMemo(() => buildGrid(github?.contrib?.seed ?? 42), [github]);
  if (!github?.enabled) return null;
  const h = github.heading || {};
  const s = github.stats;

  return (
    <section id="github">
      <div className="container">
        <div className="section-head">
          <div>
            <div className="tag">{github.eyebrow}</div>
            <h2>{h.before}<span className="serif">{h.serif}</span>{h.after}</h2>
          </div>
          <p className="sub">{github.sub}</p>
        </div>
        <div className="gh-bar">
          <div className="gh-cell">
            <div className="lbl"><Icon name="github" /> Repositories</div>
            <div className="val">{s.repos.val}</div>
            <div className="sub">{s.repos.sub}</div>
          </div>
          <div className="gh-cell">
            <div className="lbl"><Icon name="spark" /> Stars earned</div>
            <div className="val">{s.stars.val}{s.stars.em && <em>{s.stars.em}</em>}</div>
            <div className="sub">{s.stars.sub}</div>
          </div>
          <div className="gh-cell">
            <div className="lbl"><Icon name="code" /> Contributions</div>
            <div className="val">{s.contribs.val}</div>
            <div className="sub">{s.contribs.sub}</div>
          </div>
          <div className="gh-cell">
            <div className="lbl"><Icon name="clock" /> Streak</div>
            <div className="val">{s.streak.val}</div>
            <div className="sub">{s.streak.sub}</div>
          </div>
        </div>
        <div className="contrib-graph">
          <div className="contrib-title">
            <span>{github.contrib.title}</span>
            <span>{github.contrib.range}</span>
          </div>
          <div className="contrib-grid">
            {grid.map((v, i) => <span key={i} className={`c${v}`}></span>)}
          </div>
          <div className="contrib-legend">
            <span>Less</span>
            <div className="swatches">
              <span className="c0" /><span className="c1" /><span className="c2" /><span className="c3" /><span className="c4" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  );
}
