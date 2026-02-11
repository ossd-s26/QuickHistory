import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const srcDir = path.join(projectRoot, "src");
const distDir = path.join(projectRoot, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await Promise.all([
  cp(path.join(srcDir, "manifest.json"), path.join(distDir, "manifest.json")),
  cp(path.join(srcDir, "popup.html"), path.join(distDir, "popup.html")),
  cp(path.join(srcDir, "settings.html"), path.join(distDir, "settings.html")),
  cp(path.join(projectRoot, "icon.png"), path.join(distDir, "icon.png")),
]);

await build({
  entryPoints: [path.join(srcDir, "agent.ts")],
  outfile: path.join(distDir, "agent.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  alias: {
    "node:async_hooks": path.join(srcDir, "shims", "async_hooks.ts"),
  },
});

await build({
  entryPoints: [path.join(srcDir, "popup.tsx")],
  outfile: path.join(distDir, "popup.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  jsx: "automatic",
  jsxImportSource: "react",
});

await build({
  entryPoints: [path.join(srcDir, "settings.tsx")],
  outfile: path.join(distDir, "settings.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  jsx: "automatic",
  jsxImportSource: "react",
});

execSync(`npx @tailwindcss/cli -i src/app.css -o dist/styles.css`, {
  cwd: projectRoot,
  stdio: "inherit",
});

console.log("Built extension in dist/");
