import type { BrandId } from "@repo/shared-types"
import { brandFromRequestHostname } from "./brand-host"

/**
 * Dev and preview only: when true, prefer Sunset theming.
 * Never honored when VERCEL_ENV is production (see isSunsetOverrideActive).
 */
function envTruthy(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false
  const v = raw.trim().replace(/^\uFEFF/, "").toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

export function isSunsetOverrideActive(): boolean {
  if (process.env.VERCEL_ENV === "production") return false
  const v = process.env.IS_SUNSET ?? process.env.NEXT_PUBLIC_IS_SUNSET
  return envTruthy(v)
}


/**
 * Resolves which brand UI and registry to use.
 *
 * Precedence:
 * 1. Hostname match via `NEXT_PUBLIC_SUNSET_HOSTS` / `NEXT_PUBLIC_SUNRISE_HOSTS` (pass `requestHost` from `headers()`).
 * 2. `NEXT_PUBLIC_BRAND_ID` when set to `sunset` or `sunrise` (per-deployment branding).
 * 3. Non-production only: `IS_SUNSET` / `NEXT_PUBLIC_IS_SUNSET` preview toggle.
 * 4. `deploymentBrand` default (usually how the binary was built / primary Sunrise deployment).
 */
export function getEffectiveBrandId(deploymentBrand: BrandId, requestHost?: string | null): BrandId {
  const fromHost = brandFromRequestHostname(requestHost ?? undefined)
  if (fromHost) return fromHost

  const envBrand = process.env.NEXT_PUBLIC_BRAND_ID?.trim()
  if (envBrand === "sunset" || envBrand === "sunrise") {
    return envBrand
  }

  if (process.env.VERCEL_ENV !== "production" && isSunsetOverrideActive()) {
    return "sunset"
  }

  return deploymentBrand
}
