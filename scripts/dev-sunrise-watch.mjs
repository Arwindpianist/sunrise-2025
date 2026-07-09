/**
 * Runs `pnpm --filter sunrise-web dev` and restarts it when monorepo root or app
 * `.env` / `.env.*` files change (see AGENTS.md).
 */
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const appDir = path.join(root, "apps", "sunrise-web")

/** @param {string} name */
function isEnvFile(name) {
  if (!name) return false
  const base = path.basename(name)
  return base === ".env" || base.startsWith(".env.")
}

let child = null
let restartTimer = null

function shutdown(code = 0) {
  if (restartTimer) clearTimeout(restartTimer)
  if (child) {
    try {
      child.kill(process.platform === "win32" ? undefined : "SIGTERM")
    } catch {
      /* ignore */
    }
    child = null
  }
  process.exit(code)
}

function start() {
  if (child) {
    try {
      child.kill(process.platform === "win32" ? undefined : "SIGTERM")
    } catch {
      /* ignore */
    }
    child = null
  }

  console.log("[dev-watch] starting pnpm --filter sunrise-web dev …")
  child = spawn("pnpm", ["--filter", "sunrise-web", "dev"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  })

  child.on("exit", (code, signal) => {
    child = null
    if (signal === "SIGTERM" || signal === "SIGINT") return
    console.log(`[dev-watch] dev process exited (code=${code}, signal=${signal ?? "none"})`)
  })
}

function scheduleRestart() {
  clearTimeout(restartTimer)
  restartTimer = setTimeout(() => {
    restartTimer = null
    console.log("[dev-watch] env file changed, restarting dev server …")
    start()
  }, 450)
}

/** @param {string} dir */
function watchDir(dir) {
  if (!fs.existsSync(dir)) return
  fs.watch(dir, (eventType, filename) => {
    if (!isEnvFile(filename)) return
    scheduleRestart()
  })
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

watchDir(root)
watchDir(appDir)

start()
