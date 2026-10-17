import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const destination = resolve("dist/site");
await rm(destination, { recursive: true, force: true });
await mkdir(resolve(destination, "src"), { recursive: true });
const core = (await readFile("src/core.js", "utf8")).replace(/^export\s+/gm, "");
const app = (await readFile("src/app.js", "utf8")).replace(/^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/core\.js["'];?\s*/, "");
const styles = await readFile("src/styles.css", "utf8");
const script = ("document.addEventListener('DOMContentLoaded', () => {\n(() => {\n" + core + "\n" + app + "\n})();\n});").replace(/<\/script/gi, "<\\/script");
let page = await readFile("index.html", "utf8");
page = page.replace('<link rel="stylesheet" href="src/styles.css">', "<style>" + styles + "</style>");
page = page.replace('<script type="module" src="src/app.js"></script>', "<script>" + script + "</script>");
await writeFile(resolve(destination, "index.html"), page);
await cp("src", resolve(destination, "src"), { recursive: true });
for (const name of ["README.md", "LICENSE"]) await cp(name, resolve(destination, name));
console.log(destination);
