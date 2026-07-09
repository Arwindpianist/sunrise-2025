import type { BrandId } from "@repo/shared-types"

function normalizeHost(host: string): string {
  return host.split(":")[0]?.trim().toLowerCase() ?? ""
}

function parseHostList(raw: string | undefined): string[] {
  if (raw == null || raw.trim() === "") return []
  return raw
    .split(",")
    .map((s) => normalizeHost(s))
    .filter(Boolean)
}

/** All hostnames configured for Sunrise and Sunset (deduped). */
export function getConfiguredBrandHostnames(): string[] {
  const hosts = new Set<string>()
  for (const h of parseHostList(process.env.NEXT_PUBLIC_SUNSET_HOSTS)) hosts.add(h)
  for (const h of parseHostList(process.env.NEXT_PUBLIC_SUNRISE_HOSTS)) hosts.add(h)
  return [...hosts]
}

/**
 * Match request hostname against optional env allowlists.
 * Set `NEXT_PUBLIC_SUNSET_HOSTS` / `NEXT_PUBLIC_SUNRISE_HOSTS` as comma-separated hostnames
 * (e.g. `sunset-2025.com,www.sunset-2025.com`) when one deployment serves both domains.
 */
export function brandFromRequestHostname(host: string | null | undefined): BrandId | undefined {
  if (host == null || host === "") return undefined
  const h = normalizeHost(host)
  if (!h) return undefined

  const sunsetHosts = parseHostList(process.env.NEXT_PUBLIC_SUNSET_HOSTS)
  const sunriseHosts = parseHostList(process.env.NEXT_PUBLIC_SUNRISE_HOSTS)

  if (sunsetHosts.some((s) => h === s)) return "sunset"
  if (sunriseHosts.some((s) => h === s)) return "sunrise"

  return undefined
}
