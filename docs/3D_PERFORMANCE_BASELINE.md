# 3D Performance Baseline

## What is measured
- Route: `/room/performance`
- Scenario: `baseline-orbit`
- Fixture: fixed `6 x 5 x 3 m` room with `10` furniture items loaded through the real room store and main `Scene` component
- Capture mode: automated camera orbit for `12 s`, sample every `250 ms`
- Metrics: scene load time, average/min/P5 FPS, average/P95/max frame time, JS heap usage, WebGL renderer metadata

## Reproducible workflow
1. Run `npm run perf:3d`.
2. The script starts or reuses the app on `http://127.0.0.1:3100`.
3. Playwright opens `/room/performance?autorun=1&duration=12000` in Chromium headless.
4. The page loads a fixed baseline room, waits for the 3D scene to become ready, then runs an automated orbit capture.
5. Evidence is written to `docs/perf-evidence/3d-performance-baseline.json`.

## Manual inspection option
- Open `/room/performance` in a browser.
- Click `Run baseline capture`.
- Review the on-page cards for FPS, frame time, heap and renderer info.
- Click `Download JSON` if you need to attach the artifact to a task, PR or issue.

## Current baseline

Baseline evidence file: `docs/perf-evidence/3d-performance-baseline.json`

| Metric | Value | Notes |
| --- | ---: | --- |
| Capture date | 2026-04-16 | Headless Chromium run from local script |
| Duration | 12.0 s | Automated orbit |
| Scene load time | 3887.30 ms | Time until `Scene` reports ready |
| Frames rendered | 722 | Total frames during capture |
| Samples | 46 | 250 ms sample window |
| Average FPS | 59.14 | Stable near 60 FPS |
| Minimum FPS | 55.25 | Worst observed sample |
| P5 FPS | 55.87 | Lower-tail FPS guardrail |
| Average frame time | 16.92 ms | Main responsiveness indicator |
| P95 frame time | 17.90 ms | Tail latency target for smooth orbit |
| Max frame time | 18.10 ms | Worst observed frame sample |
| Max JS heap | 77.63 MB | From Chromium `performance.memory` |
| WebGL renderer | ANGLE / SwiftShader | Headless software renderer in CI-like environment |
| Device preset | high | From store device-performance heuristic |

## Interpretation
- This baseline is good enough for the repo task because it is repeatable, uses the actual room scene path, and stores evidence as JSON instead of relying on ad-hoc DevTools notes.
- FPS/frame-time/load-time are now captured in a consistent way for the primary 3D scenario.
- Renderer counters in the current headless environment remain `0`, so this baseline should be treated as authoritative for FPS/load/heap and informational for renderer identity only.
- If future work needs GPU draw-call or triangle baselines, run the same `/room/performance` page in a headed desktop browser with native GPU acceleration and attach the downloaded JSON plus a DevTools trace.

## Pass criteria for task 15.4
- There is a reproducible command: `npm run perf:3d`.
- There is a dedicated capture page: `/room/performance`.
- There is a stored evidence artifact: `docs/perf-evidence/3d-performance-baseline.json`.
- The main scenario now has concrete baseline metrics instead of a checklist.
