import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyParameter,
  cleanMany,
  cleanUrl,
  createAuditExport,
  createRuleProfile,
  formatRules,
  matchesRules,
  parseRules,
  readRuleProfile,
  summarize,
} from "../src/core.js";

test("removes known trackers and preserves functional parameters and fragments", () => {
  const result = cleanUrl("https://news.local/a?id=42&utm_source=news&color=blue&fbclid=x#details");
  assert.equal(result.ok, true);
  assert.equal(result.cleaned, "https://news.local/a?id=42&color=blue#details");
  assert.deepEqual(result.removed.map((item) => item.name), ["utm_source", "fbclid"]);
  assert.equal(result.preservedCount, 2);
});

test("matches names case-insensitively without rewriting kept query bytes", () => {
  const result = cleanUrl("HTTPS://NEWS.LOCAL/p?UTM_Source=x&na%6De=Logan%20P");
  assert.equal(result.cleaned, "HTTPS://NEWS.LOCAL/p?na%6De=Logan%20P");
});

test("supports exact and prefix custom rules with keep precedence", () => {
  const options = {
    removeRules: parseRules("campaign_id, affiliate_*"),
    keepRules: parseRules("affiliate_code, utm_content"),
  };
  const result = cleanUrl(
    "https://news.local/?campaign_id=1&affiliate_source=a&affiliate_code=b&utm_content=keep",
    options,
  );
  assert.equal(result.cleaned, "https://news.local/?affiliate_code=b&utm_content=keep");
  assert.deepEqual(result.removed.map((item) => item.reason), ["custom remove rule", "custom remove rule"]);
});

test("deduplicates parsed rules and handles encoded names", () => {
  assert.deepEqual(parseRules("Foo, foo, camp%61ign_*"), [
    { value: "foo", prefix: false },
    { value: "campaign_", prefix: true },
  ]);
  assert.equal(matchesRules("campa%69gn_id", parseRules("campaign_*")), true);
});

test("does not remove ambiguous parameters", () => {
  for (const name of ["ref", "source", "token", "id", "q", "page"]) {
    assert.equal(classifyParameter(name).remove, false);
  }
});

test("reports invalid and unsafe schemes", () => {
  assert.equal(cleanUrl("example.com/page?utm_source=x").ok, false);
  assert.equal(cleanUrl("javascript:alert(1)").error, "Only HTTP and HTTPS URLs are supported.");
  assert.equal(cleanUrl("   ").error, "URL is empty.");
});

test("preserves no-query URLs and warns about fragment data and credentials", () => {
  assert.equal(cleanUrl("https://news.local/path#section").changed, false);
  const result = cleanUrl("https://user:pass@example.com/?utm_source=x#state=value");
  assert.equal(result.cleaned, "https://user:pass@example.com/#state=value");
  assert.equal(result.warnings.length, 2);
});

test("retains malformed encodings safely", () => {
  const result = cleanUrl("https://news.local/?bad%ZZ=1&utm_source=x");
  assert.equal(result.cleaned, "https://news.local/?bad%ZZ=1");
});

test("cleans newline lists and summarizes results", () => {
  const results = cleanMany("https://a.test/?gclid=1\ninvalid\n\nhttps://b.test/?id=2");
  assert.deepEqual(summarize(results), { total: 3, valid: 2, invalid: 1, changed: 1, removed: 1 });
});

test("handles flag parameters, duplicate parameters, and empty query segments", () => {
  const result = cleanUrl("https://news.local/?id=1&&utm_medium&tag=a&tag=b&");
  assert.equal(result.cleaned, "https://news.local/?id=1&&tag=a&tag=b&");
  assert.equal(result.removed[0].value, "");
});

test("round-trips portable rule profiles and rejects invalid profiles", () => {
  const profile = createRuleProfile("campaign_id, affiliate_*", "affiliate_code");
  const imported = readRuleProfile(JSON.stringify(profile));
  assert.equal(formatRules(imported.removeRules), "campaign_id, affiliate_*");
  assert.equal(formatRules(imported.keepRules), "affiliate_code");
  assert.throws(() => readRuleProfile('{"schemaVersion":99}'), /Unsupported/);
  assert.throws(() => readRuleProfile({ schemaVersion: 1, type: profile.type, removeRules: [{}], keepRules: [] }), /invalid/);
});

