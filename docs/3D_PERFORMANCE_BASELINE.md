# 3D Performance Baseline

## Scope
- Validate that rendering presets degrade gracefully across `low`, `medium`, and `high` device classes.
- Confirm LOD thresholds and texture quality presets behave deterministically.
- Keep a lightweight manual checklist for live browser profiling.

## Automated coverage
- `lib/__tests__/three-performance-utils.test.ts` verifies:
  - LOD tier selection by camera distance.
  - Quality presets for weaker vs stronger devices.
  - Texture optimization scaling.

## Manual profiling checklist
- Open `/room` and confirm the 3D scene loads without blocking the room form.
- In browser devtools, record a short performance profile while orbiting the camera for 10-15 seconds.
- Watch FPS stability, scripting time, and GPU rasterization spikes while changing room dimensions.
- Repeat once with desktop viewport and once with mobile emulation.

## Suggested capture points
- Initial scene load.
- Room resize and validation.
- Adding several AI-recommended items.
- Camera orbit and zoom interactions.

## Acceptance targets
- No crash or blank canvas during scene initialization.
- Interaction remains responsive after room validation.
- Lower-end preset disables expensive rendering features instead of failing.
