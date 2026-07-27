# Changelog

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
