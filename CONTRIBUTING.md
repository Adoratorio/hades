# Contributing to Hades

Bug reports, documentation improvements and focused pull requests are welcome.
For a new feature or a public API change, open an issue first to discuss the use case.

## Report an issue

Use [GitHub Issues](https://github.com/Adoratorio/hades/issues). Include the package version,
your runtime or browser, a minimal reproduction, and the expected and actual behavior.

## Local development

Clone your fork and use Node.js 24 with the pnpm version declared in `package.json`.
From the repository root, run:

```sh
pnpm install --frozen-lockfile --trust-lockfile
pnpm check
pnpm test
pnpm build
pnpm test:package
```

`pnpm check` runs typechecking, linting and formatting checks. Use `pnpm format`
to apply formatting. `pnpm test:package` installs the built archive in a temporary
consumer project and checks imports, declarations and source maps.

## Scope and validation

Keep changes focused. Add a regression test for bug fixes and update examples when
the public API changes. Preserve public exports, including supported `dist` subpaths.

Cover scrolling boundaries, interrupted movement, nested scrollers, renderer changes and plugin teardown. Check keyboard input, browser zoom, reduced motion, resize and repeated mount/destroy cycles. Preserve the default scrolling feel and continuous plugin callbacks; changes to these defaults require an agreed breaking release.

To test unpublished dependency changes, build those repositories first, then run
`pnpm test:package ../aion ../hermes` with paths to your local checkouts.

### Browser checks

After building, run `pnpm test:browser` with Playwright and its browser installed.
The default browser is Chromium. Set `BROWSER=firefox` or `BROWSER=webkit` to use
another installed browser, or `BROWSER_CHANNEL=chrome` for an installed Chrome.
An existing Playwright installation can be selected with
`PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs`.

These checks use real browser layout. Changes to touch behavior also need testing
on a physical device. Browser checks are separate from the default CI job.

## Pull requests

Describe the problem, the resulting behavior and how you verified it. Include any
compatibility impact and add user-facing changes to `Unreleased` in `CHANGELOG.md`.
A current maintainer other than the author should review each change; maintainers
are listed in the [README](README.md#maintainers).

## Releases

Maintainers coordinate the version and release owner. Before publishing, run the
checks above, confirm dependency versions are available, and move the relevant
`Unreleased` notes into a dated version entry.

Release notes should explain the user impact, identify breaking changes and give
concrete upgrade steps. Keep titles and headings plain, without emoji. Use the
changelog as the source for release notes and link to the relevant comparison.

CI validates changes; publishing is a separate maintainer operation.
