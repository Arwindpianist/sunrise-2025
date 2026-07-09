"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Bell, BookOpen, Coins, LifeBuoy, Mail, Menu, Shield } from "lucide-react"

import { featureFlags } from "@/lib/feature-flags"
import { getChannelBurnDisplay } from "@/lib/pricing"
import type { ChannelType } from "@/lib/financial-model"
import { cn } from "@/lib/utils"
import { useBrand } from "@repo/ui/brand-provider"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type SectionId =
  | "getting-started"
  | "contacts"
  | "events"
  | "messaging"
  | "templates"
  | "tokens"
  | "troubleshooting"
  | "support"

const NAV: { id: SectionId; label: string }[] = [
  { id: "getting-started", label: "Getting started" },
  { id: "contacts", label: "Contacts" },
  { id: "events", label: "Events" },
  { id: "messaging", label: "Messaging" },
  { id: "templates", label: "Templates" },
  { id: "tokens", label: "Tokens & plans" },
  { id: "troubleshooting", label: "FAQ" },
  { id: "support", label: "Support" },
]

const CHANNEL_ROWS: { key: string; channel: ChannelType; title: string; description: string }[] = [
  {
    key: "email",
    channel: "email",
    title: "Email",
    description: "Invitations, reminders, and rich HTML layouts. Best for formal comms and details.",
  },
  {
    key: "telegram",
    channel: "telegram",
    title: "Telegram",
    description: "Quick updates and reminders for subscribers who use Telegram (paid plans).",
  },
  {
    key: "discord",
    channel: "discord",
    title: "Discord",
    description: "Reach communities and teams where they already collaborate.",
  },
  {
    key: "slack",
    channel: "slack",
    title: "Slack",
    description: "Workplace-friendly notifications for internal events and meetings.",
  },
  {
    key: "whatsapp_utility",
    channel: "whatsapp_utility",
    title: "WhatsApp (utility)",
    description: "Transactional-style messages; higher delivery cost is reflected in token use.",
  },
  {
    key: "whatsapp_marketing",
    channel: "whatsapp_marketing",
    title: "WhatsApp (marketing)",
    description: "Promotional or broad outreach; uses more tokens per message than utility.",
  },
]

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why are my messages not sending?",
    a: "Confirm you still have tokens, recipients have valid contact info, and your event is saved. On the Free plan, only email is available. Upgrade for Telegram and other channels.",
  },
  {
    q: "How do I add or import contacts?",
    a: "Open Dashboard, then Contacts. Add people manually, import a file where supported, or share a signup link when you use public intake flows. Keep duplicates tidy so sends stay accurate.",
  },
  {
    q: "Can I customize templates?",
    a: "Free and Basic include ready-made layouts. Pro and Enterprise unlock deeper customization and branding options. See Pricing for the full comparison.",
  },
  {
    q: "How far ahead should I schedule invitations?",
    a: "For most events, two to four weeks ahead works well. Add a reminder about one week out and a short nudge the day before, especially for paid or ticketed events.",
  },
]

const brandOutlineButton =
  "border-border bg-background text-foreground shadow-xs hover:bg-muted hover:text-foreground"

function DocsNav({ activeId, onNavigate }: { activeId: SectionId; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1 px-1" aria-label="Help sections">
      <p className="text-muted-foreground mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider">Help</p>
      {NAV.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={onNavigate}
          className={cn(
            "block rounded-md px-2 py-1.5 text-sm transition-colors",
            activeId === id
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          {label}
        </a>
      ))}
      <div className="border-border mt-8 border-t pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/faq">View FAQ</Link>
        </Button>
      </div>
    </nav>
  )
}

