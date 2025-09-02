## Deployment Guide (manual version overrides)

This repository supports environment-based publishes with optional per-package version overrides via the CI - Publish & Build workflow (workflow_dispatch).

### Environments and dist-tags
- dev: publishes with pre-release semantics; resolves external deps from `alpha` dist-tag (fallback to `latest` if `alpha` not found)
- stage: publishes with pre-release semantics; resolves from `beta` (fallback to `latest`)
- prod: publishes stable; resolves from `latest`

Pre-release tagging in GitHub:
- dev → `release/<version>-alpha`
- stage → `release/<version>-beta`
- prod → `release/<version>`

### Registries per environment
- dev: `${{ vars.NEXUS_DEV_REGISTRY_URL }}`
- stage: `${{ vars.NEXUS_STAGE_REGISTRY_URL }}`
- prod: `${{ secrets.NEXUS_REGISTRY_URL }}`

The active registry is printed in job logs and the job summary.

### Triggering a publish
1) Open GitHub Actions → CI - Publish & Build → Run workflow
2) Set inputs:
   - environment: `dev` | `stage` | `prod`
   - services: usually `package-publish` or `all`
   - dry_run: `true` to validate only (no publish, no tags, no pushes)
   - versions (optional): comma-separated overrides

### versions input format
Use short keys mapped to full packages. Omit to auto-resolve from env dist-tags.

Supported keys → packages:
- `core` → `@to-nexus/core`
- `universal` → `@to-nexus/universal-provider`
- `sign-client` → `@to-nexus/sign-client`
- `sdk` → `@to-nexus/sdk`

Examples:
- Use specific prerelease for core and sdk:
  - `core=2.19.11-alpha.2,sdk=1.17.0-alpha.1`
- Pin sign-client stable and let others auto-resolve:
  - `sign-client=2.19.11`
- Leave blank to auto-resolve all from env tags (`alpha`/`beta`) with fallback to `latest`:
  - `` (empty string)

Resolution rules:
- If `versions` contains `key=version`, that exact version is used
- Else (no override):
  - dev: resolve `@<alpha>`; if missing, use `@latest`
  - stage: resolve `@<beta>`; if missing, use `@latest`
  - prod: resolve `@latest`

### Version from branch name (release/*)
If you run on a `release/*` branch, the workflow uses the suffix as the base version (strips leading `v` only for writing package versions) and enters Changesets pre-mode:
- dev → `alpha`
- stage → `beta`

Note: Pre-release counters (e.g., `-alpha.2`) increment if pre-mode/version steps are re-run. To reset, exit pre-mode before re-entering.

### Build scope
The CI installs and builds only `packages/**`. Example apps in `examples/**` are excluded from install/upgrade to prevent conflicts with unpublished versions.

### Dry run
- `dry_run: true` performs build and validation only; publish, tag, and push steps are skipped. Use job summary/logs to verify the target registry and resolved versions.


