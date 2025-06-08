"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Coins, Plus, Clock, MessageSquare, TrendingUp, DollarSign, CheckSquare } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { format } from "date-fns"

interface DashboardSummary {
  user: {
    id: string
    email: string
    full_name: string
    created_at: string
  }
  stats: {
    events: number
    contacts: number
  }
}

interface RecentActivity {
  id: string
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'contact_added'
  title: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchSummary()
    fetchRecentActivity()
  }, [user, router])

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/dashboard/summary")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch dashboard data")
      }
      const data = await response.json()
      setSummary(data)
    } catch (error: any) {
      console.error("Dashboard fetch error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/dashboard/activity")
      if (!response.ok) {
        throw new Error("Failed to fetch recent activity")
      }
      const data = await response.json()
      setRecentActivity(data)
    } catch (error: any) {
      console.error("Activity fetch error:", error)
    }
  }

  const handleCreateEvent = () => {
    router.push("/dashboard/events/create")
  }

  if (!user) {
    return null
  }

  const displayName = summary?.user.full_name || user.email?.split('@')[0] || 'User'

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return 'N/A'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {displayName}! 🌅
            </h1>
            <p className="text-gray-600">Here's what's happening with your events</p>
          </div>
          <Button 
            onClick={handleCreateEvent}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 mt-4 md:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/contacts')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contacts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.stats.contacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Manage your contacts
              </p>
            </CardContent>
          </Card>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/events')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.stats.events || 0}</div>
              <p className="text-xs text-muted-foreground">
                View your events
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(summary?.stats.events || 0) * 100}.00</div>
              <p className="text-xs text-muted-foreground">
                Track your expenses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasks
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.stats.events || 0}</div>
              <p className="text-xs text-muted-foreground">
                Manage your tasks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(activity.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
