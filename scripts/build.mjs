import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const destination = resolve("dist/site");
await rm(destination, { recursive: true, force: true });
await mkdir(resolve(destination, "src"), { recursive: true });
await cp("index.html", resolve(destination, "index.html"));
await cp("src", resolve(destination, "src"), { recursive: true });
console.log(destination);
