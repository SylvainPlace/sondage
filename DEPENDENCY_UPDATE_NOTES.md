# Dependency update notes

This branch updates the Next.js requirement to `^16.4.6` and overrides the transitive `@node-minify/core` package to `11.0.0`.

The existing `package-lock.json` was not regenerated in this change. It still records Next.js 16.4.3 and `@node-minify/core` 9.0.2 (including its existing nested `glob` and `minimatch` entries). Run `npm install` with the repository's supported Node/npm toolchain, review the resulting lockfile diff and test the application before merging. Do not use `npm ci` against this branch until the lockfile has been refreshed to match `package.json`.
