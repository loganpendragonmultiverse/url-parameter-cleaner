# Testing

## 1.1.1 acceptance

Run npm test, npm run check and npm run build. Test the actual dist/site/index.html from file URLs and local HTTP in supported browser engines: review results, custom keep override, invalid URL handling, redacted audit, profile export/import and no destination requests. Source modules require a local HTTP server; only built HTML claims direct offline file launch. Clipboard denial must be actionable, not an uncaught error.

## 1.2.0 host policies

Verify exact/subdomain matching, Unicode and trailing-dot normalization, keep precedence, version 1/2 profile import, invalid/oversized policies, unchanged query bytes and no destination requests. Browser acceptance covers adding, replacing, deleting, exporting and importing policies in the actual offline build. Never persist pasted URLs.

## 1.3.0 query preservation and policy editing

Check exact identity for nontracking queries with empty, leading, repeated and trailing segments. Remove only selected tracking segments; retain surviving query bytes and fragments. Exercise policy Edit/save/cancel, hostname changes, collision rejection, removal during editing and profile import/export in the built app.

## 1.3.1 no-query review warnings

Review no-query URLs containing embedded credentials and state-like fragments. Both warnings must be visible without changing URL bytes. Default audits redact credentials and fragment data; complete audits preserve the original URL and warnings. Check the built page in the supported browser engines.

## 1.3.2 package documentation acceptance

Build the offline site and release ZIP, then verify every relative README documentation link resolves to an included file with the same bytes as its source. Recheck the built app; the URL processing code is unchanged.
