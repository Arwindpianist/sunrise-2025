"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Mail, Coins, Clock, CheckCircle } from "lucide-react"

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
        .from('profiles')
        .select('first_name, last_name')
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm border-none">
            <CardContent className="pt-4 sm:pt-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Good {getGreeting()}, {userProfile?.first_name || 'there'} {userProfile?.last_name || ''} 🌅
              </h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                Welcome back to your dashboard. Here's an overview of your events and activities.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-4">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalEvents}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orange-500" />
                Total Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalContacts}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-orange-500" />
                Emails Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalEmails}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-orange-500" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                RM{(stats.balance * 0.05).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">{stats.balance} credits</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-8 mt-6 sm:mt-8 grid-cols-1 md:grid-cols-2">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex justify-between items-center p-4 bg-white/50 rounded-lg backdrop-blur-sm"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No events yet. Create your first event to get started!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                  onClick={() => router.push('/dashboard/events/create')}
                >
                  Create New Event
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                  onClick={() => router.push('/dashboard/contacts')}
                >
                  Manage Contacts
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                  onClick={() => router.push('/dashboard/balance')}
                >
                  View Balance
                </Button>
              </div>
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
