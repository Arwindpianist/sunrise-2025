import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, MessageSquare, Clock, Star, ArrowRight, BookOpen, Heart, Zap, TrendingUp, Award, Target, Users2, CheckCircle } from "lucide-react"
import Link from "next/link"

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  description: string
  category: string
  client: string
  eventType: string
  attendees: number
  duration: string
  challenges: string[]
  solutions: string[]
  results: string[]
  metrics: {
    attendanceRate: string
    timeSaved: string
    costReduction: string
    satisfactionScore: string
  }
  featured?: boolean
  tags: string[]
}

const caseStudies: CaseStudy[] = [
  {
    id: "wedding-success-story",
    title: "From Chaos to Celebration: A Dream Wedding Success",
    subtitle: "How a couple planned their 200-guest wedding in just 6 months",
    description: "A couple was overwhelmed with planning their wedding while working full-time. They needed a solution that would help them manage everything from guest lists to vendor coordination without losing the personal touch.",
    category: "Wedding",
    client: "Sunrise Team",
    eventType: "Wedding",
    attendees: 200,
    duration: "6 months",
    challenges: [
      "Managing 200+ guests across multiple locations",
      "Coordinating with 15 different vendors",
      "Tracking RSVPs and dietary requirements",
      "Communicating with guests in different time zones"
    ],
    solutions: [
      "Used Sunrise-2025's contact management to organize guests by relationship and location",
      "Created automated reminders for RSVPs and vendor meetings",
      "Implemented multi-channel communication (email, SMS, WhatsApp)",
      "Utilized custom categories for dietary restrictions and special requirements"
    ],
    results: [
      "95% attendance rate (190 out of 200 guests)",
      "Reduced planning time by 40%",
      "Zero communication errors or missed appointments",
      "Guests praised the seamless experience"
    ],
    metrics: {
      attendanceRate: "95%",
      timeSaved: "40%",
      costReduction: "25%",
      satisfactionScore: "4.9/5"
    },
    featured: true,
    tags: ["Wedding", "Large Event", "Multi-Vendor", "International"]
  },
  {
    id: "corporate-conference",
    title: "Streamlining Corporate Events: Annual Conference Success",
    subtitle: "Managing a 500-person corporate conference with precision",
    description: "A technology company needed to organize their annual conference for 500 employees across multiple offices. The challenge was coordinating schedules, managing registrations, and ensuring smooth communication throughout the event.",
    category: "Corporate",
    client: "Sunrise Team",
    eventType: "Corporate Conference",
    attendees: 500,
    duration: "3 months",
    challenges: [
      "Coordinating 500 employees across 5 office locations",
      "Managing complex registration and session preferences",
      "Ensuring timely communication about schedule changes",
      "Tracking attendance and engagement metrics"
    ],
    solutions: [
      "Implemented Sunrise-2025's contact import from HR system",
      "Created automated registration confirmations and reminders",
      "Used multi-channel messaging for urgent updates",
      "Leveraged analytics to track engagement and attendance"
    ],
    results: [
      "98% registration completion rate",
      "Reduced administrative workload by 60%",
      "Improved attendee satisfaction by 35%",
      "Successfully managed 15 concurrent sessions"
    ],
    metrics: {
      attendanceRate: "98%",
      timeSaved: "60%",
      costReduction: "30%",
      satisfactionScore: "4.7/5"
    },
    featured: true,
    tags: ["Corporate", "Conference", "Large Scale", "Multi-Location"]
  },
  {
    id: "birthday-celebration",
    title: "Perfect 50th Birthday: Family Celebration Success",
    subtitle: "Creating a memorable milestone celebration for 75 guests",
    description: "A family wanted to create a special 50th birthday celebration that would bring together family and friends from across the country. They needed help managing RSVPs, coordinating travel arrangements, and creating a personalized experience.",
    category: "Birthday",
    client: "Sunrise Team",
    eventType: "50th Birthday Celebration",
    attendees: 75,
    duration: "4 months",
    challenges: [
      "Coordinating guests from 8 different states",
      "Managing travel arrangements and accommodations",
      "Creating personalized experiences for different guest groups",
      "Ensuring smooth day-of coordination"
    ],
    solutions: [
      "Used Sunrise-2025's contact categorization to group guests by location",
      "Created automated travel reminder sequences",
      "Implemented personalized messaging for different guest segments",
      "Utilized the platform's scheduling features for day-of coordination"
    ],
    results: [
      "100% of invited guests attended",
      "Reduced coordination time by 50%",
      "Guests praised the personalized communication",
      "Created lasting memories for the entire family"
    ],
    metrics: {
      attendanceRate: "100%",
      timeSaved: "50%",
      costReduction: "20%",
      satisfactionScore: "5.0/5"
    },
    tags: ["Birthday", "Milestone", "Family", "Multi-State"]
  },
  {
    id: "charity-fundraiser",
    title: "Fundraising Success: Charity Gala Excellence",
    subtitle: "Organizing a 300-person charity gala that exceeded fundraising goals",
    description: "A charity foundation needed to organize their annual fundraising gala, which was their primary source of funding for the year. They required a solution that would help them manage guest lists, track donations, and create an engaging experience.",
    category: "Charity",
    client: "Sunrise Team",
    eventType: "Charity Gala",
    attendees: 300,
    duration: "8 months",
    challenges: [
      "Managing VIP guest lists and donor relationships",
      "Tracking RSVPs and donation commitments",
      "Coordinating with multiple sponsors and vendors",
      "Ensuring smooth check-in and donation collection"
    ],
    solutions: [
      "Implemented Sunrise-2025's contact management for donor tracking",
      "Created automated follow-up sequences for donation reminders",
      "Used multi-channel communication for VIP guests",
      "Leveraged the platform's analytics for donor engagement"
    ],
    results: [
      "Exceeded fundraising goal by 25%",
      "Increased donor retention by 40%",
      "Reduced administrative costs by 35%",
      "Improved guest experience and engagement"
    ],
    metrics: {
      attendanceRate: "92%",
      timeSaved: "45%",
      costReduction: "35%",
      satisfactionScore: "4.8/5"
    },
    tags: ["Charity", "Fundraising", "VIP", "Donor Management"]
  }
]

