import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Users, MessageSquare, Clock, Star, ArrowRight, BookOpen, Lightbulb, Heart, Zap, Shield, TrendingUp } from "lucide-react"
import Link from "next/link"

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
    description: "A comprehensive 12-month checklist covering every aspect of event planning, from initial concept to post-event follow-up. Perfect for weddings, corporate events, and celebrations.",
    category: "Planning",
    type: "checklist",
    tags: ["Planning", "Checklist", "Timeline"],
    featured: true,
    fileSize: "2.1 MB",
    pages: 15
  },
  {
    id: "wedding-planning-template",
    title: "Wedding Planning Template & Timeline",
    description: "Detailed wedding planning template with customizable timeline, vendor contact sheets, budget tracker, and guest list management tools.",
    category: "Wedding",
    type: "template",
    tags: ["Wedding", "Template", "Timeline"],
    featured: true,
    fileSize: "3.5 MB",
    pages: 25
  },
  {
    id: "corporate-event-guide",
    title: "Corporate Event Planning Guide",
    description: "Professional guide for planning corporate events, conferences, and business meetings. Includes ROI tracking, vendor management, and attendee engagement strategies.",
    category: "Corporate",
    type: "guide",
    tags: ["Corporate", "Business", "Professional"],
    fileSize: "4.2 MB",
    pages: 32
  },
  {
    id: "contact-management-template",
    title: "Contact Management Spreadsheet",
    description: "Excel template for organizing contacts, tracking RSVPs, and managing guest lists. Includes categorization, communication history, and follow-up tracking.",
    category: "Management",
    type: "template",
    tags: ["Contacts", "Spreadsheet", "Organization"],
    fileSize: "1.8 MB",
    pages: 8
  },
  {
    id: "communication-strategy-guide",
    title: "Multi-Channel Communication Strategy Guide",
    description: "Comprehensive guide to creating effective communication strategies across email, SMS, social media, and messaging platforms.",
    category: "Communication",
    type: "guide",
    tags: ["Communication", "Strategy", "Multi-Channel"],
    fileSize: "2.8 MB",
    pages: 18
  },
  {
    id: "budget-tracker-template",
    title: "Event Budget Tracker",
    description: "Excel-based budget tracking template with automatic calculations, expense categories, and variance analysis for accurate financial management.",
    category: "Finance",
    type: "template",
    tags: ["Budget", "Finance", "Tracking"],
    fileSize: "1.5 MB",
    pages: 12
  },
  {
    id: "vendor-management-checklist",
    title: "Vendor Management Checklist",
    description: "Essential checklist for selecting, contracting, and managing vendors. Includes evaluation criteria, contract templates, and communication protocols.",
    category: "Vendors",
    type: "checklist",
    tags: ["Vendors", "Management", "Contracts"],
    fileSize: "1.2 MB",
    pages: 10
  },
  {
    id: "event-marketing-guide",
    title: "Event Marketing & Promotion Guide",
    description: "Complete guide to marketing your event effectively. Covers digital marketing, social media strategies, email campaigns, and traditional promotion methods.",
    category: "Marketing",
    type: "guide",
    tags: ["Marketing", "Promotion", "Digital"],
    fileSize: "3.1 MB",
    pages: 22
  },
  {
    id: "risk-management-template",
    title: "Risk Management & Contingency Planning",
    description: "Template for identifying potential risks, creating contingency plans, and establishing emergency procedures for events of all sizes.",
    category: "Risk Management",
    type: "template",
    tags: ["Risk", "Contingency", "Safety"],
    fileSize: "2.3 MB",
    pages: 14
  },
  {
    id: "post-event-evaluation",
    title: "Post-Event Evaluation Template",
    description: "Comprehensive evaluation template for measuring event success, gathering feedback, and planning improvements for future events.",
    category: "Evaluation",
    type: "template",
    tags: ["Evaluation", "Feedback", "Improvement"],
    fileSize: "1.7 MB",
    pages: 9
  },
  {
    id: "seasonal-event-ideas",
    title: "Seasonal Event Ideas & Themes",
    description: "Creative event ideas and themes organized by season. Includes decoration suggestions, activity ideas, and planning tips for each season.",
    category: "Ideas",
    type: "guide",
    tags: ["Ideas", "Themes", "Seasonal"],
    fileSize: "2.9 MB",
    pages: 20
  },
  {
    id: "accessibility-guidelines",
    title: "Event Accessibility Guidelines",
    description: "Comprehensive guidelines for making events accessible to all attendees. Covers physical accessibility, digital accessibility, and inclusive practices.",
    category: "Accessibility",
    type: "guide",
    tags: ["Accessibility", "Inclusion", "Guidelines"],
    fileSize: "2.4 MB",
    pages: 16
  }
]

