"use client"

import { useMemo, useState } from "react"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_CATEGORIES, DEMO_CONTACTS, categoryById } from "@/lib/sunrise-demo-data"

type Props = {
  className?: string
  compact?: boolean
}

export default function ContactBoardDemo({ className, compact }: Props) {
  const [filter, setFilter] = useState<string>("all")

  const visible = useMemo(() => {
    if (filter === "all") return DEMO_CONTACTS
    return DEMO_CONTACTS.filter((c) => c.categoryIds.includes(filter))
  }, [filter])

  return (
    <div className={cn("rounded-3xl border border-border bg-card/90 p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Group contacts your way</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Categories carry colours in Sunrise so you can scan lists quickly, filter an audience for an event, and keep
            vendors separate from guests; try toggling a group below.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50/80 px-3 py-1.5 text-xs text-orange-800">
          <Users className="h-3.5 w-3.5" />
          <span>
            Showing <strong>{visible.length}</strong> of {DEMO_CONTACTS.length}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
            filter === "all"
              ? "scale-[1.02] border-orange-400 bg-white font-medium text-orange-800 shadow-sm"
              : "border-orange-100 bg-orange-50/50 text-orange-700 hover:border-orange-200 hover:scale-[1.01]",
          )}
        >
          All contacts
        </button>
        {DEMO_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
              filter === cat.id
                ? "scale-[1.02] font-medium text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:scale-[1.01] hover:border-border",
            )}
            style={
              filter === cat.id && cat.color
                ? { borderColor: cat.color, backgroundColor: `${cat.color}18` }
                : undefined
            }
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color || "#94a3b8" }} />
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      <ul
        key={filter}
        className={cn(
          "mt-4 grid gap-2",
          compact ? "sm:grid-cols-1" : "sm:grid-cols-2",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
        )}
      >
        {visible.map((contact, idx) => (
          <li
            key={contact.id}
            className="flex flex-col gap-2 rounded-2xl border border-orange-50 bg-gradient-to-br from-white to-orange-50/40 px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both sm:flex-row sm:items-center sm:justify-between"
            style={{ animationDelay: `${Math.min(idx, 10) * 45}ms` }}
          >
            <div>
              <p className="font-medium text-foreground">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.email}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contact.categoryIds.map((cid) => {
                const cat = categoryById(cid)
                if (!cat) return null
                return (
                  <span
                    key={cid}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{
                      borderColor: cat.color || "#e5e7eb",
                      color: "#1f2937",
                      backgroundColor: cat.color ? `${cat.color}20` : "#f9fafb",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
