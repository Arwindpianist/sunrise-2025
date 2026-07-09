import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Users, MessageSquare, BookOpen, Shield } from "lucide-react"
import Link from "next/link"
import { resolveEffectiveBrandId } from "@/lib/request-brand"

interface Resource {
  id: string
  title: string
  description: string
  category: string
  type: "template" | "guide" | "checklist" | "tool" | "ebook"
  downloadUrl?: string
  tags: string[]
  featured?: boolean
  fileSize?: string
  pages?: number
}

const resources: Resource[] = [
  {
    id: "event-planning-checklist",
    title: "Complete Event Planning Checklist",
    description:
      "A comprehensive 12-month checklist covering every aspect of event planning, from initial concept to post-event follow-up. Perfect for weddings, corporate events, and celebrations.",
    category: "Planning",
    type: "checklist",
    tags: ["Planning", "Checklist", "Timeline"],
    featured: true,
    fileSize: "2.1 MB",
    pages: 15,
  },
  {
    id: "wedding-planning-template",
    title: "Wedding Planning Template & Timeline",
    description:
      "Detailed wedding planning template with customizable timeline, vendor contact sheets, budget tracker, and guest list management tools.",
    category: "Wedding",
    type: "template",
    tags: ["Wedding", "Template", "Timeline"],
    featured: true,
    fileSize: "3.5 MB",
    pages: 25,
  },
  {
    id: "corporate-event-guide",
    title: "Corporate Event Planning Guide",
    description:
      "Professional guide for planning corporate events, conferences, and business meetings. Includes ROI tracking, vendor management, and attendee engagement strategies.",
    category: "Corporate",
    type: "guide",
    tags: ["Corporate", "Business", "Professional"],
    fileSize: "4.2 MB",
    pages: 32,
  },
  {
    id: "contact-management-template",
    title: "Contact Management Spreadsheet",
    description:
      "Excel template for organizing contacts, tracking RSVPs, and managing guest lists. Includes categorization, communication history, and follow-up tracking.",
    category: "Management",
    type: "template",
    tags: ["Contacts", "Spreadsheet", "Organization"],
    fileSize: "1.8 MB",
    pages: 8,
  },
  {
    id: "communication-strategy-guide",
    title: "Multi-Channel Communication Strategy Guide",
    description:
      "Comprehensive guide to creating effective communication strategies across email, SMS, social media, and messaging platforms.",
    category: "Communication",
    type: "guide",
    tags: ["Communication", "Strategy", "Multi-Channel"],
    fileSize: "2.8 MB",
    pages: 18,
  },
  {
    id: "budget-tracker-template",
    title: "Event Budget Tracker",
    description:
      "Excel-based budget tracking template with automatic calculations, expense categories, and variance analysis for accurate financial management.",
    category: "Finance",
    type: "template",
    tags: ["Budget", "Finance", "Tracking"],
    fileSize: "1.5 MB",
    pages: 12,
  },
  {
    id: "vendor-management-checklist",
    title: "Vendor Management Checklist",
    description:
      "Essential checklist for selecting, contracting, and managing vendors. Includes evaluation criteria, contract templates, and communication protocols.",
    category: "Vendors",
    type: "checklist",
    tags: ["Vendors", "Management", "Contracts"],
    fileSize: "1.2 MB",
    pages: 10,
  },
  {
    id: "event-marketing-guide",
    title: "Event Marketing & Promotion Guide",
    description:
      "Complete guide to marketing your event effectively. Covers digital marketing, social media strategies, email campaigns, and traditional promotion methods.",
    category: "Marketing",
    type: "guide",
    tags: ["Marketing", "Promotion", "Digital"],
    fileSize: "3.1 MB",
    pages: 22,
  },
  {
    id: "risk-management-template",
    title: "Risk Management & Contingency Planning",
    description:
      "Template for identifying potential risks, creating contingency plans, and establishing emergency procedures for events of all sizes.",
    category: "Risk Management",
    type: "template",
    tags: ["Risk", "Contingency", "Safety"],
    fileSize: "2.3 MB",
    pages: 14,
  },
  {
    id: "post-event-evaluation",
    title: "Post-Event Evaluation Template",
    description:
      "Comprehensive evaluation template for measuring event success, gathering feedback, and planning improvements for future events.",
    category: "Evaluation",
    type: "template",
    tags: ["Evaluation", "Feedback", "Improvement"],
    fileSize: "1.7 MB",
    pages: 9,
  },
  {
    id: "seasonal-event-ideas",
    title: "Seasonal Event Ideas & Themes",
    description:
      "Creative event ideas and themes organized by season. Includes decoration suggestions, activity ideas, and planning tips for each season.",
    category: "Ideas",
    type: "guide",
    tags: ["Ideas", "Themes", "Seasonal"],
    fileSize: "2.9 MB",
    pages: 20,
  },
  {
    id: "accessibility-guidelines",
    title: "Event Accessibility Guidelines",
    description:
      "Comprehensive guidelines for making events accessible to all attendees. Covers physical accessibility, digital accessibility, and inclusive practices.",
    category: "Accessibility",
    type: "guide",
    tags: ["Accessibility", "Inclusion", "Guidelines"],
    fileSize: "2.4 MB",
    pages: 16,
  },
]

