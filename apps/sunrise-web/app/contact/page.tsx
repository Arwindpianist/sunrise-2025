import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  Sunrise,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { resolveEffectiveBrandId } from "@/lib/request-brand"

const ADMIN_EMAIL = "admin@sunrise-2025.com"
const SUPPORT_EMAIL = "support@sunrise-2025.com"

const brandPrimaryButton =
  "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:from-orange-600 hover:to-rose-600 focus-visible:ring-orange-400/40 border-0"

const sunsetPrimaryButton = "bg-primary text-primary-foreground hover:bg-primary/90 border-0"

const brandOutlineButton =
  "border-orange-300 bg-white/80 text-orange-800 shadow-xs backdrop-blur hover:bg-orange-50 hover:text-orange-900"

const sunsetOutlineButton = "border-border bg-card/80 text-foreground shadow-xs backdrop-blur hover:bg-accent hover:text-accent-foreground"

/** Matches homepage marketing cards: frosted panel + warm border */
const surfaceCard =
  "rounded-2xl border border-orange-100/80 bg-white/70 shadow-sm backdrop-blur transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"

export default async function ContactPage() {
  const brand = await resolveEffectiveBrandId("sunrise")
  const isSunset = brand === "sunset"
  const brandName = isSunset ? "Sunset" : "Sunrise"

  return (
    <div className={isSunset ? "sunset-marketing relative min-h-[calc(100dvh-4rem)] overflow-hidden border-t border-border bg-background" : "relative min-h-[calc(100dvh-4rem)] overflow-hidden border-t border-orange-100/90 bg-gradient-to-b from-orange-50 via-white to-rose-50"}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={isSunset ? "sunset-hero-glow-a absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl" : "absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"} />
        <div className={isSunset ? "sunset-hero-glow-b absolute -right-16 top-1/4 h-80 w-80 rounded-full blur-3xl" : "absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl"} />
        <div className={isSunset ? "sunset-hero-glow-a absolute bottom-0 left-1/3 h-64 w-64 rounded-full blur-3xl" : "absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl"} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                {brandName}
              </Link>
            </li>
            <li aria-hidden className="text-muted-foreground/50">
              /
            </li>
            <li className="font-medium text-foreground">Contact</li>
          </ol>
        </nav>

        <div className="mb-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <Sunrise className={isSunset ? "h-6 w-6 shrink-0 text-primary" : "h-6 w-6 shrink-0 text-orange-500"} aria-hidden />
            <p className={isSunset ? "sunset-wordmark text-sm font-bold tracking-tight bg-clip-text text-transparent" : "text-sm font-bold tracking-tight bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"}>
              {isSunset ? "Sunset-2025" : "Sunrise-2025"}
            </p>
          </div>
          <h1 className="mt-3 text-balance text-3xl font-black tracking-tight sm:text-4xl">
            <span className={isSunset ? "sunset-wordmark bg-clip-text text-transparent" : "bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 bg-clip-text text-transparent"}>
              Contact us
            </span>
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Questions about {brandName}, your account, or billing? Send us an email. We read every message and usually reply
            within one to two business days.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">
            <Card className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur" : `${surfaceCard} border-rose-100/70`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className={isSunset ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100"}>
                    <Mail className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-orange-500"} aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-lg text-foreground">Email</CardTitle>
                    <CardDescription className="text-muted-foreground">Best channel for support and account issues</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="text-muted-foreground/90">General and admin: </span>
                    <a
                      href={`mailto:${ADMIN_EMAIL}`}
                      className={isSunset ? "font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline" : "font-medium text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline"}
                    >
                      {ADMIN_EMAIL}
                    </a>
                  </p>
                  <p>
                    <span className="text-muted-foreground/90">Product support: </span>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className={isSunset ? "font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline" : "font-medium text-orange-600 underline-offset-4 hover:text-orange-700 hover:underline"}
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className={isSunset ? sunsetPrimaryButton : brandPrimaryButton}>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Sunrise%20support`}>
                      Compose in mail app
                      <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className={isSunset ? sunsetOutlineButton : brandOutlineButton}>
                    <a href={`mailto:${ADMIN_EMAIL}?subject=Sunrise%20inquiry`}>Write to admin</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert
              className={
                isSunset
                  ? "rounded-2xl border-primary/35 bg-primary/10 text-foreground shadow-sm backdrop-blur"
                  : "rounded-2xl border-orange-200/90 bg-orange-50/80 text-foreground shadow-sm backdrop-blur dark:border-orange-800/50 dark:bg-orange-950/40"
              }
            >
              <MessageSquare className={isSunset ? "h-4 w-4 text-primary" : "h-4 w-4 text-orange-600"} />
              <AlertTitle className="text-foreground">Include context</AlertTitle>
              <AlertDescription className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                <p>Your account email, a short subject, and what you were trying to do when something went wrong.</p>
                <p>
                  For how-to questions, the{" "}
                  <Link
                    href="/help"
                    className={
                      isSunset
                        ? "font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                        : "font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700 dark:text-orange-400"
                    }
                  >
                    Help center
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/faq"
                    className={
                      isSunset
                        ? "font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                        : "font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700 dark:text-orange-400"
                    }
                  >
                    FAQ
                  </Link>{" "}
                  may answer you faster.
                </p>
              </AlertDescription>
            </Alert>

            <Card className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur" : `${surfaceCard} border-amber-100/80`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className={isSunset ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100"}>
                    <Clock className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-amber-600"} aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-lg text-foreground">Response times</CardTitle>
                    <CardDescription className="text-muted-foreground">Malaysia business hours when possible</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>We aim to reply within one to two business days. Complex or account-specific cases can take a bit longer.</p>
                <p>If you are reporting a security issue, put &quot;Security&quot; in the subject line so we can prioritise it.</p>
              </CardContent>
            </Card>

            <Card className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur" : `${surfaceCard} border-orange-100/90`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className={isSunset ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100"}>
                    <Building2 className={isSunset ? "h-5 w-5 text-primary" : "h-5 w-5 text-rose-500"} aria-hidden />
                  </span>
                  <div>
                    <CardTitle className="text-lg text-foreground">Business details</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Registered business operating Sunrise and Sunset
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">SUNRISE SUNSET SERVICES</p>
                <ul className="list-none space-y-1.5">
                  <li>
                    <span className="text-muted-foreground/90">Registration no.: </span>
                    202503184225 (CT0152300-K)
                  </li>
                  <li>
                    <span className="text-muted-foreground/90">Type: </span>
                    Sole proprietorship
                  </li>
                  <li>
                    <span className="text-muted-foreground/90">Start date: </span>
                    6 July 2025
                  </li>
                </ul>
                <Separator className={isSunset ? "my-4 bg-border" : "my-4 bg-orange-100"} />
                <p className="text-xs leading-relaxed">
                  For full company and partnership information, see{" "}
                  <Link
                    href="/contact-info"
                    className={
                      isSunset
                        ? "font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                        : "font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700 dark:text-orange-400"
                    }
                  >
                    Contact information
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="Quick links">
            <Card className={isSunset ? "sunset-panel rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur" : `${surfaceCard} border-orange-100/90`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground">Quick links</CardTitle>
                <CardDescription className="text-muted-foreground">Self-serve resources</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isSunset
                      ? "w-full justify-start gap-2 border-border bg-card text-foreground backdrop-blur hover:bg-accent"
                      : "w-full justify-start gap-2 border-orange-200 bg-card/80 text-foreground backdrop-blur hover:bg-accent dark:border-orange-800/60"
                  }
                  asChild
                >
                  <Link href="/help">
                    <HelpCircle className={isSunset ? "h-4 w-4 shrink-0 text-primary" : "h-4 w-4 shrink-0 text-orange-500"} aria-hidden />
                    Help center
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isSunset
                      ? "w-full justify-start gap-2 border-border bg-card text-foreground backdrop-blur hover:bg-accent"
                      : "w-full justify-start gap-2 border-orange-200 bg-card/80 text-foreground backdrop-blur hover:bg-accent dark:border-orange-800/60"
                  }
                  asChild
                >
                  <Link href="/faq">
                    <BookOpen className={isSunset ? "h-4 w-4 shrink-0 text-primary" : "h-4 w-4 shrink-0 text-rose-500"} aria-hidden />
                    FAQ
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isSunset
                      ? "w-full justify-start gap-2 border-border bg-card text-foreground backdrop-blur hover:bg-accent"
                      : "w-full justify-start gap-2 border-orange-200 bg-card/80 text-foreground backdrop-blur hover:bg-accent dark:border-orange-800/60"
                  }
                  asChild
                >
                  <Link href="/pricing">
                    <LifeBuoy className={isSunset ? "h-4 w-4 shrink-0 text-primary" : "h-4 w-4 shrink-0 text-amber-600"} aria-hidden />
                    Pricing
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    isSunset
                      ? "w-full justify-start gap-2 border-border bg-card text-foreground backdrop-blur hover:bg-accent"
                      : "w-full justify-start gap-2 border-orange-200 bg-card/80 text-foreground backdrop-blur hover:bg-accent dark:border-orange-800/60"
                  }
                  asChild
                >
                  <Link href="/dashboard">
                    <ArrowRight className={isSunset ? "h-4 w-4 shrink-0 text-primary" : "h-4 w-4 shrink-0 text-orange-500"} aria-hidden />
                    Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div className={isSunset ? "mt-6 hidden sunset-panel rounded-2xl border border-primary/35 bg-primary/12 px-4 py-5 text-center text-foreground shadow-lg lg:block" : "mt-6 hidden rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-5 text-center text-white shadow-lg lg:block"}>
              <p className="text-sm font-semibold">New here?</p>
              <p className={isSunset ? "mt-1 text-xs text-muted-foreground" : "mt-1 text-xs text-white/90"}>Create a free account and explore templates.</p>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className={isSunset ? "mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90" : "mt-3 w-full bg-white text-orange-600 hover:bg-orange-50"}
              >
                <Link href="/register">
                  Start free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
