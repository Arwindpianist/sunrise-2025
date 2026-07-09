/**
 * Deletes heavy generated dirs so you can reinstall cleanly (`pnpm install`).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** @param {string} p */
function rm(p) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true })
      console.log("removed", path.relative(root, p) || ".")
    }
  } catch (e) {
    console.warn("skip", p, e instanceof Error ? e.message : e)
  }
}

rm(path.join(root, "node_modules"))
rm(path.join(root, ".turbo"))

const sunrise = path.join(root, "apps", "sunrise-web")
rm(path.join(sunrise, "node_modules"))
rm(path.join(sunrise, ".next"))

const sunsetStub = path.join(root, "apps", "sunset-web")
rm(path.join(sunsetStub, "node_modules"))

const packagesDir = path.join(root, "packages")
if (fs.existsSync(packagesDir)) {
  for (const name of fs.readdirSync(packagesDir)) {
    const pkg = path.join(packagesDir, name)
    if (!fs.statSync(pkg).isDirectory()) continue
    rm(path.join(pkg, "node_modules"))
    rm(path.join(pkg, "dist"))
  }
}

for (const name of fs.readdirSync(root)) {
  if (name.startsWith("db_cluster")) {
    rm(path.join(root, name))
  }
}

console.log("Done. Run pnpm install.")
