// Token pricing based on user subscription tier
export function getTokenPrice(userTier: string): number {
  switch (userTier) {
    case "enterprise": return 0.35;
    case "pro": return 0.40;
    case "basic": return 0.45;
    default: return 0.50; // No subscription
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
    name: "Mini Pack",
    tokens: 20,
    description: "For light occasional use",
    popular: false,
  },
  {
    name: "Plus Pack",
    tokens: 60,
    description: "Great for moderate users",
    popular: true,
  },
  {
    name: "Pro Pack",
    tokens: 100,
    description: "Best for planners and businesses",
    popular: false,
  },
  {
    name: "Business Pack",
    tokens: 250,
    description: "Ideal for agencies or bulk outreach",
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
      "Discounted token prices (RM0.45/token)",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
      "Basic email templates",
      "Mobile-friendly interface",
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
      "Discounted token prices (RM0.40/token)",
      "Advanced email templates",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
      "Bulk contact import",
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
      "Discounted token prices (RM0.35/token)",
      "Premium email templates",
      "Smart contact management",
      "Event scheduling",
      "Email tracking",
      "Priority support",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "White-label options",
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