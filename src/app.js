import {
  cleanMany,
  createAuditExport,
  createRuleProfile,
  formatRules,
  parseRules,
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  currentResults = cleanMany(input.value, {
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
  await navigator.clipboard.writeText(text);
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
  downloadJson("url-parameter-cleaner-rules.json", createRuleProfile(removeInput.value, keepInput.value));
});

importProfileInput.addEventListener("change", async () => {
  const [file] = importProfileInput.files;
  if (!file) return;
  try {
    const profile = readRuleProfile(await file.text());
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
  URL.revokeObjectURL(link.href);
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