function DocsToc({ activeId, isSunset }: { activeId: SectionId; isSunset: boolean }) {
  return (
    <nav className="space-y-1" aria-label="On this page">
      <p className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">On this page</p>
      {NAV.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            "block border-l-2 py-1 pl-3 text-xs leading-snug transition-colors",
            activeId === id
                ? isSunset
                  ? "border-primary font-medium text-foreground"
                  : "border-orange-500 font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}

function useActiveSection() {
  const [activeId, setActiveId] = useState<SectionId>("getting-started")

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    return () => {
      document.documentElement.style.scrollBehavior = ""
    }
  }, [])

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, "") as SectionId
      if (NAV.some((n) => n.id === raw)) setActiveId(raw)
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  useEffect(() => {
    const sections = NAV.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (sections.length === 0) return

    let raf = 0
    const observer = new IntersectionObserver(
      (entries) => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const visible = entries.filter((e) => e.isIntersecting && e.target.id)
          if (visible.length === 0) return
          const scored = visible.map((e) => {
            const r = e.boundingClientRect
            const mid = (window.innerHeight * 0.32) as number
            const dist = Math.abs(r.top + r.height / 2 - mid)
            return { id: e.target.id as SectionId, ratio: e.intersectionRatio, dist }
          })
          scored.sort((a, b) => {
            if (Math.abs(b.ratio - a.ratio) > 0.08) return b.ratio - a.ratio
            return a.dist - b.dist
          })
          setActiveId(scored[0].id)
        })
      },
      {
        root: null,
        rootMargin: "-72px 0px -42% 0px",
        threshold: [0, 0.04, 0.08, 0.12, 0.18, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
      },
    )

    sections.forEach((el) => observer.observe(el))
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return activeId
}

