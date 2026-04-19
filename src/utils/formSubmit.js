// Form submission adapters. Each receives { payload, config } and returns a
// Promise that resolves on 2xx or throws on any other outcome.

function tpl(str, vars) {
  return (str || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ""));
}

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}). ${text.slice(0, 200)}`);
  }
  return res;
}

const ADAPTERS = {
  async turnstile({ payload, config }) {
    if (!config.endpoint) throw new Error("Worker endpoint is not configured.");
    if (!payload.token) throw new Error("Please complete the verification challenge.");
    const res = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status}).`);
    }
    return res;
  },

  async lambda({ payload, config }) {
    if (!config.endpoint) throw new Error("Lambda endpoint is not configured.");
    return postJson(config.endpoint, payload, config.headers);
  },

  async gotify({ payload, config }) {
    if (!config.endpoint || !config.token) {
      throw new Error("Gotify endpoint or token is not configured.");
    }
    const url = `${config.endpoint}?token=${encodeURIComponent(config.token)}`;
    const body = {
      title: tpl(config.titleTemplate || "Portfolio · {subject}", payload),
      message: tpl(config.messageTemplate || "From {name} <{email}>\n\n{message}", payload),
      priority: config.priority ?? 5,
    };
    return postJson(url, body);
  },

  async custom({ payload, config }) {
    if (!config.endpoint) throw new Error("Custom endpoint is not configured.");
    const res = await fetch(config.endpoint, {
      method: config.method || "POST",
      headers: { "Content-Type": "application/json", ...(config.headers || {}) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status}).`);
    return res;
  },

  async mock({ payload }) {
    // eslint-disable-next-line no-console
    console.info("[contact:mock] would submit →", payload);
    return new Promise((r) => setTimeout(() => r({ ok: true }), 600));
  },
};

export async function submitContact(payload, submission) {
  const type = submission?.type || "mock";
  const adapter = ADAPTERS[type];
  if (!adapter) throw new Error(`Unknown submission type: ${type}`);
  const config = submission[type] || {};
  return adapter({ payload, config });
}
