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
import {
  Users,
  Calendar,
  Mail,
  DollarSign,
  UserCheck,
  MessageSquare,
  CreditCard,
  Clock,
} from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string | null
  subscription_plan: string
  token_balance: number
  created_at: string
  last_sign_in_at: string | null
  is_active: boolean
  contacts_count: number
  events_count: number
  emails_sent: number
  total_spent: number
}

interface Stats {
  totalUsers: number
  activeUsers: number
  totalEvents: number
  totalContacts: number
  totalEmailsSent: number
  totalRevenue: number
  averageRevenuePerUser: number
  eventsByStatus: {
    draft: number
    scheduled: number
    sending: number
    sent: number
    failed: number
    partial: number
    cancelled: number
  }
  emailsByStatus: {
    sent: number
    failed: number
    opened: number
  }
  subscriptionsByPlan: {
    free: number
    basic: number
    pro: number
    enterprise: number
  }
  recentTransactions: Array<{
    id: string
    user_id: string
    type: string
    amount: number
    status: string
    created_at: string
  }>
}

export default function AdminPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        router.push("/dashboard")
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userEmail = session?.user?.email
        const isUserAdmin = userEmail === "arwindpianist@gmail.com"
        setIsAdmin(isUserAdmin)

        if (!isUserAdmin) {
          router.push("/dashboard")
          return
        }

        await fetchData()
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
        router.push("/dashboard")
      }
    }

    checkAdminStatus()
  }, [user, router, supabase])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch users with their related data
      const { data: usersData, error: usersError } = await supabase
        .from("auth.users")
        .select(`
          id,
          email,
          created_at,
          last_sign_in_at,
          users!inner (
            full_name,
            subscription_plan,
            token_balance
          ),
          profiles (
            first_name,
            last_name
          ),
          contacts (
            id
          ),
          events (
            id
          ),
          event_contacts (
            status
          ),
          transactions (
            amount,
            status
          )
        `)
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      // Process users data
      const processedUsers = usersData.map((user: any) => {
        const emailsSent = user.event_contacts?.filter((ec: any) => 
          ec.status === "sent" || ec.status === "opened"
        ).length || 0
        const totalSpent = user.transactions?.reduce((sum: number, t: any) => 
          t.status === "completed" ? sum + t.amount : sum, 0
        ) || 0

        return {
          id: user.id,
          email: user.email,
          full_name: user.profiles?.[0]?.first_name && user.profiles?.[0]?.last_name ? 
            `${user.profiles[0].first_name} ${user.profiles[0].last_name}` : 
            user.users?.[0]?.full_name || null,
          subscription_plan: user.users?.[0]?.subscription_plan || "free",
          token_balance: user.users?.[0]?.token_balance || 0,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          is_active: user.last_sign_in_at ? 
            new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
            false,
          contacts_count: user.contacts?.length || 0,
          events_count: user.events?.length || 0,
          emails_sent: emailsSent,
          total_spent: totalSpent
        }
      })

      setUsers(processedUsers)

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
    if (!user) return false

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (user.email?.toLowerCase().includes(searchLower) ?? false) ||
      (user.full_name?.toLowerCase().includes(searchLower) ?? false)
    
    const matchesPlan = planFilter === "all" || user.subscription_plan === planFilter

    return matchesSearch && matchesPlan
  })

  if (!isAdmin || loading) {
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
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">Events: {stats?.totalEvents || 0}</p>
              <p className="text-sm">Contacts: {stats?.totalContacts || 0}</p>
              <p className="text-sm">Emails: {stats?.totalEmailsSent || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats?.subscriptionsByPlan && Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
                <p key={plan} className="text-sm capitalize">
                  {plan}: {count}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Event Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {stats?.eventsByStatus && Object.entries(stats.eventsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="capitalize">{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {stats?.emailsByStatus && Object.entries(stats.emailsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="capitalize">{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <div className="grid grid-cols-8 gap-4 p-4 font-medium border-b">
              <div>Name</div>
              <div>Email</div>
              <div>Plan</div>
              <div>Balance</div>
              <div>Contacts</div>
              <div>Events</div>
              <div>Status</div>
              <div>Joined</div>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-8 gap-4 p-4 border-b last:border-0">
                <div>{user.full_name || "N/A"}</div>
                <div>{user.email}</div>
                <div className="capitalize">{user.subscription_plan}</div>
                <div>{user.token_balance} tokens</div>
                <div>{user.contacts_count}</div>
                <div>{user.events_count}</div>
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

      {/* Recent Transactions */}
      {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                <div>User</div>
                <div>Type</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Date</div>
              </div>
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0">
                  <div>{users.find(u => u.id === transaction.user_id)?.email || "Unknown"}</div>
                  <div className="capitalize">{transaction.type}</div>
                  <div>${(transaction.amount / 100).toFixed(2)}</div>
                  <div>
                    <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </div>
                  <div>{format(new Date(transaction.created_at), "MMM d, yyyy")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 