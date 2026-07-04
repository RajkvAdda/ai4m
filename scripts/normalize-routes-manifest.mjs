import fs from "node:fs";
import path from "node:path";

const manifestPath = path.join(process.cwd(), ".next", "routes-manifest.json");

if (!fs.existsSync(manifestPath)) {
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
let changed = false;

if (!Array.isArray(manifest.dataRoutes)) {
  manifest.dataRoutes = [];
  changed = true;
}

if (!Array.isArray(manifest.dynamicRoutes)) {
  manifest.dynamicRoutes = [];
  changed = true;
}

if (!Array.isArray(manifest.staticRoutes)) {
  manifest.staticRoutes = [];
  changed = true;
}

if (typeof manifest.pages404 !== "boolean") {
  manifest.pages404 = true;
  changed = true;
}

if (changed) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
  console.log("Normalized .next/routes-manifest.json");
}
