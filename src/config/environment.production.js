// =============================================================================
//  PRODUCTION ENVIRONMENT CONFIG
// -----------------------------------------------------------------------------
//  Used automatically by `npm run build`. Mirror the schema of
//  environment.development.js and fill in the real values before shipping.
// =============================================================================

export const ENV_NAME = "production";

export const site = {
  title: "Kartikey Choudhary — Senior Software Engineer",
  accent: "teal",
  texture: "grid",
  heroVariant: "split",
  timelineLayout: "horizontal-dots",
};

export const assets = {
  favicon: "/assets/favicon.svg",
  resume: "/assets/resume.pdf",
  portrait: "",
  ogImage: "/assets/og.png",
};

export const profile = {
  name: "Kartikey Choudhary",
  role: "Senior Software Engineer · Full Stack Developer",
  handle: "kartikeychoudhary",
  location: "India",                     // TODO: set to your current city if you'd like it shown
  availability: "Open to opportunities",
  email: "kartikey31choudhary@gmail.com",
  phone: "",
  social: {
    github:    "https://github.com/kartikeychoudhary",
    linkedin:  "https://www.linkedin.com/in/kartikeychoudhary/",
    x:         "",                       // not listed publicly — add if you want it
    instagram: "https://www.instagram.com/kartikey31choudhary",
    mail:      "mailto:kartikey31choudhary@gmail.com",
  },
  stats: [
    { n: "6",  suffix: "+", l: "Years shipping" },
    { n: "5",  suffix: "+", l: "Spot awards" },
    { n: "4",  suffix: "",  l: "Companies shipped with" },
  ],
};

export const nav = {
  enabled: true,
  links: [
    { t: "Skills",     h: "#skills"     },
    { t: "Experience", h: "#experience" },
    { t: "Contact",    h: "#contact"    },
  ],
  showResumeButton: true,
  showContactButton: true,
};

export const hero = {
  enabled: true,
  eyebrow: "Open to opportunities",
  title: {
    before: "Senior ",
    serif: "full\u2011stack",
    middle: " engineer shipping ",
    stroke: "resilient",
    after: " systems.",
  },
  lead:
    "Hi, I'm **Kartikey Choudhary** — I build products end-to-end with **Java, Spring** and **Angular**. Six years across enterprise BI, fintech tooling for Citi, and internal platforms.",
  primaryCta: { label: "See experience",  href: "#experience" },
  ghostCta:   { label: "Download résumé", href: "/assets/resume.pdf" },
  chips: [
    { tag: "@Service", value: "KyvosService",       pos: "top-l" },
    { tag: "ng",       value: "<app-dashboard />",  pos: "mid-l" },
    { tag: "5+",       value: "spot awards",        pos: "bot-r" },
  ],
};

export const skills = {
  enabled: true,
  eyebrow: "01 — What I work with",
  heading: { before: "A stack chosen for ", serif: "longevity", after: ", not novelty." },
  sub:
    "Battle-tested tools I reach for across the stack. Strong on the Java/Spring + Angular line, comfortable wiring the rest.",
  items: [
    {
      cat: "Backend",
      title: "Java & Spring ecosystem",
      tags: [
        { t: "Java", p: true }, { t: "Spring", p: true }, { t: "Spring Boot" },
        { t: "Servlets" }, { t: "JWT" }, { t: "SSO" }, { t: "REST APIs" },
      ],
    },
    {
      cat: "Frontend",
      title: "Angular & TypeScript",
      tags: [
        { t: "Angular", p: true }, { t: "TypeScript", p: true }, { t: "RxJS" },
        { t: "Ag-Grid" }, { t: "React" }, { t: "Node.js" }, { t: "HTML/CSS" },
      ],
    },
    {
      cat: "Data",
      title: "Databases & integrations",
      tags: [
        { t: "Oracle DB", p: true }, { t: "SQL" }, { t: "Firebase" }, { t: "Kyvos BI" },
      ],
    },
    {
      cat: "Tools & Ops",
      title: "Ship & collaborate",
      tags: [
        { t: "Docker", p: true }, { t: "Git", p: true }, { t: "Android Studio" },
        { t: "MATLAB" },
      ],
    },
  ],
};