const categories = [
  { name: "All", count: resources.length },
  { name: "Planning", count: resources.filter(r => r.category === "Planning").length },
  { name: "Wedding", count: resources.filter(r => r.category === "Wedding").length },
  { name: "Corporate", count: resources.filter(r => r.category === "Corporate").length },
  { name: "Management", count: resources.filter(r => r.category === "Management").length },
  { name: "Communication", count: resources.filter(r => r.category === "Communication").length },
  { name: "Finance", count: resources.filter(r => r.category === "Finance").length },
  { name: "Vendors", count: resources.filter(r => r.category === "Vendors").length },
  { name: "Marketing", count: resources.filter(r => r.category === "Marketing").length },
  { name: "Risk Management", count: resources.filter(r => r.category === "Risk Management").length },
  { name: "Evaluation", count: resources.filter(r => r.category === "Evaluation").length },
  { name: "Ideas", count: resources.filter(r => r.category === "Ideas").length },
  { name: "Accessibility", count: resources.filter(r => r.category === "Accessibility").length }
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent leading-tight">
            Event Planning Resources
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
            Free templates, guides, checklists, and tools to help you plan perfect events. 
            Download professional resources created by event planning experts.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.slice(1, 8).map((category) => (
              <Badge key={category.name} variant="outline" className="bg-white/50 backdrop-blur-sm">
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Featured Resources</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {resources.filter(resource => resource.featured).map((resource) => (
            <Card key={resource.id} className="border-orange-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {resource.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    <span>{resource.fileSize}</span>
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                  {resource.title}
                </CardTitle>
                <p className="text-gray-600 leading-relaxed">
                  {resource.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>{resource.pages} pages</span>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                    <Download className="mr-2 h-4 w-4" />
                    Download Free
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Resources */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">All Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {resources.map((resource) => (
            <Card key={resource.id} className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="h-3 w-3" />
                    <span>{resource.fileSize}</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                  {resource.title}
                </CardTitle>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {resource.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span>{resource.pages} pages</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Resource Categories */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Resource Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-semibold mb-2">Planning Templates</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive templates for event planning, timelines, and project management
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-rose-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-rose-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="font-semibold mb-2">Management Tools</h3>
                <p className="text-gray-600 text-sm">
                  Contact management, vendor coordination, and guest list organization tools
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-amber-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-semibold mb-2">Communication Guides</h3>
                <p className="text-gray-600 text-sm">
                  Strategies and templates for effective multi-channel communication
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold mb-2">Risk Management</h3>
                <p className="text-gray-600 text-sm">
                  Templates and guidelines for risk assessment and contingency planning
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Use Resources */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">How to Use These Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-orange-600 font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold mb-4 text-lg">Download & Customize</h3>
            <p className="text-gray-600">
              Download any resource and customize it to fit your specific event needs and preferences.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-rose-600 font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold mb-4 text-lg">Follow the Guidelines</h3>
            <p className="text-gray-600">
              Use the provided guidelines and checklists to ensure you don't miss any important details.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <span className="text-amber-600 font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold mb-4 text-lg">Integrate with Sunrise</h3>
            <p className="text-gray-600">
              Use these resources alongside Sunrise-2025's platform for seamless event management.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Get New Resources First</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
            Be the first to know when we release new templates, guides, and tools. 
            Join our community of event planning professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
            Ready to Start Planning Your Event?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Download these resources and start creating unforgettable events with Sunrise-2025.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
} 