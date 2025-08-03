"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, MessageSquare, Clock, Star, ArrowRight, CheckCircle } from "lucide-react"
import LaunchPopup from "@/components/launch-popup"
import { toast } from "@/components/ui/use-toast"

export default function HomePage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle URL parameters for messages
    const message = searchParams.get('message')
    
    if (message === 'account_deleted') {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted. Thank you for using our service.",
        variant: "default",
      })
    }
  }, [searchParams])

  return (
    <div className="bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      {/* Launch Popup */}
      <LaunchPopup />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 bg-clip-text text-transparent leading-tight">
            Celebrate Life's Beautiful Moments
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
            Create joyful invitations and reminders for weddings, birthdays, and festivals. Send scheduled messages
            across email, WhatsApp, Telegram, and SMS.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Create a Sunrise Event
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Simple Steps to Spread Joy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="bg-orange-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Create Event</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Choose your event type and add all the beautiful details that make it special.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border-rose-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="bg-rose-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-rose-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Smart Contact Management</h3>
              <p className="text-gray-600 text-sm sm:text-base">Import from Google, phone files, or create custom categories to organize your circle perfectly.</p>
            </CardContent>
          </Card>

          <Card className="text-center border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="bg-amber-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Schedule Messages</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Send invitations and reminders across multiple channels at the perfect time.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Everything You Need for Perfect Events</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Multi-Channel Messaging</h3>
              <p className="text-xs sm:text-sm text-gray-600">Email, WhatsApp, Telegram & SMS</p>
            </div>

            <div className="text-center">
              <div className="bg-rose-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Smart Scheduling</h3>
              <p className="text-xs sm:text-sm text-gray-600">Automated reminders & follow-ups</p>
            </div>

            <div className="text-center">
              <div className="bg-amber-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Smart Contact Import</h3>
              <p className="text-xs sm:text-sm text-gray-600">Google, vCard, CSV & custom categories</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Beautiful Templates</h3>
              <p className="text-xs sm:text-sm text-gray-600">Pre-designed for every occasion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Loved by Event Organizers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card className="border-orange-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                "Sunrise-2025 made planning my wedding so much easier. The automated reminders were perfect!"
              </p>
              <div className="font-semibold text-sm sm:text-base">Sarah Chen</div>
              <div className="text-xs sm:text-sm text-gray-500">Wedding Planner</div>
            </CardContent>
          </Card>

          <Card className="border-rose-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                "The multi-channel messaging saved me hours. Everyone got their invitations on time!"
              </p>
              <div className="font-semibold text-sm sm:text-base">Ahmad Rahman</div>
              <div className="text-xs sm:text-sm text-gray-500">Event Organizer</div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                "Beautiful templates and easy scheduling. My birthday party was unforgettable!"
              </p>
              <div className="font-semibold text-sm sm:text-base">Priya Sharma</div>
              <div className="text-xs sm:text-sm text-gray-500">Happy Customer</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gradient-to-r from-orange-500 to-rose-500 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">Start Creating Joyful Moments</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90">Choose the perfect plan for your celebration needs</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100 w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-black hover:bg-gradient-to-r hover:from-orange-600 hover:to-rose-600 hover:text-white w-full sm:w-auto"
              >
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
