# Testing

## 1.1.1 acceptance

Run npm test, npm run check and npm run build. Test the actual dist/site/index.html from file URLs and local HTTP in supported browser engines: review results, custom keep override, invalid URL handling, redacted audit, profile export/import and no destination requests. Source modules require a local HTTP server; only built HTML claims direct offline file launch. Clipboard denial must be actionable, not an uncaught error.

## 1.2.0 host policies

Verify exact/subdomain matching, Unicode and trailing-dot normalization, keep precedence, version 1/2 profile import, invalid/oversized policies, unchanged query bytes and no destination requests. Browser acceptance covers adding, replacing, deleting, exporting and importing policies in the actual offline build. Never persist pasted URLs.
