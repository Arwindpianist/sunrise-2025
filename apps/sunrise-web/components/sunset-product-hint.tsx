"use client"

import { ExternalLink, Moon } from "lucide-react"

import { cn } from "@/lib/utils"

const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL ?? "https://sunset-2025.com"

type SunsetProductHintProps = {
  className?: string
}

/**
 * Shown in-app where users craft messages (e.g. event templates) that may be somber or sensitive.
 * Positions Sunset as a full product, not a theme toggle.
 */
export function SunsetProductHint({ className }: SunsetProductHintProps) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border border-violet-200/90 bg-violet-50 p-3 text-sm text-violet-950 sm:p-4",
        "dark:border-violet-500/35 dark:bg-violet-950/50 dark:text-violet-100",
        className
      )}
    >
      <div className="flex gap-3">
        <Moon className="mt-0.5 h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden />
        <div className="min-w-0 space-y-1.5">
          <p className="font-medium leading-snug text-violet-950 dark:text-violet-100">
            Memorial, condolence, or other sensitive communication?
          </p>
          <p className="text-violet-900/90 leading-relaxed dark:text-violet-200/90">
            <span className="font-semibold">Sunset</span> is the companion product for thoughtful outreach: same account and
            platform as Sunrise, with an experience designed for difficult moments, not just a different color scheme.
          </p>
          <a
            href={SUNSET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-violet-800 underline underline-offset-2 transition-colors hover:text-violet-950 dark:text-violet-200 dark:hover:text-violet-100"
          >
            Open Sunset
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  )
}
