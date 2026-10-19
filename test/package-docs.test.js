import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("built README documentation links resolve to the shipped source documents", () => {
  execFileSync(process.execPath, ["scripts/build.mjs"]);
  const readme = readFileSync("dist/site/README.md", "utf8");
  const links = [...readme.matchAll(/\]\(([^)]+)\)/gu)]
    .map((match) => match[1]).filter((target) => !/^[a-z]+:/iu.test(target) && !target.startsWith("#"));
  assert(links.includes("DEVELOPMENT.md"));
  assert(links.includes("CONTRIBUTING.md"));
  assert(links.includes("docs/RULE-POLICY.md"));
  for (const target of links) {
    assert.deepEqual(readFileSync("dist/site/" + target), readFileSync(target));
  }
});
