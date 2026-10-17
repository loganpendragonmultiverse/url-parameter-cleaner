import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("every app selector has its shipped HTML target, including the result summary", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  for (const [, id] of app.matchAll(/document\.querySelector\("#([\w-]+)"\)/g)) assert(html.includes(`id="${id}"`), `missing #${id}`);
});

test("built distribution needs no script or stylesheet requests for file launch", async () => {
  const built = spawnSync(process.execPath, ["scripts/build.mjs"], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  const html = await readFile("dist/site/index.html", "utf8");
  assert(!/<script[^>]*src=/i.test(html));
  assert(!/<link[^>]*rel="stylesheet"/i.test(html));
  assert(html.includes("DOMContentLoaded") && html.includes('id="summary"'));
  assert((await readFile("dist/site/LICENSE", "utf8")).includes("MIT"));
});
