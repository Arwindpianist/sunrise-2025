// Token pricing based on user subscription tier (hidden from users)
export function getTokenPrice(userTier: string): number {
  switch (userTier) {
    case "enterprise": return 0.35;
    case "pro": return 0.40;
    case "basic": return 0.45;
    default: return 0.50; // No subscription
  }
}

// Get token price display (for UI - doesn't show actual price)
export function getTokenPriceDisplay(userTier: string): string {
  switch (userTier) {
    case "enterprise": return "Best Value";
    case "pro": return "Great Value";
    case "basic": return "Good Value";
    default: return "Standard";
  }
}

// Calculate token pack price based on user tier
export function calculateTokenPackPrice(tokens: number, userTier: string): number {
  const pricePerToken = getTokenPrice(userTier);
  return pricePerToken * tokens;
}

// Calculate savings for a token pack
export function calculateSavings(tokens: number, userTier: string): number {
  if (userTier === "free") return 0;
  const fullPrice = tokens * 0.50;
  const discountedPrice = calculateTokenPackPrice(tokens, userTier);
  return fullPrice - discountedPrice;
}

// Get tier display information
export function getTierInfo(tier: string) {
  switch (tier) {
    case "enterprise":
      return {
        name: "Enterprise",
        discount: "30%",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      };
    case "pro":
      return {
        name: "Pro",
        discount: "20%",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    case "basic":
      return {
        name: "Basic",
        discount: "10%",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    default:
      return {
        name: "No Plan",
        discount: "0%",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      };
  }
}

// Token top-up packages
export const TOKEN_TOPUPS = [
  {
    name: "Starter Pack",
    tokens: 25,
    description: "Perfect for small events",
    popular: false,
  },
  {
    name: "Popular Pack",
    tokens: 75,
    description: "Great for regular users",
    popular: true,
  },
  {
    name: "Business Pack",
    tokens: 150,
    description: "Ideal for growing businesses",
    popular: false,
  },
  {
    name: "Enterprise Pack",
    tokens: 500,
    description: "For large-scale operations",
    popular: false,
  }
];

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    description: "Perfect for small events and personal use",
    price: 9.90,
    tokenPrice: 0.45,
    discount: "10%",
    features: [
      "Discounted token pricing",
      "Event scheduling",
      "Email tracking",
      "All email templates (birthday, wedding, etc.)",
      "Telegram messaging (generic templates)",
      "Mobile-friendly interface",
      "100 lifetime tokens included",
    ],
    popular: false,
    icon: "Coins",
  },
  {
    name: "Pro",
    description: "Best for growing businesses and event planners",
    price: 29.90,
    tokenPrice: 0.40,
    discount: "20%",
    features: [
      "Discounted token pricing",
      "Advanced email templates",
      "Telegram messaging",
      "More channels coming soon",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
      "Bulk contact import",
      "Unlimited tokens",
    ],
    popular: true,
    icon: "Zap",
  },
  {
    name: "Enterprise",
    description: "For large-scale events and agencies",
    price: 79.90,
    tokenPrice: 0.35,
    discount: "30%",
    features: [
      "Discounted token pricing",
      "Premium email templates",
      "Telegram messaging",
      "More channels coming soon",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "White-label options",
      "Unlimited everything",
    ],
    popular: false,
    icon: "Crown",
  },
];

// Trial tokens for new users
export const TRIAL_TOKENS = 15;

// Check if user has trial tokens available
export function hasTrialTokens(userBalance: number, userCreatedAt: string): boolean {
  const userCreated = new Date(userCreatedAt);
  const now = new Date();
  const daysSinceCreation = (now.getTime() - userCreated.getTime()) / (1000 * 60 * 60 * 24);
  
  // Trial tokens are available for 30 days after account creation
  return daysSinceCreation <= 30 && userBalance <= TRIAL_TOKENS;
} 