export default function HelpPage() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const activeSection = useActiveSection()

  const brandPrimaryButton = isSunset
    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary/30 border-0"
    : "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:from-orange-600 hover:to-rose-600 focus-visible:ring-orange-400/40 border-0"

  const brandAccentBorder = isSunset ? "border-primary/35" : "border-orange-500"
  const brandAccentIcon = isSunset ? "text-primary" : "text-orange-600"
  const brandLink = isSunset ? "text-primary hover:text-primary/90" : "text-orange-700 hover:text-orange-900"

  return (
    <div className="min-h-[calc(100dvh-4rem)] border-t border-border bg-muted/30">
      <div className="mx-auto max-w-screen-2xl">
        {/* Mobile */}
        <div className="border-b border-border bg-background px-4 py-4 lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Help</p>
              <h1 className="text-foreground mt-1 text-xl font-semibold tracking-tight">{isSunset ? "Sunset Help" : "Sunrise Help"}</h1>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {isSunset
                  ? "Guides for memorial setup, contacts, outreach, and sending."
                  : "Guides for setup, contacts, events, and sending."}
              </p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 gap-2">
                  <Menu className="h-4 w-4" aria-hidden />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(100vw-2rem,18rem)] flex-col gap-0 p-0 sm:max-w-xs">
                <SheetHeader className="border-b border-border px-4 py-4 text-left">
                  <SheetTitle className="text-base font-semibold">Help</SheetTitle>
                  <p className="text-muted-foreground text-sm font-normal">Jump to a section.</p>
                </SheetHeader>
                <div className="px-2 py-4">
                  <DocsNav activeId={activeSection} onNavigate={closeSheet} />
                </div>
                <div className="border-t border-border mt-auto space-y-2 px-4 py-4">
                  <Button asChild className={cn("w-full", brandPrimaryButton)}>
                    <Link href="/contact" onClick={closeSheet}>
                      Contact support
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full" size="sm">
                    <Link href="/faq" onClick={closeSheet}>
                      FAQ
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex flex-col bg-background lg:flex-row">
          <aside
            className="border-border hidden w-56 shrink-0 border-r bg-background lg:sticky lg:top-16 lg:block lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:py-10"
            aria-label="Help navigation"
          >
            <DocsNav activeId={activeSection} />
          </aside>

          <main className="min-w-0 flex-1 lg:border-r lg:border-border">
            <div className="mx-auto max-w-2xl space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 lg:px-8 lg:py-10">
              <div className="hidden lg:block">
                <nav className="text-muted-foreground mb-3 text-sm" aria-label="Breadcrumb">
                  <ol className="flex flex-wrap items-center gap-1.5">
                    <li>
                      <Link href="/" className="hover:text-foreground">
                        {isSunset ? "Sunset" : "Sunrise"}
                      </Link>
                    </li>
                    <li aria-hidden className="text-muted-foreground/70">
                      /
                    </li>
                    <li className="text-foreground font-medium">Help</li>
                  </ol>
                </nav>
                <h1 className="text-foreground text-balance text-3xl font-bold tracking-tight">
                  {isSunset ? "How to get the most out of Sunset" : "How to get the most out of Sunrise"}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-xl text-pretty text-base leading-relaxed">
                  {isSunset
                    ? "Guides for memorial updates, contacts, messaging, and billing. Written for organisers on any device."
                    : "Guides for accounts, contacts, events, messaging, and billing. Written for organizers on any device."}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild size="sm" className={brandPrimaryButton}>
                    <Link href="/dashboard">
                      Dashboard
                      <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className={brandOutlineButton}>
                    <Link href="/pricing">Pricing</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className={brandOutlineButton}>
                    <Link href="/contact">Contact</Link>
                  </Button>
                </div>
              </div>

              <Alert className="border-border bg-muted/50 lg:hidden">
                <Bell className="h-4 w-4" />
                <AlertTitle>Topics menu</AlertTitle>
                <AlertDescription>
                  Use <strong>Menu</strong> to open the section list. The layout matches desktop from medium widths up.
                </AlertDescription>
              </Alert>

            {/* Getting started */}
            <section id="getting-started" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Getting started</CardTitle>
                  <CardDescription>Create your workspace, then send your first invitation with confidence.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border border-border bg-muted/20 py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <Badge className={cn("w-fit border-0", brandPrimaryButton)}>1</Badge>
                        <CardTitle className="text-base text-foreground">Create your account</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                        Register with email and password, confirm your inbox, then sign in to open the dashboard.
                      </CardContent>
                    </Card>
                    <Card className="border border-border bg-muted/15 py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <Badge className={cn("w-fit border-0", brandPrimaryButton)}>2</Badge>
                        <CardTitle className="text-base text-foreground">Add contacts</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                        Build your list manually or via import. Clean data upfront saves time when you segment audiences later.
                      </CardContent>
                    </Card>
                    <Card className="border border-border bg-muted/25 py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <Badge className={cn("w-fit border-0", brandPrimaryButton)}>3</Badge>
                        <CardTitle className="text-base text-foreground">Create an event</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                        Add event details, pick who should receive it, choose a template, then send or schedule messages.
                      </CardContent>
                    </Card>
                  </div>
                  <Alert className="border-border bg-muted/40">
                    <Shield className={cn("h-4 w-4", brandAccentIcon)} />
                    <AlertTitle className="text-foreground">Free plan snapshot</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Includes <strong>15 trial tokens</strong>, unlimited contacts, up to <strong>5 events</strong>, and{" "}
                        <strong>email sending</strong>. Subscribe when you need Telegram, higher event limits, token top-ups, or advanced templates.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </section>

            {/* Contacts */}
            <section id="contacts" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Managing contacts</CardTitle>
                  <CardDescription>Organize people once, reuse them across events and campaigns.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Your contact list powers every send. Keep names and channels current, merge duplicates, and use tags or
                    segments (where available) so each event reaches the right group.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Manual entry",
                        body: "Ideal for VIPs and last-minute additions. Double-check spelling so delivery does not bounce.",
                      },
                      {
                        title: "Import",
                        body: "Bring structured data from spreadsheets or contact files when your flow supports it. Always preview field mapping.",
                      },
                      {
                        title: "Self-serve signup",
                        body: "Share a public form when you want guests to add themselves; review new entries before large sends.",
                      },
                      {
                        title: "Hygiene",
                        body: "Remove stale addresses, respect opt-outs, and document consent for marketing-style messages.",
                      },
                    ].map((item) => (
                      <Card key={item.title} className="border border-border py-4 shadow-none">
                        <CardHeader className="p-4 pb-2 pt-0">
                          <CardTitle className="text-base text-foreground">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">{item.body}</CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Events */}
            <section id="events" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Creating events</CardTitle>
                  <CardDescription>From idea to inbox: a linear flow you can repeat for every occasion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ol className="space-y-4">
                    {[
                      {
                        title: "Event details",
                        body: "Name, date, time, location, dress code, RSVP instructions: put anything guests need in one place.",
                      },
                      {
                        title: "Audience",
                        body: "Choose individuals, segments, or everyone on a list. Narrowing the audience saves tokens and improves relevance.",
                      },
                      {
                        title: "Template & copy",
                        body: "Pick a layout that matches the tone of the event; tweak subject lines for clarity on mobile previews.",
                      },
                      {
                        title: "Schedule",
                        body: "Send now or queue sends and reminders. Space messages so nothing feels like spam.",
                      },
                    ].map((step, i) => (
                      <li key={step.title} className="flex gap-3 sm:gap-4">
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm",
                            isSunset ? "bg-primary" : "bg-gradient-to-br from-orange-500 to-rose-500",
                          )}
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="font-medium text-foreground">{step.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {featureFlags.enableSos ? (
                    <Alert className="border-border bg-muted/40">
                      <LifeBuoy className={cn("h-4 w-4", brandAccentIcon)} />
                      <AlertTitle className="text-foreground">Emergency (SOS)</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                        If SOS is enabled for your deployment, organizers can use dashboard SOS tools for urgent broadcasts.
                        Use only for true emergencies and follow your organization&apos;s policy.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </section>

            {/* Messaging */}
            <section id="messaging" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Messaging & scheduling</CardTitle>
                  <CardDescription>Meet people on the channel they check, without guessing token cost.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Each successful send consumes tokens based on channel cost. Combine email for depth with instant channels
                    for nudges once your plan supports them.
                  </p>
                  <div className="rounded-lg border border-border">
                    <table className="w-full min-w-[280px] text-left text-sm">
                      <thead className="border-b border-border bg-muted/40">
                        <tr>
                          <th className="px-3 py-2.5 font-medium text-foreground sm:px-4">Channel</th>
                          <th className="px-3 py-2.5 font-medium text-foreground sm:px-4">Token use</th>
                          <th className="hidden px-4 py-2.5 font-medium text-foreground sm:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHANNEL_ROWS.map((row) => (
                          <tr key={row.key} className="border-b border-border last:border-0">
                            <td className="px-3 py-3 align-top sm:px-4">
                              <span className="font-medium text-foreground">{row.title}</span>
                              <p className="mt-1 text-muted-foreground sm:hidden">{row.description}</p>
                            </td>
                            <td className="px-3 py-3 align-top sm:px-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-normal",
                                  isSunset ? "border-primary/35 bg-primary/10 text-primary" : "border-orange-200 bg-orange-50/80 text-orange-900",
                                )}
                              >
                                {getChannelBurnDisplay(row.channel)}
                              </Badge>
                            </td>
                            <td className="hidden px-4 py-3 align-top text-muted-foreground sm:table-cell">{row.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Card className="border border-dashed border-border bg-muted/20 py-4 shadow-none">
                    <CardContent className="space-y-2 px-4 py-0 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Scheduling habits that work</p>
                      <ul className="list-inside list-disc space-y-1 pl-0.5">
                        <li>Send the first invitation two to four weeks ahead for weddings and ticketed events.</li>
                        <li>Schedule one reminder a week before and a short note the day before.</li>
                        <li>Use timezone-aware times when guests are in multiple regions.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>

            {/* Templates */}
            <section id="templates" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Templates & branding</CardTitle>
                  <CardDescription>Keep every touchpoint on-brand while moving quickly.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      title: "Formal",
                      body: "Weddings, galas, and ceremonies: clear hierarchy, generous spacing, legible type on mobile.",
                    },
                    {
                      title: "Casual",
                      body: "Birthdays and parties: warm tone, bold hero image, single-column body for small screens.",
                    },
                    {
                      title: "Business",
                      body: "Meetings and offsites: concise bullets, agenda blocks, and calendar-friendly summaries.",
                    },
                  ].map((t) => (
                    <Card key={t.title} className="border border-border py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <CardTitle className="text-base text-foreground">{t.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">{t.body}</CardContent>
                    </Card>
                  ))}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 border-t border-border sm:flex-row sm:justify-end">
                  <Button variant="outline" asChild className={brandOutlineButton}>
                    <Link href="/features">Explore features</Link>
                  </Button>
                  <Button asChild className={brandPrimaryButton}>
                    <Link href="/pricing">Plan comparison</Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>

            {/* Tokens */}
            <section id="tokens" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Tokens & subscriptions</CardTitle>
                  <CardDescription>Tokens meter delivery; plans unlock capacity and channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border border-border py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <CardTitle className="text-base text-foreground">Free</CardTitle>
                        <CardDescription>Trial workspace</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 px-4 pb-4 pt-0 text-sm text-muted-foreground">
                        <p>15 trial tokens, unlimited contacts, up to 5 events, email-only sends.</p>
                        <p>No token top-ups until you subscribe.</p>
                      </CardContent>
                    </Card>
                    <Card className="border border-border py-4 shadow-none">
                      <CardHeader className="p-4 pb-2 pt-0">
                        <CardTitle className="text-base text-foreground">Paid plans</CardTitle>
                        <CardDescription>Basic, Pro, Enterprise</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 px-4 pb-4 pt-0 text-sm text-muted-foreground">
                        <p>Monthly token allowances, lower per-token top-up rates on higher tiers, and more events.</p>
                        <p>Telegram and other channels unlock according to your tier. See Pricing for detail.</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Alert className="border-border bg-muted/40">
                    <Coins className={cn("h-4 w-4", brandAccentIcon)} />
                    <AlertTitle className="text-foreground">Weighted sends</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      Heavy channels (for example some WhatsApp modes) cost more tokens by design so pricing stays aligned
                      with carrier fees. Check the messaging table above before you scale a campaign.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </section>

            {/* FAQ */}
            <section id="troubleshooting" className="scroll-mt-28">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Troubleshooting & FAQ</CardTitle>
                  <CardDescription>Fast answers before you open a ticket.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {FAQ_ITEMS.map((item) => (
                    <Card key={item.q} className="border border-border py-0 shadow-none">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base font-medium leading-snug text-foreground">{item.q}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">{item.a}</CardContent>
                    </Card>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="link" className={cn("h-auto min-h-0 px-0", brandLink)} asChild>
                    <Link href="/faq">View full FAQ page</Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>

            {/* Support */}
            <section id="support" className="scroll-mt-28">
              <Card className="border-border bg-muted/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">Still stuck?</CardTitle>
                  <CardDescription>We respond fastest when messages include screenshots and steps to reproduce.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Card className="border border-border bg-muted/20 shadow-sm">
                    <CardHeader className="p-4 pb-2 pt-0">
                      <div className="flex items-center gap-2">
                        <Mail className={cn("h-4 w-4", brandAccentIcon)} aria-hidden />
                        <CardTitle className="text-base text-foreground">Email us</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 text-sm text-muted-foreground">
                      Use the contact form with your account email, event name, and approximate time of the issue.
                    </CardContent>
                    <CardFooter className="px-4 pb-4 pt-0">
                      <Button className={cn("w-full sm:w-auto", brandPrimaryButton)} asChild>
                        <Link href="/contact">Open contact form</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card className="border border-border bg-muted/20 shadow-sm">
                    <CardHeader className="p-4 pb-2 pt-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className={cn("h-4 w-4", brandAccentIcon)} aria-hidden />
                        <CardTitle className="text-base text-foreground">Self-serve</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-0">
                      <Button variant="outline" asChild className={brandOutlineButton}>
                        <Link href="/faq">FAQ</Link>
                      </Button>
                      <Button variant="outline" asChild className={brandOutlineButton}>
                        <Link href="/pricing">Plans & tokens</Link>
                      </Button>
                      <Button variant="outline" asChild className={brandOutlineButton}>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </section>
            </div>
          </main>

          <aside
            className="border-border hidden w-48 shrink-0 border-l bg-background py-10 pl-5 pr-6 xl:block"
            aria-label="On this page"
          >
            <div className="sticky top-20">
              <DocsToc activeId={activeSection} isSunset={isSunset} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
