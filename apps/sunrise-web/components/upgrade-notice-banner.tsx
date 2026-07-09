"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useBrand } from "@repo/ui/brand-provider"

export default function UpgradeNoticeBanner() {
  const brand = useBrand()
  const isSunset = brand === "sunset"

  return (
    <div
      className={
        isSunset
          ? "border-b border-primary/35 bg-primary/12 px-4 py-3 text-sm text-foreground"
          : "border-b border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900"
      }
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          {isSunset
            ? "We are currently upgrading Sunset. Some features may be limited while we improve memorial workflows. If you have trouble signing in, please "
            : "We are currently upgrading Sunrise. Some features may be limited. If you have trouble signing in, please "}
          <Link href="/forgot-password" className="font-semibold underline">
            reset your password
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

