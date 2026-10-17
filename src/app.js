import {
  cleanMany,
  createAuditExport,
  createRuleProfile,
  formatRules,
  parseRules,
  normalizeHost,
  validateHostRules,
  readRuleProfile,
  summarize,
} from "./core.js";

const form = document.querySelector("#cleaner-form");
const input = document.querySelector("#url-input");
const removeInput = document.querySelector("#custom-remove");
const keepInput = document.querySelector("#custom-keep");
const resultsRegion = document.querySelector("#results");
const summaryRegion = document.querySelector("#summary");
const copyButton = document.querySelector("#copy-results");
const exportButton = document.querySelector("#export-results");
const redactExport = document.querySelector("#redact-export");
const exportProfileButton = document.querySelector("#export-profile");
const importProfileInput = document.querySelector("#import-profile");
const sampleButton = document.querySelector("#load-sample");
let currentResults = [];
let hostRules = [];
let editingPolicy = null;
const policyHost = document.querySelector("#policy-host");
const policySubdomains = document.querySelector("#policy-subdomains");
const policyRemove = document.querySelector("#policy-remove");
const policyKeep = document.querySelector("#policy-keep");
const policyStatus = document.querySelector("#policy-status");
const policyList = document.querySelector("#host-policies");
const savePolicy = document.querySelector("#save-host-policy");
const cancelPolicy = document.querySelector("#cancel-host-policy");
function resetPolicyEditor() {
  editingPolicy = null;
  policyHost.value = "";
  policySubdomains.checked = false;
  policyRemove.value = "";
  policyKeep.value = "";
  savePolicy.textContent = "Save host policy";
  cancelPolicy.hidden = true;
}
cancelPolicy.addEventListener("click", () => {
  resetPolicyEditor();
  policyStatus.textContent = "Policy edit canceled. No rules changed.";
});
savePolicy.addEventListener("click", () => {
  try {
    const policy = {host: normalizeHost(policyHost.value), includeSubdomains: policySubdomains.checked,
      removeRules: parseRules(policyRemove.value), keepRules: parseRules(policyKeep.value)};
    if (editingPolicy && hostRules.some((p) => p !== editingPolicy && p.host === policy.host && p.includeSubdomains === policy.includeSubdomains)) {
      throw new Error("Another policy already uses this hostname and subdomain setting.");
    }
    const next = hostRules.filter((p) => editingPolicy ? p !== editingPolicy :
      p.host !== policy.host || p.includeSubdomains !== policy.includeSubdomains);
    hostRules = validateHostRules([...next, policy]);
    resetPolicyEditor();
    renderPolicies();
    policyStatus.textContent = "Host policy updated in this tab. Export the profile to keep it.";
  } catch (error) { policyStatus.textContent = error.message; }
});
function renderPolicies() {
  policyList.replaceChildren();
  hostRules.forEach((p, i) => {
    const row = document.createElement("li");
    row.textContent = p.host + (p.includeSubdomains ? " and subdomains" : " only") +
      " — remove: " + (formatRules(p.removeRules) || "none") + "; keep: " + (formatRules(p.keepRules) || "none") + " ";
    const edit = document.createElement("button");
    edit.type = "button"; edit.textContent = "Edit";
    edit.setAttribute("aria-label", "Edit policy for " + p.host + (p.includeSubdomains ? " and subdomains" : " only"));
    edit.addEventListener("click", () => {
      editingPolicy = p;
      policyHost.value = p.host;
      policySubdomains.checked = p.includeSubdomains;
      policyRemove.value = formatRules(p.removeRules);
      policyKeep.value = formatRules(p.keepRules);
      savePolicy.textContent = "Save policy changes";
      cancelPolicy.hidden = false;
      policyStatus.textContent = "Editing " + p.host + ". Save changes or cancel.";
      policyHost.focus();
    });
    const remove = document.createElement("button");
    remove.type = "button"; remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove policy for " + p.host);
    remove.addEventListener("click", () => {if (editingPolicy === p) resetPolicyEditor(); hostRules.splice(i, 1); renderPolicies();});
    row.append(edit, remove); policyList.append(row);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  currentResults = cleanMany(input.value, {
    hostRules,
    removeRules: parseRules(removeInput.value),
    keepRules: parseRules(keepInput.value),
  });
  render(currentResults);
});

sampleButton.addEventListener("click", () => {
  input.value = [
  "https://news.local/article?id=42&utm_source=newsletter&utm_campaign=launch#comments",
    "https://shop.example/products?sku=ABC-123&fbclid=tracking-value&color=blue",
  ].join("\n");
  input.focus();
});

copyButton.addEventListener("click", async () => {
  const text = currentResults.filter((result) => result.ok).map((result) => result.cleaned).join("\n");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    summaryRegion.textContent = "Clipboard access is unavailable. Select the cleaned URL text or export the audit.";
    return;
  }
  const original = copyButton.textContent;
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = original;
  }, 1200);
});

