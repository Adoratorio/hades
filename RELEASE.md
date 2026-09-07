# Release preparation

No local check pushes, tags or publishes the package.

Before a release:

1. Confirm the required Aion and Hermes versions are available on npm.
2. Generate the lockfile from the registry without local `link:`, `file:` or
   `workspace:` dependencies.
3. Run a frozen install, `pnpm check`, `pnpm test`, `pnpm build`,
   `pnpm test:package` and `pnpm test:browser`.
4. Review the version and changelog before approving push and publication.