test("creates privacy-safe audit exports by default", () => {
  const result = cleanUrl("https://logan:secret@example.com/a?id=42&utm_source=private#state");
  const audit = createAuditExport([result]);
  assert.equal(audit.schemaVersion, 2);
  assert.equal(audit.redacted, true);
  assert.doesNotMatch(JSON.stringify(audit), /secret|private|id=42/);
  assert.equal(audit.results[0].removed[0].value, "[REDACTED]");
  const raw = createAuditExport([result], { redact: false });
  assert.match(JSON.stringify(raw), /secret/);
});


test("redacted audits hide complete opaque fragments while normal outputs preserve them", () => {
  for (const fragment of [
    "access_token=SYNTHETIC-FRAGMENT-SECRET&state=PRIVATE-STATE",
    "/private/SYNTHETIC-FRAGMENT-SECRET",
    "SYNTHETIC-FRAGMENT-SECRET",
    "access_token%3DSYNTHETIC-FRAGMENT-SECRET",
  ]) {
    const original = `https://example.test/a?id=PRIVATE-QUERY&utm_source=TRACK#${fragment}`;
    const result = cleanUrl(original);
    assert.equal(result.cleaned, `https://example.test/a?id=PRIVATE-QUERY#${fragment}`);
    const audit = createAuditExport([result]);
    assert.doesNotMatch(JSON.stringify(audit), /SYNTHETIC-FRAGMENT-SECRET|PRIVATE-STATE|PRIVATE-QUERY/);
    assert.equal(new URL(audit.results[0].original).hash, "#[REDACTED]");
    assert.equal(new URL(audit.results[0].cleaned).hash, "#[REDACTED]");
    assert.equal(createAuditExport([result], { redact: false }).results[0].original, original);
  }
  assert.equal(new URL(createAuditExport([cleanUrl("https://example.test/?id=1")]).results[0].original).hash, "");
});


test("preserves empty query segments when no tracker is removed", () => {
  for (const input of [
    "https://example.com/path?a=1&&b=2&",
    "https://example.com/path?&a=1&&#state",
    "https://example.com/path?",
    "https://example.com/path?&&",
  ]) {
    const result = cleanUrl(input);
    assert.equal(result.cleaned, input);
    assert.equal(result.changed, false);
    assert.deepEqual(result.removed, []);
  }
});

test("removes tracker segments without rebuilding untouched query segments", () => {
  assert.equal(cleanUrl("https://example.com/path?a=1&&utm_source=demo&b=2&").cleaned,
    "https://example.com/path?a=1&&b=2&");
  assert.equal(cleanUrl("https://example.com/path?&utm_source=demo&&q=%2f+%20#x").cleaned,
    "https://example.com/path?&&q=%2f+%20#x");
  assert.equal(cleanUrl("https://example.com/path?utm_source=demo").cleaned,
    "https://example.com/path");
});


test("warns about credentials and state fragments without a query and preserves audit modes", () => {
  const input = "https://user:SYNTHETIC-PASSWORD@example.org/path#token=SYNTHETIC-FRAGMENT";
  const result = cleanUrl(input);
  assert.equal(result.cleaned, input);
  assert.equal(result.changed, false);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.warnings, [
    "URL contains embedded credentials.",
    "The fragment was preserved exactly and may contain application-specific data.",
  ]);
  const redacted = createAuditExport([result]);
  assert(!JSON.stringify(redacted).includes("SYNTHETIC-"));
  assert.equal(new URL(redacted.results[0].original).username, "");
  assert.equal(new URL(redacted.results[0].cleaned).hash, "#[REDACTED]");
  assert.deepEqual(redacted.results[0].warnings, result.warnings);
  assert.equal(createAuditExport([result], { redact: false }).results[0].original, input);
  assert.equal(createAuditExport([result], { redact: false }).results[0].cleaned, input);
  assert.deepEqual(cleanUrl("https://example.org/path").warnings, []);
});
