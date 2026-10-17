# URL Parameter Cleaner

URL Parameter Cleaner is a private, browser-based tool that removes known marketing and click-tracking parameters while preserving functional or unfamiliar query data. It shows every removal before you copy or export the cleaned URLs.

**Current release:** 1.2.0.

## Try it

Use the [live application](https://loganpendragonmultiverse.github.io/url-parameter-cleaner/) or download the ZIP from the [latest release](https://github.com/loganpendragonmultiverse/url-parameter-cleaner/releases/tag/v1.2.0) and open its built `index.html`. The downloadable page embeds its script and styles and needs no local server.

1. Paste one or more absolute HTTP/HTTPS URLs.
2. Optionally add exact or prefix-based remove and keep rules.
3. Select **Review cleaned URLs**.
4. Inspect every removal, then copy the valid results or export the audit JSON.

Custom rule profiles can be exported and imported as portable JSON. Audit exports redact embedded credentials, all query parameter values and complete URL fragments by default; clear the redaction checkbox only when a complete local record is intentional.

## What it removes

The built-in rules cover narrow, established tracking names such as `utm_*`, `gclid`, `fbclid`, `msclkid`, `mc_cid`, `ttclid`, and related vendor identifiers. Custom rules accept commas and a trailing `*` for prefixes. Keep rules always override removal rules.

Ambiguous fields such as `ref`, `source`, `id`, `q`, `page`, and `token` are not removed by default because they may control content, navigation, authentication, or attribution that the user intends to preserve.

## Privacy and safety

- Processing happens entirely in the browser.
- There are no requests to the supplied URLs.
- There is no server, account, analytics, storage, or browsing history.
- Invalid and non-HTTP URLs are rejected.
- Kept query segments are not decoded and reconstructed, avoiding unnecessary byte-level changes.
- Fragments are preserved exactly and flagged when they resemble application state.

## Supported platforms

Current versions of Chrome, Edge, Firefox, and Safari with JavaScript enabled. The application is dependency-free. The downloadable built page runs from local files; the source checkout uses ES modules, so build it with `npm run build` and open `dist/site/index.html`, or serve the source over local HTTP.

## Limitations

- A parameter name can be used differently by different sites. Always review removals before sharing a cleaned URL.
- Tracking embedded in paths, fragments, redirects, cookies, pixels, or server-side identifiers is outside scope.
- The tool does not expand shortened URLs or contact destination sites.
- Imported rules remain session-only unless you export a profile for later use.
- Unredacted JSON exports can contain credentials, tokens, and sensitive URL data; protect them accordingly.

## Development

```console
npm test
npm run check
npm run build
```

Node.js 20 or newer is required for development. The shipped application itself has no package dependencies.

See [DEVELOPMENT.md](DEVELOPMENT.md), [rule policy](docs/RULE-POLICY.md), and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License. Copyright 2026 Logan Pendragon Multiverse.

## More open-source projects

This project is part of the [Logan Pendragon Forge open-source collection](https://www.loganpendragonforge.com/open-source/). Browse the catalog for other released tools, source repositories, live demos, and downloads.

## Host policies

Add a hostname, remove rules and keep rules in the host-policy editor. Exact hostname matching is the default; subdomains require the checkbox. Matching compares normalized lowercase/Punycode hostnames, ignoring a final DNS dot and the URL port. A subdomain must end at a dot boundary: shop.example never matches evilshop.example. All matching policies add to global rules; any keep rule wins. Paths and query bytes are preserved. IPv6 policies are not supported in this version. Policies stay in the current tab and can be exported in a version 2 profile; version 1 global profiles still import. Profiles contain rules and hostnames, never pasted URLs. A hostname may itself be private, so inspect profiles before sharing.
