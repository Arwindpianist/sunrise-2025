"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Flower2,
  Mail,
  Sparkles,
} from "lucide-react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from "@repo/ui"
import { estimateMonthlyMessageSpend } from "./financial-estimator"
import { MemorialFlowDemo } from "./demos/MemorialFlowDemo"
import { MemorialMessageChannelPreview } from "./demos/MessageChannelPreview"
import { MemorialContactBoardDemo } from "./demos/ContactBoardDemo"
import { MemorialContactLinkFormDemo } from "./demos/ContactLinkFormDemo"

export type SunsetMarketingHomeProps = {
  /** Canonical Sunrise marketing URL for the companion strip (no trailing slash). */
  companionSunriseUrl?: string
  /** Same-origin path unless you override (shared Sunrise/Sunset app). */
  playgroundHref?: string
  registerHref?: string
  pricingHref?: string
  memorialHref?: string
  forgotPasswordHref?: string
  showUpgradeBadge?: boolean
}

export function SunsetMarketingHome({
  companionSunriseUrl = "https://sunrise-2025.com",
  playgroundHref: playgroundHrefProp,
  registerHref = "/register",
  pricingHref = "/pricing",
  memorialHref = "/memorial",
  forgotPasswordHref,
  showUpgradeBadge = false,
}: SunsetMarketingHomeProps) {
  const sunriseBase = companionSunriseUrl.replace(/\/$/, "")
  const playgroundHref = playgroundHrefProp ?? "/playground"
  const forgotHref = forgotPasswordHref ?? "/forgot-password"

  const [activeUseCase, setActiveUseCase] = useState<"service" | "condolence" | "community">("service")
  const [recipientCount, setRecipientCount] = useState(120)
  const [whatsappShare, setWhatsappShare] = useState(15)
  const [marketingTab, setMarketingTab] = useState("create")

  const useCaseContent = useMemo(() => {
    const map = {
      service: {
        title: "Memorial and service coordination without spreadsheet chaos",
        description:
          "Share one carefully drafted notice for dates, venues, and streaming links so everyone receives the same calm, accurate information.",
        bullets: [
          "Segment family, community, and logistics contacts",
          "Schedule reminders that respect quiet hours and time zones",
          "Keep tone consistent across channels",
        ],
      },
      condolence: {
        title: "Condolence and acknowledgement at the right distance",
        description:
          "Reach people who need a gentle update without overwhelming them. Acknowledgements can be short, personal, and measured.",
        bullets: [
          "Separate lists for immediate family and wider circles",
          "Optional staggered sending for large groups",
          "Templates crafted for sensitivity, not celebration UI",
        ],
      },
      community: {
        title: "Organisations and faith communities",
        description:
          "Parishes, workplaces, and associations can coordinate announcements with clear roles, fewer duplicate sends, and delivery visibility.",
        bullets: [
          "Structured workflow for staff and volunteers",
          "Categories that reflect real-world relationships",
          "Status-aware sending to reduce duplicate outreach",
        ],
      },
    }
    return map[activeUseCase]
  }, [activeUseCase])

  const monthlySpendPreview = useMemo(() => {
    const whatsappRatio = whatsappShare / 100
    const emailRatio = 1 - whatsappRatio
    return estimateMonthlyMessageSpend(recipientCount, {
      emailShare: emailRatio,
      whatsappShare: whatsappRatio,
    })
  }, [recipientCount, whatsappShare])

  const sliderProgress = useMemo(() => {
    const min = 40
    const max = 2000
    return ((recipientCount - min) / (max - min)) * 100
  }, [recipientCount])
  const channelBlend = 100 - whatsappShare

  return (
    <div className="sunset-marketing relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="sunset-hero-glow-a absolute -left-24 top-16 h-64 w-64 rounded-full opacity-50 blur-3xl" />
        <div className="sunset-hero-glow-b absolute right-0 top-1/3 h-72 w-72 rounded-full opacity-40 blur-3xl" />
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:py-20">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out">
          {showUpgradeBadge ? (
            <div className="flex justify-center sm:justify-start">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                Platform upgrade in progress
              </Badge>
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-primary" />
            <p className="sunset-wordmark bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Sunset
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Dignified memorial communications for families and communities.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            Sunset helps you plan once and reach the right people with care. Coordinate notices, organise audiences, and send
            measured messages from a workflow built for difficult moments, not marketing noise.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 motion-safe:transition-all motion-safe:duration-300">
          <Link href={registerHref}>
            <Button className="h-12 w-full bg-primary text-base text-primary-foreground shadow-md motion-safe:transition-transform motion-safe:duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]">
              Begin quietly
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href={pricingHref}>
            <Button
              variant="outline"
              className="h-12 w-full border-primary/40 text-base text-primary motion-safe:transition-all motion-safe:duration-200 hover:scale-[1.01] hover:bg-primary/10 active:scale-[0.99]"
            >
              View pricing
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Flower2,
              title: "Written for remembrance",
              desc: "Services, private gatherings, condolences, and organisational outreach.",
            },
            {
              icon: Clock3,
              title: "Less administrative burden",
              desc: "Guided steps and reusable memorial presets reduce repetitive work when focus matters most.",
            },
            {
              icon: Mail,
              title: "Delivery you can trace",
              desc: "Email-first pipeline with clear status so nothing feels lost in the noise.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="sunset-panel rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 h-5 w-5 text-primary" />
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
              Compose
            </TabsTrigger>
            <TabsTrigger value="send" className="motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]">
              Deliver
            </TabsTrigger>
            <TabsTrigger value="track" className="motion-safe:transition-all motion-safe:duration-200 data-[state=active]:scale-[1.02]">
              Follow up
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div
          key={marketingTab}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:zoom-in-[0.995] motion-safe:duration-400 motion-safe:ease-out"
        >
          {marketingTab === "create" ? (
            <div className="sunset-panel mt-4 rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Guided memorial composer
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Build each outreach step by step: occasion details, audience, templates, and review. The flow stays calm and
                legible on mobile when you are away from a desk.
              </p>
            </div>
          ) : null}
          {marketingTab === "send" ? (
            <div className="sunset-panel mt-4 rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Respectful delivery paths
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Messages route through the same careful pipeline as Sunrise so families keep one wallet and one ledger under
                Sunrise Sunset Services, with Sunset tuned for memorial tone and timing.
              </p>
            </div>
          ) : null}
          {marketingTab === "track" ? (
            <div className="sunset-panel mt-4 rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur motion-safe:transition-shadow motion-safe:duration-300">
              <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                <Mail className="h-5 w-5 text-primary" />
                Clarity for organisers
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">
                Cleaner templates, thoughtful categories, and status-aware workflows help small teams avoid duplicate sends when
                emotions run high.
              </p>
            </div>
          ) : null}
        </div>

        <MemorialFlowDemo compact className="animate-in fade-in slide-in-from-bottom-4 duration-700" />

        <MemorialMessageChannelPreview className="sunset-panel rounded-3xl border border-border bg-card/60 p-6 shadow-sm" />

        <MemorialContactBoardDemo compact className="animate-in fade-in duration-700" />

        <MemorialContactLinkFormDemo registerHref={registerHref} className="animate-in fade-in duration-700 border-border shadow-sm" />

        <div className="sunset-panel rounded-2xl border border-border bg-card/70 p-6 text-center shadow-sm">
          <p className="font-semibold text-foreground">Explore interactive demos</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            The playground hosts the full builder, channel previews, and UI experiments with no live sending. Your account and
            tokens stay shared across Sunrise and Sunset.
          </p>
          <Link href={playgroundHref} className="mt-4 inline-flex">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Open playground</Button>
          </Link>
        </div>

        <section className="sunset-panel rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-foreground">Explore by moment</h3>
            <div className="inline-flex rounded-full border border-border bg-muted/50 p-1 text-sm">
              {[
                { key: "service", label: "Service" },
                { key: "condolence", label: "Condolence" },
                { key: "community", label: "Community" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveUseCase(item.key as "service" | "condolence" | "community")}
                  className={cn(
                    "rounded-full px-3 py-1.5 motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
                    activeUseCase === item.key
                      ? "scale-[1.02] bg-card font-medium text-primary shadow-sm ring-1 ring-primary/30"
                      : "text-muted-foreground hover:scale-[1.02] hover:text-foreground",
                  )}
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
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{useCaseContent.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {useCaseContent.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {bullet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sunset-panel rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-foreground">Interactive send estimator</h3>
            <p className="text-sm text-muted-foreground">Preview cost behaviour as recipient volume grows (shared wallet).</p>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="recipient-count" className="text-sm font-medium text-foreground">
                Estimated recipients per month: <span className="text-primary">{recipientCount}</span>
              </label>
              <input
                id="recipient-count"
                type="range"
                min={40}
                max={2000}
                step={10}
                value={recipientCount}
                onInput={(e) => setRecipientCount(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => setRecipientCount(Number(e.target.value))}
                className="sunset-slider mt-3 w-full cursor-pointer appearance-none bg-transparent motion-safe:transition-[background] motion-safe:duration-200 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary"
                style={{
                  background: `linear-gradient(to right, var(--sunset-slider-fill-start) 0%, var(--sunset-slider-fill-end) ${sliderProgress}%, var(--sunset-slider-track) ${sliderProgress}%, var(--sunset-slider-track) 100%)`,
                  height: "0.5rem",
                  borderRadius: "9999px",
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>40</span>
                <span>1000</span>
                <span>2000</span>
              </div>
              <label htmlFor="whatsapp-share" className="mt-4 block text-sm font-medium text-foreground">
                WhatsApp mix: <span className="text-primary">{whatsappShare}%</span>
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
                className="sunset-slider mt-3 w-full cursor-pointer appearance-none bg-transparent motion-safe:transition-[background] motion-safe:duration-200 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary"
                style={{
                  background: `linear-gradient(to right, var(--sunset-slider-fill-start) 0%, var(--sunset-slider-fill-end) ${whatsappShare}%, var(--sunset-slider-track) ${whatsappShare}%, var(--sunset-slider-track) 100%)`,
                  height: "0.5rem",
                  borderRadius: "9999px",
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">Email mix automatically adjusts to {channelBlend}%.</p>
            </div>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Projected monthly send cost</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground transition-all duration-200">
                  RM{monthlySpendPreview.platformEstimate.toFixed(2)}
                </p>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Email channel mix</span>
                    <span>{channelBlend}%</span>
                  </div>
                  <Progress value={channelBlend} className="h-2" />
                </div>
                <div className="sunset-success-panel mt-3 rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Value comparison
                  </p>
                  <p className="mt-1 text-sm">
                    Around <span className="font-bold">{monthlySpendPreview.cheaperPercent}% lower</span> than typical bundled
                    providers at this mix (indicative).
                  </p>
                  <p className="mt-1 text-xs">
                    Competitor est.: RM{monthlySpendPreview.competitorEstimate.toFixed(2)} vs our est.: RM
                    {monthlySpendPreview.platformEstimate.toFixed(2)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Indicative preview only. Final billing varies by plan tier and token pricing.
                </p>
                <div className="mt-4">
                  <Link href={pricingHref} className="text-sm font-semibold text-primary underline underline-offset-2">
                    Compare plans and token rates
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="sunset-panel rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur">
          <h3 className="text-xl font-semibold text-foreground">Why teams choose Sunset</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              '"Finally a tool that does not feel like party invitations when we are grieving."',
              '"We could coordinate clergy, family, and distant relatives without losing track of who was told what."',
              '"Status on each send meant our volunteers were not duplicating painful calls."',
            ].map((quote) => (
              <p key={quote} className="rounded-xl border border-border bg-muted/25 p-4 text-sm leading-relaxed text-muted-foreground">
                {quote}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Accessible layouts for stressful moments",
            "Unified memorial template system",
            "Shared login with Sunrise for one wallet",
          ].map((item) => (
            <div
              key={item}
              className="sunset-panel flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>

        <div className="sunset-panel rounded-2xl border border-primary/35 bg-primary/12 p-4">
          <div className="flex flex-col gap-2 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              If your password fails after migration, reset it on Sunrise (shared account).
            </div>
            <a
              href={forgotHref}
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary/90"
              target="_blank"
              rel="noopener noreferrer"
            >
              Forgot password
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/35 bg-primary/10 p-4">
          <div className="flex flex-col gap-3 text-sm text-foreground sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl space-y-1 leading-relaxed">
              <p className="font-semibold">Sunrise is the companion for celebrations.</p>
              <p className="text-muted-foreground">
                When the moment calls for joy rather than mourning, Sunrise keeps the same account, tokens, and delivery rails.
                Brands stay separate; your wallet does not.
              </p>
            </div>
            <a
              href={sunriseBase}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-semibold text-primary underline underline-offset-2 hover:text-primary/90"
            >
              Visit Sunrise
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pb-8">
          <Link href={memorialHref}>
            <Button variant="outline" className="border-border">
              Memorial overview
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
