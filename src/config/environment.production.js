// =============================================================================
//  PRODUCTION ENVIRONMENT CONFIG
// -----------------------------------------------------------------------------
//  Portfolio content lives in ./content.default.json (edit via /#/editor and
//  export the updated JSON back over this file). This module layers in the
//  environment-specific bits: contact-form submission type, endpoints, and
//  secret-sourced keys that must never be baked into the JSON.
//
//  Submission type is picked by `pickSubmissionType()` — if no Turnstile pair
//  is set we fall through to lambda / gotify / custom / mock depending on
//  which VITE_* vars are populated. Set VITE_CONTACT_SUBMISSION_TYPE to force
//  a specific adapter.
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
  ENV_NAME: "production",
  contact: {
    form: {
      submission: {
        type: pickSubmissionType(),
        turnstile: {
          siteKey: env.VITE_TURNSTILE_SITE_KEY || "",
          endpoint: env.VITE_WORKER_URL || "",
        },
        lambda: {
          endpoint: env.VITE_LAMBDA_ENDPOINT || "https://YOUR-LAMBDA.lambda-url.us-east-1.on.aws/",
          headers: { "Content-Type": "application/json" },
        },
        gotify: {
          endpoint: env.VITE_GOTIFY_ENDPOINT || "https://gotify.example.com/message",
          token: env.VITE_GOTIFY_TOKEN || "YOUR_APPLICATION_TOKEN",
          priority: Number(env.VITE_GOTIFY_PRIORITY) || 5,
          titleTemplate: env.VITE_GOTIFY_TITLE_TEMPLATE || "Portfolio · {subject}",
          messageTemplate: env.VITE_GOTIFY_MESSAGE_TEMPLATE || "From {name} <{email}>\n\n{message}",
        },
        custom: {
          endpoint: env.VITE_CUSTOM_ENDPOINT || "https://your-api.example.com/contact",
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
