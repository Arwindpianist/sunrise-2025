"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  full_name: string | null
  subscription_plan: string
  token_balance: number
  created_at: string
  last_sign_in_at: string | null
  is_active: boolean
}

interface Stats {
  totalUsers: number
  activeUsers: number
  totalEvents: number
  totalContacts: number
  totalEmailsSent: number
  totalRevenue: number
  averageRevenuePerUser: number
}

export default function AdminPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.email !== "arwindpianist@gmail.com") {
      router.push("/dashboard")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError

      // Fetch auth users to get last sign in
      const { data: authUsers, error: authError } = await supabase
        .from("auth_users")
        .select("id, last_sign_in_at")

      if (authError) throw authError

      // Combine profile and auth data
      const combinedUsers = profiles.map((profile: any) => {
        const authUser = authUsers.find((au: any) => au.id === profile.id)
        return {
          ...profile,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          is_active: authUser?.last_sign_in_at ? 
            new Date(authUser.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
            false
        }
      })

      setUsers(combinedUsers)

      // Fetch statistics
      const { data: statsData, error: statsError } = await supabase
        .rpc("get_admin_stats")

      if (statsError) throw statsError
      setStats(statsData)

    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch admin data")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesPlan = planFilter === "all" || user.subscription_plan === planFilter

    return matchesSearch && matchesPlan
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Admin
        </Badge>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active in last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">Events: {stats?.totalEvents || 0}</p>
              <p className="text-sm">Contacts: {stats?.totalContacts || 0}</p>
              <p className="text-sm">Emails Sent: {stats?.totalEmailsSent || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalRevenue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(stats?.averageRevenuePerUser || 0).toFixed(2)} per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
              <div>Name</div>
              <div>Email</div>
              <div>Plan</div>
              <div>Balance</div>
              <div>Status</div>
              <div>Joined</div>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-0">
                <div>{user.full_name || "N/A"}</div>
                <div>{user.email}</div>
                <div className="capitalize">{user.subscription_plan}</div>
                <div>{user.token_balance} tokens</div>
                <div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>{format(new Date(user.created_at), "MMM d, yyyy")}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 