# Cross-Browser And Device Matrix

## Playwright projects
- `chromium`: desktop Chrome baseline.
- `firefox`: desktop Firefox compatibility.
- `webkit`: Safari-class rendering and layout checks.
- `mobile-chrome`: Pixel 7 viewport and touch emulation.
- `mobile-safari`: iPhone 13 viewport and touch emulation.

## Scenarios to verify
- Home page opens and primary navigation works.
- Room setup form accepts dimensions and shows server-calculated metrics.
- AI recommendation demo renders recommendation cards and action buttons.
- Layout remains usable on narrow mobile viewports.

## Reproducible run command
- Install browsers once: `npm run test:e2e:install`
- Run the current smoke matrix: `npm run test:e2e:matrix`

## Current result table

| Project | Device/browser class | Covered smoke scenarios | Latest status |
| --- | --- | --- | --- |
| `chromium` | Desktop Chrome | room validation, style+save, AI demo | Passed |
| `firefox` | Desktop Firefox | room validation, style+save, AI demo | Passed |
| `webkit` | Desktop Safari-class | room validation, style+save, AI demo | Passed |
| `mobile-chrome` | Pixel 7 emulation | room validation, style+save, AI demo | Passed |
| `mobile-safari` | iPhone 13 emulation | room validation, style+save, AI demo | Passed |

Latest verification: 2026-04-16, `15/15 passed`.

## Current artifact status
- Automated coverage is configured in `playwright.config.ts`.
- Core E2E flows are implemented in `e2e/room-designer.spec.ts`.
- Run `npm run test:e2e:matrix` after installing browsers to execute the minimum reproducible matrix locally.
