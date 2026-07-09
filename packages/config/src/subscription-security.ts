import { getConfiguredBrandHostnames } from "./brand-host"

/**
 * Hostnames allowed in Referer for subscription mutation APIs (middleware).
 */
export function getSubscriptionSecurityHosts(): string[] {
  const hosts = new Set<string>()
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (site) {
    try {
      hosts.add(new URL(site).hostname)
    } catch {
      /* ignore invalid URL */
    }
  }
  for (const h of getConfiguredBrandHostnames()) {
    hosts.add(h)
  }
  const raw = process.env.ALLOWED_APP_HOSTS
  if (raw) {
    for (const part of raw.split(",")) {
      const h = part.trim()
      if (h) hosts.add(h)
    }
  }
  hosts.add("localhost")
  hosts.add("127.0.0.1")
  return [...hosts]
}
export function refererMatchesAllowedHosts(referer: string): boolean {
  if (!referer) return false
  return getSubscriptionSecurityHosts().some((host) => referer.includes(host))
}
