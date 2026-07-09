import type { SubscriptionTier } from "@/lib/subscription"

export type ChannelType = "email" | "telegram" | "discord" | "slack" | "whatsapp_utility" | "whatsapp_marketing"
export type ForecastScenario = "conservative" | "base" | "upside"
export type BulkProgramSize = "commit_s" | "commit_m" | "commit_l"

export const TARGET_GROSS_MARGIN_FLOOR = 0.55
const MARGIN_DENOMINATOR = 1 - TARGET_GROSS_MARGIN_FLOOR
export const BULK_MARGIN_FLOOR = 0.45
const BULK_MARGIN_DENOMINATOR = 1 - BULK_MARGIN_FLOOR

export const COST_INPUTS_BASE = {
  neonMonthly: 450,
  opsToolsMonthly: 120,
  twoDomainAnnual: 140,
  emailCostPerMessage: 0.012,
  twilioCostPerMessage: 0.18,
  stripeFeeRate: 0.042,
} as const

export const TOKEN_VALUE_BY_TIER: Record<Exclude<SubscriptionTier, "free">, number> = {
  basic: 0.22,
  pro: 0.18,
  enterprise: 0.14,
}

export const CHANNEL_COST_BY_TYPE: Record<ChannelType, number> = {
  email: COST_INPUTS_BASE.emailCostPerMessage,
  telegram: COST_INPUTS_BASE.emailCostPerMessage,
  discord: COST_INPUTS_BASE.emailCostPerMessage,
  slack: COST_INPUTS_BASE.emailCostPerMessage,
  whatsapp_utility: COST_INPUTS_BASE.twilioCostPerMessage,
  whatsapp_marketing: COST_INPUTS_BASE.twilioCostPerMessage,
}

export const CHANNEL_BURN_BY_TYPE: Record<ChannelType, number> = {
  email: 1,
  telegram: 1,
  discord: 1,
  slack: 1,
  whatsapp_utility: 2,
  whatsapp_marketing: 3,
}

export const BULK_COMMIT_PROGRAMS: Record<
  BulkProgramSize,
  { label: string; monthlyCommitTokens: number; monthlyCommitPrice: number; includedSupport: string }
> = {
  commit_s: {
    label: "Bulk Commit S",
    monthlyCommitTokens: 2000,
    monthlyCommitPrice: 360,
    includedSupport: "Email support",
  },
  commit_m: {
    label: "Bulk Commit M",
    monthlyCommitTokens: 10000,
    monthlyCommitPrice: 1600,
    includedSupport: "Priority support",
  },
  commit_l: {
    label: "Bulk Commit L",
    monthlyCommitTokens: 50000,
    monthlyCommitPrice: 7000,
    includedSupport: "Dedicated account support",
  },
}

export const BULK_OVERAGE_BANDS = [
  { id: "band_1", maxAdditionalTokens: 5000, ratePerToken: 0.17 },
  { id: "band_2", maxAdditionalTokens: 20000, ratePerToken: 0.15 },
  { id: "band_3", maxAdditionalTokens: Number.POSITIVE_INFINITY, ratePerToken: 0.13 },
] as const

type ScenarioInput = {
  startingPayingSubscribers: number
  monthlyGrowthRate: number
  blendedGrossArpu: number
  variableCostRate: number
}

const FORECAST_INPUTS: Record<ForecastScenario, ScenarioInput> = {
  conservative: {
    startingPayingSubscribers: 45,
    monthlyGrowthRate: 0.04,
    blendedGrossArpu: 33.5,
    variableCostRate: 0.36,
  },
  base: {
    startingPayingSubscribers: 60,
    monthlyGrowthRate: 0.07,
    blendedGrossArpu: 37.9,
    variableCostRate: 0.28,
  },
  upside: {
    startingPayingSubscribers: 80,
    monthlyGrowthRate: 0.1,
    blendedGrossArpu: 43.5,
    variableCostRate: 0.22,
  },
}

export function estimateRequiredRevenuePerMessage(providerCost: number): number {
  return providerCost / MARGIN_DENOMINATOR
}

export function estimateBulkRequiredRevenuePerMessage(providerCost: number): number {
  return providerCost / BULK_MARGIN_DENOMINATOR
}

export function getChannelTokenBurn(channel: ChannelType, tier: Exclude<SubscriptionTier, "free">): number {
  const tokenValue = TOKEN_VALUE_BY_TIER[tier]
  const requiredRevenue = estimateRequiredRevenuePerMessage(CHANNEL_COST_BY_TYPE[channel])
  return Math.max(CHANNEL_BURN_BY_TYPE[channel], Math.ceil(requiredRevenue / tokenValue))
}

export function validateBulkRateAgainstFloor(ratePerToken: number, channel: ChannelType): boolean {
  const burn = CHANNEL_BURN_BY_TYPE[channel]
  const effectiveRevenuePerMessage = ratePerToken * burn
  return effectiveRevenuePerMessage >= estimateBulkRequiredRevenuePerMessage(CHANNEL_COST_BY_TYPE[channel])
}

export function calculateBulkOverageCost(additionalTokens: number): number {
  let remaining = additionalTokens
  let cost = 0
  for (const band of BULK_OVERAGE_BANDS) {
    if (remaining <= 0) break
    const tokensInBand = Math.min(remaining, band.maxAdditionalTokens)
    cost += tokensInBand * band.ratePerToken
    remaining -= tokensInBand
  }
  return cost
}

