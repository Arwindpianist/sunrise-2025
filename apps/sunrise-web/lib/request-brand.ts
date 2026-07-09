import { headers } from "next/headers"
import type { BrandId } from "@repo/shared-types"
import { getEffectiveBrandId } from "@repo/config"

/** Host header from the incoming request (works behind proxies when forwarded headers are set). */
export async function getRequestHostname(): Promise<string | null> {
  const h = await headers()
  return h.get("x-forwarded-host") ?? h.get("host")
}

export async function resolveEffectiveBrandId(defaultDeploymentBrand: BrandId = "sunrise"): Promise<BrandId> {
  const host = await getRequestHostname()
  return getEffectiveBrandId(defaultDeploymentBrand, host)
}
