"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Mail, CheckCircle, XCircle, Clock, Calendar, Users } from "lucide-react"

interface EmailLog {
  id: string
  event_id: string
  contact_id: string
  status: "sent" | "failed" | "opened"
  error_message: string | null
  sent_at: string
  opened_at: string | null
  event: {
    title: string
    email_subject: string
  }
  contact: {
    first_name: string
    last_name: string
    email: string
  }
}

interface EmailStats {
  total: number
  sent: number
  failed: number
  opened: number
  successRate: number
}

export default function EmailLogsPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    failed: 0,
    opened: 0,
    successRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchEmailLogs()
    }
  }, [user, router])

  const fetchEmailLogs = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Fetch email logs with event and contact details
      // First get events for the current user
      const { data: userEvents, error: eventsError } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", session.user.id)

      if (eventsError) {
        throw eventsError
      }

      if (!userEvents || userEvents.length === 0) {
        setEmailLogs([])
        setStats({ total: 0, sent: 0, failed: 0, opened: 0, successRate: 0 })
        return
      }

      const eventIds = userEvents.map(event => event.id)

      const { data: logs, error } = await supabase
        .from("email_logs")
        .select(`
          *,
          event:events (
            title,
            email_subject
          ),
          contact:contacts (
            first_name,
            last_name,
            email
          )
        `)
        .in("event_id", eventIds)
        .order("sent_at", { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      setEmailLogs(logs || [])

      // Calculate stats
      const total = logs?.length || 0
      const sent = logs?.filter(log => log.status === "sent").length || 0
      const opened = logs?.filter(log => log.status === "opened").length || 0
      const failed = logs?.filter(log => log.status === "failed").length || 0
      const successRate = total > 0 ? Math.round(((sent + opened) / total) * 100) : 0

      setStats({
        total,
        sent,
        failed,
        opened,
        successRate,
      })
    } catch (error: any) {
      console.error("Error fetching email logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "opened":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "opened":
        return <Badge className="bg-blue-100 text-blue-800">Opened</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Email Logs</h1>
          <p className="text-gray-600 text-sm md:text-base">Track your email sending history and delivery status</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-orange-500" />
                Total Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.total}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {stats.sent}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {stats.failed}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Opened
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {stats.opened}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {stats.successRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Email Logs List */}
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Email Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading email logs...</p>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No email logs found</h3>
                <p className="text-gray-600">Start sending emails to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {getStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {log.contact?.first_name} {log.contact?.last_name}
                          </p>
                          <span className="text-gray-500">•</span>
                          <p className="text-gray-600 text-sm truncate">
                            {log.contact?.email}
                          </p>
                        </div>
                                                 <div className="flex items-center gap-2 text-sm text-gray-600">
                           <Calendar className="h-3 w-3" />
                           <span>{format(new Date(log.sent_at), "MMM d, yyyy 'at' h:mm a")}</span>
                           <span>•</span>
                           <span className="truncate">{log.event?.title}</span>
                         </div>
                        {log.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 