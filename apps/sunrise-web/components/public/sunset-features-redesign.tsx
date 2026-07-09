import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Flower2, HeartHandshake, Mail, ShieldCheck, Users, Clock3, Sparkles } from "lucide-react"

const pillars = [
  {
    icon: Flower2,
    title: "Memorial-first composition",
    desc: "Templates and flows are written for remembrance, not celebration language.",
  },
  {
    icon: Users,
    title: "Audience sensitivity",
    desc: "Separate family, community, and logistics groups so updates stay appropriate.",
  },
  {
    icon: Mail,
    title: "Reliable delivery core",
    desc: "Status-aware sending keeps teams aligned and reduces duplicate outreach.",
  },
]

const detailed = [
  "Structured memorial notice builder with clear review steps",
  "Reusable wording patterns for service, condolence, and logistics updates",
  "Shared account and wallet with Sunrise under Sunrise Sunset Services",
  "Mobile-friendly editing for urgent updates away from a desk",
  "Delivery visibility to keep organisers coordinated",
]

export default function SunsetFeaturesRedesign() {
  return (
    <div className="sunset-marketing relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="sunset-hero-glow-a absolute -left-20 top-20 h-72 w-72 rounded-full blur-3xl" />
        <div className="sunset-hero-glow-b absolute right-0 top-1/3 h-72 w-72 rounded-full blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="flex items-center gap-2">
          <Flower2 className="h-5 w-5 text-primary" />
          <p className="sunset-wordmark bg-clip-text text-sm font-semibold tracking-wide text-transparent">Sunset</p>
        </div>
        <Badge variant="outline" className="mt-3 border-primary/35 bg-primary/10 text-primary">
          Memorial communication platform
        </Badge>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
          Features designed for thoughtful outreach in difficult moments
        </h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          Sunset helps families and organisations share clear updates with dignity. Every workflow prioritizes tone, timing,
          and reliability when communication cannot be careless.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pillars.map((item) => (
            <div key={item.title} className="sunset-panel rounded-2xl border border-border bg-card/75 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <item.icon className="h-5 w-5 text-primary" />
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card className="sunset-panel border-border bg-card/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <HeartHandshake className="h-5 w-5 text-primary" />
                What teams get with Sunset
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {detailed.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="sunset-panel border-border bg-card/80">
            <CardContent className="p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Operating principles
              </h2>
              <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Timing controls help prevent rushed or duplicated sends.
                </p>
                <p className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Copy and layout maintain a respectful, low-noise presentation.
                </p>
                <p>
                  Sunrise and Sunset remain one account system: same login, same wallet, same delivery backbone, brand-specific
                  experience.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="sunset-success-panel mt-8 rounded-2xl p-4 text-sm">
          If your password fails after migration, reset it on Sunrise. Accounts stay shared across Sunrise and Sunset.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90">Get started with Sunset</Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button variant="outline" className="h-11 w-full border-primary/35 text-primary hover:bg-primary/10">
              Compare plans
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

