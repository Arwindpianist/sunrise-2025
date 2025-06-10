"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Users, Mail, Calendar, Coins, Search, Shield, AlertTriangle } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  subscription_plan: string
  token_balance: number
  created_at: string
  last_sign_in: string
}

interface Stats {
  totalUsers: number
  totalEvents: number
  totalContacts: number
  totalEmailsSent: number
  totalRevenue: number
  activeUsers: number
}

export default function AdminPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    totalContacts: 0,
    totalEmailsSent: 0,
    totalRevenue: 0,
    activeUsers: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPlan, setFilterPlan] = useState("all")

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user.email !== "arwindpianist@gmail.com") {
      router.push('/dashboard')
      return
    }

    fetchUsers()
    fetchStats()
  }, [user, router])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get last sign in times from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) throw authError

      const usersWithLastSignIn = data.map(user => ({
        ...user,
        last_sign_in: authUsers.users.find(authUser => authUser.id === user.id)?.last_sign_in_at || 'Never'
      }))

      setUsers(usersWithLastSignIn)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

      // Get total emails sent (completed transactions)
      const { count: totalEmailsSent } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'usage')
        .eq('status', 'completed')

      // Get total revenue (completed purchases)
      const { data: revenueData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'purchase')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, tx) => sum + tx.amount, 0) || 0

      // Get active users (users who signed in within last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: activeUsers } = await supabase.auth.admin.listUsers()
      const activeUsersCount = activeUsers?.users.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
      ).length || 0

      setStats({
        totalUsers: totalUsers || 0,
        totalEvents: totalEvents || 0,
        totalContacts: totalContacts || 0,
        totalEmailsSent: totalEmailsSent || 0,
        totalRevenue,
        activeUsers: activeUsersCount,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesPlan = filterPlan === 'all' || user.subscription_plan === filterPlan
    return matchesSearch && matchesPlan
  })

  if (!user || user.email !== "arwindpianist@gmail.com") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and monitor platform statistics</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-500">Admin Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orange-500" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Users: <span className="font-semibold">{stats.totalUsers}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Active Users (30d): <span className="font-semibold">{stats.activeUsers}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-orange-500" />
                Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Events: <span className="font-semibold">{stats.totalEvents}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Total Contacts: <span className="font-semibold">{stats.totalContacts}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Emails Sent: <span className="font-semibold">{stats.totalEmailsSent}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Coins className="h-5 w-5 text-orange-500" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Revenue: <span className="font-semibold">RM{stats.totalRevenue.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Avg. Revenue/User: <span className="font-semibold">
                    RM{(stats.totalRevenue / (stats.totalUsers || 1)).toFixed(2)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
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

            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{user.subscription_plan}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{user.token_balance} credits</span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(user.last_sign_in).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(user.last_sign_in) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 