"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Link2 } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@repo/ui"
import { useToast } from "@repo/ui/use-toast"
import { MEMORIAL_DEMO_CATEGORIES } from "../lib/memorial-demo-data"

type Props = {
  className?: string
  registerHref?: string
}

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || "your-page"
}

export function MemorialContactLinkFormDemo({ className, registerHref = "/register" }: Props) {
  const { toast: showToast } = useToast()
  const [category, setCategory] = useState<string>("__none__")
  const [linkHandle, setLinkHandle] = useState("")
  const [siteBase, setSiteBase] = useState(
    () =>
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
      "https://sunset-2025.com",
  )

  useEffect(() => {
    setSiteBase(window.location.origin.replace(/\/$/, ""))
  }, [])

  const shareUrl = `${siteBase}/contact-form/${slugify(linkHandle)}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    showToast({
      title: "Demo only",
      description: "No data is saved. Create an account to collect RSVPs and updates privately.",
    })
  }

  return (
    <Card className={cn("border-border", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/15 p-2 ring-1 ring-primary/25">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Share a dignified intake link</CardTitle>
            <CardDescription className="mt-1 max-w-prose">
              Families receive one respectful page where visitors choose how they are connected to the occasion and leave
              contact details. This mirrors production behaviour with submissions disabled here.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="mem-link-handle">Page name (updates the URL)</Label>
          <Input
            id="mem-link-handle"
            value={linkHandle}
            onChange={(e) => setLinkHandle(e.target.value)}
            placeholder="e.g. hart-family-memorial"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens.</p>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 motion-safe:transition-all motion-safe:duration-300">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your link would look like</p>
          <div
            key={shareUrl}
            className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
          >
            <code className="break-all text-sm text-foreground">{shareUrl}</code>
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" disabled>
              <ExternalLink className="h-3.5 w-3.5" />
              Open (demo)
            </Button>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mem-demo-name">Full name</Label>
              <Input id="mem-demo-name" placeholder="Guest name" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mem-demo-email">Email</Label>
              <Input id="mem-demo-email" type="email" placeholder="guest@email.com" autoComplete="off" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Relationship / grouping</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="How should we file your reply?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Prefer not to say</SelectItem>
                {MEMORIAL_DEMO_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mem-demo-notes">Message for the family (optional)</Label>
            <Textarea
              id="mem-demo-notes"
              placeholder="Flowers, condolences, or logistical notes."
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Submit (demo: nothing is stored)
            </Button>
            <Link href={registerHref} className="text-sm font-semibold text-primary underline underline-offset-2">
              Create your real collection link
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
