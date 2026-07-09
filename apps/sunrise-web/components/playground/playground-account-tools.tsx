"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Calendar,
  Coins,
  Crown,
  Layers,
  LifeBuoy,
  Plus,
  Send,
  Users,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import FeatureAvailability from "@/components/feature-availability"
import { discordTemplates } from "@/components/discord-templates"
import { slackTemplates } from "@/components/slack-templates"
import { format } from "date-fns"
import { CHANNEL_BURN_BY_TYPE, type ChannelType } from "@/lib/financial-model"
import { getTokenPriceDisplay } from "@/lib/pricing"
import { getTokenLimitInfo } from "@/lib/token-limits"
import type { SubscriptionTier } from "@/lib/subscription"
import { SUBSCRIPTION_FEATURES } from "@/lib/subscription"
import { cn } from "@/lib/utils"
import { useBrand } from "@repo/ui/brand-provider"

const SAMPLE_EVENT = {
  title: "Garden Party",
  description: "Casual dress. RSVP in Sunrise.",
  date: format(new Date(Date.now() + 86400000 * 10), "EEEE, MMMM do yyyy, h:mm a"),
  location: "Community hall",
  host: "Sunrise Host",
}

const channelRows: { key: ChannelType; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "telegram", label: "Telegram" },
  { key: "discord", label: "Discord" },
  { key: "slack", label: "Slack" },
  { key: "whatsapp_utility", label: "WhatsApp (utility)" },
  { key: "whatsapp_marketing", label: "WhatsApp (marketing)" },
]

