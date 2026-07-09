/**
 * Moves *.sql files from the repo root into archive/sql-root/ (skips if target exists).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const destDir = path.join(root, "archive", "sql-root")

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

let moved = 0
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith(".sql")) continue
  const from = path.join(root, name)
  if (!fs.statSync(from).isFile()) continue
  const to = path.join(destDir, name)
  if (fs.existsSync(to)) {
    console.warn(`skip (exists): ${name}`)
    continue
  }
  fs.renameSync(from, to)
  console.log(`moved ${name}`)
  moved++
}
console.log(moved ? `Done. Moved ${moved} file(s).` : "No root .sql files to move.")