export function calculateBulkProgramEstimate(
  program: BulkProgramSize,
  tokenDemand: number,
  channelMix: { emailShare: number; whatsappShare: number },
) {
  const commit = BULK_COMMIT_PROGRAMS[program]
  const additionalTokens = Math.max(0, tokenDemand - commit.monthlyCommitTokens)
  const overageCost = calculateBulkOverageCost(additionalTokens)
  const totalCost = commit.monthlyCommitPrice + overageCost

  const emailRatio = Math.max(0, Math.min(1, channelMix.emailShare))
  const whatsappRatio = Math.max(0, Math.min(1, channelMix.whatsappShare))
  const normalizedTotal = emailRatio + whatsappRatio || 1
  const normalizedEmail = emailRatio / normalizedTotal
  const normalizedWhatsapp = whatsappRatio / normalizedTotal

  const effectiveRate = tokenDemand > 0 ? totalCost / tokenDemand : 0
  const emailFloorPass = validateBulkRateAgainstFloor(effectiveRate, "email")
  const whatsappUtilityFloorPass = validateBulkRateAgainstFloor(effectiveRate, "whatsapp_utility")
  const blendedFloorPass =
    normalizedEmail * Number(emailFloorPass) + normalizedWhatsapp * Number(whatsappUtilityFloorPass) >= 0.5

  return {
    commit,
    tokenDemand,
    additionalTokens,
    overageCost,
    totalCost,
    effectiveRate,
    floorValidation: {
      emailFloorPass,
      whatsappUtilityFloorPass,
      blendedFloorPass,
    },
  }
}

export function estimateMonthlyMessageSpend(messages: number, channelMix: { emailShare: number; whatsappShare: number }): {
  sunriseEstimate: number
  competitorEstimate: number
  cheaperPercent: number
} {
  const safeEmailShare = Math.min(Math.max(channelMix.emailShare, 0), 1)
  const safeWhatsappShare = Math.min(Math.max(channelMix.whatsappShare, 0), 1)
  const normalizedTotal = safeEmailShare + safeWhatsappShare || 1
  const emailRatio = safeEmailShare / normalizedTotal
  const whatsappRatio = safeWhatsappShare / normalizedTotal

  // Pro-tier token economics used for homepage estimator baseline.
  const emailPrice = getChannelTokenBurn("email", "pro") * TOKEN_VALUE_BY_TIER.pro
  const whatsappPrice = getChannelTokenBurn("whatsapp_utility", "pro") * TOKEN_VALUE_BY_TIER.pro
  const sunriseUnitPrice = emailPrice * emailRatio + whatsappPrice * whatsappRatio

  const competitorEmailUnit = 0.24
  const competitorWhatsappUnit = 0.62
  const competitorUnitPrice = competitorEmailUnit * emailRatio + competitorWhatsappUnit * whatsappRatio

  const sunriseEstimate = messages * sunriseUnitPrice
  const competitorEstimate = messages * competitorUnitPrice
  const cheaperPercent =
    competitorEstimate > 0 ? Math.max(0, Math.round(((competitorEstimate - sunriseEstimate) / competitorEstimate) * 100)) : 0

  return { sunriseEstimate, competitorEstimate, cheaperPercent }
}

export function buildTwelveMonthForecast(scenario: ForecastScenario) {
  const input = FORECAST_INPUTS[scenario]
  const domainMonthly = COST_INPUTS_BASE.twoDomainAnnual / 12
  const fixedMonthly = COST_INPUTS_BASE.neonMonthly + COST_INPUTS_BASE.opsToolsMonthly + domainMonthly

  let subscribers = input.startingPayingSubscribers
  const months = Array.from({ length: 12 }, (_, i) => {
    if (i > 0) subscribers = subscribers * (1 + input.monthlyGrowthRate)
    const payingSubscribers = Math.round(subscribers)
    const grossRevenue = payingSubscribers * input.blendedGrossArpu
    const stripeCost = grossRevenue * COST_INPUTS_BASE.stripeFeeRate
    const netRevenue = grossRevenue - stripeCost
    const variableCost = grossRevenue * input.variableCostRate
    const totalCost = fixedMonthly + variableCost + stripeCost
    const contribution = grossRevenue - totalCost

    return {
      month: i + 1,
      payingSubscribers,
      grossRevenue,
      stripeCost,
      netRevenue,
      variableCost,
      fixedCost: fixedMonthly,
      totalCost,
      contribution,
    }
  })

  const totals = months.reduce(
    (acc, month) => {
      acc.grossRevenue += month.grossRevenue
      acc.stripeCost += month.stripeCost
      acc.netRevenue += month.netRevenue
      acc.variableCost += month.variableCost
      acc.fixedCost += month.fixedCost
      acc.totalCost += month.totalCost
      acc.contribution += month.contribution
      return acc
    },
    { grossRevenue: 0, stripeCost: 0, netRevenue: 0, variableCost: 0, fixedCost: 0, totalCost: 0, contribution: 0 },
  )

  const contributionMargin = totals.netRevenue > 0 ? totals.contribution / totals.netRevenue : 0
  return { scenario, months, totals, contributionMargin }
}
