"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings as SettingsIcon,
  AlertTriangle,
  Bell,
  Coins,
  Mail,
  Send,
  Database,
  Shield,
  User,
  Zap,
  Crown,
  LogOut,
  ChevronDown,
  Gift,
  Inbox,
} from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useEffect, useState } from "react"
import { useSubscription } from "@/lib/use-subscription"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useBrand } from "@repo/ui/brand-provider"

function NavLink({
  href,
  icon: Icon,
  label,
  isActive,
  className,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
  className?: string
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className={className}>
        <Link href={href}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function DashboardNav() {
  const pathname = usePathname()
  const brand = useBrand()
  const { supabase, user } = useSupabase()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [logsOpen, setLogsOpen] = useState(false)

  const brandLabel = brand === "sunset" ? "Sunset" : "Sunrise"

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userEmail = session?.user?.email
        setIsAdmin(userEmail === "arwindpianist@gmail.com")
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, supabase])

  useEffect(() => {
    const onLogsRoute =
      pathname.startsWith("/dashboard/email-logs") ||
      pathname.startsWith("/dashboard/telegram-logs") ||
      pathname.startsWith("/dashboard/discord-logs") ||
      pathname.startsWith("/dashboard/slack-logs")
    if (onLogsRoute) setLogsOpen(true)
  }, [pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const showDiscordSlack =
    subscription?.tier === "pro" || subscription?.tier === "enterprise"

  if (isLoading || subscriptionLoading) {
    return (
      <>
        <SidebarHeader className="gap-2 border-b border-sidebar-border px-3 py-4">
          <SidebarMenuSkeleton showIcon />
          <SidebarMenuSkeleton className="h-7 w-3/4" />
        </SidebarHeader>
        <SidebarContent className="gap-2 px-2 py-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <SidebarMenuSkeleton key={i} showIcon />
          ))}
        </SidebarContent>
      </>
    )
  }

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link
          href="/dashboard"
          className="flex flex-col gap-0.5 rounded-md px-2 py-1 outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2"
        >
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            {brandLabel}
          </span>
          <span className="truncate text-xs font-medium text-sidebar-foreground/65">Workspace</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/dashboard"
                icon={LayoutDashboard}
                label="Home"
                isActive={pathname === "/dashboard"}
              />
              <NavLink
                href="/dashboard/events"
                icon={Calendar}
                label="Events"
                isActive={pathname.startsWith("/dashboard/events")}
              />
              <NavLink
                href="/dashboard/contacts"
                icon={Users}
                label="Contacts"
                isActive={pathname.startsWith("/dashboard/contacts")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Messaging</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/dashboard/messages"
                icon={Inbox}
                label="Messages"
                isActive={pathname.startsWith("/dashboard/messages")}
              />
              <NavLink
                href="/dashboard/balance"
                icon={Coins}
                label="Balance"
                isActive={pathname.startsWith("/dashboard/balance")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Safety</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/dashboard/sos"
                icon={AlertTriangle}
                label="Emergency SOS"
                isActive={pathname.startsWith("/dashboard/sos")}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive data-[active=true]:bg-destructive/15 data-[active=true]:text-destructive"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="pr-8">Delivery logs</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => setLogsOpen((o) => !o)}
                  aria-expanded={logsOpen}
                  className="text-sidebar-foreground"
                >
                  <Mail />
                  <span className="truncate">Reports &amp; channels</span>
                  <ChevronDown
                    className={cn(
                      "ml-auto size-4 shrink-0 transition-transform duration-200",
                      logsOpen ? "rotate-180" : "rotate-0"
                    )}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
              {logsOpen ? (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname.startsWith("/dashboard/email-logs")}>
                      <Link href="/dashboard/email-logs">
                        <Mail />
                        <span>Email</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname.startsWith("/dashboard/telegram-logs")}>
                      <Link href="/dashboard/telegram-logs">
                        <Send />
                        <span>Telegram</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {showDiscordSlack ? (
                    <>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/dashboard/discord-logs")}>
                          <Link href="/dashboard/discord-logs">
                            <MessageSquare />
                            <span>Discord</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith("/dashboard/slack-logs")}>
                          <Link href="/dashboard/slack-logs">
                            <MessageSquare />
                            <span>Slack</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </>
                  ) : null}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/dashboard/data-management"
                icon={Database}
                label="Import / export"
                isActive={pathname.startsWith("/dashboard/data-management")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavLink
                  href="/dashboard/admin"
                  icon={Shield}
                  label="Overview"
                  isActive={
                    pathname.startsWith("/dashboard/admin") &&
                    !pathname.startsWith("/dashboard/admin/manage-users")
                  }
                />
                <NavLink
                  href="/dashboard/admin/manage-users"
                  icon={Users}
                  label="Users"
                  isActive={pathname.startsWith("/dashboard/admin/manage-users")}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/dashboard/notifications"
                icon={Bell}
                label="Notifications"
                isActive={pathname.startsWith("/dashboard/notifications")}
              />
              <NavLink
                href="/dashboard/referrals"
                icon={Gift}
                label="Referrals"
                isActive={pathname.startsWith("/dashboard/referrals")}
              />
              <NavLink
                href="/dashboard/settings"
                icon={SettingsIcon}
                label="Settings"
                isActive={pathname.startsWith("/dashboard/settings")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {subscription ? (
          <div className="mb-2 rounded-lg bg-sidebar-accent/40 px-2 py-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-sidebar-foreground">
              {subscription.tier === "free" && <User className="size-3.5 shrink-0 text-muted-foreground" />}
              {subscription.tier === "basic" && <Coins className="size-3.5 shrink-0 text-primary" />}
              {subscription.tier === "pro" && <Zap className="size-3.5 shrink-0 text-primary" />}
              {subscription.tier === "enterprise" && (
                <Crown className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
              )}
              <span className="capitalize">{subscription.tier}</span>
              {subscription.status === "trial" ? (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Trial
                </span>
              ) : null}
            </div>
            {subscription.tier === "basic" && subscription.totalTokensPurchased > 0 ? (
              <p className="mt-1 text-[11px] text-sidebar-foreground/70">
                {subscription.totalTokensPurchased}/100 tokens used
              </p>
            ) : null}
          </div>
        ) : null}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
