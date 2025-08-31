import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, MessageSquare, Shield, Heart, Star, ArrowRight, BookOpen, Lightbulb, Zap, Globe, Award, Target, Users2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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

  const teamMembers = [
    {
      name: "Arwin Kumar",
      role: "Founder & CEO",
      company: "Arwindpianist Multimedia & Consulting",
      bio: "Founder and owner of Arwindpianist Multimedia & Consulting (arwindpianist.store). Personally developed, designed, and architected the entire Sunrise-2025 platform, bringing comprehensive business solutions to life.",
      expertise: ["Full-Stack Development", "Product Design", "Business Strategy", "Multimedia Consulting"]
    },
    {
      name: "Sunrise Sunset Group",
      role: "Financial Partners & Sales Support",
      company: "Sunrise Sunset Group",
      bio: "Strategic financial partners who provide investment support and actively help drive sales and market expansion for the Sunrise-2025 platform.",
      expertise: ["Financial Investment", "Sales & Marketing", "Market Expansion", "Business Development"]
    }
  ]

  const milestones = [
    {
      year: "2025",
      title: "Platform Launch",
      description: "Successfully launched Sunrise-2025 on September 1st with core event management features and multi-channel communication capabilities."
    },
    {
      year: "2025",
      title: "Development Phase",
      description: "Built the foundation with modern technologies including Next.js, Supabase, and TypeScript for a robust platform."
    },
    {
      year: "2025",
      title: "Concept Development",
      description: "Started the Sunrise idea at the beginning of 2025, identifying the need for a comprehensive event management solution."
    }
  ]

  const values = [
    {
      icon: Heart,
      title: "User-Centric Design",
      description: "Every feature we build is designed with our users in mind. We prioritize ease of use, accessibility, and meaningful experiences."
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "We take data security seriously. Your information is protected with enterprise-grade security measures and privacy controls."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously innovate to provide cutting-edge solutions that make event planning easier and more enjoyable."
    },
    {
      icon: Users2,
      title: "Community",
      description: "We believe in building a community of event planners who support and inspire each other to create amazing experiences."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
            About <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Sunrise-2025</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Created by Arwin Kumar, founder of Arwindpianist Multimedia & Consulting, we're on a mission to make celebrating life's beautiful moments easier, more organized, and more joyful. 
            From intimate gatherings to grand celebrations, Sunrise-2025 is your trusted companion for creating unforgettable experiences.
          </p>
        </div>

        {/* Company Information */}
        <Card className="mb-12 sm:mb-16 border-orange-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">About Arwindpianist Multimedia & Consulting</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  Sunrise-2025 is a product of Arwindpianist Multimedia & Consulting, a company founded and owned by Arwin Kumar. 
                  Our company specializes in multimedia consulting, technology innovation, and business strategy.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  With expertise in creating innovative digital solutions, we've developed Sunrise-2025 to address the real-world 
                  challenges faced by event organizers and planners.
                </p>
                <div className="mt-4">
                  <a href="https://arwindpianist.store" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-rose-600 transition-colors">
                    Visit Our Company
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg p-4 sm:p-6 text-center">
                <Globe className="h-12 w-12 sm:h-16 sm:w-16 text-orange-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Multimedia & Consulting</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Specializing in innovative digital solutions and business consulting services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partnership Section */}
        <Card className="mb-12 sm:mb-16 border-blue-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Strategic Partnership</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Arwindpianist Multimedia & Consulting</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Founded and owned by Arwin Kumar, our company handles 100% of the development, design, and business solutions. 
                  We provide complete technical expertise, product architecture, and comprehensive business strategy.
                </p>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Our Complete Contribution:</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Full-Stack Development</li>
                    <li>• Product Design & UX</li>
                    <li>• Business Strategy & Vision</li>
                    <li>• Technical Architecture</li>
                    <li>• Multimedia Consulting</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Sunrise Sunset Group</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Strategic financial partners who provide investment support and actively help drive sales and market expansion. 
                  They contribute to business growth and market reach.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Their Contribution:</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Financial Investment</li>
                    <li>• Sales & Marketing Support</li>
                    <li>• Market Expansion</li>
                    <li>• Business Development</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-700 font-medium">
                This strategic partnership combines complete technical development with financial support and sales expertise 
                to create and grow the most comprehensive event planning platform available.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mission Statement */}
        <Card className="mb-12 sm:mb-16 border-rose-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Our Mission</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <p className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                  In a world where connections matter more than ever, we believe that organizing and sharing life's special moments 
                  should be effortless and beautiful. Whether it's a wedding, birthday, festival, or any celebration, 
                  we want to help you focus on what truly matters - creating memories with the people you love.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Our platform combines powerful technology with intuitive design to give you everything you need 
                  to manage your events, organize your contacts, and communicate with your guests seamlessly.
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-lg p-4 sm:p-6 text-center">
                <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-orange-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Celebrating Connections</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Every feature we build is designed to strengthen the bonds between people and make celebrations more meaningful.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Story */}
        <Card className="mb-12 sm:mb-16 border-amber-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Our Story</h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">The Beginning</h3>
                                 <p className="text-gray-600 leading-relaxed mb-4">
                   Sunrise-2025 was born from a simple observation: event planning, while rewarding, was often overwhelming and fragmented. 
                   Our founder, Arwin Kumar, experienced this firsthand while working with clients through Arwindpianist Multimedia & Consulting.
                 </p>
                 <p className="text-gray-600 leading-relaxed">
                   He noticed that existing solutions were either too complex, too expensive, or too limited in scope. 
                   There had to be a better way to bring people together and create meaningful celebrations.
                 </p>
                 <p className="text-gray-600 leading-relaxed">
                   This led to a strategic partnership with the Sunrise Sunset Group, where Arwin personally developed, designed, and architected 
                   the entire platform, while the group provides financial support and helps drive sales and market expansion.
                 </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">The Solution</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We set out to create a platform that would simplify event planning while maintaining the personal touch that makes 
                  celebrations special. Our goal was to build something that would work for everyone - from intimate family gatherings 
                  to large corporate events.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Today, Sunrise-2025 serves event organizers worldwide, helping them create unforgettable experiences 
                  while saving time and reducing stress.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card className="mb-12 sm:mb-16 border-green-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Meet Our Team</h2>
            <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
              Our team combines complete technical development from Arwindpianist Multimedia & Consulting with financial support and sales expertise from the Sunrise Sunset Group, 
              creating a powerful partnership that brings the ultimate event planning platform to market.
            </p>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-orange-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{member.name}</h3>
                  <p className="text-orange-600 font-medium mb-3">{member.role}</p>
                  <p className="text-blue-600 text-sm font-medium mb-2">{member.company}</p>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
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

        {/* Values Section */}
        <Card className="mb-12 sm:mb-16 border-green-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Our Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value, index) => {
                const IconComponent = value.icon
                return (
                  <div key={index} className="text-center">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="mb-12 sm:mb-16 border-purple-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Our Journey</h2>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="font-bold text-xl">{milestone.year}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{milestone.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{milestone.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 sm:mb-12 text-center">What Makes Us Special</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="bg-gradient-to-r from-orange-100 to-rose-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3 sm:mb-4">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-12 sm:mb-16 border-rose-200">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Built with Modern Technology</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                  <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Next.js 14</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Modern React framework with App Router</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Supabase</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Backend-as-a-Service with real-time features</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                  <h4 className="font-semibold text-purple-800 text-sm sm:text-base">TypeScript</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Type-safe development for reliability</p>
              </div>
              <div className="text-center">
                <div className="bg-cyan-100 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                  <h4 className="font-semibold text-cyan-800 text-sm sm:text-base">Tailwind CSS</h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">Utility-first CSS for beautiful designs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Ready to Start Creating Beautiful Moments?</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of event organizers who trust Sunrise-2025 to make their celebrations unforgettable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 w-full sm:w-auto">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 