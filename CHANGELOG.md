# Changelog

## 1.3.1 - 2026-10-17

- Show credential and state-fragment warnings for URLs without a query, matching the existing query-bearing review behavior.
- Preserve unchanged URL bytes and both redacted and complete audit modes.

## 1.3.0 - 2026-10-17

- Preserve empty query segments and untouched query markers instead of silently normalizing them.
- Load host policies into the editor, with explicit save/cancel and collision checks when changing the hostname.

## 1.2.0 - 2026-10-17

- Redacted audit exports now hide complete URL fragments, which can contain access tokens or private application state. Ordinary cleaned URLs and explicitly unredacted exports retain their fragments.

- Decode query names once when applying custom rules, preserving double-encoded functional names.

- Add host-specific remove/keep policies with exact matching and explicit subdomain matching.
- Export version 2 portable profiles and continue importing version 1 global profiles.
- Keep policies in the tab until explicitly exported; do not store pasted URLs.

## 1.1.1 - 2026-10-17

- Restore the missing summary target so review results render.
- Build a self-contained offline HTML distribution while retaining readable sources and license.
- Handle unavailable clipboard access and allow downloads to finish before releasing object URLs.
- Add cross-file selector and built-distribution regressions.

## [1.1.0] - 2026-07-27

- Added portable JSON import and export for custom remove and keep rule profiles.
- Added a privacy-safe audit mode, enabled by default, that removes embedded credentials and redacts parameter values.
- Retained an explicit unredacted export option for users who need complete local review records.

## [1.0.0] - 2026-07-21

- Added local batch cleaning for absolute HTTP and HTTPS URLs.
- Added conservative built-in tracking rules and exact/prefix custom rules.
- Added keep-rule precedence, removal explanations, preserved query bytes, and fragment warnings.
- Added copy-ready output and versioned JSON audit export.
- Added responsive light/dark interface, automated tests, release build, CI, CodeQL, and GitHub Pages deployment.

[1.0.0]: https://github.com/loganpendragonmultiverse/url-parameter-cleaner/releases/tag/v1.0.0
[1.1.0]: https://github.com/loganpendragonmultiverse/url-parameter-cleaner/releases/tag/v1.1.0
