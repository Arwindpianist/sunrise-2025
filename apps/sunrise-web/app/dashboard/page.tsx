"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useUserProfile } from "@/components/providers/user-profile-provider"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  Mail,
  Coins,
  Plus,
  Gift,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"
import SubscriptionStatus from "@/components/subscription-status"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const { profile } = useUserProfile()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalContacts: 0,
    totalEmails: 0,
    balance: 0,
  })
  const [recentEvents, setRecentEvents] = useState<
    Array<{ id: string; title: string; status: string }>
  >([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else {
      fetchDashboardOverview()
    }
  }, [user, router])

  const fetchDashboardOverview = async () => {
    try {
      const response = await fetch("/api/dashboard/overview", { credentials: "include" })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to fetch dashboard overview")
      }

      setStats(
        payload.stats || {
          totalEvents: 0,
          totalContacts: 0,
          totalEmails: 0,
          balance: 0,
        }
      )
      setRecentEvents(payload.recentEvents || [])
    } catch (error) {
      console.error("Error fetching dashboard overview:", error)
    }
  }

  if (!user || !mounted) {
    return null
  }

  const glance = [
    {
      label: "Events",
      value: stats.totalEvents,
      icon: Calendar,
      href: "/dashboard/events",
    },
    {
      label: "Contacts",
      value: stats.totalContacts,
      icon: Users,
      href: "/dashboard/contacts",
    },
    {
      label: "Messages sent",
      value: stats.totalEmails,
      icon: Mail,
      href: "/dashboard/messages",
    },
    {
      label: "Tokens",
      value: stats.balance,
      icon: Coins,
      href: "/dashboard/balance",
    },
  ]

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="mb-10">
          <p className="text-sm font-medium text-muted-foreground">
            Good {getGreeting()}, {profile?.full_name?.trim() || "there"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Your workspace
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start an event, reach people on their channels, and keep token usage in view without digging through menus.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={() => router.push("/dashboard/events/create")}>
              <Plus className="h-4 w-4" />
              Create event
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => router.push("/dashboard/contacts")}>
              <Users className="h-4 w-4" />
              Contacts
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/dashboard/referrals">
                <Gift className="h-4 w-4" />
                Referrals
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Need help fast?{" "}
            <button
              type="button"
              onClick={() => router.push("/dashboard/sos")}
              className="font-medium text-destructive underline-offset-4 hover:underline"
            >
              Emergency SOS
            </button>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            At a glance
          </h2>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {glance.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className="group flex flex-col gap-2 bg-card p-4 text-left transition-colors hover:bg-muted/40 sm:p-5"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{item.value}</span>
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight">Recent events</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" asChild>
                <Link href="/dashboard/events">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-border rounded-2xl border border-border">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{event.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{event.status}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/events/${event.id}`}>Open</Link>
                  </Button>
                </div>
              ))}
              {recentEvents.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
                  <p className="mb-4 text-sm text-muted-foreground">No events yet</p>
                  <Button onClick={() => router.push("/dashboard/events/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first event
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Plan &amp; usage</h2>
            <SubscriptionStatus />
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Compare tiers, token rules, and limits anytime on the pricing page.
            </p>
            <Button variant="secondary" size="sm" className="shrink-0 gap-2" asChild>
              <Link href="/pricing">
                View pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Looking for channel specifics (email, Telegram, and more)? Open{" "}
            <Link href="/features" className="font-medium text-primary underline-offset-4 hover:underline">
              Features
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 18) return "afternoon"
  return "evening"
}