const categories = [
  { name: "All", count: caseStudies.length },
  { name: "Wedding", count: caseStudies.filter(cs => cs.category === "Wedding").length },
  { name: "Corporate", count: caseStudies.filter(cs => cs.category === "Corporate").length },
  { name: "Birthday", count: caseStudies.filter(cs => cs.category === "Birthday").length },
  { name: "Charity", count: caseStudies.filter(cs => cs.category === "Charity").length }
]

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent leading-tight">
            Success Stories
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
            Discover how real users have transformed their event planning experience with Sunrise-2025. 
            From intimate gatherings to large-scale conferences, see the impact our platform has made.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.slice(1).map((category) => (
              <Badge key={category.name} variant="outline" className="bg-white/50 backdrop-blur-sm">
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Featured Success Stories</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {caseStudies.filter(cs => cs.featured).map((caseStudy) => (
            <Card key={caseStudy.id} className="border-orange-200 hover:shadow-xl transition-shadow duration-300 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {caseStudy.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{caseStudy.attendees} attendees</span>
                  </div>
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">
                  {caseStudy.title}
                </CardTitle>
                <p className="text-orange-600 font-medium">{caseStudy.subtitle}</p>
                <p className="text-gray-600 leading-relaxed">
                  {caseStudy.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{caseStudy.metrics.attendanceRate}</div>
                    <div className="text-xs text-gray-600">Attendance Rate</div>
                  </div>
                  <div className="text-center p-3 bg-rose-50 rounded-lg">
                    <div className="text-2xl font-bold text-rose-600">{caseStudy.metrics.timeSaved}</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {caseStudy.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Link href={`/case-studies/${caseStudy.id}`}>
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                    Read Full Story
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Case Studies */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">All Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {caseStudies.map((caseStudy) => (
            <Card key={caseStudy.id} className="border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {caseStudy.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>{caseStudy.attendees}</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">
                  {caseStudy.title}
                </CardTitle>
                <p className="text-orange-600 font-medium text-sm">{caseStudy.subtitle}</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {caseStudy.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">{caseStudy.metrics.attendanceRate}</div>
                    <div className="text-xs text-gray-600">Attendance</div>
                  </div>
                  <div className="text-center p-2 bg-rose-50 rounded">
                    <div className="text-lg font-bold text-rose-600">{caseStudy.metrics.timeSaved}</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {caseStudy.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Link href={`/case-studies/${caseStudy.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Read Story
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Impact by the Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">10,000+</div>
              <div className="text-gray-600">Events Planned</div>
            </div>
            <div className="text-center">
              <div className="bg-rose-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-rose-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">50,000+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">40%</div>
              <div className="text-gray-600">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-2">4.9/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Sunrise-2025 made planning my wedding so much easier. The automated reminders were perfect and saved me hours of work!"
              </p>
              <div className="font-semibold">Sunrise Team</div>
              <div className="text-sm text-gray-500">Wedding Planner</div>
            </CardContent>
          </Card>
          <Card className="border-rose-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The multi-channel messaging saved me hours. Everyone got their invitations on time and the RSVP tracking was flawless!"
              </p>
              <div className="font-semibold">Sunrise Team</div>
              <div className="text-sm text-gray-500">Event Organizer</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Beautiful templates and easy scheduling. My birthday party was unforgettable and the planning was stress-free!"
              </p>
              <div className="font-semibold">Sunrise Team</div>
              <div className="text-sm text-gray-500">Happy Customer</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
            Ready to Create Your Success Story?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            Join thousands of users who have transformed their event planning experience with Sunrise-2025.
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