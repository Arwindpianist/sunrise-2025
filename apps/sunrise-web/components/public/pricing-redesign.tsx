"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Coins, Info, Sunrise, ShieldCheck, Sparkles } from "lucide-react"
import { BULK_PROGRAMS, BULK_OVERAGE_TIERS, estimateBulkMonthlySpend } from "@/lib/pricing"
import { useBrand } from "@repo/ui/brand-provider"

type Plan = {
  name: string
  description: string
  price: number
  tokenPrice: number
  features: string[]
  popular?: boolean
  discount: string
  icon: any
}

type Pack = {
  name: string
  tokens: number
  description: string
  popular?: boolean
}

type Props = {
  plans: Plan[]
  packs: Pack[]
  userTier: string
  loading: boolean
  getButtonText: (planName: string) => string
  getTokenPriceDisplay: (tier: string) => string
  getProrationInfo: (planTier: string) => any
  onSelectPlan: (planName: string) => void
  onBuyTokens: () => void
  channelBurns: Record<string, number>
}

export default function PricingRedesign({
  plans,
  packs,
  userTier,
  loading,
  getButtonText,
  getTokenPriceDisplay,
  getProrationInfo,
  onSelectPlan,
  onBuyTokens,
  channelBurns,
}: Props) {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [calculatorTier, setCalculatorTier] = useState("pro")
  const [emailVolume, setEmailVolume] = useState(500)
  const [whatsappUtilityVolume, setWhatsappUtilityVolume] = useState(100)
  const [whatsappMarketingVolume, setWhatsappMarketingVolume] = useState(50)
  const [bulkProgram, setBulkProgram] = useState<"commit_s" | "commit_m" | "commit_l">("commit_m")
  const [bulkTokenDemand, setBulkTokenDemand] = useState(12000)

  const calculator = useMemo(() => {
    const selectedPlan =
      plans.find((plan) => plan.name.toLowerCase() === calculatorTier) || plans.find((plan) => plan.name.toLowerCase() === "pro")

    const includedMatch = selectedPlan?.features.find((item) => /tokens included monthly/i.test(item))?.match(/(\d+)/)
    const includedTokens = includedMatch ? Number(includedMatch[1]) : 0
    const tokenRate = selectedPlan?.tokenPrice ?? 0

    const totalTokens =
      emailVolume * (channelBurns.email ?? 1) +
      whatsappUtilityVolume * (channelBurns.whatsapp_utility ?? 2) +
      whatsappMarketingVolume * (channelBurns.whatsapp_marketing ?? 3)

    const additionalTokens = Math.max(0, totalTokens - includedTokens)
    const estimatedTopUp = additionalTokens * tokenRate

    return {
      includedTokens,
      totalTokens,
      additionalTokens,
      estimatedTopUp,
    }
  }, [plans, calculatorTier, emailVolume, whatsappUtilityVolume, whatsappMarketingVolume, channelBurns])

  const includedUsagePercent = calculator.totalTokens
    ? Math.min(100, (calculator.includedTokens / calculator.totalTokens) * 100)
    : 100
  const bulkEstimate = estimateBulkMonthlySpend(bulkProgram, bulkTokenDemand)

  return (
    <div className={isSunset ? "sunset-marketing relative min-h-screen overflow-hidden bg-background" : "relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-rose-50/50"}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={isSunset ? "sunset-hero-glow-a absolute -left-24 top-20 h-72 w-72 rounded-full blur-3xl" : "absolute -left-24 top-20 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"} />
        <div className={isSunset ? "sunset-hero-glow-b absolute right-0 top-1/3 h-64 w-64 rounded-full blur-3xl" : "absolute right-0 top-1/3 h-64 w-64 rounded-full bg-rose-200/25 blur-3xl"} />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sunrise className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} />
            <p className={isSunset ? "sunset-wordmark bg-clip-text text-sm font-semibold tracking-wide text-transparent" : "text-sm font-semibold tracking-wide text-orange-700"}>
              {isSunset ? "Sunset-2025" : "Sunrise-2025"}
            </p>
          </div>
          <Badge variant="outline" className={isSunset ? "border-primary/35 bg-primary/10 text-primary" : "border-orange-200 bg-orange-50 text-orange-700"}>
            {isSunset ? "Memorial messaging pricing" : "Upgrade-safe pricing experience"}
          </Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            {isSunset ? "Flexible pricing for thoughtful memorial communication" : "Flexible pricing for modern event teams"}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            {isSunset
              ? "Keep one shared wallet with Sunrise while using Sunset-specific memorial templates, flows, and channel economics."
              : "Subscribe for better token value and unlock richer messaging tools as new channels return after upgrade."}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { icon: ShieldCheck, text: "Transparent token value by plan", color: "text-green-600" },
            { icon: Sparkles, text: "Built for celebrations and campaigns", color: "text-orange-500" },
            { icon: Coins, text: "Scale usage without surprise billing", color: "text-orange-600" },
          ].map((item) => (
            <div
              key={item.text}
              className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 p-3 text-sm text-muted-foreground shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md" : "rounded-2xl border border-border bg-card/80 p-3 text-sm text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md"}
            >
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${isSunset ? "text-primary" : item.color}`} />
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className={isSunset ? "sunset-success-panel rounded-2xl p-4 text-sm" : "rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900"}>
            <p className="font-semibold">Weighted token burn model</p>
            <p className="mt-2">Email/Telegram/Slack/Discord: {channelBurns.email} token per message</p>
            <p>WhatsApp utility: {channelBurns.whatsapp_utility} tokens per message</p>
            <p>WhatsApp marketing: {channelBurns.whatsapp_marketing} tokens per message</p>
          </div>
          <div className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 p-4 text-sm text-muted-foreground" : "rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900"}>
            <p className="font-semibold">How this helps your workflow</p>
            <p className="mt-2">One subscription gives you included monthly tokens.</p>
            <p>Every channel uses the same wallet with clear per-channel multipliers.</p>
            <p>You scale instantly by topping up tokens only when needed.</p>
          </div>
        </div>

        <section className={isSunset ? "sunset-panel mt-8 rounded-2xl border border-border bg-card/85 p-5 shadow-sm" : "mt-8 rounded-2xl border border-orange-200 bg-white/90 p-5 shadow-sm"}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className={isSunset ? "text-lg font-semibold text-foreground" : "text-lg font-semibold text-foreground"}>Multi-channel token calculator</h3>
            <p className={isSunset ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground"}>Estimate usage by channel and see required tokens instantly.</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card className={isSunset ? "border-border bg-card/80" : "border-orange-100"}>
              <CardContent className="space-y-4 p-4">
              <div>
                <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>Plan tier</Label>
                <Select
                  value={calculatorTier}
                  onValueChange={(value) => setCalculatorTier(value)}
                >
                  <SelectTrigger className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.name} value={plan.name.toLowerCase()}>
                      {plan.name}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>Email messages</Label>
                <Input
                  type="number"
                  min={0}
                  value={emailVolume}
                  onChange={(e) => setEmailVolume(Number(e.target.value) || 0)}
                  className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}
                />
              </div>

              <div>
                <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>WhatsApp utility messages</Label>
                <Input
                  type="number"
                  min={0}
                  value={whatsappUtilityVolume}
                  onChange={(e) => setWhatsappUtilityVolume(Number(e.target.value) || 0)}
                  className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}
                />
              </div>

              <div>
                <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>WhatsApp marketing messages</Label>
                <Input
                  type="number"
                  min={0}
                  value={whatsappMarketingVolume}
                  onChange={(e) => setWhatsappMarketingVolume(Number(e.target.value) || 0)}
                  className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}
                />
              </div>
              </CardContent>
            </Card>

            <Card className={isSunset ? "sunset-panel border-border bg-card/80" : "border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50"}>
              <CardContent className="p-4">
              <p className={isSunset ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-foreground"}>Token summary</p>
              <div className={isSunset ? "mt-3 space-y-2 text-sm text-muted-foreground" : "mt-3 space-y-2 text-sm text-foreground"}>
                <p>Total required tokens: <span className={isSunset ? "font-semibold text-primary" : "font-semibold text-orange-700"}>{calculator.totalTokens}</span></p>
                <p>Included monthly tokens: <span className="font-semibold">{calculator.includedTokens}</span></p>
                <p>Additional tokens needed: <span className="font-semibold">{calculator.additionalTokens}</span></p>
                <p>Estimated top-up budget: <span className={isSunset ? "font-semibold text-primary" : "font-semibold text-orange-700"}>RM{calculator.estimatedTopUp.toFixed(2)}</span></p>
              </div>
              <div className="mt-4">
                <div className={isSunset ? "mb-2 flex items-center justify-between text-xs text-muted-foreground" : "mb-2 flex items-center justify-between text-xs text-muted-foreground"}>
                  <span>Included coverage</span>
                  <span>{includedUsagePercent.toFixed(0)}%</span>
                </div>
                <Progress value={includedUsagePercent} className="h-2" />
              </div>
              <p className={isSunset ? "mt-3 text-xs text-muted-foreground" : "mt-3 text-xs text-muted-foreground"}>
                Uses current multipliers: email x{channelBurns.email}, WhatsApp utility x{channelBurns.whatsapp_utility},
                WhatsApp marketing x{channelBurns.whatsapp_marketing}.
              </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Tabs defaultValue="plans" className="mt-10">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="packs">Token Packs</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Messaging</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-5">
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon || Coins
                const tier = plan.name.toLowerCase()
                const current = userTier === tier
                const proration = getProrationInfo(tier)
                return (
                  <div
                    key={plan.name}
                    className={`${isSunset ? "sunset-panel bg-card/85" : "bg-white/85"} rounded-2xl border p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                      plan.popular ? (isSunset ? "border-2 border-primary shadow-lg" : "border-2 border-orange-400 shadow-lg") : (isSunset ? "border-border" : "border-orange-100")
                    }`}
                  >
                    <div>
                      <h3 className={isSunset ? "flex items-center gap-2 text-xl font-semibold text-foreground" : "flex items-center gap-2 text-xl font-semibold text-foreground"}>
                        <Icon className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} />
                        {plan.name}
                      </h3>
                      <p className={isSunset ? "mt-1 text-sm text-muted-foreground" : "mt-1 text-sm text-muted-foreground"}>{plan.description}</p>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className={isSunset ? "text-3xl font-bold text-foreground" : "text-3xl font-bold text-foreground"}>RM{plan.price}</p>
                        <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>/ month</p>
                      </div>
                      <div className={isSunset ? "rounded-md border border-primary/35 bg-primary/10 p-3 text-sm text-primary" : "rounded-md bg-orange-50 p-3 text-sm text-orange-800"}>
                        Token rate: {getTokenPriceDisplay(tier)} ({plan.discount})
                      </div>
                      {proration ? (
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          <div className="mb-1 flex items-center gap-1 font-semibold">
                            <Info className="h-4 w-4" />
                            Prorated upgrade
                          </div>
                          {proration.prorationInfo?.description || "Proration will be applied automatically."}
                        </div>
                      ) : null}
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className={isSunset ? "flex items-start gap-2 text-sm text-muted-foreground" : "flex items-start gap-2 text-sm text-foreground"}>
                            <Check className={isSunset ? "mt-0.5 h-4 w-4 text-primary" : "mt-0.5 h-4 w-4 text-green-500"} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        disabled={loading || current}
                        onClick={() => onSelectPlan(plan.name)}
                      >
                        {loading ? "Processing..." : getButtonText(plan.name)}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="packs" className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packs.map((pack) => (
                <div
                  key={pack.name}
                  className={`${isSunset ? "sunset-panel bg-card/85" : "bg-white/85"} rounded-2xl border p-5 text-center shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                    pack.popular ? (isSunset ? "border-2 border-primary shadow-md" : "border-2 border-orange-400 shadow-md") : (isSunset ? "border-border" : "border-orange-100")
                  }`}
                >
                  <div className="space-y-3">
                    <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>{pack.name}</p>
                    <p className={isSunset ? "text-3xl font-bold text-primary" : "text-3xl font-bold text-orange-600"}>{pack.tokens}</p>
                    <p className={isSunset ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground"}>{pack.description}</p>
                    <Button className="w-full" onClick={onBuyTokens}>
                      Buy Tokens
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className={isSunset ? "border-border bg-card/80" : "border-orange-100"}>
                <CardContent className="space-y-4 p-5">
                  <div>
                    <p className={isSunset ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-foreground"}>How bulk pricing works</p>
                    <p className={isSunset ? "mt-2 text-sm text-muted-foreground" : "mt-2 text-sm text-muted-foreground"}>
                      Choose a monthly commit bundle, then scale above commit volume with overage tiers. This keeps pricing
                      predictable for high-volume teams while preserving the same channel multipliers.
                    </p>
                  </div>
                  <div>
                    <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>Bulk commit program</Label>
                    <Select value={bulkProgram} onValueChange={(value) => setBulkProgram(value as "commit_s" | "commit_m" | "commit_l")}>
                      <SelectTrigger className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}>
                        <SelectValue placeholder="Select bulk program" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BULK_PROGRAMS).map(([id, program]) => (
                          <SelectItem key={id} value={id}>
                            {program.label} ({program.monthlyCommitTokens.toLocaleString()} tokens)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={isSunset ? "text-sm font-medium text-foreground" : "text-sm font-medium text-foreground"}>Expected monthly token demand</Label>
                    <Input
                      type="number"
                      min={0}
                      value={bulkTokenDemand}
                      onChange={(e) => setBulkTokenDemand(Number(e.target.value) || 0)}
                      className={isSunset ? "mt-1 border-border" : "mt-1 border-orange-200"}
                    />
                  </div>
                  <div className={isSunset ? "rounded-md border border-primary/35 bg-primary/10 p-3 text-xs text-primary" : "rounded-md bg-orange-50 p-3 text-xs text-orange-900"}>
                    Overage tiers:
                    {BULK_OVERAGE_TIERS.map((tier) => (
                      <div key={tier.id}>
                        - {tier.maxAdditionalTokens === Number.POSITIVE_INFINITY ? "20k+" : `up to ${tier.maxAdditionalTokens}`} at
                        {" "}RM{tier.ratePerToken.toFixed(2)}/token
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={isSunset ? "sunset-panel border-border bg-card/80" : "border-orange-100 bg-gradient-to-br from-orange-50 to-rose-50"}>
                <CardContent className="space-y-3 p-5">
                  <p className={isSunset ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-foreground"}>Bulk estimate summary</p>
                  <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>
                    Commit cost: <span className="font-semibold">RM{bulkEstimate.commitCost.toFixed(2)}</span>
                  </p>
                  <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>
                    Additional tokens: <span className="font-semibold">{bulkEstimate.additionalTokens.toLocaleString()}</span>
                  </p>
                  <p className={isSunset ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>
                    Overage cost: <span className="font-semibold">RM{bulkEstimate.overageCost.toFixed(2)}</span>
                  </p>
                  <p className={isSunset ? "text-base text-foreground" : "text-base text-foreground"}>
                    Estimated monthly total: <span className={isSunset ? "font-bold text-primary" : "font-bold text-orange-700"}>RM{bulkEstimate.totalCost.toFixed(2)}</span>
                  </p>
                  <p className={isSunset ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground"}>
                    Bulk plans use the same channel multipliers and are best for teams with predictable high-volume traffic.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

