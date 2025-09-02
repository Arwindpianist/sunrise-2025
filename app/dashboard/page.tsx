"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Mail, Coins, Clock, CheckCircle, Plus, Eye, UserPlus, Crown, Settings, AlertTriangle } from "lucide-react"
import SubscriptionStatus from "@/components/subscription-status"
import FeatureAvailability from "@/components/feature-availability"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalContacts: 0,
    totalEmails: 0,
    balance: 0,
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchStats()
      fetchRecentEvents()
      fetchUserProfile()
    }
  }, [user, router])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch total events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch total contacts
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch total emails sent
      const { count: emailsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('type', 'usage')
        .eq('status', 'completed')

      // Fetch user balance
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      setStats({
        totalEvents: eventsCount || 0,
        totalContacts: contactsCount || 0,
        totalEmails: emailsCount || 0,
        balance: balanceData?.balance || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentEvents(data || [])
    } catch (error) {
      console.error('Error fetching recent events:', error)
    }
  }

  if (!user || !mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Good {getGreeting()}, {userProfile?.full_name || 'there'} 🌅
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Welcome back to your dashboard. Here's an overview of your events and activities.
                  </p>
                </div>
                <Link href="/dashboard/referrals" className="w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Refer Friends
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Most Important */}
        <div className="mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 h-12 sm:h-14 text-sm sm:text-base font-semibold"
                  onClick={() => router.push('/dashboard/events/create')}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Create Event
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 h-12 sm:h-14 text-sm sm:text-base font-semibold"
                  onClick={() => router.push('/dashboard/contacts')}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Manage Contacts
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 h-12 sm:h-14 text-sm sm:text-base font-semibold"
                  onClick={() => router.push('/dashboard/balance')}
                >
                  <Coins className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  View Balance
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 h-12 sm:h-14 text-sm sm:text-base font-semibold"
                  onClick={() => router.push('/dashboard/events')}
                >
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  All Events
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-12 sm:h-14 text-sm sm:text-base font-semibold shadow-lg"
                  onClick={() => router.push('/dashboard/sos')}
                >
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Emergency SOS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview - Second Priority */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card 
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => router.push('/dashboard/events')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalEvents}
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Total Events</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => router.push('/dashboard/contacts')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalContacts}
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Total Contacts</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => router.push('/dashboard/messages')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalEmails}
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Messages Sent</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={() => router.push('/dashboard/balance')}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.balance}
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Token Balance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3 mb-6 sm:mb-8">
          {/* Recent Events */}
          <Card className="bg-white/50 backdrop-blur-sm shadow-lg lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                  Recent Events
                </CardTitle>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-sm sm:text-base"
                  onClick={() => router.push('/dashboard/events/create')}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                  New Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex justify-between items-center p-3 sm:p-4 bg-white/50 rounded-lg backdrop-blur-sm hover:bg-white/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate text-sm sm:text-base">{event.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                        {event.status}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 ml-2 text-xs sm:text-sm"
                      onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">No events yet</p>
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-sm sm:text-base"
                      onClick={() => router.push('/dashboard/events/create')}
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Create Your First Event
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status - Information */}
          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionStatus />
            </CardContent>
          </Card>
        </div>

        {/* Feature Availability - Information */}
        <div className="mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                Feature Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeatureAvailability />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}
