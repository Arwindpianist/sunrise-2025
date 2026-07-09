/**
 * Toggle Sunrise / Sunset for local dev by updating `.env.local`.
 *
 * Updates NEXT_PUBLIC_BRAND_ID, IS_SUNSET, and NEXT_PUBLIC_IS_SUNSET so brand
 * resolution works on localhost (hostname lists do not apply locally).
 *
 * Usage:
 *   pnpm brand              # toggle
 *   pnpm brand:sunrise
 *   pnpm brand:sunset
 *   pnpm brand:status
 *
 * If `pnpm dev` is running (dev-sunrise-watch), it restarts when `.env.local` changes.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPaths = [
  path.join(root, ".env.local"),
  path.join(root, "apps", "sunrise-web", ".env.local"),
]

const BRAND_KEYS = ["NEXT_PUBLIC_BRAND_ID", "IS_SUNSET", "NEXT_PUBLIC_IS_SUNSET"]
const TRUTHY = new Set(["1", "true", "yes"])

/** @param {string} line */
function parseEnvLine(line) {
  const m = line.match(/^(\s*)(#?)\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
  if (!m) return null
  let value = m[4].trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  return {
    key: m[3],
    value,
    commented: m[2] === "#",
  }
}

/** @param {string} content */
function readCurrentBrand(content) {
  /** @type {Record<string, string>} */
  const active = {}
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed || parsed.commented) continue
    active[parsed.key] = parsed.value
  }

  if (active.NEXT_PUBLIC_BRAND_ID === "sunset" || active.NEXT_PUBLIC_BRAND_ID === "sunrise") {
    return active.NEXT_PUBLIC_BRAND_ID
  }

  const override = active.IS_SUNSET ?? active.NEXT_PUBLIC_IS_SUNSET ?? ""
  if (TRUTHY.has(String(override).trim().toLowerCase())) {
    return "sunset"
  }

  return "sunrise"
}

/** @param {string} content @param {"sunrise" | "sunset"} brand */
function applyBrand(content, brand) {
  const isSunset = brand === "sunset"
  /** @type {Record<string, string>} */
  const target = {
    NEXT_PUBLIC_BRAND_ID: brand,
    IS_SUNSET: isSunset ? "true" : "false",
    NEXT_PUBLIC_IS_SUNSET: isSunset ? "true" : "false",
  }

  const keySet = new Set(BRAND_KEYS)
  const written = new Set()
  const lines = content.length ? content.split(/\r?\n/) : []
  const out = []

  for (const line of lines) {
    const parsed = parseEnvLine(line)
    if (parsed && keySet.has(parsed.key)) {
      if (written.has(parsed.key)) continue
      written.add(parsed.key)
      out.push(`${parsed.key}=${target[parsed.key]}`)
      continue
    }
    out.push(line)
  }

  const missing = BRAND_KEYS.filter((key) => !written.has(key))
  if (missing.length > 0) {
    if (out.length > 0 && out[out.length - 1] !== "") out.push("")
    out.push("# Dev brand (pnpm brand / scripts/swap-brand.mjs)")
    for (const key of missing) {
      out.push(`${key}=${target[key]}`)
    }
  }

  const text = out.join("\n")
  return text.endsWith("\n") ? text : `${text}\n`
}

/** @param {string} filePath */
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return ""
  return fs.readFileSync(filePath, "utf8")
}

/** @param {string} mode */
function resolveTargetBrand(mode, primaryContent) {
  if (mode === "sunrise" || mode === "sunset") return mode
  if (mode === "toggle") {
    return readCurrentBrand(primaryContent) === "sunset" ? "sunrise" : "sunset"
  }
  throw new Error(`Unknown mode "${mode}". Use sunrise, sunset, toggle, or status.`)
}

function printStatus() {
  const primary = envPaths[0]
  const content = readEnvFile(primary)
  if (!content) {
    console.log(`No ${path.relative(root, primary)} found. Run pnpm brand:sunrise or pnpm brand:sunset to create brand vars.`)
    return
  }

  const brand = readCurrentBrand(content)
  console.log(`Current dev brand: ${brand}`)
  console.log(`Env file: ${path.relative(root, primary)}`)
  console.log("\nRestart or let pnpm dev auto-restart to apply UI changes.")
}

function main() {
  const mode = (process.argv[2] ?? "toggle").toLowerCase()

  if (mode === "status") {
    printStatus()
    return
  }

  const primaryPath = envPaths[0]
  let primaryContent = readEnvFile(primaryPath)
  if (!primaryContent && !fs.existsSync(primaryPath)) {
    console.error(`Missing ${path.relative(root, primaryPath)}. Copy .env.example to .env.local first.`)
    process.exit(1)
  }

  const target = resolveTargetBrand(mode, primaryContent)
  const nextContent = applyBrand(primaryContent, target)

  const updated = []
  for (const filePath of envPaths) {
    if (!fs.existsSync(filePath)) continue
    const content = readEnvFile(filePath)
    fs.writeFileSync(filePath, applyBrand(content, target), "utf8")
    updated.push(path.relative(root, filePath))
  }

  if (updated.length === 0) {
    fs.writeFileSync(primaryPath, nextContent, "utf8")
    updated.push(path.relative(root, primaryPath))
  }

  const emoji = target === "sunset" ? "🌙" : "🌅"
  console.log(`${emoji} Dev brand set to ${target}`)
  console.log(`Updated: ${updated.join(", ")}`)
  console.log("\nOpen http://localhost:3000 — pnpm dev will restart if it is already running.")
}

main()
