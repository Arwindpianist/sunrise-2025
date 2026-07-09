"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    return null
  }
  return <Footer />
}
