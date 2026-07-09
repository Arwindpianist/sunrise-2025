"use client"

import { SunsetMarketingHome } from "@repo/marketing"

/**
 * Sunset marketing home when `data-brand="sunset"`: same routes as Sunrise, memorial-focused copy and previews.
 */
export default function SunsetHomeMarketing() {
  const sunrise = (process.env.NEXT_PUBLIC_SUNRISE_URL ?? "https://sunrise-2025.com").replace(/\/$/, "")

  return (
    <SunsetMarketingHome
      companionSunriseUrl={sunrise}
      playgroundHref="/playground"
      registerHref="/register"
      pricingHref="/pricing"
      memorialHref="/memorial"
      forgotPasswordHref="/forgot-password"
    />
  )
}
