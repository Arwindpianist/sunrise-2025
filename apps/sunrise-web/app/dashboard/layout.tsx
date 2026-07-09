"use client"

import { SubscriptionProvider } from "@/lib/use-subscription"
import { DashboardShell } from "@/components/dashboard-shell"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SubscriptionProvider>
  )
}
