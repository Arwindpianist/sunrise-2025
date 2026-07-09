"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useSubscription } from "@/lib/use-subscription"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock, Lock } from "lucide-react"

interface SlackLog {
  id: string
  webhook_url: string
  channel: string | null
  message_content: string
  status: string
  error_message: string | null
  created_at: string
}

export default function SlackLogsPage() {
  const router = useRouter()
  const { status } = useSession()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [logs, setLogs] = useState<SlackLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const fetchSlackLogs = useCallback(async () => {
    try {
      setLoadError(null)
      const res = await fetch("/api/dashboard/slack-logs", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load Slack logs")
      }
      if (data.unavailable) {
        setUnavailable(true)
        setLogs([])
        setLoadError(typeof data.message === "string" ? data.message : null)
        return
      }
      setUnavailable(false)
      setLogs(Array.isArray(data.logs) ? data.logs : [])
    } catch (e) {
      console.error("Error fetching Slack logs:", e)
      setLoadError(e instanceof Error ? e.message : "Could not load Slack logs")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status !== "authenticated") return

    if (!subscriptionLoading && subscription && subscription.tier !== "pro" && subscription.tier !== "enterprise") {
      router.push("/pricing")
      return
    }

    if (subscription && (subscription.tier === "pro" || subscription.tier === "enterprise")) {
      fetchSlackLogs()
    }
  }, [status, router, subscription, subscriptionLoading, fetchSlackLogs])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (statusStr: string) => {
    if (statusStr === "sent") {
      return (
        <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/60 dark:text-green-100">
          <CheckCircle className="mr-1 h-3 w-3" />
          Sent
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Failed
      </Badge>
    )
  }

  const truncateWebhook = (webhook: string) => {
    const url = new URL(webhook)
    return `${url.hostname}${url.pathname.substring(0, 20)}...`
  }

  if (!mounted || subscriptionLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-card/20 to-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!subscription || (subscription.tier !== "pro" && subscription.tier !== "enterprise")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-card/20 to-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-xl font-semibold text-foreground">Slack Logs</h1>
          <p className="mb-4 text-muted-foreground">Slack logs are available for Pro and Enterprise users only.</p>
          <Button onClick={() => router.push("/pricing")} className="bg-primary text-primary-foreground hover:bg-primary/90">
            View Plans
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-start gap-4 sm:mb-8 sm:flex-row sm:items-center lg:mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="self-start text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">Slack Logs</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">View your Slack message history</p>
          </div>
        </div>

        {(loadError || unavailable) && (
          <Alert className="mb-6" variant={unavailable ? "default" : "destructive"}>
            <AlertTitle>{unavailable ? "Logs unavailable" : "Could not load logs"}</AlertTitle>
            <AlertDescription>{loadError ?? "Try again later or contact support if this persists."}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading Slack logs...</p>
              </div>
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-foreground">No Slack messages yet</h3>
                <p className="mb-4 text-muted-foreground">
                  You haven&apos;t sent any Slack messages yet. Start by creating an event and selecting Slack as a communication method.
                </p>
                <Button onClick={() => router.push("/dashboard/events/create")}>Create Your First Event</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {getStatusBadge(log.status)}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    <div className="self-start font-mono text-xs text-muted-foreground sm:self-auto">{truncateWebhook(log.webhook_url)}</div>
                  </div>

                  <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3">
                    <pre className="whitespace-pre-wrap break-words text-xs text-foreground sm:text-sm">{log.message_content}</pre>
                  </div>

                  {log.error_message && (
                    <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3">
                      <p className="text-xs text-red-800 sm:text-sm dark:text-red-200">
                        <strong>Error:</strong> {log.error_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6 text-center sm:mt-8">
            <p className="text-xs text-muted-foreground sm:text-sm">Showing the last 50 Slack messages. Older messages are automatically archived.</p>
          </div>
        )}
      </div>
    </div>
  )
}
