# Release Process

This document describes the automated release workflow for Platito.

## Overview

Releases are managed through two GitHub Actions workflows that together handle the full lifecycle: branch creation, changelog update, PR to main, GitHub Release creation, and backport to develop.

```
develop ──► release/X.Y.Z ──► main ──► backport/X.Y.Z ──► develop
                          (PR)     (Release)           (PR)
```

## Prerequisites

Before running a release for the first time, enable **Allow auto-merge** in the repository:

> GitHub → Settings → General → Pull Requests → Allow auto-merge

Without this, the workflows will still create the PRs but they will need to be merged manually.

## How to trigger a release

1. Go to **Actions → Create Release → Run workflow**
2. Enter the version number following [Semantic Versioning](https://semver.org/) (e.g. `1.9.0`)
3. Click **Run workflow**

Everything else is automatic.

## What happens step by step

### Phase 1 — `release.yml` (triggered manually)

| Step | What it does |
|---|---|
| Checkout develop | Starts from the current state of `develop` |
| Create release branch | Creates `release/X.Y.Z` from `develop` |
| Bump version | Updates `package.json` and `package-lock.json` |
| Update CHANGELOG.md | Moves `[Unreleased]` content to `[X.Y.Z] - YYYY-MM-DD` and updates comparison links |
| Commit & push | Commits as `chore: release X.Y.Z` and pushes the branch |
| Create PR | Opens `release/X.Y.Z → main` with title `release: X.Y.Z` |
| Auto-merge | Enables auto-merge; the PR merges once the PR check passes |

### Phase 2 — `release-finalize.yml` (triggered automatically when the release PR merges into main)

| Step | What it does |
|---|---|
| Create GitHub Release | Tags the commit and creates a release with notes extracted from CHANGELOG.md |
| Create backport branch | Creates `backport/X.Y.Z` from `develop` and merges `release/X.Y.Z` into it |
| Create backport PR | Opens `backport/X.Y.Z → develop` |
| Auto-merge | Enables auto-merge on the backport PR |

## CHANGELOG convention

The `[Unreleased]` section at the top of `CHANGELOG.md` is where all changes are documented during development. When a release is triggered, the automation:

1. Renames `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`
2. Adds a fresh empty `[Unreleased]` section above it
3. Updates the comparison links at the bottom of the file

During development, add entries under `[Unreleased]` using the standard categories:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Changed behavior description

### Fixed
- Bug fix description
```

## Conflict handling

If the backport merge has conflicts (e.g. because `develop` has new CHANGELOG entries), the workflow will:

- Skip the auto-merge
- Print a warning in the Actions log
- Leave the backport PR creation incomplete

In this case, create the backport manually:

```bash
git checkout develop
git pull origin develop
git checkout -b backport/X.Y.Z
git merge origin/release/X.Y.Z
# resolve conflicts
git push origin backport/X.Y.Z
gh pr create --base develop --head backport/X.Y.Z --title "chore: backport X.Y.Z to develop"
```

## Files involved

| File | Purpose |
|---|---|
| [workflows/release.yml](workflows/release.yml) | Manual workflow — creates release branch and PR |
| [workflows/release-finalize.yml](workflows/release-finalize.yml) | Automatic workflow — GitHub Release and backport |
| [scripts/update-changelog.js](scripts/update-changelog.js) | Updates CHANGELOG.md during release creation |
| [scripts/extract-release-notes.js](scripts/extract-release-notes.js) | Extracts version notes for the GitHub Release |
