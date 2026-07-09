/**
 * Same app as Sunrise (`apps/sunrise-web`) on port 3001 with local Sunset preview toggles.
 * Production ignores `IS_SUNSET`; this is for dev/preview only (see @repo/config).
 */
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const env = {
  ...process.env,
  PORT: process.env.PORT ?? "3001",
  IS_SUNSET: "1",
  NEXT_PUBLIC_IS_SUNSET: "1",
}

console.log(
  `[dev-sunset] http://localhost:${env.PORT} — Sunset preview toggles on (non-production only).\n`,
)

const child = spawn("pnpm", ["--filter", "sunrise-web", "dev"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env,
})

child.on("exit", (code) => process.exit(code ?? 0))
