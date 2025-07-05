import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, MessageSquare, Shield, Heart, Star } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const features = [
    {
      icon: Users,
      title: "Smart Contact Management",
      description: "Organize your contacts with flexible categories, import from Google Contacts, vCard files, or CSV. Create custom categories with color coding for perfect organization."
    },
    {
      icon: Calendar,
      title: "Beautiful Event Creation",
      description: "Create stunning events with our intuitive templates. From weddings to birthdays, festivals to corporate events - we have templates for every occasion."
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Communication",
      description: "Reach your guests wherever they are. Send invitations and updates via Email, WhatsApp, Telegram, and SMS with smart scheduling."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security. We use Supabase for secure authentication and data storage with Row Level Security."
    },
    {
      icon: Heart,
      title: "Shareable Contact Forms",
      description: "Let your contacts add themselves to your circle with beautiful, informative forms that explain why you're collecting their information."
    },
    {
      icon: Star,
      title: "Token-Based Pricing",
      description: "Pay only for what you use. Our flexible token system ensures you never pay for unused features."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            About <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Sunrise-2025</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to make celebrating life's beautiful moments easier, more organized, and more joyful. 
            From intimate gatherings to grand celebrations, Sunrise-2025 is your trusted companion for creating unforgettable experiences.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 border-orange-200">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Mission</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                  In a world where connections matter more than ever, we believe that organizing and sharing life's special moments 
                  should be effortless and beautiful. Whether it's a wedding, birthday, festival, or any celebration, 
                  we want to help you focus on what truly matters - creating memories with the people you love.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Our platform combines powerful technology with intuitive design to give you everything you need 
                  to manage your events, organize your contacts, and communicate with your guests seamlessly.
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg p-6 text-center">
                <Heart className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Celebrating Connections</h3>
                <p className="text-gray-600">
                  Every feature we build is designed to strengthen the bonds between people and make celebrations more meaningful.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">What Makes Us Special</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-16 border-rose-200">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Built with Modern Technology</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-4 mb-3">
                  <h4 className="font-semibold text-blue-800">Next.js 14</h4>
                </div>
                <p className="text-sm text-gray-600">Modern React framework with App Router</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-4 mb-3">
                  <h4 className="font-semibold text-green-800">Supabase</h4>
                </div>
                <p className="text-sm text-gray-600">Backend-as-a-Service with real-time features</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-lg p-4 mb-3">
                  <h4 className="font-semibold text-purple-800">TypeScript</h4>
                </div>
                <p className="text-sm text-gray-600">Type-safe development for reliability</p>
              </div>
              <div className="text-center">
                <div className="bg-cyan-100 rounded-lg p-4 mb-3">
                  <h4 className="font-semibold text-cyan-800">Tailwind CSS</h4>
                </div>
                <p className="text-sm text-gray-600">Utility-first CSS for beautiful designs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to Start Creating Beautiful Moments?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust Sunrise-2025 to make their celebrations unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600">
                Get Started Free
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 