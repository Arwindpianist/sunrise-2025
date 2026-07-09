import type { BrandId } from "@repo/shared-types"

export type BrandThemeTokens = {
  displayName: string
  /** Marketing / canonical site origin, no trailing slash */
  siteOriginDefault: string
  supportEmail: string
  motionIntensity: "standard" | "subtle"
  /** Short phrase after display name in `<title>` */
  seoTagline: string
  seoDescription: string
}

const sunrise: BrandThemeTokens = {
  displayName: "Sunrise",
  siteOriginDefault: "https://sunrise-2025.com",
  supportEmail: "support@sunrise-2025.com",
  motionIntensity: "standard",
  seoTagline: "Celebrate Life's Beautiful Moments",
  seoDescription:
    "Create joyful invitations and reminders for weddings, birthdays, and festivals. Send scheduled messages across email, WhatsApp, Telegram, and SMS.",
}

const sunset: BrandThemeTokens = {
  displayName: "Sunset",
  siteOriginDefault: "https://sunset-2025.com",
  supportEmail: "support@sunrise-2025.com",
  motionIntensity: "subtle",
  seoTagline: "Memorials & remembrance",
  seoDescription:
    "Dignified memorial communications and coordinated remembrance across channels.",
}

export function getBrandRegistry(brand: BrandId): BrandThemeTokens {
  return brand === "sunset" ? sunset : sunrise
}
