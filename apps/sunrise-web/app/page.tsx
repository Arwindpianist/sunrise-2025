"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import HomeRedesign from "@/components/public/home-redesign"
import SunsetHomeMarketing from "@/components/public/sunset-home-marketing"
import { useBrand } from "@repo/ui/brand-provider"

function HomePageContent() {
  const brand = useBrand()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get("message")
    if (message === "account_deleted") {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted. Thank you for using our service.",
        variant: "default",
      })
    }
  }, [searchParams])

  return brand === "sunset" ? <SunsetHomeMarketing /> : <HomeRedesign />
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  )
}
