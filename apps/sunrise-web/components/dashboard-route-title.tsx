"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

/** Longest-prefix wins so `/dashboard/events/create` maps before `/dashboard/events`. */
const ROUTE_LABELS: [string, string][] = [
  ["/dashboard/events/create", "New event"],
  ["/dashboard/admin/manage-users", "Manage users"],
  ["/dashboard/email-logs", "Email logs"],
  ["/dashboard/telegram-logs", "Telegram logs"],
  ["/dashboard/discord-logs", "Discord logs"],
  ["/dashboard/slack-logs", "Slack logs"],
  ["/dashboard/data-management", "Data"],
  ["/dashboard/export-contacts", "Export contacts"],
  ["/dashboard/emergency-alerts", "Emergency alerts"],
  ["/dashboard/notifications", "Notifications"],
  ["/dashboard/discord-settings", "Discord"],
  ["/dashboard/slack-settings", "Slack"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/referrals", "Referrals"],
  ["/dashboard/balance", "Balance"],
  ["/dashboard/contacts", "Contacts"],
  ["/dashboard/messages", "Messages"],
  ["/dashboard/admin", "Admin"],
  ["/dashboard/sos", "Emergency SOS"],
  ["/dashboard/events", "Events"],
  ["/dashboard", "Home"],
]

function labelsByLongestPrefixFirst(): [string, string][] {
  return [...ROUTE_LABELS].sort((a, b) => b[0].length - a[0].length)
}

export function DashboardRouteTitle() {
  const pathname = usePathname()

  const title = useMemo(() => {
    if (!pathname.startsWith("/dashboard")) return "Dashboard"

    const sorted = labelsByLongestPrefixFirst()

    const dynamicEvent = /^\/dashboard\/events\/([^/]+)$/.exec(pathname)
    if (dynamicEvent && dynamicEvent[1] !== "create") {
      return "Event"
    }

    for (const [prefix, label] of sorted) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return label
      }
    }

    return "Dashboard"
  }, [pathname])

  return (
    <span className="truncate text-base font-semibold tracking-tight text-foreground">{title}</span>
  )
}
