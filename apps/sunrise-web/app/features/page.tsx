import FeaturesRedesign from "@/components/public/features-redesign"
import SunsetFeaturesRedesign from "@/components/public/sunset-features-redesign"
import { resolveEffectiveBrandId } from "@/lib/request-brand"

export default async function FeaturesPage() {
  const brand = await resolveEffectiveBrandId("sunrise")
  return brand === "sunset" ? <SunsetFeaturesRedesign /> : <FeaturesRedesign />
}
