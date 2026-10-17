# Development handoff

## Version 1.1.0 contract

The application is a dependency-free, local-only URL review tool. Its core safety policy is conservative removal: remove only established tracking names or explicit user rules, preserve unknown parameters, show each decision, and never request a supplied URL.

The release includes batch input, exact and prefix custom rules, portable rule profiles, keep-rule precedence, value-preserving query filtering, fragment preservation, invalid-scheme rejection, copy output, and redacted-by-default audit JSON export.

## Boundaries

- Do not add link expansion, URL fetching, analytics, accounts, cloud sync, or remote rule delivery.
- Do not classify ambiguous parameters as tracking without evidence and adversarial tests.
- Do not store pasted URLs automatically.
- Do not silently alter paths, fragments, preserved encodings, or parameter order.
- Any export change must consider URL credentials, tokens, and other sensitive values.

## Verification

```console
npm test
npm run check
npm run build
```

Core behavior remains covered by the Node test and coverage suite; release claims must be refreshed from the current run rather than copied from an older version.

The release workflow derives the downloadable ZIP filename from the pushed `v*` tag. Never hardcode an older package version in deployment or release automation.

## 1.1.1 acceptance

Run npm test, npm run check and npm run build. Test the actual dist/site/index.html from file URLs and local HTTP in supported browser engines: review results, custom keep override, invalid URL handling, redacted audit, profile export/import and no destination requests. Source modules require a local HTTP server; only built HTML claims direct offline file launch. Clipboard denial must be actionable, not an uncaught error.
