import { useEffect, useMemo, useRef, useState } from "react";
import defaultContent from "../config/content.default.json";
import deepMerge from "../config/deepMerge.js";
import { envConfig, ConfigProvider } from "../config/ConfigContext.jsx";
import { NotificationProvider } from "../components/Notifications.jsx";
import Nav from "../components/Nav.jsx";
import Hero from "../sections/Hero.jsx";
import Skills from "../sections/Skills.jsx";
import Experience from "../sections/Experience.jsx";
import Education from "../sections/Education.jsx";
import Projects from "../sections/Projects.jsx";
import GitHub from "../sections/GitHub.jsx";
import Writing from "../sections/Writing.jsx";
import Contact from "../sections/Contact.jsx";
import Footer from "../sections/Footer.jsx";
import FieldRenderer, { ObjectRenderer } from "./FieldRenderer.jsx";
import { setAt, deleteAt } from "./editorState.js";

const SECTION_ORDER = [
  "site", "assets", "profile", "nav", "hero", "skills", "experience",
  "education", "projects", "github", "writing", "contact", "footer", "notifications",
];

export default function Editor() {
  const [content, setContent] = useState(defaultContent);
  const [showPreview, setShowPreview] = useState(true);
  const [loadError, setLoadError] = useState("");
  const fileInputRef = useRef(null);

  const previewCfg = useMemo(() => deepMerge(envConfig, content), [content]);

  useEffect(() => {
    const site = content.site || {};
    document.body.setAttribute("data-accent", site.accent || "teal");
    document.body.setAttribute("data-tex", site.texture || "grid");
    document.body.setAttribute("data-timeline", site.timelineLayout || "horizontal-dots");
    document.title = `Editor · ${site.title || "Portfolio"}`;
  }, [content]);

  const update = (path, value) => setContent((prev) => setAt(prev, path, value));
  const remove = (path) => setContent((prev) => deleteAt(prev, path));

  const resetAll = () => {
    if (confirm("Reset all changes and reload from default JSON?")) {
      setContent(defaultContent);
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content.default.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onFile = (file) => {
    if (!file) return;
    setLoadError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Root of JSON must be an object.");
        }
        setContent(parsed);
      } catch (err) {
        setLoadError(err.message || "Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  const exitEditor = () => {
    window.location.hash = "";
  };

  const sectionKeys = SECTION_ORDER.filter((k) => k in content).concat(
    Object.keys(content).filter((k) => !SECTION_ORDER.includes(k))
  );

  return (
    <div className="ed-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <div className="ed-brand">
            <div className="ed-mark">C</div>
            <div>
              <div className="ed-title">Portfolio content editor</div>
              <div className="ed-sub">Edits apply to <code>content.default.json</code> — environment JS files are untouched.</div>
            </div>
          </div>
          <div className="ed-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button className="ed-btn" onClick={() => fileInputRef.current?.click()}>
              Load JSON
            </button>
            <button className="ed-btn" onClick={resetAll}>
              Reset
            </button>
            <button className="ed-btn ed-btn-primary" onClick={download}>
              Download JSON
            </button>
            <label className="ed-toggle">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              Preview
            </label>
            <button className="ed-btn ed-btn-ghost" onClick={exitEditor}>
              Back to site
            </button>
          </div>
        </div>
        {loadError && <div className="ed-error">Load failed: {loadError}</div>}
      </header>

      <div className="ed-form">
        {sectionKeys.map((k) => (
          <ObjectRenderer
            key={k}
            path={[k]}
            value={content[k]}
            onChange={update}
            onDelete={remove}
            label={k}
            defaultOpen={false}
          />
        ))}
      </div>

      {showPreview && (
        <div className="ed-preview-wrap">
          <div className="ed-preview-label">
            <span>Live preview</span>
            <span className="ed-preview-note">interaction is disabled — export JSON and reload the site to try links & forms</span>
          </div>
          <div className="ed-preview-frame" aria-hidden="true">
            <ConfigProvider value={previewCfg}>
              <NotificationProvider>
                <Nav />
                <Hero />
                <Skills />
                <Experience />
                <Education />
                <Projects />
                <GitHub />
                <Writing />
                <Contact />
                <Footer />
              </NotificationProvider>
            </ConfigProvider>
          </div>
        </div>
      )}
    </div>
  );
}
