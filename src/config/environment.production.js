// =============================================================================
//  PRODUCTION ENVIRONMENT CONFIG
// -----------------------------------------------------------------------------
//  Portfolio content lives in ./content.default.json (edit via /#/editor and
//  export the updated JSON back over this file). This module layers in the
//  environment-specific bits: contact-form submission type, endpoints, and
//  secret-sourced Turnstile keys that must never be baked into the JSON.
// =============================================================================

import content from "./content.default.json";
import deepMerge from "./deepMerge.js";

const overrides = {
  ENV_NAME: "production",
  contact: {
    form: {
      submission: {
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
  },
};

const merged = deepMerge(content, overrides);

export default merged;
