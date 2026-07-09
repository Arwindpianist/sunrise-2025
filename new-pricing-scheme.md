Perfect — this is a smart hybrid model. By **lowering token prices for subscribers**, you're encouraging users to:

* **Subscribe** to unlock cheaper bulk messaging
* **Remain subscribed** to maintain low usage costs
* **Use the platform more**, since they’re “already invested”

Let’s finalize this with:

---

## ✅ Updated Token Pricing Logic (Subscription-Based Discount)

| Plan Tier      | Token Price | Discount % | Notes                             |
| -------------- | ----------- | ---------- | --------------------------------- |
| **No Plan**    | RM0.50      | 0%         | Full price for unsubscribed users |
| **Basic**      | RM0.45      | 10%        | Light discount                    |
| **Pro**        | RM0.40      | 20%        | Substantial savings               |
| **Enterprise** | RM0.35      | 30%        | Best deal per token               |

### 🎁 Trial Tokens

* New users get **10–15 free tokens** on registration
* Can be used for **email, WhatsApp, Telegram**, etc.
* After they run out → must **subscribe or buy tokens at RM0.50**

---

## 🛍️ Updated Token Top-Up Store

```ts
const TOKEN_TOPUPS = [
  {
    name: "Mini Pack",
    basePrice: 9.90,
    tokens: 20,
    description: "For light occasional use",
  },
  {
    name: "Plus Pack",
    basePrice: 24.90,
    tokens: 60,
    description: "Great for moderate users",
    popular: true,
  },
  {
    name: "Pro Pack",
    basePrice: 39.90,
    tokens: 100,
    description: "Best for planners and businesses",
  },
  {
    name: "Business Pack",
    basePrice: 89.90,
    tokens: 250,
    description: "Ideal for agencies or bulk outreach",
  }
]
```

---

### 🧠 Pricing Calculation (Dynamic Based on Tier)

```ts
function getTokenPrice(userTier) {
  switch (userTier) {
    case "Enterprise": return 0.35;
    case "Pro": return 0.40;
    case "Basic": return 0.45;
    default: return 0.50; // No subscription
  }
}

function calculateTokenPackPrice(pack, userTier) {
  const pricePerToken = getTokenPrice(userTier);
  return (pricePerToken * pack.tokens).toFixed(2);
}
```

#### 👇 Example Output (For UI):

| Pack Name     | Tokens | Price (Free User) | Price (Pro User) |
| ------------- | ------ | ----------------- | ---------------- |
| Mini Pack     | 20     | RM10.00           | RM8.00           |
| Plus Pack     | 60     | RM30.00           | RM24.00          |
| Pro Pack      | 100    | RM50.00           | RM40.00          |
| Business Pack | 250    | RM125.00          | RM87.50          |

---

## 🔒 Access Rules

| Status               | Can Send? | Token Price    | Can Use Advanced Features? |
| -------------------- | --------- | -------------- | -------------------------- |
| New w/ free tokens   | ✅         | Free           | ❌                          |
| No plan (after free) | ❌         | Must subscribe | ❌                          |
| Subscribed user      | ✅         | Discounted     | ✅                          |

---

## 🧭 Why This Works

| Principle              | Impact                                   |
| ---------------------- | ---------------------------------------- |
| **Lock-in effect**     | People stay subscribed to save on tokens |
| **Paywalling**         | Free users are nudged to subscribe       |
| **Incentive stacking** | Subscription + token discounts           |
| **Flexible billing**   | Token usage controls cost predictably    |

---