const categories = [
  { name: "All", count: resources.length },
  { name: "Planning", count: resources.filter((r) => r.category === "Planning").length },
  { name: "Wedding", count: resources.filter((r) => r.category === "Wedding").length },
  { name: "Corporate", count: resources.filter((r) => r.category === "Corporate").length },
  { name: "Management", count: resources.filter((r) => r.category === "Management").length },
  { name: "Communication", count: resources.filter((r) => r.category === "Communication").length },
  { name: "Finance", count: resources.filter((r) => r.category === "Finance").length },
  { name: "Vendors", count: resources.filter((r) => r.category === "Vendors").length },
  { name: "Marketing", count: resources.filter((r) => r.category === "Marketing").length },
  { name: "Risk Management", count: resources.filter((r) => r.category === "Risk Management").length },
  { name: "Evaluation", count: resources.filter((r) => r.category === "Evaluation").length },
  { name: "Ideas", count: resources.filter((r) => r.category === "Ideas").length },
  { name: "Accessibility", count: resources.filter((r) => r.category === "Accessibility").length },
]

export default async function ResourcesPage() {
  const brand = await resolveEffectiveBrandId("sunrise")
  const isSunset = brand === "sunset"
  const productName = isSunset ? "Sunset" : "Sunrise"
  const productLabel = isSunset ? "Sunset-2025" : "Sunrise-2025"

  const pageShell = isSunset
    ? "sunset-marketing min-h-screen bg-background text-foreground"
    : "min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50"

  const h1Class = isSunset
    ? "text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 sunset-wordmark bg-clip-text text-transparent leading-tight"
    : "text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent leading-tight"

  const subtext = isSunset ? "text-muted-foreground" : "text-gray-600"
  const sectionTitle = isSunset ? "text-foreground" : "text-gray-800"
  const cardTitle = isSunset ? "text-foreground" : "text-gray-800"
  const bodyText = isSunset ? "text-muted-foreground" : "text-gray-600"
  const metaText = isSunset ? "text-muted-foreground" : "text-gray-500"

  const heroIconWrap = isSunset
    ? "rounded-full border border-primary/35 bg-primary/15 p-3"
    : "rounded-full bg-gradient-to-r from-orange-500 to-rose-500 p-3"
  const heroIconClass = isSunset ? "h-8 w-8 text-primary" : "h-8 w-8 text-white"

  const featuredCard = isSunset
    ? "sunset-panel border-border shadow-lg transition-shadow duration-300 hover:shadow-xl"
    : "border-orange-200 shadow-lg transition-shadow duration-300 hover:shadow-xl"

  const featuredBadge = isSunset
    ? "border-primary/35 bg-primary/15 text-primary"
    : "border-orange-200 bg-orange-100 text-orange-700"

  const gridCard = isSunset
    ? "sunset-panel border-border transition-shadow hover:shadow-lg"
    : "border-gray-200 transition-shadow hover:shadow-lg"

  const categoryCards = [
    {
      border: isSunset ? "border-border" : "border-orange-200",
      iconBg: isSunset ? "bg-primary/15" : "bg-orange-100",
      iconClass: isSunset ? "text-primary" : "text-orange-500",
      icon: Calendar,
      title: "Planning Templates",
      desc: "Templates for timelines, logistics, and run-of-show clarity",
    },
    {
      border: isSunset ? "border-border" : "border-rose-200",
      iconBg: isSunset ? "bg-primary/15" : "bg-rose-100",
      iconClass: isSunset ? "text-primary" : "text-rose-500",
      icon: Users,
      title: "Management Tools",
      desc: "Contact lists, RSVPs, and stakeholder coordination",
    },
    {
      border: isSunset ? "border-border" : "border-amber-200",
      iconBg: isSunset ? "bg-primary/15" : "bg-amber-100",
      iconClass: isSunset ? "text-primary" : "text-amber-500",
      icon: MessageSquare,
      title: "Communication Guides",
      desc: "Channel strategy when tone and timing matter",
    },
    {
      border: isSunset ? "border-border" : "border-green-200",
      iconBg: isSunset ? "bg-primary/15" : "bg-green-100",
      iconClass: isSunset ? "text-primary" : "text-green-500",
      icon: Shield,
      title: "Risk Management",
      desc: "Contingencies, safety, and operational readiness",
    },
  ] as const

  const newsletterSection = isSunset
    ? "border-y border-border bg-card/80 py-12 sm:py-16 text-foreground"
    : "bg-gradient-to-r from-orange-500 to-rose-500 py-12 sm:py-16 text-white"

  const newsletterInput = isSunset
    ? "flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
    : "flex-1 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"

  const newsletterBtn = isSunset
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "bg-white text-orange-500 hover:bg-gray-100"

  return (
    <div className={pageShell}>
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex justify-center">
            <div className={heroIconWrap}>
              <BookOpen className={heroIconClass} />
            </div>
          </div>
          <h1 className={h1Class}>
            {isSunset ? "Remembrance & gathering resources" : "Event Planning Resources"}
          </h1>
          <p className={`mb-6 px-2 text-lg leading-relaxed sm:mb-8 sm:text-xl md:text-2xl ${subtext}`}>
            {isSunset
              ? `Free templates, guides, and checklists for dignified coordination. Curated for ${productLabel}; operated by Sunrise Sunset Services alongside Sunrise.`
              : "Free templates, guides, checklists, and tools to help you plan perfect events. Download professional resources created for Sunrise organisers."}
          </p>
          <p className={`mb-6 text-sm ${subtext}`}>
            <strong className={isSunset ? "text-foreground" : "text-gray-800"}>Sunrise Sunset Services</strong>{" "}
            operates both {productName} and {isSunset ? "Sunrise" : "Sunset"} with one account model.
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {categories.slice(1, 8).map((category) => (
              <Badge
                key={category.name}
                variant="outline"
                className={
                  isSunset
                    ? "border-border bg-card/80 text-muted-foreground backdrop-blur-sm"
                    : "bg-white/50 backdrop-blur-sm"
                }
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className={`mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl ${sectionTitle}`}>
          Featured Resources
        </h2>
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {resources
            .filter((resource) => resource.featured)
            .map((resource) => (
              <Card key={resource.id} className={featuredCard}>
                <CardHeader className="pb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className={featuredBadge}>{resource.category}</Badge>
                    <div className={`flex items-center gap-2 text-sm ${metaText}`}>
                      <FileText className="h-4 w-4" />
                      <span>{resource.fileSize}</span>
                    </div>
                  </div>
                  <CardTitle className={`text-xl font-bold leading-tight sm:text-2xl ${cardTitle}`}>
                    {resource.title}
                  </CardTitle>
                  <p className={`leading-relaxed ${bodyText}`}>{resource.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${metaText}`}>
                      <span>{resource.pages} pages</span>
                    </div>
                    <Button
                      className={
                        isSunset
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Free
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className={`mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl ${sectionTitle}`}>All Resources</h2>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className={gridCard}>
              <CardHeader className="pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                  <div className={`flex items-center gap-2 text-xs ${metaText}`}>
                    <FileText className="h-3 w-3" />
                    <span>{resource.fileSize}</span>
                  </div>
                </div>
                <CardTitle className={`text-lg font-semibold leading-tight ${cardTitle}`}>{resource.title}</CardTitle>
                <p className={`text-sm leading-relaxed ${bodyText}`}>{resource.description}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-xs ${metaText}`}>
                    <span>{resource.pages} pages</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      isSunset ? "w-full border-border text-foreground hover:bg-accent" : "w-full"
                    }
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className={isSunset ? "bg-card/50 py-12 sm:py-16" : "bg-white py-12 sm:py-16"}>
        <div className="container mx-auto px-4">
          <h2 className={`mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl ${sectionTitle}`}>
            Resource Categories
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categoryCards.map((c) => (
              <Card key={c.title} className={`text-center transition-shadow hover:shadow-lg ${c.border}`}>
                <CardContent className="p-6">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${c.iconBg}`}>
                    <c.icon className={`h-6 w-6 ${c.iconClass}`} />
                  </div>
                  <h3 className={`mb-2 font-semibold ${cardTitle}`}>{c.title}</h3>
                  <p className={`text-sm ${bodyText}`}>{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className={`mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl ${sectionTitle}`}>
          How to Use These Resources
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {(
            [
              {
                n: "1",
                wrap: isSunset ? "border border-primary/35 bg-primary/10" : "bg-orange-100",
                num: isSunset ? "text-primary" : "text-orange-600",
                title: "Download & Customize",
                body: "Download any resource and adapt it to your gathering, service, or celebration.",
              },
              {
                n: "2",
                wrap: isSunset ? "border border-primary/35 bg-primary/10" : "bg-rose-100",
                num: isSunset ? "text-primary" : "text-rose-600",
                title: "Follow the Guidelines",
                body: "Use checklists so timing, channels, and stakeholders stay clear.",
              },
              {
                n: "3",
                wrap: isSunset ? "border border-primary/35 bg-primary/10" : "bg-amber-100",
                num: isSunset ? "text-primary" : "text-amber-600",
                title: `Use with ${productName}`,
                body: `Pair downloads with ${productLabel} for lists, sends, and scheduling under Sunrise Sunset Services.`,
              },
            ] as const
          ).map((step) => (
            <div key={step.n} className="text-center">
              <div
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${step.wrap}`}
              >
                <span className={`text-xl font-bold ${step.num}`}>{step.n}</span>
              </div>
              <h3 className={`mb-4 text-lg font-semibold ${cardTitle}`}>{step.title}</h3>
              <p className={bodyText}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={newsletterSection}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl">Get New Resources First</h2>
          <p className={`mx-auto mb-6 max-w-2xl text-lg sm:mb-8 sm:text-xl ${isSunset ? "text-muted-foreground" : "opacity-90"}`}>
            Be the first to know when we release new templates and guides from Sunrise Sunset Services.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
            <input type="email" placeholder="Enter your email address" className={newsletterInput} />
            <Button size="lg" variant="secondary" className={newsletterBtn}>
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className={`mb-4 text-2xl font-bold sm:mb-6 sm:text-3xl ${sectionTitle}`}>
            {isSunset ? "Ready to coordinate with care?" : "Ready to Start Planning Your Event?"}
          </h2>
          <p className={`mb-6 text-lg sm:mb-8 sm:text-xl ${bodyText}`}>
            {isSunset
              ? `Use these resources with ${productLabel}, then send updates with confidence. One operator: Sunrise Sunset Services.`
              : `Download these resources and plan with ${productLabel}, operated by Sunrise Sunset Services.`}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className={
                  isSunset
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                }
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className={
                  isSunset
                    ? "border-border text-foreground hover:bg-accent"
                    : "border-orange-500 text-orange-500 hover:bg-orange-50"
                }
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
