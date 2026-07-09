"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Settings, Bug, Zap, TestTube } from "lucide-react"

interface TelegramLog {
  id: string
  event_id: string
  contact_id: string
  status: string
  error_message: string | null
  sent_at: string
  event: {
    title: string
  }
  contact: {
    first_name: string
    last_name: string
    phone: string
  }
}

interface TelegramStats {
  total: number
  sent: number
  failed: number
  successRate: number
}

export default function TelegramLogsPage() {
  const router = useRouter()
  const { status } = useSession()
  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>([])
  const [stats, setStats] = useState<TelegramStats>({
    total: 0,
    sent: 0,
    failed: 0,
    successRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [isTestingSetup, setIsTestingSetup] = useState(false)

  const fetchTelegramLogs = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const res = await fetch("/api/dashboard/telegram-logs", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to fetch telegram logs")
      }
      if (data.unavailable) {
        setUnavailable(true)
        setTelegramLogs([])
        setStats({ total: 0, sent: 0, failed: 0, successRate: 0 })
        setLoadError(typeof data.message === "string" ? data.message : null)
        return
      }
      setUnavailable(false)
      const logs: TelegramLog[] = Array.isArray(data.logs) ? data.logs : []

      setTelegramLogs(logs)

      const total = logs.length
      const sent = logs.filter((log) => log.status === "sent").length
      const failed = logs.filter((log) => log.status === "failed").length
      const successRate = total > 0 ? Math.round((sent / total) * 100) : 0

      setStats({
        total,
        sent,
        failed,
        successRate,
      })
    } catch (error: unknown) {
      console.error("Error fetching telegram logs:", error)
      const message = error instanceof Error ? error.message : "Failed to fetch telegram logs"
      setLoadError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchTelegramLogs()
    }
  }, [status, router, fetchTelegramLogs])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "border-transparent bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-100"
      case "failed":
        return "border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-100"
      default:
        return "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-100"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleTestTelegram = async () => {
    try {
      setIsTesting(true)
      
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test message")
      }

      toast({
        title: "Test Message Sent!",
        description: "Check your Telegram to see if you received the test message.",
      })
    } catch (error: any) {
      console.error("Error testing Telegram:", error)
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSetupWebhook = async () => {
    try {
      setIsSettingUpWebhook(true)
      
      const response = await fetch("/api/telegram/setup-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up webhook")
      }

      toast({
        title: "Webhook Set Up Successfully!",
        description: "Your bot is now ready to respond with chat IDs.",
      })
    } catch (error: any) {
      console.error("Error setting up webhook:", error)
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up webhook",
        variant: "destructive",
      })
    } finally {
      setIsSettingUpWebhook(false)
    }
  }

  const handleDiagnose = async () => {
    try {
      setIsDiagnosing(true)
      
      const response = await fetch("/api/telegram/diagnose", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run diagnostics")
      }

      setDiagnosticData(data)
      console.log("Diagnostic data:", data)
      
      toast({
        title: "Diagnostics Complete",
        description: "Check the console for detailed information.",
      })
    } catch (error: any) {
      console.error("Error running diagnostics:", error)
      toast({
        title: "Diagnostics Failed",
        description: error.message || "Failed to run diagnostics",
        variant: "destructive",
      })
    } finally {
      setIsDiagnosing(false)
    }
  }

  const handleTestWebhook = async () => {
    try {
      setIsTestingWebhook(true)
      
      // Test GET request
      const getResponse = await fetch("/api/telegram/webhook", {
        method: "GET",
      })
      
      console.log("Webhook GET test:", {
        status: getResponse.status,
        ok: getResponse.ok
      })

      // Test POST request with sample data
      const postResponse = await fetch("/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          message: {
            chat: { id: 123456789, type: "private" },
            from: { first_name: "Test", username: "testuser" },
            text: "test message"
          }
        })
      })
      
      console.log("Webhook POST test:", {
        status: postResponse.status,
        ok: postResponse.ok
      })

      if (postResponse.ok) {
        try {
          const responseData = await postResponse.json()
          console.log("Webhook response:", responseData)
        } catch (error) {
          console.log("Webhook response (non-JSON):", await postResponse.text())
        }
      }
      
      toast({
        title: "Webhook Test Complete",
        description: "Check the console for test results.",
      })
    } catch (error: any) {
      console.error("Error testing webhook:", error)
      toast({
        title: "Webhook Test Failed",
        description: error.message || "Failed to test webhook",
        variant: "destructive",
      })
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleTestSetup = async () => {
    try {
      setIsTestingSetup(true)
      
      const response = await fetch("/api/telegram/setup-webhook-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test webhook setup")
      }

      console.log("Setup test result:", data)
      
      toast({
        title: "Setup Test Complete",
        description: "Check the console for detailed results.",
      })
    } catch (error: any) {
      console.error("Error testing setup:", error)
      toast({
        title: "Setup Test Failed",
        description: error.message || "Failed to test setup",
        variant: "destructive",
      })
    } finally {
      setIsTestingSetup(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-card/20 to-background">
      <div className="container mx-auto px-4 py-6">
        {(loadError || unavailable) && (
          <Alert className="mb-6" variant={unavailable ? "default" : "destructive"}>
            <AlertTitle>{unavailable ? "Logs unavailable" : "Could not load logs"}</AlertTitle>
            <AlertDescription>{loadError ?? "Try again later."}</AlertDescription>
          </Alert>
        )}
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Telegram Logs</h1>
              <p className="text-sm text-muted-foreground md:text-base">View your Telegram message history and delivery status</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleDiagnose}
                disabled={isDiagnosing}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Bug className="mr-2 h-4 w-4" />
                {isDiagnosing ? "Diagnosing..." : "Diagnose Issues"}
              </Button>
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-500 dark:text-emerald-300"
              >
                <Zap className="mr-2 h-4 w-4" />
                {isTestingWebhook ? "Testing..." : "Test Webhook"}
              </Button>
              <Button
                onClick={handleTestSetup}
                disabled={isTestingSetup}
                variant="outline"
                className="border-violet-600 text-violet-700 hover:bg-violet-500/10 dark:border-violet-500 dark:text-violet-300"
              >
                <TestTube className="mr-2 h-4 w-4" />
                {isTestingSetup ? "Testing..." : "Test Setup"}
              </Button>
              <Button
                onClick={handleSetupWebhook}
                disabled={isSettingUpWebhook}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Settings className="mr-2 h-4 w-4" />
                {isSettingUpWebhook ? "Setting Up..." : "Setup Webhook"}
              </Button>
              <Button
                onClick={handleTestTelegram}
                disabled={isTesting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Send className="mr-2 h-4 w-4" />
                {isTesting ? "Testing..." : "Test Telegram"}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-border/80 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Send className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.successRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading telegram logs...</p>
          </div>
        ) : telegramLogs.length === 0 ? (
          <Card className="border border-border/80 bg-card">
            <CardContent className="text-center py-12">
              <Send className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium text-foreground">No telegram logs found</h3>
              <p className="mb-4 text-muted-foreground">Telegram message logs will appear here after you send messages</p>
              <Button onClick={() => router.push('/dashboard/events')}>
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {telegramLogs.map((log) => (
              <Card key={log.id} className="border border-border/80 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(log.status)}
                        <h3 className="font-medium text-foreground">{log.event.title}</h3>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        To: {log.contact.first_name} {log.contact.last_name} ({log.contact.phone})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sent: {formatDate(log.sent_at)}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 