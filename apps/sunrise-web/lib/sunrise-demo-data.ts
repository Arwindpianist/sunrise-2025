import type { ContactCategory } from "@/components/events/create/types"

export const DEMO_CATEGORIES: ContactCategory[] = [
  { id: "cat-family", name: "Family", color: "#f97316" },
  { id: "cat-friends", name: "Friends", color: "#e11d48" },
  { id: "cat-work", name: "Work", color: "#6366f1" },
  { id: "cat-vendors", name: "Vendors", color: "#0d9488" },
]

export type DemoContact = {
  id: string
  name: string
  email: string
  categoryIds: string[]
}

export const DEMO_CONTACTS: DemoContact[] = [
  { id: "1", name: "Aisha Rahman", email: "aisha@example.com", categoryIds: ["cat-family"] },
  { id: "2", name: "Marcus Lee", email: "marcus@example.com", categoryIds: ["cat-friends", "cat-work"] },
  { id: "3", name: "Priya Nair", email: "priya@example.com", categoryIds: ["cat-friends"] },
  { id: "4", name: "James Wong", email: "james@example.com", categoryIds: ["cat-work"] },
  { id: "5", name: "Bloom Florist", email: "hello@bloom.example", categoryIds: ["cat-vendors"] },
  { id: "6", name: "Nadia Ibrahim", email: "nadia@example.com", categoryIds: ["cat-family", "cat-friends"] },
]

export function countDemoRecipients(categoryId: string) {
  if (categoryId === "all") return DEMO_CONTACTS.length
  return DEMO_CONTACTS.filter((c) => c.categoryIds.includes(categoryId)).length
}

export function categoryById(id: string) {
  return DEMO_CATEGORIES.find((c) => c.id === id)
}
