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
- Run E2E tests with visible browser: `npm run test:e2e:headed`

## Notes
- E2E tests start the app on `http://127.0.0.1:3100` through `playwright.config.ts`.
- The AI recommendation E2E scenario mocks `/api/ai/recommendations` to stay deterministic and offline-friendly.
- Route integration tests mock external AI providers and verify local fallback behavior plus RUB-specific formatting.