export const experience = {
  enabled: true,
  eyebrow: "02 — Where I've shipped",
  heading: { before: "My career & ", serif: "experience", after: "." },
  sub: "Scroll through the timeline. Tap any role for the full story — impact, stack, and what I'd do differently.",
  items: [
    {
      company: "IDeaS — A SAS Company", mark: "I",
      role: "Senior Software Engineer",
      period: "2025 — Present", year: "2025 · Now", location: "India",
      summary: "Senior engineer at IDeaS, a SAS company — building revenue management software used across the hospitality industry.",
      highlights: [
        "Senior engineering role focused on full-stack delivery.",
      ],
      stack: ["Java", "Spring", "Angular"],
    },
    {
      company: "Intellicus Technologies", mark: "I",
      role: "Software Engineer",
      period: "2022 — 2025", year: "2022 – 2025", location: "Indore, India",
      summary: "Worked on the Kyvos BI tool across the full stack — Angular on the front-end, Spring + legacy Servlets on the back-end, Oracle DB.",
      highlights: [
        "Designed, developed and demonstrated modules published in future releases.",
        "Received a start-of-month award.",
        "Undertook initiatives to update the Angular application-wide.",
      ],
      stack: ["Java", "Spring", "Oracle DB", "Angular", "Servlets"],
    },
    {
      company: "Xoriant Solutions", mark: "X",
      role: "Software Engineer",
      period: "2021 — 2022", year: "2021 – 2022", location: "Pune, India",
      summary: "Full-stack developer on a Citi client engagement — Spring + Oracle + Angular + Ag-Grid.",
      highlights: [
        "Designed, developed and demonstrated modules published in future releases.",
        "Received two Spot Awards for outstanding work.",
        "Built a PDF parsing system that automated a client's internal process and improved productivity.",
      ],
      stack: ["Java", "Spring", "Oracle DB", "Angular", "Ag-Grid"],
    },
    {
      company: "Xoriant Solutions", mark: "X",
      role: "Associate Software Engineer",
      period: "2020 — 2021", year: "2020 – 2021", location: "Pune, India",
      summary: "Full-stack developer on internal projects — Spring + Angular with JWT/SSO auth. Built modules from scratch and owned them through to deployment.",
      highlights: [
        "Delivered five modules end-to-end.",
        "Received two Spot Awards for outstanding performance.",
        "Owned the full cycle: build → demo → feedback → deploy.",
      ],
      stack: ["Java", "Spring", "Angular", "JWT", "SSO"],
    },
    {
      company: "IBM Delhi", mark: "I",
      role: "Intern",
      period: "2018 · 6 weeks", year: "2018", location: "Delhi, India",
      summary: "Internship at Allsoft Solutions & Service Pvt. Ltd. (IBM Delhi) on Project MediBook — a healthcare booking Android app.",
      highlights: [
        "Built MediBook — healthcare booking — using Core Java, Android Studio, XML.",
        "Integrated Google Firebase for real-time data and auth.",
      ],
      stack: ["Android", "Core Java", "Android Studio", "XML", "Firebase"],
    },
    {
      company: "N.C.A.O.R.", mark: "N",
      role: "Intern",
      period: "2017", year: "2017", location: "Goa, India",
      summary: "Internship at the National Centre for Antarctica and Ocean Research. Used MATLAB image processing to estimate glacier melt rates in Antarctica from 2005–2016 imagery.",
      highlights: [
        "Image-processing pipeline in MATLAB over a decade of satellite imagery.",
        "Modelled glacier-melt rates as part of ongoing climate research.",
      ],
      stack: ["MATLAB", "Image Processing"],
    },
  ],
};

// No public data on degree / certifications from the source site — disabled.
// Set enabled: true and fill `items` to surface the section.
export const education = {
  enabled: false,
  eyebrow: "03 — Foundations",
  heading: { before: "Education & ", serif: "credentials", after: "." },
  sub: "Degrees and certifications that underpin how I approach systems today.",
  items: [],
};

// No public projects list on the source site — disabled. Flip on and add items
// when you want to showcase personal / open-source work.
export const projects = {
  enabled: false,
  eyebrow: "04 — Selected work",
  heading: { before: "Projects I'm ", serif: "proud", after: " of." },
  sub: "A handful of systems I designed, built, or led.",
  items: [],
};

// Disabled until real GitHub stats are wired up.
export const github = {
  enabled: false,
  eyebrow: "05 — Open source",
  heading: { before: "On ", serif: "GitHub", after: ", lately." },
  sub: "I contribute to a handful of libraries and maintain a couple.",
  stats: {
    repos:    { val: 0,   sub: "" },
    stars:    { val: "0", em: "",  sub: "" },
    contribs: { val: "0", sub: "" },
    streak:   { val: 0,   sub: "" },
  },
  contrib: { title: "Commit activity · last 12 months", range: "", seed: 42 },
};

// Blog is a separate route on the source site — this section is for featured
// posts on the landing page. Disabled until you want to feature any.
export const writing = {
  enabled: false,
  eyebrow: "06 — Writing",
  heading: { before: "Notes from the ", serif: "build", after: "." },
  allPostsHref: "/blog",
  posts: [],
};

export const contact = {
  enabled: true,
  eyebrow: "07 — Get in touch",
  heading: { before: "Let's build something ", serif: "thoughtful", after: "." },
  lead:
    "Have a question or want to work together? Drop a note and I'll get back to you.",
  links: [
    { type: "email",  lbl: "Email",    val: "kartikey31choudhary@gmail.com",                 href: "mailto:kartikey31choudhary@gmail.com" },
    { type: "github", lbl: "GitHub",   val: "@kartikeychoudhary",                            href: "https://github.com/kartikeychoudhary" },
    { type: "map",    lbl: "Based in", val: "India",                                         href: "#" },
  ],
  consent: "I'll only use your email to reply.",
  form: {
    submission: {
      // turnstile | lambda | gotify | custom | mock
      type: "turnstile",
      turnstile: {
        siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
        endpoint: import.meta.env.VITE_WORKER_URL || "",
      },
      lambda: {
        endpoint: "https://YOUR-LAMBDA.lambda-url.us-east-1.on.aws/",
        headers: { "Content-Type": "application/json" },
      },
      gotify: {
        endpoint: "https://gotify.example.com/message",
        token: "YOUR_APPLICATION_TOKEN",
        priority: 5,
        titleTemplate: "Portfolio · {subject}",
        messageTemplate: "From {name} <{email}>\n\n{message}",
      },
      custom: {
        endpoint: "https://your-api.example.com/contact",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    },
    ddos: {
      honeypotField: "website",
      minSubmitMs: 1500,
      rateLimit: { maxPerWindow: 3, windowMs: 10 * 60 * 1000 },
    },
  },
};

export const footer = {
  enabled: true,
  legal: "© 2026 Kartikey Choudhary",
};

export const notifications = {
  position: "bottom-right",
  durationMs: 4500,
  maxStack: 3,
};

export default {
  ENV_NAME, site, assets, profile, nav, hero, skills, experience,
  education, projects, github, writing, contact, footer, notifications,
};
