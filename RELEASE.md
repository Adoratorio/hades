# Release preparation

No push, tag or npm publication is performed by the local checks.

Hades 2.0 requires `@adoratorio/hermes@^2.0.0`. That version was not available
from npm when this branch was validated. The local development installation
uses a sibling Hermes checkout through an ignored pnpm-workspace.yaml; its
modified lockfile contains a local link and must not be published as the
standalone repository lockfile.

Before approving a Hades push/release:

1. Review and release Hermes 2.0 first. Agree on the Aion patch release as well.
2. Save/remove the local development override, then regenerate the Hades
   lockfile with `pnpm install --lockfile-only --ignore-scripts` against the
   published dependencies. Do not hand-write integrity hashes or assume the
   local tarball has the registry checksum.
3. Commit the regenerated portable lockfile and verify a fresh
   `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`,
   and `pnpm test:package` without sibling checkouts.
4. Review versions/changelog, then separately approve push, tag and publishing.

The existing CI uses frozen-lockfile installation: it will not be green on a
standalone checkout until step 3. This is an explicit release prerequisite,
not something to bypass with a non-frozen install or a silent link in CI.

Before Hermes is published, the executable packed-consumer check is:

```sh
pnpm test:package ../aion ../hermes
```

Build the sibling packages first. This installs their real npm archives in a
fresh temporary consumer, without publishing anything.
