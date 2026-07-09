import {
  BULK_COMMIT_PROGRAMS,
  BULK_OVERAGE_BANDS,
  CHANNEL_BURN_BY_TYPE,
  TOKEN_VALUE_BY_TIER,
  calculateBulkOverageCost,
  type BulkProgramSize,
  type ChannelType,
} from "@/lib/financial-model"

export function getTokenPrice(userTier: string): number {
  switch (userTier) {
    case "enterprise":
      return TOKEN_VALUE_BY_TIER.enterprise
    case "pro":
      return TOKEN_VALUE_BY_TIER.pro
    case "basic":
      return TOKEN_VALUE_BY_TIER.basic
    default:
      return 0.25
  }
}

export function getTokenPriceDisplay(userTier: string): string {
  const tokenPrice = getTokenPrice(userTier)
  return `RM${tokenPrice.toFixed(2)}/token`
}

export function calculateTokenPackPrice(tokens: number, userTier: string): number {
  return getTokenPrice(userTier) * tokens
}

export function calculateSavings(tokens: number, userTier: string): number {
  if (userTier === "free") return 0
  const freeTierPrice = 0.25
  return tokens * freeTierPrice - calculateTokenPackPrice(tokens, userTier)
}

export function getTierInfo(tier: string) {
  switch (tier) {
    case "enterprise":
      return {
        name: "Enterprise",
        discount: "44%",
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/30",
      }
    case "pro":
      return {
        name: "Pro",
        discount: "28%",
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "border-primary/30",
      }
    case "basic":
      return {
        name: "Basic",
        discount: "12%",
        color: "text-sky-600 dark:text-sky-400",
        bgColor: "bg-sky-500/10",
        borderColor: "border-sky-500/30",
      }
    default:
      return {
        name: "No Plan",
        discount: "0%",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        borderColor: "border-border",
      }
  }
}

export const CHANNEL_TOKEN_BURN = CHANNEL_BURN_BY_TYPE
export const BULK_PROGRAMS = BULK_COMMIT_PROGRAMS
export const BULK_OVERAGE_TIERS = BULK_OVERAGE_BANDS

export function getChannelBurnDisplay(channel: ChannelType): string {
  return `${CHANNEL_TOKEN_BURN[channel]} token${CHANNEL_TOKEN_BURN[channel] > 1 ? "s" : ""}`
}

export function estimateBulkMonthlySpend(program: BulkProgramSize, tokenDemand: number): {
  commitCost: number
  additionalTokens: number
  overageCost: number
  totalCost: number
} {
  const commit = BULK_PROGRAMS[program]
  const additionalTokens = Math.max(0, tokenDemand - commit.monthlyCommitTokens)
  const overageCost = calculateBulkOverageCost(additionalTokens)
  return {
    commitCost: commit.monthlyCommitPrice,
    additionalTokens,
    overageCost,
    totalCost: commit.monthlyCommitPrice + overageCost,
  }
}

export const TOKEN_TOPUPS = [
  { name: "Starter Pack", tokens: 50, description: "Great for smaller monthly campaigns", popular: false },
  { name: "Growth Pack", tokens: 150, description: "Best for steady weekly sending", popular: true },
  { name: "Scale Pack", tokens: 400, description: "For frequent event operations", popular: false },
  { name: "Agency Pack", tokens: 1200, description: "High-volume sending for teams", popular: false },
]

export const SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    description: "For individuals and smaller organizers",
    price: 12.9,
    tokenPrice: TOKEN_VALUE_BY_TIER.basic,
    discount: "Entry value",
    features: [
      "20 tokens included monthly",
      `Top-up at ${getTokenPriceDisplay("basic")}`,
      "Channel-aware token burn model",
      "Email delivery and scheduling",
      "Telegram access",
      "Up to 20 active events",
    ],
    popular: false,
    icon: "Coins",
  },
  {
    name: "Pro",
    description: "For growing teams and professional planners",
    price: 39.9,
    tokenPrice: TOKEN_VALUE_BY_TIER.pro,
    discount: "Best growth value",
    features: [
      "100 tokens included monthly",
      `Top-up at ${getTokenPriceDisplay("pro")}`,
      "Priority processing and richer templates",
      "Custom branding and bulk workflows",
      "WhatsApp utility sends at weighted burn",
      "Up to 120 active events",
    ],
    popular: true,
    icon: "Zap",
  },
  {
    name: "Enterprise",
    description: "For agencies and high-throughput communication",
    price: 129,
    tokenPrice: TOKEN_VALUE_BY_TIER.enterprise,
    discount: "Highest token efficiency",
    features: [
      "400 tokens included monthly",
      `Top-up at ${getTokenPriceDisplay("enterprise")}`,
      "API access and advanced governance",
      "Dedicated account support",
      "Sunrise and Sunset product access (same account)",
      "Unlimited events with fair-use controls",
    ],
    popular: false,
    icon: "Crown",
  },
]

export const TRIAL_TOKENS = 15

export function hasTrialTokens(userBalance: number, userCreatedAt: string): boolean {
  const userCreated = new Date(userCreatedAt)
  const daysSinceCreation = (Date.now() - userCreated.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceCreation <= 30 && userBalance <= TRIAL_TOKENS
}