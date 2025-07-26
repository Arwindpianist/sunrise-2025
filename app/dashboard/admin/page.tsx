'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Eye,
  Mail
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  totalMessages: number
  totalEvents: number
  totalContacts: number
  totalTokensPurchased: number
}

interface UserEnquiry {
  id: string
  user_id: string
  user_email: string
  user_name: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  updated_at: string
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'subscription' | 'message_sent' | 'event_created'
  user_email: string
  description: string
  created_at: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [enquiries, setEnquiries] = useState<UserEnquiry[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('subscription_plan')
        .eq('id', session.user.id)
        .single()

      if (error || userProfile?.subscription_plan !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(session.user)
      fetchAdminData()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    }
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchStats(),
        fetchEnquiries(),
        fetchRecentActivity()
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchEnquiries = async () => {
    try {
      const response = await fetch('/api/admin/enquiries')
      if (response.ok) {
        const data = await response.json()
        setEnquiries(data)
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity')
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAdminData()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Site analytics and user management</p>
          </div>
          <Button onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.monthlyRecurringRevenue)} MRR
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all channels
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events Created</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalContacts.toLocaleString()} total contacts
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="enquiries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enquiries">User Enquiries</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  User Enquiries & Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enquiries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No enquiries at the moment</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enquiries.map((enquiry) => (
                        <TableRow key={enquiry.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{enquiry.user_name}</div>
                              <div className="text-sm text-gray-500">{enquiry.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">{enquiry.subject}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                enquiry.status === 'open' ? 'destructive' :
                                enquiry.status === 'in_progress' ? 'secondary' : 'default'
                              }
                            >
                              {enquiry.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(enquiry.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`View enquiry: ${enquiry.subject}`)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  alert(`Reply to: ${enquiry.user_email}`)
                                }}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'user_signup' && <Users className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'subscription' && <DollarSign className="h-5 w-5 text-green-600" />}
                          {activity.type === 'message_sent' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                          {activity.type === 'event_created' && <Calendar className="h-5 w-5 text-orange-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-gray-500">{activity.user_email}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Free</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Basic</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pro</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Enterprise</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Channel Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Email</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Telegram</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>WhatsApp</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SMS</span>
                      <Badge variant="secondary">Coming soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 