export default function PlaygroundAccountTools() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [tier, setTier] = useState<SubscriptionTier>("basic")
  const [balance, setBalance] = useState(42)
  const [slackKey, setSlackKey] = useState(slackTemplates[0]?.key ?? "birthday")
  const [discordKey, setDiscordKey] = useState(discordTemplates[0]?.key ?? "birthday")

  const maxSlide = tier === "free" ? SUBSCRIPTION_FEATURES.free.maxTokens : 250

  const limitInfo = useMemo(() => {
    const purchasedMock = tier === "free" ? 0 : Math.max(0, Math.round(balance * 0.35))
    return getTokenLimitInfo(tier, balance, purchasedMock)
  }, [tier, balance])

  const slackPreview = useMemo(() => {
    const def = slackTemplates.find((t) => t.key === slackKey)
    if (!def) return null
    return def.template({
      firstName: "Jamie",
      eventTitle: SAMPLE_EVENT.title,
      eventDescription: SAMPLE_EVENT.description,
      eventDate: SAMPLE_EVENT.date,
      eventLocation: SAMPLE_EVENT.location,
      hostName: SAMPLE_EVENT.host,
      customMessage: SAMPLE_EVENT.description,
    })
  }, [slackKey])

  const discordPreview = useMemo(() => {
    const def = discordTemplates.find((t) => t.key === discordKey)
    if (!def) return null
    return def.template({
      firstName: "Jamie",
      eventTitle: SAMPLE_EVENT.title,
      eventDescription: SAMPLE_EVENT.description,
      eventDate: SAMPLE_EVENT.date,
      eventLocation: SAMPLE_EVENT.location,
      hostName: SAMPLE_EVENT.host,
    })
  }, [discordKey])

  const mockAction = (label: string) => {
    toast({
      title: "Try this after sign-in",
      description: `${label} opens in your live workspace with your data.`,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className={isSunset ? "sunset-panel border-border bg-card/85 shadow-md" : "border-orange-100 shadow-md"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} />
            Workspace shortcuts
          </CardTitle>
          <CardDescription>
            Same dashboard entry points; tap to see where they lead once you have an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Button
              className={isSunset ? "h-12 bg-primary text-primary-foreground hover:bg-primary/90 sm:h-14" : "h-12 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 sm:h-14"}
              asChild
            >
              <Link href="/register">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
            <Button variant="outline" className={isSunset ? "h-12 border-primary/35 text-primary sm:h-14" : "h-12 border-orange-300 text-orange-700 sm:h-14"} asChild>
              <Link href="/register">
                <Users className="mr-2 h-4 w-4" />
                Contacts
              </Link>
            </Button>
            <Button variant="outline" className={isSunset ? "h-12 border-primary/35 text-primary sm:h-14" : "h-12 border-orange-300 text-orange-700 sm:h-14"} asChild>
              <Link href="/register">
                <Coins className="mr-2 h-4 w-4" />
                Balance
              </Link>
            </Button>
            <Button variant="outline" className={isSunset ? "h-12 border-primary/35 text-primary sm:h-14" : "h-12 border-orange-300 text-orange-700 sm:h-14"} asChild>
              <Link href="/register">
                <Calendar className="mr-2 h-4 w-4" />
                All Events
              </Link>
            </Button>
            <Button
              className="h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 sm:h-14"
              type="button"
              onClick={() => mockAction("Emergency SOS")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency SOS
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={isSunset ? "sunset-panel border-border bg-card/85 shadow-md" : "border-amber-100 shadow-md"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Coins className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-amber-600"} />
            Token wallet lab
          </CardTitle>
          <CardDescription>
            Explore limits and channel burn the same way the billing layer does; numbers update locally only.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Plan tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as SubscriptionTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tok-bal">
                Wallet balance: <span className={cn("font-semibold", isSunset ? "text-primary" : "text-orange-600")}>{balance}</span>
              </Label>
              <input
                id="tok-bal"
                type="range"
                min={0}
                max={maxSlide}
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className={isSunset ? "w-full cursor-pointer accent-primary" : "w-full cursor-pointer accent-orange-500"}
              />
            </div>
            <div className={isSunset ? "rounded-xl border border-primary/35 bg-primary/10 p-4 text-sm text-foreground" : "rounded-xl border border-orange-100 bg-orange-50/50 p-4 text-sm"}>
              <p className={isSunset ? "font-medium text-foreground" : "font-medium text-gray-900"}>Allowance snapshot</p>
              <p className="mt-1 text-muted-foreground">
                {limitInfo.remainingTokens === -1 ? (
                  <>
                    Wallet-style balance: no fixed ceiling on this tier in the product calculators.
                  </>
                ) : (
                  <>
                    Remaining headroom:{" "}
                    <span className="font-semibold text-foreground">{limitInfo.remainingTokens}</span>
                  </>
                )}{" "}
                · Used roughly <span className="font-semibold">{limitInfo.percentageUsed.toFixed(0)}%</span>
              </p>
              <Progress value={Math.min(100, limitInfo.percentageUsed || 0)} className="mt-3 h-2" />
              {limitInfo.isNearLimit ? (
                <p className={isSunset ? "mt-2 text-xs text-primary" : "mt-2 text-xs text-amber-800"}>
                  Approaching plan envelope; top up or upgrade in product.
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Top-up rate on this tier: {getTokenPriceDisplay(tier)} · Monthly tokens:{" "}
                {SUBSCRIPTION_FEATURES[tier].monthlyTokens || "-"}
              </p>
            </div>
          </div>
          <div>
            <p className={isSunset ? "mb-2 text-sm font-medium text-foreground" : "mb-2 text-sm font-medium text-gray-900"}>Tokens per send (channel weights)</p>
            <ul className="space-y-2">
              {channelRows.map((row) => (
                <li
                  key={row.key}
                  className={isSunset ? "flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm" : "flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm"}
                >
                  <span>{row.label}</span>
                  <span className={isSunset ? "font-mono text-xs text-primary" : "font-mono text-xs text-orange-700"}>
                    {CHANNEL_BURN_BY_TYPE[row.key]} token{CHANNEL_BURN_BY_TYPE[row.key] === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className={isSunset ? "sunset-panel border-border bg-card/85 shadow-md" : "border-indigo-100 shadow-md"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-indigo-600"} />
            Discord & Slack payloads
          </CardTitle>
          <CardDescription>
            Same structured messages your automations send; pick presets to inspect formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <Label>Discord embed preset</Label>
            <Select value={discordKey} onValueChange={setDiscordKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {discordTemplates.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {discordPreview?.embeds?.[0] ? (
              <div
                className={cn(
                  "rounded-lg border-l-4 p-3 text-sm shadow-inner",
                  "border-[#5865f2] bg-[#2f3136] text-[#dcddde]",
                )}
              >
                <p className="font-semibold text-white">{discordPreview.embeds[0].title}</p>
                {discordPreview.embeds[0].description ? (
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">
                    {discordPreview.embeds[0].description}
                  </p>
                ) : null}
                {discordPreview.embeds[0].fields?.length ? (
                  <dl className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    {discordPreview.embeds[0].fields.map((f) => (
                      <div key={f.name}>
                        <dt className="text-[11px] font-semibold uppercase text-[#b9bbbe]">{f.name}</dt>
                        <dd className="text-[13px]">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {discordPreview.embeds[0].footer?.text ? (
                  <p className="mt-3 text-[11px] text-[#72767d]">{discordPreview.embeds[0].footer.text}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            <Label>Slack Block Kit preset</Label>
            <Select value={slackKey} onValueChange={setSlackKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {slackTemplates.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {slackPreview?.blocks ? (
              <div
                className={cn(
                  "space-y-2 rounded-lg border p-3 font-sans text-sm shadow-inner",
                  isSunset
                    ? "border-border bg-[#1a1d21] ring-1 ring-primary/15"
                    : "border-gray-200 bg-white",
                )}
              >
                {slackPreview.text ? (
                  <p className={cn("text-[12px] italic", isSunset ? "text-[#9ea3a8]" : "text-muted-foreground")}>
                    {slackPreview.text}
                  </p>
                ) : null}
                {slackPreview.blocks.slice(0, 8).map((block, i) => (
                  <div
                    key={i}
                    className={cn(
                      "rounded-md p-2 text-[13px]",
                      isSunset ? "bg-[#2c2d30] text-[#e8e8e8]" : "bg-[#f8f8f8] text-gray-900",
                    )}
                  >
                    {block.type === "header" && block.text?.text ? (
                      <p className={cn("font-bold", isSunset && "text-[#f8f8f2]")}>{block.text.text}</p>
                    ) : null}
                    {block.type === "section" && block.text?.text ? (
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{block.text.text}</p>
                    ) : null}
                    {block.type === "section" && !block.text?.text && block.fields?.length ? (
                      <dl className="space-y-1">
                        {block.fields.map((f, j) => (
                          <div key={j}>
                            <dt
                              className={cn(
                                "text-[11px] font-semibold",
                                isSunset ? "text-[#bd93f9]" : "text-gray-600",
                              )}
                            >
                              {f.text}
                            </dt>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {block.type !== "header" && block.type !== "section" ? (
                      <span className={cn("text-[11px]", isSunset ? "text-[#6272a4]" : "text-muted-foreground")}>
                        {block.type}
                      </span>
                    ) : null}
                  </div>
                ))}
                <p className={cn("text-[11px]", isSunset ? "text-[#6272a4]" : "text-muted-foreground")}>
                  Showing the first blocks; live sends include the full kit.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className={isSunset ? "sunset-panel border-border bg-card/85 shadow-md" : "border-gray-200 shadow-md"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-purple-600"} />
            Capability matrix
          </CardTitle>
          <CardDescription>How features map to plans; identical framing as subscription tooling.</CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureAvailability showComingSoon={false} showPromoBanner={false} />
        </CardContent>
      </Card>

      <Card className={isSunset ? "sunset-panel border-border bg-card/85 shadow-inner" : "border-blue-100 bg-blue-50/40 shadow-inner"}>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Send className={isSunset ? "mt-0.5 h-5 w-5 shrink-0 text-primary" : "mt-0.5 h-5 w-5 shrink-0 text-blue-600"} />
            <div>
              <p className={isSunset ? "font-medium text-foreground" : "font-medium text-gray-900"}>Help centre</p>
              <p className="text-sm text-muted-foreground">
                Signed-in users get the floating help entry; same destination as here.
              </p>
            </div>
          </div>
          <Button variant="outline" className={isSunset ? "shrink-0 border-primary/35 text-primary hover:bg-primary/10" : "shrink-0 border-blue-200 bg-white"} asChild>
            <Link href="/help">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Open help
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
