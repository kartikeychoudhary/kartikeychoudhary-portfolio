# Assets

Drop your files here and reference them in `src/config/environment.*.js` under `assets`.

Suggested files:

| File                | Referenced in env       | Used by                  |
| ------------------- | ----------------------- | ------------------------ |
| `favicon.svg`       | `assets.favicon`        | browser tab icon         |
| `resume.pdf`        | `assets.resume`         | Nav "Résumé" button, hero CTA |
| `portrait.jpg`      | `assets.portrait`       | Hero split variant (SVG fallback when empty) |
| `og.png`            | `assets.ogImage`        | social share image       |

Anything in `/public/assets/` is served from the site root as `/assets/<filename>`.
