"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { DEMO_CATEGORIES } from "@/lib/sunrise-demo-data"

type Props = {
  className?: string
}

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || "your-account-id"
}

export default function ContactLinkFormDemo({ className }: Props) {
  const [category, setCategory] = useState<string>("__none__")
  const [linkHandle, setLinkHandle] = useState("")
  const [siteBase, setSiteBase] = useState(
    () =>
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
      "https://sunrise-2025.com",
  )

  useEffect(() => {
    setSiteBase(window.location.origin.replace(/\/$/, ""))
  }, [])

  const shareUrl = `${siteBase}/contact-form/${slugify(linkHandle)}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Demo only",
      description: "No data is saved or sent. Sign up to collect real contacts through your personal link.",
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-orange-100 p-2">
            <Link2 className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Collect contacts with a shareable link</CardTitle>
            <CardDescription className="mt-1 max-w-prose">
              Hosts get a branded intake page; guests pick a category, leave details, and you stay organised without
              spreadsheets. This card mirrors the live form; submissions here are disabled.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="link-handle">Your page name (updates the link)</Label>
          <Input
            id="link-handle"
            value={linkHandle}
            onChange={(e) => setLinkHandle(e.target.value)}
            placeholder="e.g. jane-and-sam-wedding"
            autoComplete="off"
            className="motion-safe:transition-shadow motion-safe:duration-200"
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens. Shown in your public URL.</p>
        </div>

        <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-4 motion-safe:transition-all motion-safe:duration-300">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-800">Your link would look like</p>
          <div
            key={shareUrl}
            className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
          >
            <code className="break-all text-sm text-orange-900">{shareUrl}</code>
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" disabled>
              <ExternalLink className="h-3.5 w-3.5" />
              Open (demo)
            </Button>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="demo-name">Full name</Label>
              <Input id="demo-name" placeholder="Guest name" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="guest@email.com" autoComplete="off" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Where should we file you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No category</SelectItem>
                {DEMO_CATEGORIES.map((cat) => (
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
            <Label htmlFor="demo-notes">Notes (optional)</Label>
            <Textarea id="demo-notes" placeholder="Dietary needs, plus-one, etc." rows={3} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
              Submit (demo: nothing is stored)
            </Button>
            <Link href="/register" className="text-sm font-semibold text-orange-700 underline underline-offset-2">
              Create your real collection link
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
