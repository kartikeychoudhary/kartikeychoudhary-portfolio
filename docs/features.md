# Features

Index of shipped and in-flight features. Each entry links to its own spec in
[feature/](feature/).

| Feature                          | Status   | Spec                                                            |
| -------------------------------- | -------- | --------------------------------------------------------------- |
| Serverless Contact Form          | Shipped  | [serverless-contact-form.md](feature/serverless-contact-form.md) |
| Deploy Pipeline (Pages + Worker) | Shipped  | [deploy-pipeline.md](feature/deploy-pipeline.md)                 |
| Content Editor (`/#/editor`)     | Shipped  | [content-editor.md](feature/content-editor.md)                   |

## Adding a feature

1. Add a row to the table above.
2. Create `feature/<kebab-name>.md` with: objective, architecture, functional
   + non-functional requirements, API spec (if any), config keys, and the
   deployment runbook.
3. If the feature introduces new env keys, document them in
   [../CLAUDE.md](../CLAUDE.md) under "Secrets vs. public config".
