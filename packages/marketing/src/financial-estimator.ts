/** Mirrors Sunrise homepage estimator math without coupling to the full billing module. */
const TARGET_GROSS_MARGIN_FLOOR = 0.55
const MARGIN_DENOMINATOR = 1 - TARGET_GROSS_MARGIN_FLOOR

const COST_INPUTS_BASE = {
  emailCostPerMessage: 0.012,
  twilioCostPerMessage: 0.18,
} as const

const TOKEN_VALUE_PRO = 0.18

type ChannelType = "email" | "whatsapp_utility"

const CHANNEL_COST_BY_TYPE: Record<ChannelType, number> = {
  email: COST_INPUTS_BASE.emailCostPerMessage,
  whatsapp_utility: COST_INPUTS_BASE.twilioCostPerMessage,
}

const CHANNEL_BURN_BY_TYPE: Record<ChannelType, number> = {
  email: 1,
  whatsapp_utility: 2,
}

function estimateRequiredRevenuePerMessage(providerCost: number): number {
  return providerCost / MARGIN_DENOMINATOR
}

function getChannelTokenBurn(channel: ChannelType): number {
  const tokenValue = TOKEN_VALUE_PRO
  const requiredRevenue = estimateRequiredRevenuePerMessage(CHANNEL_COST_BY_TYPE[channel])
  return Math.max(CHANNEL_BURN_BY_TYPE[channel], Math.ceil(requiredRevenue / tokenValue))
}

export function estimateMonthlyMessageSpend(
  messages: number,
  channelMix: { emailShare: number; whatsappShare: number },
): {
  platformEstimate: number
  competitorEstimate: number
  cheaperPercent: number
} {
  const safeEmailShare = Math.min(Math.max(channelMix.emailShare, 0), 1)
  const safeWhatsappShare = Math.min(Math.max(channelMix.whatsappShare, 0), 1)
  const normalizedTotal = safeEmailShare + safeWhatsappShare || 1
  const emailRatio = safeEmailShare / normalizedTotal
  const whatsappRatio = safeWhatsappShare / normalizedTotal

  const emailPrice = getChannelTokenBurn("email") * TOKEN_VALUE_PRO
  const whatsappPrice = getChannelTokenBurn("whatsapp_utility") * TOKEN_VALUE_PRO
  const platformUnitPrice = emailPrice * emailRatio + whatsappPrice * whatsappRatio

  const competitorEmailUnit = 0.24
  const competitorWhatsappUnit = 0.62
  const competitorUnitPrice = competitorEmailUnit * emailRatio + competitorWhatsappUnit * whatsappRatio

  const platformEstimate = messages * platformUnitPrice
  const competitorEstimate = messages * competitorUnitPrice
  const cheaperPercent =
    competitorEstimate > 0
      ? Math.max(0, Math.round(((competitorEstimate - platformEstimate) / competitorEstimate) * 100))
      : 0

  return { platformEstimate, competitorEstimate, cheaperPercent }
}
