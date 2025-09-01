"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  priority: string
  created_at: string
  read_at: string | null
}

export default function NotificationsPage() {
  const { user, supabase } = useSupabase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )

      toast({
        title: "Success",
        description: "Notification marked as read",
      })
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))

      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      )

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sos_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700'
      case 'high':
        return 'bg-orange-100 text-orange-700'
      case 'normal':
        return 'bg-blue-100 text-blue-700'
      case 'low':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Stay updated with important alerts and messages.</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Badge variant="outline" className="text-sm">
            {notifications.length} total
          </Badge>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400">You'll see important alerts and messages here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={cn(
              "transition-all duration-200",
              !notification.is_read && "border-l-4 border-l-blue-500 bg-blue-50"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", getPriorityColor(notification.priority))}
                        >
                          {notification.priority}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="default" className="text-xs bg-blue-500">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      
                      {/* SOS Alert specific content */}
                      {notification.type === 'sos_alert' && notification.data && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800">
                                {notification.data.user_name}
                              </span>
                            </div>
                            {notification.data.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span className="text-red-700">
                                  {notification.data.location}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-red-600" />
                              <span className="text-red-700">
                                {new Date(notification.data.triggered_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {notification.read_at && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Read {new Date(notification.read_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
