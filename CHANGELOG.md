# Changelog

This file records changes from 2.0.0 onward. See [GitHub releases](https://github.com/Adoratorio/hades/releases) for published release notes. Dates are shown where a matching GitHub release exists.

## Unreleased

### Documentation

- Refine contributor guidance and release notes; consolidate maintainer contacts in the README.

## [2.0.0](https://github.com/Adoratorio/hades/releases/tag/v2.0.0) — 2026-09-08

### Breaking changes

- Use native ES modules; CommonJS builds are not provided.
- Requires `@adoratorio/aion` ^1.0.1 and `@adoratorio/hermes` ^2.0.0.

### Changes

- Add a `debug` option and consistent `[Hades]` errors.
- The frame delta is clamped to the active duration (no overshoot on short `scrollTo`); the smoothing settles once closer than 0.01px, so `still` and StartStop follow the visual stop.
- Starting from still is not a direction change; user input during a `scrollTo` continues from the rendered position.
- The `easing` setter applies the new duration; nested options are merged; plugin names must be unique; `destroy()` clears plugins.
- Plugins receive a copy of the Hermes event; wheel hooks and global listeners see the raw delta.
- Scrollbars: default viewport is the document element, works with any renderer exposing boundaries, proportional thumb, pointer capture, hides once settled.
- VirtualRender uses the layout size for boundaries and skips unchanged transforms; StartStop compares coarse-pointer samples; DragAndScroll uses pointer capture and scoped `user-select`.
- Clamp programmatic virtual scrolling and synchronize resized boundaries.
- Unify cached native scroll ranges and preserve nested scroll input and browser zoom.
- Initialize native renderers from existing scroll positions and synchronize node replacements.
- Release drag capture and restore owned styles on teardown.
- Update scrollbar geometry after resize and provide keyboard navigation.
- Support typed partial nested options, immediate easing and opt-in respectReducedMotion.

### Maintenance

- Update the development toolchain to TypeScript 7.
- Include source files and inline source maps for consumer debugging.
- Typecheck tests and verify packed exports.