exportButton.addEventListener("click", () => {
  if (!currentResults.length) return;
  downloadJson(
    "url-parameter-cleaner-results.json",
    createAuditExport(currentResults, { redact: redactExport.checked }),
  );
});

exportProfileButton.addEventListener("click", () => {
  downloadJson("url-parameter-cleaner-rules.json", createRuleProfile(removeInput.value, keepInput.value, hostRules));
});

importProfileInput.addEventListener("change", async () => {
  const [file] = importProfileInput.files;
  if (!file) return;
  try {
    if (file.size > 262144) throw new Error("Profile too large");
    const profile = readRuleProfile(await file.text());
    hostRules = profile.hostRules;
    resetPolicyEditor();
    renderPolicies();
    removeInput.value = formatRules(profile.removeRules);
    keepInput.value = formatRules(profile.keepRules);
    importProfileInput.setCustomValidity("");
  } catch {
    importProfileInput.setCustomValidity("Choose a valid URL Parameter Cleaner rule profile.");
    importProfileInput.reportValidity();
  } finally {
    importProfileInput.value = "";
  }
});

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function render(results) {
  resultsRegion.replaceChildren();
  const summary = summarize(results);
  summaryRegion.textContent = `${summary.valid} valid · ${summary.changed} cleaned · ${summary.removed} parameters removed · ${summary.invalid} invalid`;
  summaryRegion.hidden = false;
  copyButton.disabled = summary.valid === 0;
  exportButton.disabled = results.length === 0;

  results.forEach((result, index) => {
    const article = document.createElement("article");
    article.className = `result-card ${result.ok ? "" : "invalid"}`;
    const heading = document.createElement("h3");
    heading.textContent = result.ok ? `URL ${index + 1}${result.changed ? " · Cleaned" : " · Already clean"}` : `URL ${index + 1} · Invalid`;
    article.append(heading);

    if (!result.ok) {
      article.append(textBlock("Original", result.original), message(result.error, "error-message"));
    } else {
      article.append(textBlock("Cleaned URL", result.cleaned));
      if (result.removed.length) {
        const list = document.createElement("ul");
        list.className = "removal-list";
        result.removed.forEach((item) => {
          const row = document.createElement("li");
          const name = document.createElement("code");
          name.textContent = item.name;
          const reason = document.createElement("span");
          reason.textContent = item.reason;
          row.append(name, reason);
          list.append(row);
        });
        article.append(list);
      }
      result.warnings?.forEach((warning) => article.append(message(warning, "warning-message")));
    }
    resultsRegion.append(article);
  });
}

function textBlock(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "url-block";
  const title = document.createElement("strong");
  title.textContent = label;
  const text = document.createElement("code");
  text.textContent = value;
  wrapper.append(title, text);
  return wrapper;
}

function message(value, className) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = value;
  return paragraph;
}
