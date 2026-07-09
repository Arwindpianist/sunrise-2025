import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Mail, Palette, Send, Smartphone, Sparkles, Sunrise, CheckCircle2, Users, Shield, Clock, MessageSquare } from "lucide-react"

const featurePillars = [
  {
    icon: Calendar,
    title: "Event Builder 2.0",
    desc: "A simpler step-based flow that helps teams create events faster with fewer mistakes.",
  },
  {
    icon: Mail,
    title: "Email Delivery Core",
    desc: "Unified email path with delivery status tracking and cleaner failure handling.",
  },
  {
    icon: Palette,
    title: "Template Refresh",
    desc: "Modernized template structure with reusable placeholders and better preview behavior.",
  },
]

export default function FeaturesRedesign() {
  const detailedFeatures = [
    {
      icon: Calendar,
      title: "Smart Event Creation",
      description:
        "Create events with a guided flow designed for speed and accuracy. From event details to audience selection, every step is structured to reduce mistakes and help you launch campaigns faster.",
      bullets: [
        "Step-by-step builder for event setup",
        "Built-in scheduling flow with review checkpoints",
        "Reusable event patterns for recurring campaigns",
      ],
    },
    {
      icon: Users,
      title: "Contact Management That Scales",
      description:
        "Manage growing contact lists without chaos. Sunrise supports structured categories and cleaner segmentation so your invites reach the right people every time.",
      bullets: [
        "Audience segmentation by category",
        "Cleaner recipient targeting workflows",
        "Improved compatibility with larger contact sets",
      ],
    },
    {
      icon: MessageSquare,
      title: "Email-First Delivery Pipeline",
      description:
        "We currently prioritize a robust email pipeline during the upgrade phase. This gives you clearer send status, fewer edge-case failures, and more predictable delivery behavior.",
      bullets: [
        "Canonical send pipeline for consistent behavior",
        "Status-aware delivery and failure handling",
        "Designed for reliable production usage",
      ],
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-orange-50/40 to-rose-50/50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-rose-200/30 blur-3xl" />
      </div>
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="mb-2 flex items-center gap-2">
          <Sunrise className="h-5 w-5 text-orange-500" />
          <p className="text-sm font-semibold tracking-wide text-orange-700">Sunrise-2025</p>
        </div>
        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
          Public experience redesign
        </Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
          A stronger brand experience with practical event tools
        </h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          We are reshaping Sunrise around the moments that matter most: creating events, sending invitations, and
          maintaining visual quality across every message touchpoint.
        </p>

        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The latest update is not just a visual refresh: it is a usability and performance reset. We are preserving the
          strengths users loved in the earlier experience (clear copy, practical workflows, event-first communication) while
          modernizing the interface to be cleaner, faster, and more mobile-friendly.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featurePillars.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <item.icon className="h-5 w-5 text-orange-500" />
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="mobile" className="mt-10">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="mobile">Mobile UX</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="mobile" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/80 p-5 text-sm text-foreground shadow-sm backdrop-blur">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 text-rose-500" />
                New responsive structures reduce cramped layouts and improve touch interactions on smaller screens.
              </div>
            </div>
          </TabsContent>
          <TabsContent value="delivery" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/80 p-5 text-sm text-foreground shadow-sm backdrop-blur">
              <div className="flex items-start gap-3">
                <Send className="mt-0.5 h-5 w-5 text-rose-500" />
                Email-first delivery provides more reliable send outcomes while background channels remain intentionally limited.
              </div>
            </div>
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/80 p-5 text-sm text-foreground shadow-sm backdrop-blur">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-rose-500" />
                Templates are shifting to shared registries so all channels can inherit consistent content structure.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {detailedFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <feature.icon className="h-5 w-5 text-orange-500" />
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{feature.description}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-lg font-semibold text-foreground">What this means for your team</h3>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              {[
                "Less setup friction when creating campaigns",
                "Consistent tone and brand look in invitations",
                "Better visibility into delivery behavior",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-lg font-semibold text-foreground">Brand identity direction</h3>
            <p className="mt-3 text-sm text-foreground">
              Sunrise visuals focus on warm gradients, celebration-first language, and approachable layouts that feel
              premium but friendly on both mobile and desktop.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="border-orange-100 bg-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold text-foreground">Built for real operations</p>
                <p className="text-sm text-muted-foreground">
                  Every core flow now prioritizes reliability for day-to-day event operations.
                </p>
              </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100 bg-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold text-foreground">Safer transition path</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade messaging and reset guidance help existing users continue smoothly.
                </p>
              </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100 bg-white/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold text-foreground">Mobile-friendly by default</p>
                <p className="text-sm text-muted-foreground">
                  Layouts, interactions, and hierarchy are tuned for smaller screens first.
                </p>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="h-11 w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
              Try the New Flow
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button variant="outline" className="h-11 w-full border-orange-300 text-orange-700 hover:bg-orange-50">
              Compare Plans
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

