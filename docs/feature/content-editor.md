# Content Editor

An in-app, section-by-section form for editing portfolio content with a live
preview and JSON import/export. Replaces "open the env JS file and edit by
hand" as the primary authoring workflow.

## Objective

- Make portfolio content editable without touching JavaScript syntax.
- Keep a single source of truth (`content.default.json`) for dev and prod.
- Leave environment-specific configuration (contact-form adapter, secrets,
  DDoS guards) in the env JS files where it belongs.

## Architecture

```
┌───────────────────────────────────────┐
│ src/config/content.default.json       │  ← shared portfolio content
└──────────────┬────────────────────────┘
               │ imported by
               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ environment.development.js│   │ environment.production.js │
│ (adds ENV_NAME,           │   │ (adds ENV_NAME,           │
│  contact.form.*,          │   │  contact.form.*,          │
│  Turnstile keys)          │   │  Turnstile keys)          │
└──────────────┬────────────┘   └─────────────┬────────────┘
               │ default export (deep-merged)
               ▼                              ▼
             Vite's @env alias (mode-dependent)
                           │
                           ▼
               ┌────────────────────────┐
               │ ConfigContext (default │
               │ value = envConfig)     │
               └─────────┬──────────────┘
                         │ useConfig()
            ┌────────────┴─────────────┐
            ▼                          ▼
   Sections (Nav, Hero, …)      Editor page preview
                                (ConfigProvider overrides
                                 with edited content)
```

## How it works

1. **Shared content** — `src/config/content.default.json` holds every
   content field: `site`, `assets`, `profile`, `nav`, `hero`, `skills`,
   `experience`, `education`, `projects`, `github`, `writing`, `contact`
   (eyebrow/heading/lead/links/consent), `footer`, `notifications`.
2. **Environment overrides** — `environment.development.js` and
   `environment.production.js` import the JSON and deep-merge in:
   - `ENV_NAME`
   - `site.title` suffix in dev
   - `contact.form.submission.{type, turnstile, lambda, gotify, custom}`
   - `contact.form.ddos`
   - Secrets sourced from `import.meta.env.VITE_*`
3. **Consumption** — every section reads the merged config through
   `useConfig()` (see `src/config/ConfigContext.jsx`). The hook's default
   value is the env config, so no provider is needed for the normal site.
4. **Editor route** — `#/editor` in the URL hash mounts `src/pages/Editor.jsx`
   instead of the regular layout. The editor owns its own working copy of
   `content.default.json` and renders:
   - a section-by-section collapsible form (`FieldRenderer`), and
   - a live preview below — the real section components, wrapped in a
     nested `ConfigProvider` whose value is `deepMerge(envConfig, edited)`.
     Preview is `pointer-events: none` to keep anchor links and form submits
     from firing.

## Workflow

```
/#/editor
   │
   ├─ Load JSON ────► replaces working state from an uploaded file
   ├─ Reset ────────► reloads content.default.json
   ├─ Download JSON ► serializes working state as content.default.json
   └─ Back to site ─► clears the hash, shows the real site
```

To ship a content change:

1. Open `/#/editor`.
2. Edit fields in the form; watch the preview update.
3. Click **Download JSON**.
4. Replace `src/config/content.default.json` in the repo with the downloaded
   file.
5. Commit, push — CI deploys the updated site.

## Files

| File                                   | Role                                                      |
| -------------------------------------- | --------------------------------------------------------- |
| `src/config/content.default.json`      | Single source of truth for portfolio content.             |
| `src/config/deepMerge.js`              | Recursive object merge used by env files and preview.     |
| `src/config/ConfigContext.jsx`         | `ConfigProvider` + `useConfig()` hook.                    |
| `src/config/environment.development.js`| Imports JSON, layers in dev overrides + secrets.          |
| `src/config/environment.production.js` | Imports JSON, layers in prod overrides + secrets.         |
| `src/pages/Editor.jsx`                 | Editor page: header, form, preview.                       |
| `src/pages/FieldRenderer.jsx`          | Generic form renderer (strings, numbers, booleans, arrays, nested objects). |
| `src/pages/editorState.js`             | Immutable `getAt` / `setAt` / `deleteAt` + `cloneTemplate` helpers. |
| `src/styles/editor.css`                | Editor-only styles (scoped under `.ed-*`).                |

## Non-goals

- **No persistence.** The editor does not write to disk or a backend. Download
  the JSON and commit it yourself — deliberate, to keep the site backend-free.
- **No auth gate.** The editor ships in every build and is reachable at
  `/#/editor`. It exposes no secrets and cannot mutate the deployed site, so
  a gate is unnecessary.
- **No environment-specific edits.** The editor never shows
  `contact.form.submission.*` or `contact.form.ddos` — those stay in the env
  JS files.

## What does not round-trip through the editor

Anything outside `content.default.json`. Editing these requires touching the
env JS files:

- `ENV_NAME`
- `contact.form.submission.*` (adapter type, endpoints, headers, Turnstile
  keys — the last are sourced from `VITE_*` env vars)
- `contact.form.ddos.*` (honeypot field name, min submit time, rate limits)

## Adding a new content field

1. Add the field to `content.default.json`.
2. Read it through `useConfig()` in the consuming section.
3. Rebuild — the editor picks it up automatically via `FieldRenderer`'s
   generic dispatch on value type.
