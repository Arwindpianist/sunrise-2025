import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  MessageSquare,
  Shield,
  Heart,
  Star,
  ArrowRight,
  Zap,
  Globe,
  Users2,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { resolveEffectiveBrandId } from "@/lib/request-brand"

const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL ?? "https://sunset-2025.com"
const SUNRISE_URL = process.env.NEXT_PUBLIC_SUNRISE_URL ?? "https://sunrise-2025.com"

export default async function AboutPage() {
  const brand = await resolveEffectiveBrandId("sunrise")
  const isSunset = brand === "sunset"
  const productLabel = isSunset ? "Sunset-2025" : "Sunrise-2025"
  const peerProductName = isSunset ? "Sunrise" : "Sunset"
  const peerProductUrl = isSunset ? SUNRISE_URL : SUNSET_URL

  const features = isSunset
    ? [
        {
          icon: Users,
          title: "Thoughtful contact lists",
          description:
            "Organize families, friends, and communities with categories that respect how groups prefer to be reached.",
        },
        {
          icon: Calendar,
          title: "Memorials and gatherings",
          description:
            "Plan services, wakes, and remembrance events with templates tuned for dignified timing and tone.",
        },
        {
          icon: MessageSquare,
          title: "Multi-channel outreach",
          description:
            "Reach people by email, WhatsApp, Telegram, and SMS with scheduling that reduces stress for organisers.",
        },
        {
          icon: Shield,
          title: "Secure and private",
          description:
            "Strong authentication, encrypted transport, and a managed PostgreSQL data layer on Neon with careful access controls for sensitive lists.",
        },
        {
          icon: Heart,
          title: "Shareable information forms",
          description:
            "Let people contribute details through clear forms that explain why information is collected.",
        },
        {
          icon: Star,
          title: "Fair token pricing",
          description:
            "Pay for what you send. One wallet and ledger across Sunrise and Sunset under Sunrise Sunset Services.",
        },
      ]
    : [
        {
          icon: Users,
          title: "Smart Contact Management",
          description:
            "Organize your contacts with flexible categories, import from Google Contacts, vCard files, or CSV. Create custom categories with color coding for perfect organization.",
        },
        {
          icon: Calendar,
          title: "Beautiful Event Creation",
          description:
            "Create stunning events with our intuitive templates. From weddings to birthdays, festivals to corporate events, we have templates for every occasion.",
        },
        {
          icon: MessageSquare,
          title: "Multi-Channel Communication",
          description:
            "Reach your guests wherever they are. Send invitations and updates via Email, WhatsApp, Telegram, and SMS with smart scheduling.",
        },
        {
          icon: Shield,
          title: "Secure & Reliable",
          description:
            "Your data is protected with enterprise-grade practices: secure sign-in (NextAuth.js), PostgreSQL on Neon, and disciplined access patterns across the stack.",
        },
        {
          icon: Heart,
          title: "Shareable Contact Forms",
          description:
            "Let your contacts add themselves to your circle with beautiful, informative forms that explain why you're collecting their information.",
        },
        {
          icon: Star,
          title: "Token-Based Pricing",
          description:
            "Pay only for what you use. Our flexible token system ensures you never pay for unused features.",
        },
      ]

  const teamMembers = [
    {
      name: "Arwin Kumar",
      role: "Founder & CEO",
      company: "Arwindpianist Multimedia & Consulting",
      bio: isSunset
        ? "Founder and owner of Arwindpianist Multimedia & Consulting (arwindpianist.com), a managed IT and solutions practice. Personally developed, designed, and architected the shared platform behind Sunrise and Sunset, operated by Sunrise Sunset Services."
        : "Founder and owner of Arwindpianist Multimedia & Consulting (arwindpianist.com), a managed IT and solutions practice. Personally developed, designed, and architected the Sunrise-2025 platform and related product work.",
      expertise: [
        "MSP & Managed IT",
        "Software & Cloud Architecture",
        "Product & Platform Design",
        "Music Production & Audio",
      ],
    },
    {
      name: "Sunrise Sunset Services",
      role: "Operator · Finance & go-to-market",
      company: "Sunrise Sunset Services",
      bio: isSunset
        ? "The registered operator of Sunset and Sunrise. Provides governance, billing, and growth support so families and organisers get one dependable account and delivery backbone."
        : "The registered operator of Sunrise and Sunset. Provides governance, billing, and growth support so celebrations and remembrance share one account, wallet, and delivery backbone.",
      expertise: ["Financial Operations", "Sales & Marketing", "Market Expansion", "Business Development"],
    },
  ]

  const milestones = [
    {
      period: "Early 2025",
      title: "Concept",
      description:
        "Defined the need for one operator, two purposeful brands: Sunrise for celebrations and Sunset for remembrance, with shared accounts and messaging.",
    },
    {
      period: "2025",
      title: "Foundation build",
      description:
        "Engineering focus on Next.js, TypeScript, Neon PostgreSQL, and secure auth: event flows, contacts, tokens, and multi-channel delivery.",
    },
    {
      period: "Aug 2025",
      title: "Public launch",
      description:
        "Sunrise and Sunset go live with core workflows, multi-channel messaging, and token billing under Sunrise Sunset Services.",
    },
    {
      period: "Late 2025",
      title: "Customer beta",
      description:
        "Structured beta feedback on reliability, templates, and account journeys while we prepare the v2 generation of the platform.",
    },
    {
      period: "2026",
      title: "Platform v2",
      description:
        "Rollout of v2: refreshed architecture, faster release cadence, and a stronger shared base for Sunrise and Sunset together.",
    },
    {
      period: "Aug 2026",
      title: "Full public release",
      description:
        "Forecast: v2 generally available to all customers, stable feature set, polished onboarding, and operations tuned for full public scale.",
      forecast: true,
    },
  ]

  const values = isSunset
    ? [
        {
          icon: Heart,
          title: "Dignity first",
          description:
            "We design for clarity, restraint, and respect. Tools should reduce burden, not add noise, during difficult times.",
        },
        {
          icon: Shield,
          title: "Security & Privacy",
          description:
            "Sensitive lists and messages deserve strong controls. We invest in security and transparent data practices.",
        },
        {
          icon: Zap,
          title: "Reliable delivery",
          description:
            "When timing matters, channels and schedules need to work. We focus on dependable sends and visibility.",
        },
        {
          icon: Users2,
          title: "Community",
          description:
            "We support organisers, families, and communities who hold people together through care and communication.",
        },
      ]
    : [
        {
          icon: Heart,
          title: "User-Centric Design",
          description:
            "Every feature we build is designed with our users in mind. We prioritize ease of use, accessibility, and meaningful experiences.",
        },
        {
          icon: Shield,
          title: "Security & Privacy",
          description:
            "We take data security seriously. Your information is protected with enterprise-grade security measures and privacy controls.",
        },
        {
          icon: Zap,
          title: "Innovation",
          description:
            "We continuously innovate to provide cutting-edge solutions that make event planning easier and more enjoyable.",
        },
        {
          icon: Users2,
          title: "Community",
          description:
            "We believe in building a community of event planners who support and inspire each other to create amazing experiences.",
        },
      ]

  const pageShell = isSunset
    ? "sunset-marketing min-h-screen bg-background text-foreground"
    : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50"

  const headingMuted = "text-muted-foreground"
  const headingStrong = "text-foreground"
  const cardBorder = (extra: string) => (isSunset ? `sunset-panel border-border ${extra}` : extra)

  return (
    <div className={pageShell}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight ${headingStrong}`}>
            About{" "}
            <span
              className={
                isSunset
                  ? "sunset-wordmark bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"
              }
            >
              {productLabel}
            </span>
          </h1>
          <p className={`text-base sm:text-xl max-w-3xl mx-auto leading-relaxed px-4 ${headingMuted}`}>
            {isSunset ? (
              <>
                {productLabel} is operated by{" "}
                <strong className="text-foreground">Sunrise Sunset Services</strong>. Created with Arwin Kumar and
                Arwindpianist Multimedia & Consulting, we help organisers run memorials, wakes, and remembrance updates
                with calm, reliable communication. Your account is shared with Sunrise: one wallet, one ledger, one team
                behind both experiences.
              </>
            ) : (
              <>
                Created by Arwin Kumar, founder of Arwindpianist Multimedia & Consulting, we are on a mission to make
                celebrating life&apos;s beautiful moments easier, more organized, and more joyful.{" "}
                <strong className={headingStrong}>Sunrise Sunset Services</strong> operates {productLabel} alongside
                Sunset, with the same account and billing backbone. From intimate gatherings to grand celebrations,{" "}
                {productLabel} is your companion for unforgettable experiences.
              </>
            )}
          </p>
        </div>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-violet-200 bg-violet-50/60")}>
          <CardContent className="p-6 sm:p-8">
            <h2
              className={`text-xl sm:text-2xl font-bold mb-3 text-center ${isSunset ? "text-foreground" : "text-violet-950"}`}
            >
              {isSunset ? "Sunset and Sunrise share one operator" : "Sunrise and Sunset are both core to what we build"}
            </h2>
            <p className="mx-auto max-w-3xl text-center leading-relaxed text-muted-foreground">
              <strong className={isSunset ? "text-foreground" : undefined}>Sunrise</strong> is for celebrations,
              invitations, and joyful coordination.{" "}
              <strong className={isSunset ? "text-foreground" : undefined}>Sunset</strong> is the companion experience
              for memorials, condolences, and careful outreach when tone matters most. Both are operated by{" "}
              <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong> with the same
              account, billing, and delivery backbone. Sunset is not a cosmetic skin of Sunrise. It is purpose-built for
              compassionate communication.
            </p>
            <p className="text-center mt-5">
              <a
                href={peerProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isSunset
                    ? "inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-2 hover:text-primary/90"
                    : "inline-flex items-center gap-2 font-semibold text-violet-800 underline underline-offset-2 hover:text-violet-950"
                }
              >
                Visit {peerProductName}
              </a>
            </p>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-orange-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center ${headingStrong}`}>
              About Arwindpianist Multimedia & Consulting
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <p className={`text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed ${headingMuted}`}>
                  {productLabel} was built by Arwindpianist Multimedia & Consulting, founded and owned by Arwin Kumar. The
                  product is operated for customers by{" "}
                  <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong>. The firm
                  is a managed service provider (MSP) and IT solutions partner: managed IT, new and refurbished hardware,
                  software and integrations, music production services, and IT consulting including construction-related
                  technology.
                </p>
                <p className={`text-base sm:text-lg leading-relaxed ${headingMuted}`}>
                  That delivery experience informs how we build reliable, secure communication products for organisers,
                  whether they are planning celebrations or remembrance.
                </p>
                <div className="mt-4">
                  <a
                    href="https://arwindpianist.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      isSunset
                        ? "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        : "inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-rose-600 transition-colors"
                    }
                  >
                    Visit Our Company
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div
                className={
                  isSunset
                    ? "rounded-lg border border-border bg-card/80 p-4 sm:p-6 text-center"
                    : "bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg p-4 sm:p-6 text-center"
                }
              >
                <Globe className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${isSunset ? "text-primary" : "text-orange-500"}`} />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${headingStrong}`}>MSP & IT solutions</h3>
                <p className={`text-sm sm:text-base ${headingMuted}`}>
                  Managed IT, cybersecurity and cloud support, hardware sourcing, custom software, and creative audio
                  services for businesses and production clients in Malaysia and beyond.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-blue-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center ${headingStrong}`}>
              How we work together
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${headingStrong}`}>Arwindpianist Multimedia & Consulting</h3>
                <p className={`leading-relaxed mb-4 ${headingMuted}`}>
                  Founded and owned by Arwin Kumar, the firm leads product engineering, design, and technical strategy for
                  the platform that powers Sunrise and Sunset, drawing on its broader MSP, integration, and software
                  practice.
                </p>
                <div
                  className={
                    isSunset
                      ? "rounded-lg border border-border bg-primary/10 p-4"
                      : "bg-orange-50 p-4 rounded-lg border border-orange-200"
                  }
                >
                  <h4 className={`font-semibold mb-2 ${headingStrong}`}>Studio contribution</h4>
                  <ul className={`text-sm space-y-1 ${headingMuted}`}>
                    <li>• Full-stack product engineering</li>
                    <li>• Product design and UX</li>
                    <li>• Cloud, security, and integration architecture</li>
                    <li>• MSP and client delivery discipline</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className={`text-xl font-semibold mb-4 ${headingStrong}`}>Sunrise Sunset Services</h3>
                <p className={`leading-relaxed mb-4 ${headingMuted}`}>
                  The registered business that operates Sunrise and Sunset for customers: governance, subscriptions,
                  tokens, support, and go-to-market. When you subscribe or send messages, you are contracting with
                  Sunrise Sunset Services.
                </p>
                <div
                  className={
                    isSunset
                      ? "rounded-lg border border-border bg-card/80 p-4"
                      : "bg-blue-50 p-4 rounded-lg border border-blue-200"
                  }
                >
                  <h4 className={`font-semibold mb-2 ${headingStrong}`}>Operator responsibilities</h4>
                  <ul className={`text-sm space-y-1 ${headingMuted}`}>
                    <li>• Customer-facing operations</li>
                    <li>• Billing and subscriptions</li>
                    <li>• Trust, safety, and policy</li>
                    <li>• Growth and partnerships</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="font-medium text-muted-foreground">
                This structure keeps engineering excellence and customer operations aligned under{" "}
                <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong>, the company
                that runs both brands.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-rose-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center ${headingStrong}`}>Our Mission</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <p className={`text-base sm:text-lg mb-3 sm:mb-4 leading-relaxed ${headingMuted}`}>
                  {isSunset ? (
                    <>
                      When people gather to remember someone they love, coordination should be steady and clear. We
                      believe organisers deserve tools that protect tone, reduce busywork, and keep everyone informed
                      without overwhelm.
                    </>
                  ) : (
                    <>
                      In a world where connections matter more than ever, we believe that organizing and sharing
                      life&apos;s special moments should be effortless and beautiful. Whether it&apos;s a wedding,
                      birthday, festival, or any celebration, we want to help you focus on what truly matters: creating
                      memories with the people you love.
                    </>
                  )}
                </p>
                <p className={`text-base sm:text-lg leading-relaxed ${headingMuted}`}>
                  {isSunset ? (
                    <>
                      Our platform combines reliable delivery with interfaces that stay calm under pressure, so you can
                      focus on people, not spreadsheets.
                    </>
                  ) : (
                    <>
                      Our platform combines powerful technology with intuitive design to give you everything you need to
                      manage your events, organize your contacts, and communicate with your guests seamlessly.
                    </>
                  )}
                </p>
              </div>
              <div
                className={
                  isSunset
                    ? "rounded-lg border border-border bg-card/80 p-4 sm:p-6 text-center"
                    : "bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg p-4 sm:p-6 text-center"
                }
              >
                <Heart className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${isSunset ? "text-primary" : "text-orange-500"}`} />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${headingStrong}`}>
                  {isSunset ? "Careful communication" : "Celebrating Connections"}
                </h3>
                <p className={`text-sm sm:text-base ${headingMuted}`}>
                  {isSunset
                    ? "Every feature is judged by whether it helps people feel informed, included, and respected."
                    : "Every feature we build is designed to strengthen the bonds between people and make celebrations more meaningful."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-amber-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center ${headingStrong}`}>Our Story</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-3 ${headingStrong}`}>The Beginning</h3>
                <p className={`leading-relaxed mb-4 ${headingMuted}`}>
                  The platform was born from seeing how much coordination it takes to bring people together, whether for joy
                  or grief. Our founder, Arwin Kumar, saw this through client work at Arwindpianist Multimedia &
                  Consulting across managed IT, integration projects, and creative production.
                </p>
                <p className={`leading-relaxed mb-4 ${headingMuted}`}>
                  Many tools were either too casual for remembrance or too heavy for celebrations. We set out to serve both
                  with honesty: two brand experiences, one operator,{" "}
                  <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong>.
                </p>
                <p className={`leading-relaxed ${headingMuted}`}>
                  {isSunset
                    ? "Sunset extends that vision for organisers who need compassionate defaults and dependable delivery."
                    : "Sunrise carries the celebration-forward experience, while Sunset carries the remembrance-forward one."}
                </p>
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-3 ${headingStrong}`}>The Solution</h3>
                <p className={`leading-relaxed mb-4 ${headingMuted}`}>
                  {isSunset
                    ? "We built Sunset so memorial workflows, contact care, and channel choice feel intentional, not improvised."
                    : "We set out to simplify event planning while keeping the personal touch that makes celebrations special."}
                </p>
                <p className={`leading-relaxed ${headingMuted}`}>
                  Today, {productLabel} serves organisers who rely on{" "}
                  <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong> for clear
                  pricing, one wallet, and serious delivery infrastructure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-green-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center ${headingStrong}`}>Meet Our Team</h2>
            <p className={`text-center mb-8 max-w-3xl mx-auto ${headingMuted}`}>
              Arwindpianist Multimedia & Consulting, an MSP and IT solutions practice, builds the product.{" "}
              <strong className={isSunset ? "text-foreground" : undefined}>Sunrise Sunset Services</strong> operates Sunrise
              and Sunset for customers.
            </p>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="text-center">
                  <div
                    className={
                      isSunset
                        ? "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-primary/35 bg-primary/10"
                        : "bg-gradient-to-br from-orange-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
                    }
                  >
                    <Users className={`h-8 w-8 ${isSunset ? "text-primary" : "text-orange-500"}`} />
                  </div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${headingStrong}`}>{member.name}</h3>
                  <p className={`font-medium mb-3 ${isSunset ? "text-primary" : "text-orange-600"}`}>{member.role}</p>
                  <p className={`text-sm font-medium mb-2 ${isSunset ? "text-muted-foreground" : "text-blue-600"}`}>
                    {member.company}
                  </p>
                  <p className={`text-sm leading-relaxed mb-4 ${headingMuted}`}>{member.bio}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {member.expertise.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-green-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center ${headingStrong}`}>Our Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon
                return (
                  <div key={index} className="text-center">
                    <div
                      className={
                        isSunset
                          ? "mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-primary/35 bg-primary/10"
                          : "bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4"
                      }
                    >
                      <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${isSunset ? "text-primary" : "text-orange-500"}`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${headingStrong}`}>{value.title}</h3>
                    <p className={`text-sm leading-relaxed ${headingMuted}`}>{value.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-purple-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center ${headingStrong}`}>Our Journey</h2>
            <p className={`mx-auto mb-8 max-w-2xl text-center text-sm ${headingMuted}`}>
              Milestones mix shipped history and forward-looking plans. Items marked as forecast are targets, not guarantees.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="text-center">
                  <div
                    className={
                      isSunset
                        ? "mx-auto mb-4 flex min-h-16 min-w-16 max-w-[6.75rem] items-center justify-center rounded-full border border-primary/40 bg-primary/15 px-2 py-2 text-primary"
                        : "mx-auto mb-4 flex min-h-16 min-w-16 max-w-[6.75rem] items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-2 text-center text-white"
                    }
                  >
                    <span className="text-center text-xs font-bold leading-snug sm:text-sm">{milestone.period}</span>
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${headingStrong}`}>
                    {milestone.title}
                    {milestone.forecast ? (
                      <span className={`ml-1.5 text-xs font-normal ${headingMuted}`}>(forecast)</span>
                    ) : null}
                  </h3>
                  <p className={`text-sm leading-relaxed ${headingMuted}`}>{milestone.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mb-12 sm:mb-16">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center ${headingStrong}`}>
            What Makes Us Special
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card
                  key={index}
                  className={
                    isSunset
                      ? "sunset-panel border-border transition-shadow hover:shadow-lg"
                      : "border-border hover:shadow-lg transition-shadow"
                  }
                >
                  <CardContent className="p-4 sm:p-6">
                    <div
                      className={
                        isSunset
                          ? "mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-primary/35 bg-primary/10"
                          : "bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4"
                      }
                    >
                      <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${isSunset ? "text-primary" : "text-orange-500"}`} />
                    </div>
                    <h3 className={`text-base sm:text-lg font-semibold mb-2 sm:mb-3 ${headingStrong}`}>{feature.title}</h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${headingMuted}`}>{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <Card className={cardBorder(isSunset ? "mb-12 sm:mb-16" : "mb-12 sm:mb-16 border-rose-200")}>
          <CardContent className="p-6 sm:p-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center ${headingStrong}`}>
              Built with Modern Technology
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {(
                [
                  {
                    title: "Next.js",
                    body: "Modern React framework with App Router",
                    box: "bg-blue-100",
                    titleColor: "text-blue-800",
                  },
                  {
                    title: "Neon Postgres",
                    body: "Managed PostgreSQL for reliable data storage",
                    box: "bg-green-100",
                    titleColor: "text-green-800",
                  },
                  {
                    title: "TypeScript",
                    body: "Type-safe development for reliability",
                    box: "bg-purple-100",
                    titleColor: "text-purple-800",
                  },
                  {
                    title: "Tailwind CSS",
                    body: "Utility-first CSS for cohesive design",
                    box: "bg-cyan-100",
                    titleColor: "text-cyan-800",
                  },
                ] as const
              ).map((item) => (
                <div key={item.title} className="text-center">
                  <div
                    className={
                      isSunset
                        ? "mb-2 sm:mb-3 rounded-lg border border-border bg-card/80 p-3 sm:p-4"
                        : `mb-2 sm:mb-3 rounded-lg p-3 sm:p-4 ${item.box}`
                    }
                  >
                    <h4
                      className={`font-semibold text-sm sm:text-base ${isSunset ? "text-foreground" : item.titleColor}`}
                    >
                      {item.title}
                    </h4>
                  </div>
                  <p className={`text-xs sm:text-sm ${headingMuted}`}>{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${headingStrong}`}>
            {isSunset ? "Ready to plan with clarity and care?" : "Ready to Start Creating Beautiful Moments?"}
          </h2>
          <p className={`text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto ${headingMuted}`}>
            {isSunset
              ? `Join organisers who use ${productLabel}, operated by Sunrise Sunset Services, for dependable remembrance communication.`
              : `Join organisers who trust ${productLabel} and Sunrise Sunset Services to make their celebrations unforgettable.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className={
                  isSunset
                    ? "w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 w-full sm:w-auto"
                }
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className={
                  isSunset
                    ? "w-full sm:w-auto border-border text-foreground hover:bg-accent"
                    : "border-orange-500 text-orange-500 hover:bg-orange-50 w-full sm:w-auto"
                }
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
