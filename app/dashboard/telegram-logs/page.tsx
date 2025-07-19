"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Settings, Bug, Zap } from "lucide-react"

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
  const { user, supabase } = useSupabase()
  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>([])
  const [stats, setStats] = useState<TelegramStats>({
    total: 0,
    sent: 0,
    failed: 0,
    successRate: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchTelegramLogs()
    }
  }, [user, router])

  const fetchTelegramLogs = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Not authenticated")
      }

      // Fetch telegram logs with event and contact details
      // First get events for the current user
      const { data: userEvents, error: eventsError } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", session.user.id)

      if (eventsError) {
        throw eventsError
      }

      if (!userEvents || userEvents.length === 0) {
        setTelegramLogs([])
        setStats({ total: 0, sent: 0, failed: 0, successRate: 0 })
        return
      }

      const eventIds = userEvents.map(event => event.id)

      const { data: logs, error } = await supabase
        .from("telegram_logs")
        .select(`
          *,
          event:events (
            title
          ),
          contact:contacts (
            first_name,
            last_name,
            phone
          )
        `)
        .in("event_id", eventIds)
        .order("sent_at", { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      setTelegramLogs(logs || [])

      // Calculate stats
      const total = logs?.length || 0
      const sent = logs?.filter(log => log.status === "sent").length || 0
      const failed = logs?.filter(log => log.status === "failed").length || 0
      const successRate = total > 0 ? Math.round((sent / total) * 100) : 0

      setStats({
        total,
        sent,
        failed,
        successRate,
      })
    } catch (error: any) {
      console.error("Error fetching telegram logs:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch telegram logs",
        variant: "destructive",
      })
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
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6">
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Telegram Logs</h1>
              <p className="text-gray-600 text-sm md:text-base">View your Telegram message history and delivery status</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleDiagnose}
                disabled={isDiagnosing}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Bug className="mr-2 h-4 w-4" />
                {isDiagnosing ? "Diagnosing..." : "Diagnose Issues"}
              </Button>
              <Button
                onClick={handleTestWebhook}
                disabled={isTestingWebhook}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Zap className="mr-2 h-4 w-4" />
                {isTestingWebhook ? "Testing..." : "Test Webhook"}
              </Button>
              <Button
                onClick={handleSetupWebhook}
                disabled={isSettingUpWebhook}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
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
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Send className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{stats.successRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading telegram logs...</p>
          </div>
        ) : telegramLogs.length === 0 ? (
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No telegram logs found</h3>
              <p className="text-gray-600 mb-4">Telegram message logs will appear here after you send messages</p>
              <Button onClick={() => router.push('/dashboard/events')}>
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {telegramLogs.map((log) => (
              <Card key={log.id} className="bg-white/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(log.status)}
                        <h3 className="font-medium text-gray-900">{log.event.title}</h3>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        To: {log.contact.first_name} {log.contact.last_name} ({log.contact.phone})
                      </p>
                      <p className="text-xs text-gray-500">
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