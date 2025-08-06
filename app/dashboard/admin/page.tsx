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
  Mail,
  Filter,
  Search,
  X,
  BarChart3,
  LineChart,
  PieChart,
  Coins
} from 'lucide-react'
import { 
  LineChart as RechartsLineChart, 
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  subscriptionRevenue: number
  tokenRevenue: number
  totalSubscriptions: number
  totalMessages: number
  totalEvents: number
  totalContacts: number
  totalTokensPurchased: number
  userGrowthData: Array<{ date: string; users: number }>
  revenueData: Array<{ date: string; revenue: number }>
  subscriptionData: Array<{ tier: string; count: number }>
  messageData: Array<{ date: string; emails: number; telegram: number }>
}

interface UserEnquiry {
    id: string
    user_id: string
  user_email: string
  user_name: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'general' | 'billing' | 'technical' | 'feature_request' | 'bug_report'
  admin_notes?: string
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
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<UserEnquiry | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  })
  const [chartTimeRange, setChartTimeRange] = useState('30d') // 7d, 30d, 90d
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
        fetchRecentActivity(),
        fetchSubscriptionAnalytics()
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

  const fetchSubscriptionAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/subscription-analytics')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching subscription analytics:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchAdminData()
    setRefreshing(false)
  }

  const updateEnquiryStatus = async (enquiryId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh enquiries
        fetchEnquiries()
      }
    } catch (error) {
      console.error('Error updating enquiry status:', error)
    }
  }

  const sendEmailToUser = async () => {
    if (!selectedEnquiry || !emailMessage.trim()) return

    try {
      setSendingEmail(true)
      const response = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: emailSubject || `Re: ${selectedEnquiry.subject}`,
          message: emailMessage
        })
      })

      if (response.ok) {
        setShowEmailModal(false)
        setEmailSubject('')
        setEmailMessage('')
        setSelectedEnquiry(null)
        // Refresh enquiries to show updated status
        fetchEnquiries()
        alert('Email sent successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to send email: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const openEmailModal = (enquiry: UserEnquiry) => {
    setSelectedEnquiry(enquiry)
    setEmailSubject(`Re: ${enquiry.subject}`)
    setEmailMessage('')
    setShowEmailModal(true)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all'
    })
  }

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = filters.search === '' || 
      enquiry.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      enquiry.user_email.toLowerCase().includes(filters.search.toLowerCase()) ||
      enquiry.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      enquiry.message.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || enquiry.status === filters.status
    const matchesPriority = filters.priority === 'all' || enquiry.priority === filters.priority
    const matchesCategory = filters.category === 'all' || enquiry.category === filters.category
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  // Chart colors
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  }

  const pieChartColors = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.purple]

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Site analytics and user management</p>
          </div>
          <Button 
            onClick={refreshData} 
            disabled={refreshing}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
          >
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
                <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.subscriptionRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSubscriptions} active subscriptions
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Excludes admin test account
                </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Token Revenue</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.tokenRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTokensPurchased.toLocaleString()} tokens sold
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

        {/* Subscription Tier Breakdown */}
        {stats && stats.subscriptionData && stats.subscriptionData.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Subscription Tier Distribution
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Breakdown of users by subscription tier (excluding test accounts)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.subscriptionData.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold text-lg">{tier.tier}</div>
                        <div className="text-2xl font-bold text-blue-600">{tier.count}</div>
                        <div className="text-sm text-gray-500">
                          {stats.totalSubscriptions > 0 
                            ? `${((tier.count / stats.totalSubscriptions) * 100).toFixed(1)}%`
                            : '0%'
                          } of total
                        </div>
                      </div>
                      <div className="w-3 h-3 rounded-full" 
                           style={{ backgroundColor: pieChartColors[index % pieChartColors.length] }}>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.monthlyRecurringRevenue)}
                    </div>
                    <div className="text-sm text-gray-500">Monthly Recurring Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalSubscriptions}
                    </div>
                    <div className="text-sm text-gray-500">Active Subscriptions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.totalSubscriptions > 0 
                        ? formatCurrency(stats.monthlyRecurringRevenue / stats.totalSubscriptions)
                        : formatCurrency(0)
                      }
                    </div>
                    <div className="text-sm text-gray-500">Average Revenue Per User</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="enquiries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="enquiries">User Enquiries</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

                    <TabsContent value="enquiries" className="space-y-4">
      <Card>
        <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    User Enquiries & Issues
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      {Object.values(filters).some(f => f !== 'all' && f !== '') && (
                        <Badge variant="secondary" className="ml-1">
                          {Object.values(filters).filter(f => f !== 'all' && f !== '').length}
                        </Badge>
                      )}
                    </Button>
                    {(Object.values(filters).some(f => f !== 'all' && f !== '')) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
        </CardHeader>
        <CardContent>
                {/* Filter Panel */}
                {showFilters && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Search names, emails, subjects..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Statuses</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Categories</option>
                          <option value="general">General</option>
                          <option value="billing">Billing</option>
                          <option value="technical">Technical</option>
                          <option value="feature_request">Feature Request</option>
                          <option value="bug_report">Bug Report</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredEnquiries.length} of {enquiries.length} enquiries
                  </p>
                  {filteredEnquiries.length !== enquiries.length && (
                    <p className="text-sm text-blue-600">
                      Filtered results
                    </p>
                  )}
                </div>

                {filteredEnquiries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      {enquiries.length === 0 ? 'No enquiries at the moment' : 'No enquiries match your filters'}
                    </p>
                    {enquiries.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnquiries.map((enquiry) => (
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
                            <Badge variant="outline" className="capitalize">
                              {enquiry.category.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                enquiry.priority === 'urgent' ? 'destructive' :
                                enquiry.priority === 'high' ? 'default' :
                                enquiry.priority === 'medium' ? 'secondary' : 'outline'
                              }
                            >
                              {enquiry.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <select
                              value={enquiry.status}
                              onChange={(e) => updateEnquiryStatus(enquiry.id, e.target.value)}
                              className="text-sm border rounded px-2 py-1 bg-white"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
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
                                  alert(`Subject: ${enquiry.subject}\n\nMessage: ${enquiry.message}`)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEmailModal(enquiry)}
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

                    <TabsContent value="analytics" className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
              <div className="flex gap-2">
                <Button
                  variant={chartTimeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={chartTimeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={chartTimeRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartTimeRange('90d')}
                >
                  90 Days
                </Button>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.userGrowthData && stats.userGrowthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={stats.userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [value, 'Users']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke={chartColors.primary} 
                          strokeWidth={2}
                          dot={{ fill: chartColors.primary }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No user growth data available</p>
                      </div>
                    </div>
                  )}
        </CardContent>
      </Card>

              {/* Revenue Chart */}
      <Card>
        <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
        </CardHeader>
        <CardContent>
                  {stats?.revenueData && stats.revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke={chartColors.secondary} 
                          fill={chartColors.secondary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No revenue data available</p>
                      </div>
              </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Subscription Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.subscriptionData && stats.subscriptionData.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={stats.subscriptionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ tier, percent }) => `${tier} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {stats.subscriptionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieChartColors[index % pieChartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, name]}/>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No subscription data available</p>
                      </div>
          </div>
                  )}
        </CardContent>
      </Card>

              {/* Message Activity */}
      <Card>
        <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Message Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.messageData && stats.messageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.messageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Bar dataKey="emails" fill={chartColors.primary} name="Emails" />
                        <Bar dataKey="telegram" fill={chartColors.secondary} name="Telegram" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No message data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalContacts?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">Across all users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalEvents?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">Created by users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tokens Purchased</CardTitle>
        </CardHeader>
        <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTokensPurchased?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">Total tokens sold</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Detailed Subscription Analytics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive breakdown of subscription tiers, revenue, and user data
                </p>
              </CardHeader>
              <CardContent>
                {subscriptionAnalytics ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {subscriptionAnalytics.summary.totalSubscriptions}
                        </div>
                        <div className="text-sm text-gray-500">Total Subscriptions</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(subscriptionAnalytics.summary.totalRevenue)}
                        </div>
                        <div className="text-sm text-gray-500">Total Revenue</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(subscriptionAnalytics.summary.averageRevenuePerUser)}
                        </div>
                        <div className="text-sm text-gray-500">Avg Revenue/User</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {subscriptionAnalytics.summary.totalTokensPurchased.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Total Tokens</div>
                      </div>
                    </div>

                    {/* Tier Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Tier Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(subscriptionAnalytics.tierBreakdown).map(([tier, data]: [string, any]) => (
                          <Card key={tier}>
                            <CardHeader>
                              <CardTitle className="text-lg capitalize">{tier}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Users:</span>
                                  <span className="font-semibold">{data.count}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue:</span>
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(data.revenue)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tokens:</span>
                                  <span className="font-semibold text-blue-600">
                                    {data.totalTokensPurchased.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Tokens/User:</span>
                                  <span className="font-semibold">
                                    {data.count > 0 ? Math.round(data.totalTokensPurchased / data.count) : 0}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Stripe Data */}
                    {subscriptionAnalytics.stripeData && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Stripe Integration Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Stripe Subscriptions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Active Subscriptions:</span>
                                  <span className="font-semibold">{subscriptionAnalytics.stripeData.totalSubscriptions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Revenue:</span>
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(subscriptionAnalytics.stripeData.totalRevenue)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Data Source</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="text-xs text-gray-600">
                                  <p><strong>Primary:</strong> Database calculations (excludes admin user)</p>
                                  <p><strong>Reference:</strong> Stripe data (includes all subscriptions)</p>
                                  <p className="text-orange-600 mt-2">
                                    ⚠️ Stripe data may include test/admin accounts
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="text-sm text-gray-500 text-center">
                      Last updated: {new Date(subscriptionAnalytics.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Loading subscription analytics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Modal */}
        {showEmailModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold mb-4">Send Email to {selectedEnquiry.user_name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your response here..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailModal(false)
                    setSelectedEnquiry(null)
                    setEmailSubject('')
                    setEmailMessage('')
                  }}
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendEmailToUser}
                  disabled={sendingEmail || !emailMessage.trim()}
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </div>
      )}
      </div>
    </div>
  )
} 