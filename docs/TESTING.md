# Testing Guide

## What is covered
- Unit tests for budget rules in `store/room-store.ts`.
- Unit tests for 3D performance helpers in `lib/three-utils.ts`.
- Integration tests for AI API routes and room validation routes.
- E2E tests for the landing-to-room flow and AI recommendation demo flow.
- Playwright projects for Chromium, Firefox, WebKit, Android Chrome emulation, and iPhone Safari emulation.

## Commands
- Install Playwright browsers: `npm run test:e2e:install`
- Run all Jest tests: `npm test`
- Run unit-focused Jest tests: `npm run test:unit`
- Run integration route tests: `npm run test:integration`
- Run all E2E tests: `npm run test:e2e`
- Run the reproducible browser/device matrix on the core smoke spec: `npm run test:e2e:matrix`
- Run E2E tests with visible browser: `npm run test:e2e:headed`
- Collect reproducible 3D performance evidence: `npm run perf:3d`

## Notes
- E2E tests start the app on `http://127.0.0.1:3100` through `playwright.config.ts`.
- The AI recommendation E2E scenario mocks `/api/ai/recommendations` to stay deterministic and offline-friendly.
- Route integration tests mock external AI providers and verify local fallback behavior plus RUB-specific formatting.
- 3D perf evidence is captured from `/room/performance` and saved to `docs/perf-evidence/3d-performance-baseline.json`.

## Browser/device matrix evidence
- Matrix execution uses the existing Playwright projects from `playwright.config.ts`: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`.
- The reproducible smoke spec is `e2e/room-designer.spec.ts` and it verifies three user-facing flows on every project:
  - landing page -> room setup -> room dimension validation and server metrics;
  - room setup -> style apply -> local project save;
  - `/api-demo` -> mocked AI recommendations -> add recommendation to budget.
- Latest local verification on 2026-04-16: `15/15 passed` via `npm run test:e2e:matrix`.
- Treat this command as the minimum honest confirmation for task `15.5` until the E2E scope expands.
