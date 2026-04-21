// =============================================================================
//  DEFAULT DEVELOPMENT ENV — shipped inside the Docker image.
// -----------------------------------------------------------------------------
//  The container copies this file into src/config/environment.development.js
//  at startup when the user has NOT mounted a custom one at
//  /config/environment.development.js. Override by mounting your own.
// =============================================================================

import content from "./content.default.json";
import deepMerge from "./deepMerge.js";

const env = import.meta.env;

function pickSubmissionType() {
  const forced = env.VITE_CONTACT_SUBMISSION_TYPE;
  if (forced) return forced;
  if (env.VITE_TURNSTILE_SITE_KEY && env.VITE_WORKER_URL) return "turnstile";
  if (env.VITE_LAMBDA_ENDPOINT) return "lambda";
  if (env.VITE_GOTIFY_ENDPOINT && env.VITE_GOTIFY_TOKEN) return "gotify";
  if (env.VITE_CUSTOM_ENDPOINT) return "custom";
  return "mock";
}

const overrides = {
  ENV_NAME: "development",
  site: {
    title: `${content.site.title} (dev)`,
  },
  contact: {
    form: {
      submission: {
        type: pickSubmissionType(),
        turnstile: {
          siteKey: env.VITE_TURNSTILE_SITE_KEY || "",
          endpoint: env.VITE_WORKER_URL || "",
        },
        lambda: {
          endpoint: env.VITE_LAMBDA_ENDPOINT || "",
          headers: { "Content-Type": "application/json" },
        },
        gotify: {
          endpoint: env.VITE_GOTIFY_ENDPOINT || "",
          token: env.VITE_GOTIFY_TOKEN || "",
          priority: Number(env.VITE_GOTIFY_PRIORITY) || 5,
          titleTemplate: env.VITE_GOTIFY_TITLE_TEMPLATE || "Portfolio · {subject}",
          messageTemplate: env.VITE_GOTIFY_MESSAGE_TEMPLATE || "From {name} <{email}>\n\n{message}",
        },
        custom: {
          endpoint: env.VITE_CUSTOM_ENDPOINT || "",
          method: env.VITE_CUSTOM_METHOD || "POST",
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
