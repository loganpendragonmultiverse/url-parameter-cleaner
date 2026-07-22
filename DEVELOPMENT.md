# Development handoff

## Version 1.0.0 contract

The application is a dependency-free, local-only URL review tool. Its core safety policy is conservative removal: remove only established tracking names or explicit user rules, preserve unknown parameters, show each decision, and never request a supplied URL.

The release includes batch input, exact and prefix custom rules, keep-rule precedence, value-preserving query filtering, fragment preservation, invalid-scheme rejection, copy output, and audit JSON export.

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

Core behavior has 100% line and function coverage and 96%+ branch coverage in v1.0.0.

