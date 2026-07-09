"use client"

import {
  Sidebar,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardRouteTitle } from "@/components/dashboard-route-title"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        collapsible="icon"
        variant="floating"
        className="border-r-0"
      >
        <DashboardNav />
      </Sidebar>
      <SidebarRail />
      {/* Div (not <main>): root layout already wraps the app in <main>. */}
      <div
        data-slot="sidebar-inset"
        className="relative flex min-h-svh w-full min-w-0 flex-1 flex-col bg-background"
      >
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background px-3 sm:px-4">
          <SidebarTrigger className="-ml-0.5 md:flex" />
          <div className="min-w-0 flex-1">
            <DashboardRouteTitle />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{children}</div>
      </div>
    </SidebarProvider>
  )
}
