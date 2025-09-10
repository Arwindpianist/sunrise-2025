"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmergencyAlert {
  id: string
  user_id: string
  status: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  triggered_at: string
  resolved_at: string | null
  notes: string | null
  created_at: string
  user: {
    email: string
    user_metadata: {
      full_name?: string
      phone?: string
    }
  }
  notifications: {
    id: string
    notification_type: string
    status: string
    sent_at: string | null
    delivered_at: string | null
    error_message: string | null
    emergency_contact: {
      contact: {
        first_name: string
        last_name: string
        email: string
        phone: string
      }
    }
  }[]
}

export default function EmergencyAlertsPage() {
  const { user, supabase } = useSupabase()
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    if (user) {
      fetchEmergencyAlerts()
    }
  }, [user])

  const fetchEmergencyAlerts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('sos_alerts')
        .select(`
          *,
          user:auth.users!sos_alerts_user_id_fkey(
            email,
            user_metadata
          ),
          notifications:sos_alert_notifications(
            id,
            notification_type,
            status,
            sent_at,
            delivered_at,
            error_message,
            emergency_contact:emergency_contacts(
              contact:contacts(
                first_name,
                last_name,
                email,
                phone
              )
            )
          )
        `)
        .order('triggered_at', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Error fetching emergency alerts:', error)
      toast({
        title: "Error",
        description: "Failed to load emergency alerts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ 
          status: 'acknowledged',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      toast({
        title: "Alert Acknowledged",
        description: "Emergency alert has been marked as acknowledged",
      })

      fetchEmergencyAlerts()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      })
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      toast({
        title: "Alert Resolved",
        description: "Emergency alert has been marked as resolved",
      })

      fetchEmergencyAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Active</Badge>
      case 'acknowledged':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Acknowledged</Badge>
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getNotificationStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>
      case 'delivered':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Delivered</Badge>
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    
    const matchesDate = dateFilter === "all" || (() => {
      const alertDate = new Date(alert.triggered_at)
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      switch (dateFilter) {
        case "today":
          return alertDate.toDateString() === now.toDateString()
        case "week":
          return alertDate >= oneWeekAgo
        case "month":
          return alertDate >= new Date(now.getFullYear(), now.getMonth(), 1)
        default:
          return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Alerts</h1>
        <p className="text-gray-600">Monitor and manage emergency SOS alerts and notifications</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchEmergencyAlerts} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Alerts ({filteredAlerts.length})
            </span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">SOS Alert</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {alert.user.user_metadata?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">{alert.user.email}</div>
                        {alert.user.user_metadata?.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {alert.user.user_metadata.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate">
                            {alert.location_address || 'Location not available'}
                          </span>
                        </div>
                        {alert.location_lat && alert.location_lng && (
                          <a
                            href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View on Map
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {new Date(alert.triggered_at).toLocaleString()}
                        </div>
                        {alert.resolved_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            Resolved: {new Date(alert.resolved_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(alert.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {alert.notifications.map((notification) => (
                          <div key={notification.id} className="flex items-center gap-2 text-xs">
                            <span className="font-medium">
                              {notification.emergency_contact.contact.first_name} {notification.emergency_contact.contact.last_name}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{notification.notification_type}</span>
                            <span className="text-gray-400">•</span>
                            {getNotificationStatusBadge(notification.status)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
