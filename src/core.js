const EXACT_TRACKERS = new Set([
  "_ga",
  "_gl",
  "dclid",
  "epik",
  "fbclid",
  "gclid",
  "gbraid",
  "igshid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "msclkid",
  "oly_anon_id",
  "oly_enc_id",
  "rb_clickid",
  "s_cid",
  "sc_cid",
  "soc_src",
  "soc_trk",
  "ttclid",
  "twclid",
  "vero_conv",
  "vero_id",
  "wbraid",
  "wickedid",
  "yclid",
]);

const PREFIX_TRACKERS = ["utm_", "pk_"];

export const DEFAULT_TRACKERS = Object.freeze({
  exact: [...EXACT_TRACKERS].sort(),
  prefixes: [...PREFIX_TRACKERS],
});

export function parseRules(input = "") {
  const rules = [];
  for (const raw of input.split(/[\n,]/u)) {
    const normalized = safeDecode(raw.trim()).toLowerCase();
    if (!normalized) continue;
    const prefix = normalized.endsWith("*");
    const value = prefix ? normalized.slice(0, -1) : normalized;
    if (value && !rules.some((rule) => rule.value === value && rule.prefix === prefix)) {
      rules.push({ value, prefix });
    }
  }
  return rules;
}

export function formatRules(rules = []) {
  return rules.map((rule) => `${rule.value}${rule.prefix ? "*" : ""}`).join(", ");
}

export function createRuleProfile(removeInput = "", keepInput = "") {
  return {
    schemaVersion: 1,
    type: "url-parameter-cleaner-rule-profile",
    removeRules: parseRules(removeInput),
    keepRules: parseRules(keepInput),
  };
}

export function readRuleProfile(value) {
  const profile = typeof value === "string" ? JSON.parse(value) : value;
  if (!profile || profile.schemaVersion !== 1 || profile.type !== "url-parameter-cleaner-rule-profile") {
    throw new Error("Unsupported rule profile.");
  }
  for (const key of ["removeRules", "keepRules"]) {
    if (!Array.isArray(profile[key]) || profile[key].some((rule) =>
      !rule || typeof rule.value !== "string" || typeof rule.prefix !== "boolean" || !rule.value.trim()
    )) {
      throw new Error("Rule profile contains invalid rules.");
    }
  }
  return {
    removeRules: parseRules(formatRules(profile.removeRules)),
    keepRules: parseRules(formatRules(profile.keepRules)),
  };
}

export function matchesRules(name, rules) {
  const normalized = safeDecode(name.replaceAll("+", " ")).toLowerCase();
  return rules.some((rule) =>
    rule.prefix ? normalized.startsWith(rule.value) : normalized === rule.value,
  );
}

export function classifyParameter(name, options = {}) {
  const normalized = safeDecode(name.replaceAll("+", " ")).toLowerCase();
  const keepRules = options.keepRules ?? [];
  const removeRules = options.removeRules ?? [];
  if (matchesRules(normalized, keepRules)) return { remove: false, reason: "custom keep rule" };
  if (matchesRules(normalized, removeRules)) return { remove: true, reason: "custom remove rule" };
  if (normalized.startsWith("utm_")) return { remove: true, reason: "UTM tracking prefix" };
  if (normalized.startsWith("pk_")) return { remove: true, reason: "Matomo/Piwik tracking prefix" };
  if (EXACT_TRACKERS.has(normalized)) return { remove: true, reason: "known tracking parameter" };
  return { remove: false, reason: "preserved as functional or unknown" };
}

export function cleanUrl(input, options = {}) {
  const original = input.trim();
  if (!original) return { ok: false, original, error: "URL is empty." };

  let parsed;
  try {
    parsed = new URL(original);
  } catch {
    return { ok: false, original, error: "Enter an absolute HTTP or HTTPS URL." };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, original, error: "Only HTTP and HTTPS URLs are supported." };
  }

  const hashIndex = original.indexOf("#");
  const fragment = hashIndex >= 0 ? original.slice(hashIndex) : "";
  const withoutFragment = hashIndex >= 0 ? original.slice(0, hashIndex) : original;
  const queryIndex = withoutFragment.indexOf("?");
  if (queryIndex < 0) {
    return { ok: true, original, cleaned: original, removed: [], preservedCount: 0, changed: false };
  }

  const base = withoutFragment.slice(0, queryIndex);
  const query = withoutFragment.slice(queryIndex + 1);
  const kept = [];
  const removed = [];
  let preservedCount = 0;

  for (const segment of query.split("&")) {
    if (segment === "") continue;
    const separator = segment.indexOf("=");
    const rawName = separator >= 0 ? segment.slice(0, separator) : segment;
    const rawValue = separator >= 0 ? segment.slice(separator + 1) : "";
    const decision = classifyParameter(rawName, options);
    if (decision.remove) {
      removed.push({
        name: safeDecode(rawName.replaceAll("+", " ")),
        value: safeDecode(rawValue.replaceAll("+", " ")),
        reason: decision.reason,
      });
    } else {
      kept.push(segment);
      preservedCount += 1;
    }
  }

  const cleaned = `${base}${kept.length ? `?${kept.join("&")}` : ""}${fragment}`;
  const warnings = [];
  if (parsed.username || parsed.password) warnings.push("URL contains embedded credentials.");
  if (fragment.includes("?") || fragment.includes("=")) {
    warnings.push("The fragment was preserved exactly and may contain application-specific data.");
  }
  return {
    ok: true,
    original,
    cleaned,
    removed,
    preservedCount,
    changed: cleaned !== original,
    warnings,
  };
}

export function cleanMany(input, options = {}) {
  return input
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => cleanUrl(url, options));
}

export function summarize(results) {
  return results.reduce(
    (summary, result) => {
      summary.total += 1;
      if (!result.ok) summary.invalid += 1;
      else {
        summary.valid += 1;
        if (result.changed) summary.changed += 1;
        summary.removed += result.removed.length;
      }
      return summary;
    },
    { total: 0, valid: 0, invalid: 0, changed: 0, removed: 0 },
  );
}

export function createAuditExport(results, { redact = true } = {}) {
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    redacted: redact,
    results: results.map((result) => {
      if (!redact) return structuredClone(result);
      return {
        ...result,
        original: redactUrl(result.original),
        ...(result.cleaned ? { cleaned: redactUrl(result.cleaned) } : {}),
        ...(result.removed ? {
          removed: result.removed.map((item) => ({ ...item, value: "[REDACTED]" })),
        } : {}),
      };
    }),
  };
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    for (const name of new Set(url.searchParams.keys())) {
      const values = url.searchParams.getAll(name);
      url.searchParams.delete(name);
      values.forEach(() => url.searchParams.append(name, "[REDACTED]"));
    }
    return url.toString();
  } catch {
    return "[REDACTED INVALID INPUT]";
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
