export type MemorialCategory = {
  id: string
  name: string
  color: string
}

export const MEMORIAL_DEMO_CATEGORIES: MemorialCategory[] = [
  { id: "cat-family", name: "Immediate family", color: "#6272a4" },
  { id: "cat-extended", name: "Extended family & friends", color: "#bd93f9" },
  { id: "cat-community", name: "Community / workplace", color: "#8be9fd" },
  { id: "cat-service", name: "Service providers", color: "#94a3b8" },
]

export type MemorialDemoContact = {
  id: string
  name: string
  email: string
  categoryIds: string[]
}

export const MEMORIAL_DEMO_CONTACTS: MemorialDemoContact[] = [
  { id: "1", name: "James Aldridge", email: "james@example.com", categoryIds: ["cat-family"] },
  { id: "2", name: "Mei Lin", email: "mei@example.com", categoryIds: ["cat-extended", "cat-community"] },
  { id: "3", name: "Sarah Okonkwo", email: "sarah@example.com", categoryIds: ["cat-extended"] },
  { id: "4", name: "St. Andrew's offices", email: "office@standrews.example", categoryIds: ["cat-service"] },
  { id: "5", name: "David Patel", email: "david@example.com", categoryIds: ["cat-community"] },
  { id: "6", name: "Rachel Weiss", email: "rachel@example.com", categoryIds: ["cat-family", "cat-extended"] },
]

export function countMemorialDemoRecipients(categoryId: string) {
  if (categoryId === "all") return MEMORIAL_DEMO_CONTACTS.length
  return MEMORIAL_DEMO_CONTACTS.filter((c) => c.categoryIds.includes(categoryId)).length
}

export function memorialCategoryById(id: string) {
  return MEMORIAL_DEMO_CATEGORIES.find((c) => c.id === id)
}
