"use client"

import { useMemo, useState } from "react"
import { Users } from "lucide-react"
import { cn } from "@repo/ui"
import {
  MEMORIAL_DEMO_CATEGORIES,
  MEMORIAL_DEMO_CONTACTS,
  memorialCategoryById,
} from "../lib/memorial-demo-data"

type Props = {
  className?: string
  compact?: boolean
}

export function MemorialContactBoardDemo({ className, compact }: Props) {
  const [filter, setFilter] = useState<string>("all")

  const visible = useMemo(() => {
    if (filter === "all") return MEMORIAL_DEMO_CONTACTS
    return MEMORIAL_DEMO_CONTACTS.filter((c) => c.categoryIds.includes(filter))
  }, [filter])

  return (
    <div className={cn("rounded-3xl border border-border bg-card/90 p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Audience lists, gently organised</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Separate immediate family, wider circles, and logistics contacts so each message reaches the right people with an
            appropriate tone.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            Showing <strong className="text-foreground">{visible.length}</strong> of {MEMORIAL_DEMO_CONTACTS.length}
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
              ? "scale-[1.02] border-primary bg-primary/15 font-medium text-primary shadow-sm"
              : "border-border bg-muted/40 text-muted-foreground hover:scale-[1.01] hover:border-primary/40",
          )}
        >
          All contacts
        </button>
        {MEMORIAL_DEMO_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out",
              filter === cat.id
                ? "scale-[1.02] font-medium text-foreground shadow-sm"
                : "border-border bg-muted/30 text-muted-foreground hover:scale-[1.01] hover:border-border",
            )}
            style={
              filter === cat.id && cat.color
                ? { borderColor: cat.color, backgroundColor: `${cat.color}22` }
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
            className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-both sm:flex-row sm:items-center sm:justify-between"
            style={{ animationDelay: `${Math.min(idx, 10) * 45}ms` }}
          >
            <div>
              <p className="font-medium text-foreground">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.email}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contact.categoryIds.map((cid) => {
                const cat = memorialCategoryById(cid)
                if (!cat) return null
                return (
                  <span
                    key={cid}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-foreground",
                      !cat.color && "bg-muted",
                    )}
                    style={{
                      borderColor: cat.color || "#e5e7eb",
                      ...(cat.color ? { backgroundColor: `${cat.color}18` } : {}),
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
