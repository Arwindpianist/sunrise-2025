"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Mail,
  Sparkles,
  Sunrise,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { estimateMonthlyMessageSpend } from "@/lib/financial-model"
import { featureFlags } from "@/lib/feature-flags"
import SunriseFlowDemo from "@/components/public/demo/sunrise-flow-demo"
import MessageChannelPreviewSection from "@/components/public/demo/message-channel-preview"
import ContactBoardDemo from "@/components/public/demo/contact-board-demo"
import ContactLinkFormDemo from "@/components/public/demo/contact-link-form-demo"

const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL || "https://sunset-2025.com"

export default function HomeRedesign() {
  const searchParams = useSearchParams()
  const [activeUseCase, setActiveUseCase] = useState<"weddings" | "family" | "teams">("weddings")
  const [inviteCount, setInviteCount] = useState(150)
  const [whatsappShare, setWhatsappShare] = useState(20)
  const [marketingTab, setMarketingTab] = useState("create")

  useEffect(() => {
    const message = searchParams.get("message")
    if (message === "account_deleted") {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted. Thank you for using our service.",
      })
    }
  }, [searchParams])

  const useCaseContent = useMemo(() => {
    const map = {
      weddings: {
        title: "Wedding coordination without group-chat chaos",
        description:
          "Create one polished announcement flow for save-the-dates, reminders, and day-of updates so everyone receives the same clear message.",
        bullets: [
          "Segment guests by family, friends, and vendors",
          "Schedule reminders before key milestones",
          "Keep visual tone elegant and consistent",
        ],
      },
      family: {
        title: "Family events that feel personal at scale",
        description:
          "From birthdays to reunions, Sunrise helps you send warm, customized invites while keeping admin effort low and response clarity high.",
        bullets: [
          "Reusable templates for recurring celebrations",
          "Clear recipient lists to avoid missed invites",
          "Mobile-friendly management for busy organizers",
        ],
      },
      teams: {
        title: "Team announcements with better visibility",
        description:
          "Coordinate company events and campaigns with a structured workflow so operations, HR, and leadership can collaborate in one system.",
        bullets: [
          "Consistent delivery process for internal comms",
          "Simplified audience targeting by category",
          "Status-aware sending to reduce duplicates",
        ],
      },
    }
    return map[activeUseCase]
  }, [activeUseCase])

  const monthlySpendPreview = useMemo(() => {
    const whatsappRatio = whatsappShare / 100
    const emailRatio = 1 - whatsappRatio
    return estimateMonthlyMessageSpend(inviteCount, {
      emailShare: emailRatio,
      whatsappShare: whatsappRatio,
    })
  }, [inviteCount, whatsappShare])

  const sliderProgress = useMemo(() => {
    const min = 50
    const max = 2000
    return ((inviteCount - min) / (max - min)) * 100
  }, [inviteCount])
  const channelBlend = 100 - whatsappShare

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-white to-rose-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
      </div>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:py-20">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out">
          {featureFlags.showUpgradeNotice ? (
            <div className="flex justify-center sm:justify-start">
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                Platform upgrade in progress
              </Badge>
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-2">
            <Sunrise className="h-6 w-6 text-orange-500" />
            <p className="text-lg font-bold tracking-tight bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Sunrise-2025
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            The joyful event platform for modern families and teams.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            Sunrise helps you plan once and communicate beautifully. Create meaningful events, organize your people, and send
            personalized invitations from a mobile-friendly workflow built for real life.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 motion-safe:transition-all motion-safe:duration-300">
          <Link href="/register">
            <Button className="h-12 w-full bg-gradient-to-r from-orange-500 to-rose-500 text-base motion-safe:transition-transform motion-safe:duration-200 hover:from-orange-600 hover:to-rose-600 hover:scale-[1.01] active:scale-[0.99]">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" className="h-12 w-full border-orange-300 text-base text-orange-700 motion-safe:transition-all motion-safe:duration-200 hover:scale-[1.01] hover:bg-orange-50 active:scale-[0.99]">
              View Pricing
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Built for heartfelt moments",
              desc: "Weddings, birthdays, family events, and community celebrations.",
            },
            {
              icon: Clock3,
              title: "Save planning time",
              desc: "Reusable templates and guided steps cut back repetitive work.",
            },
            {
              icon: Mail,
              title: "Reliable communication",
              desc: "Delivery-focused email pipeline with clear status tracking.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-orange-100/80 bg-white/70 p-5 shadow-sm backdrop-blur motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Tabs value={marketingTab} onValueChange={setMarketingTab} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 motion-safe:ease-out">
          <TabsList className="grid h-auto w-full grid-cols-3 motion-safe:transition-shadow motion-safe:duration-300">
            <TabsTrigger
              value="create"
              className="motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]"
            >
              Create
            </TabsTrigger>
            <TabsTrigger value="send" className="motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]">
              Send
            </TabsTrigger>
            <TabsTrigger value="track" className="motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]">
              Track
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div
          key={marketingTab}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:zoom-in-[0.995] motion-safe:duration-400 motion-safe:ease-out"
        >
          {marketingTab === "create" ? (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-white/75 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Calendar className="h-5 w-5 text-orange-500" />
                Guided event builder
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Build events step-by-step: details, audience, template, review. The new flow is cleaner, faster, and
                mobile-friendly.
              </p>
            </div>
          ) : null}
          {marketingTab === "send" ? (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-white/75 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Mail className="h-5 w-5 text-orange-500" />
                Reliable email pipeline
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                All event delivery now routes through a single canonical path and Zoho SMTP sender for consistent, traceable output.
              </p>
            </div>
          ) : null}
          {marketingTab === "track" ? (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-white/75 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Users className="h-5 w-5 text-orange-500" />
                Better recipient experience
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Cleaner templates, simplified categories, and status-aware workflows help teams avoid duplicate sends and confusion.
              </p>
            </div>
          ) : null}
        </div>

        <SunriseFlowDemo compact className="animate-in fade-in slide-in-from-bottom-4 duration-700" />

        <MessageChannelPreviewSection className="rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm" />

        <ContactBoardDemo compact className="animate-in fade-in duration-700" />

        <ContactLinkFormDemo className="animate-in fade-in duration-700 border-orange-100 shadow-sm" />

        <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-6 text-center shadow-sm">
          <p className="font-semibold text-foreground">Explore every control in one place</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            The playground bundles the full builder, channel previews, contact demos, and UI blocks, still with no sending.
          </p>
          <Link href="/playground" className="mt-4 inline-flex">
            <Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
              Open playground
            </Button>
          </Link>
        </div>

        <section className="rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-foreground">Explore by use case</h3>
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 p-1 text-sm">
              {[
                { key: "weddings", label: "Weddings" },
                { key: "family", label: "Family Events" },
                { key: "teams", label: "Teams" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveUseCase(item.key as "weddings" | "family" | "teams")}
                  className={`rounded-full px-3 py-1.5 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out ${
                    activeUseCase === item.key
                      ? "scale-[1.02] bg-white text-orange-700 shadow-sm"
                      : "text-orange-600 hover:scale-[1.02] hover:text-orange-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div
            key={activeUseCase}
            className="mt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-400 motion-safe:ease-out"
          >
            <h4 className="text-lg font-semibold text-foreground">{useCaseContent.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-foreground sm:text-base">{useCaseContent.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {useCaseContent.bullets.map((bullet) => (
                <div key={bullet} className="rounded-xl bg-gradient-to-br from-orange-50 to-rose-50 p-3 text-sm text-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-rose-500" />
                    {bullet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-foreground">Interactive send estimator</h3>
            <p className="text-sm text-muted-foreground">Preview cost behavior as your invite volume grows.</p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="invite-count" className="text-sm font-medium text-foreground">
                Estimated invites per month: <span className="text-orange-600">{inviteCount}</span>
              </label>
              <input
                id="invite-count"
                type="range"
                min={50}
                max={2000}
                step={10}
                value={inviteCount}
                onInput={(e) => setInviteCount(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => setInviteCount(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer appearance-none bg-transparent motion-safe:transition-[background] motion-safe:duration-200 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-rose-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #fb7185 ${sliderProgress}%, #fed7aa ${sliderProgress}%, #fed7aa 100%)`,
                  height: "0.5rem",
                  borderRadius: "9999px",
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>50</span>
                <span>1000</span>
                <span>2000</span>
              </div>
              <label htmlFor="whatsapp-share" className="mt-4 block text-sm font-medium text-foreground">
                WhatsApp mix: <span className="text-orange-600">{whatsappShare}%</span>
              </label>
              <input
                id="whatsapp-share"
                type="range"
                min={0}
                max={60}
                step={1}
                value={whatsappShare}
                onInput={(e) => setWhatsappShare(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => setWhatsappShare(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer appearance-none bg-transparent motion-safe:transition-[background] motion-safe:duration-200 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-500"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 ${whatsappShare}%, #e9d5ff ${whatsappShare}%, #e9d5ff 100%)`,
                  height: "0.5rem",
                  borderRadius: "9999px",
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">Email mix automatically adjusts to {100 - whatsappShare}%.</p>
            </div>

            <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50">
              <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Projected monthly send cost</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-foreground transition-all duration-200">
                RM{monthlySpendPreview.sunriseEstimate.toFixed(2)}
              </p>
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Email channel mix</span>
                  <span>{channelBlend}%</span>
                </div>
                <Progress value={channelBlend} className="h-2" />
              </div>
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Value comparison</p>
                <p className="mt-1 text-sm text-green-900">
                  Around <span className="font-bold">{monthlySpendPreview.cheaperPercent}% cheaper</span> than typical providers at this channel mix.
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Competitor est.: RM{monthlySpendPreview.competitorEstimate.toFixed(2)} vs Sunrise est.: RM{monthlySpendPreview.sunriseEstimate.toFixed(2)}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Indicative preview only. Final billing varies by plan tier and token pricing.
              </p>
              <div className="mt-4">
                <Link href="/pricing" className="text-sm font-semibold text-orange-700 underline underline-offset-2">
                  Compare exact plans and token rates
                </Link>
              </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="rounded-3xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h3 className="text-xl font-semibold text-foreground">Why people choose Sunrise</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              "\"Our invitations finally look consistent and professional.\"",
              "\"The new flow is much easier on mobile when managing events on the go.\"",
              "\"I can see who was targeted and sent without digging through pages.\"",
            ].map((quote) => (
              <p
                key={quote}
                className="rounded-xl bg-gradient-to-br from-orange-50 to-rose-50 p-4 text-sm leading-relaxed text-foreground"
              >
                {quote}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Mobile-first responsive layouts",
            "Unified template system",
            "Upgrade-safe login and reset messaging",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 text-rose-500" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex flex-col gap-2 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              If your old password no longer works after migration, reset it in one click.
            </div>
            <Link href="/forgot-password" className="font-semibold underline">
              Reset Password
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
          <div className="flex flex-col gap-3 text-sm text-violet-900 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl space-y-1 leading-relaxed">
              <p className="font-semibold text-violet-950">Sunset is not a visual tweak of Sunrise.</p>
              <p>
                It is the equally important companion experience for memorial services, condolences, and careful outreach when
                celebrations are not the right tone. Same account and services under Sunrise Sunset Services.
              </p>
            </div>
            <a
              href={SUNSET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-semibold text-violet-950 underline underline-offset-2 hover:text-violet-800"
            >
              Go to Sunset
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

