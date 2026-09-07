# Contributing

Use the pnpm version in package.json and Node 24 (the CI runtime).
Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` and `pnpm build`.
`pnpm format` applies the shared style. Typechecking includes the tests.

Keep classes, public exports (including dist subpaths), callback order and
existing defaults compatible. Reproduce a bug with a focused test before
fixing it. Destroy test instances and restore mocks after every test.
Changes to animation feel, input sensitivity or continuous plugin callbacks
need explicit opt-in or a planned breaking release.

Validate browser behavior with real layout, nested containers, keyboard input,
reduced motion, dynamic content and repeated mount/destroy cycles. Simulated
DOM tests cannot establish browser rendering or touch-device compatibility.
Keep import-time code safe in SSR; construct DOM plugins in a client-only hook.

Run `pnpm test:package` after building to install the actual archive in a
fresh temporary consumer and verify its exports and TypeScript declarations.
For unpublished dependencies, pass their built repository directories as
arguments: `pnpm test:package ../aion ../hermes` (only those actually needed).
The script packs dependencies; it never publishes them.

Record user-visible changes under Unreleased in CHANGELOG.md. Require review
from a different current maintainer. Agree on versions, tags, push and npm
publication separately; no local check publishes or pushes anything.
For dependent packages, publish and verify their required dependency versions
first. Prefer npm trusted publishing when the release workflow is configured.
