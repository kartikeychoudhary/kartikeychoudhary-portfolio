// =============================================================================
//  DEVELOPMENT ENVIRONMENT CONFIG
// -----------------------------------------------------------------------------
//  Portfolio content lives in ./content.default.json (edit via /#/editor and
//  export). This file layers in environment-specific overrides — the dev title
//  suffix, the mock contact-form adapter, and secret-sourced Turnstile keys.
// =============================================================================

import content from "./content.default.json";
import deepMerge from "./deepMerge.js";

const overrides = {
  ENV_NAME: "development",
  site: {
    title: `${content.site.title} (dev)`,
  },
  contact: {
    form: {
      submission: {
        // turnstile | lambda | gotify | custom | mock
        type: "mock",
        turnstile: {
          siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || "",
          endpoint: import.meta.env.VITE_WORKER_URL || "",
        },
        lambda: {
          endpoint: "https://your-lambda-url.lambda-url.us-east-1.on.aws/",
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
  },
};

const merged = deepMerge(content, overrides);

export default merged;
