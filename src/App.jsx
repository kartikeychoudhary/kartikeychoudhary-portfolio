import { useEffect } from "react";
import Nav from "./components/Nav.jsx";
import { NotificationProvider } from "./components/Notifications.jsx";
import Hero from "./sections/Hero.jsx";
import Skills from "./sections/Skills.jsx";
import Experience from "./sections/Experience.jsx";
import Education from "./sections/Education.jsx";
import Projects from "./sections/Projects.jsx";
import GitHub from "./sections/GitHub.jsx";
import Writing from "./sections/Writing.jsx";
import Contact from "./sections/Contact.jsx";
import Footer from "./sections/Footer.jsx";
import env from "@env";

export default function App() {
  const { site, assets } = env;

  useEffect(() => {
    document.body.setAttribute("data-accent", site.accent || "teal");
    document.body.setAttribute("data-tex", site.texture || "grid");
    document.body.setAttribute("data-timeline", site.timelineLayout || "horizontal-dots");
    if (site.title) document.title = site.title;

    if (assets?.favicon) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = assets.favicon;
    }
  }, [site, assets]);

  return (
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
  );
}
