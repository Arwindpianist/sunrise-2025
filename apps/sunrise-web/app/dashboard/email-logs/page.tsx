"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { Mail, CheckCircle, XCircle, Clock, Calendar, Users } from "lucide-react"

interface EmailLog {
  id: string
  event_id: string
  contact_id: string
  status: "sent" | "failed" | "opened" | string
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
  const { status } = useSession()
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    failed: 0,
    opened: 0,
    successRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const fetchEmailLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const res = await fetch("/api/dashboard/email-logs", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load email logs")
      }
      if (data.unavailable) {
        setUnavailable(true)
        setEmailLogs([])
        setStats({ total: 0, sent: 0, failed: 0, opened: 0, successRate: 0 })
        setLoadError(typeof data.message === "string" ? data.message : null)
        return
      }
      setUnavailable(false)
      const logs: EmailLog[] = Array.isArray(data.logs) ? data.logs : []

      setEmailLogs(logs)

      const total = logs.length
      const sent = logs.filter((log) => log.status === "sent").length
      const opened = logs.filter((log) => log.status === "opened").length
      const failed = logs.filter((log) => log.status === "failed").length
      const successRate = total > 0 ? Math.round(((sent + opened) / total) * 100) : 0

      setStats({ total, sent, failed, opened, successRate })
    } catch (e) {
      console.error("Error fetching email logs:", e)
      setLoadError(e instanceof Error ? e.message : "Could not load email logs")
      setEmailLogs([])
      setStats({ total: 0, sent: 0, failed: 0, opened: 0, successRate: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchEmailLogs()
    }
  }, [status, router, fetchEmailLogs])

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "opened":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "sent":
        return (
          <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/60 dark:text-green-100">
            Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge className="border-transparent bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-100">
            Failed
          </Badge>
        )
      case "opened":
        return (
          <Badge className="border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-100">
            Opened
          </Badge>
        )
      default:
        return <Badge className="bg-muted text-foreground">Unknown</Badge>
    }
  }

  if (status === "loading") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Email Logs</h1>
          <p className="text-sm text-muted-foreground md:text-base">Track your email sending history and delivery status</p>
        </div>

        {(loadError || unavailable) && (
          <Alert className="mb-6" variant={unavailable ? "default" : "destructive"}>
            <AlertTitle>{unavailable ? "Logs unavailable" : "Could not load logs"}</AlertTitle>
            <AlertDescription>{loadError ?? "Try again later."}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-5">
          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Total Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.sent}</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Opened
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.opened}</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.successRate}%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Email Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading email logs...</p>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="py-8 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-foreground">No email logs found</h3>
                <p className="text-muted-foreground">Start sending emails to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      {getStatusIcon(log.status)}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate font-medium text-foreground">
                            {log.contact?.first_name} {log.contact?.last_name}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="truncate text-sm text-muted-foreground">{log.contact?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(log.sent_at), "MMM d, yyyy 'at' h:mm a")}</span>
                          <span>•</span>
                          <span className="truncate">{log.event?.title}</span>
                        </div>
                        {log.error_message && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error: {log.error_message}</p>}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">{getStatusBadge(log.status)}</div>
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
