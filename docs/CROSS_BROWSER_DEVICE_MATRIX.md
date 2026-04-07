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

## Current artifact status
- Automated coverage is configured in `playwright.config.ts`.
- Core E2E flows are implemented in `e2e/room-designer.spec.ts`.
- Run `npm run test:e2e` after installing browsers to execute the matrix locally.
