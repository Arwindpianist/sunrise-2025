"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Send, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Eye,
  BarChart3,
  MessageSquare,
  DollarSign
} from "lucide-react"

interface Message {
  id: string
  event_id: string
  event_title: string
  channel: 'email' | 'telegram' | 'sms'
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  recipient_count: number
  sent_at: string
  tokens_used: number
  cost: number
}

interface EventMessage {
  event_id: string
  event_title: string
  sent_at: string
  email_recipients: number
  telegram_recipients: number
  email_status: {
    sent: number
    delivered: number
    failed: number
    pending: number
  }
  telegram_status: {
    sent: number
    delivered: number
    failed: number
    pending: number
  }
  total_recipients: number
  total_tokens: number
  total_cost: number
}

interface MessageStats {
  totalMessages: number
  totalRecipients: number
  totalTokens: number
  totalSavings: number
  byChannel: {
    email: { count: number; recipients: number; tokens: number }
    telegram: { count: number; recipients: number; tokens: number }
    sms: { count: number; recipients: number; tokens: number }
  }
  byStatus: {
    sent: number
    delivered: number
    failed: number
    pending: number
  }
}

export default function MessagesPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [eventMessages, setEventMessages] = useState<EventMessage[]>([])
  const [stats, setStats] = useState<MessageStats>({
    totalMessages: 0,
    totalRecipients: 0,
    totalTokens: 0,
    totalSavings: 0,
    byChannel: {
      email: { count: 0, recipients: 0, tokens: 0 },
      telegram: { count: 0, recipients: 0, tokens: 0 },
      sms: { count: 0, recipients: 0, tokens: 0 }
    },
    byStatus: {
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchMessages()
    }
  }, [user, router])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      
      // Get user's events first
      const { data: userEvents, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .eq('user_id', user?.id)

      if (eventsError) throw eventsError

      if (!userEvents || userEvents.length === 0) {
        setMessages([])
        setEventMessages([])
        calculateStats([])
        return
      }

      const eventIds = userEvents.map(e => e.id)
      const eventMap = new Map(userEvents.map(e => [e.id, e.title]))

      // Fetch email logs
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select(`
          id,
          event_id,
          status,
          sent_at,
          error_message
        `)
        .in('event_id', eventIds)
        .order('sent_at', { ascending: false })

      if (emailError) throw emailError

      // Fetch telegram logs
      const { data: telegramLogs, error: telegramError } = await supabase
        .from('telegram_logs')
        .select(`
          id,
          event_id,
          status,
          sent_at,
          error_message
        `)
        .in('event_id', eventIds)
        .order('sent_at', { ascending: false })

      if (telegramError) throw telegramError

      // Process email logs into messages
      const emailMessages: Message[] = (emailLogs || []).map(log => ({
        id: log.id,
        event_id: log.event_id,
        event_title: eventMap.get(log.event_id) || 'Unknown Event',
        channel: 'email' as const,
        status: log.status as 'sent' | 'delivered' | 'failed' | 'pending',
        recipient_count: 1,
        sent_at: log.sent_at,
        tokens_used: 1,
        cost: 0.05
      }))

      // Process telegram logs into messages
      const telegramMessages: Message[] = (telegramLogs || []).map(log => ({
        id: log.id,
        event_id: log.event_id,
        event_title: eventMap.get(log.event_id) || 'Unknown Event',
        channel: 'telegram' as const,
        status: log.status as 'sent' | 'delivered' | 'failed' | 'pending',
        recipient_count: 1,
        sent_at: log.sent_at,
        tokens_used: 1,
        cost: 0.05
      }))

      // Combine and sort by sent_at
      const allMessages = [...emailMessages, ...telegramMessages]
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())

      setMessages(allMessages)
      
      // Group messages by event
      const eventMessageMap = new Map<string, EventMessage>()
      
      allMessages.forEach(message => {
        const eventId = message.event_id
        const existing = eventMessageMap.get(eventId)
        
        if (existing) {
          // Update existing event message
          if (message.channel === 'email') {
            existing.email_recipients += message.recipient_count
            existing.email_status[message.status]++
          } else if (message.channel === 'telegram') {
            existing.telegram_recipients += message.recipient_count
            existing.telegram_status[message.status]++
          }
          existing.total_recipients += message.recipient_count
          existing.total_tokens += message.tokens_used
          existing.total_cost += message.cost
        } else {
          // Create new event message
          const newEventMessage: EventMessage = {
            event_id: eventId,
            event_title: message.event_title,
            sent_at: message.sent_at,
            email_recipients: message.channel === 'email' ? message.recipient_count : 0,
            telegram_recipients: message.channel === 'telegram' ? message.recipient_count : 0,
            email_status: {
              sent: message.channel === 'email' && message.status === 'sent' ? 1 : 0,
              delivered: message.channel === 'email' && message.status === 'delivered' ? 1 : 0,
              failed: message.channel === 'email' && message.status === 'failed' ? 1 : 0,
              pending: message.channel === 'email' && message.status === 'pending' ? 1 : 0
            },
            telegram_status: {
              sent: message.channel === 'telegram' && message.status === 'sent' ? 1 : 0,
              delivered: message.channel === 'telegram' && message.status === 'delivered' ? 1 : 0,
              failed: message.channel === 'telegram' && message.status === 'failed' ? 1 : 0,
              pending: message.channel === 'telegram' && message.status === 'pending' ? 1 : 0
            },
            total_recipients: message.recipient_count,
            total_tokens: message.tokens_used,
            total_cost: message.cost
          }
          eventMessageMap.set(eventId, newEventMessage)
        }
      })
      
      // Convert map to array and sort by sent_at
      const eventMessagesArray = Array.from(eventMessageMap.values())
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      
      setEventMessages(eventMessagesArray)
      calculateStats(allMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (messages: Message[]) => {
    // Calculate savings based on subscription tier
    const calculateSavings = (tokens: number) => {
      // Assuming user has a subscription (Pro tier for 20% savings)
      // Standard price: RM0.50 per token, Pro price: RM0.40 per token
      const standardCost = tokens * 0.50
      const discountedCost = tokens * 0.40
      return standardCost - discountedCost
    }

    const stats: MessageStats = {
      totalMessages: messages.length,
      totalRecipients: messages.reduce((sum, m) => sum + m.recipient_count, 0),
      totalTokens: messages.reduce((sum, m) => sum + m.tokens_used, 0),
      totalSavings: calculateSavings(messages.reduce((sum, m) => sum + m.tokens_used, 0)),
      byChannel: {
        email: { count: 0, recipients: 0, tokens: 0 },
        telegram: { count: 0, recipients: 0, tokens: 0 },
        sms: { count: 0, recipients: 0, tokens: 0 }
      },
      byStatus: {
        sent: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      }
    }

    messages.forEach(message => {
      // Count by channel
      stats.byChannel[message.channel].count++
      stats.byChannel[message.channel].recipients += message.recipient_count
      stats.byChannel[message.channel].tokens += message.tokens_used

      // Count by status
      stats.byStatus[message.status]++
    })

    setStats(stats)
  }

  const handleResendEvent = async (eventId: string) => {
    try {
      setResending(eventId)
      
      // Check user balance first
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      if (!balanceData || balanceData.balance < 1) {
        alert('Insufficient tokens to resend. Please purchase more tokens.')
        return
      }

      // Navigate to event page with resend flag
      router.push(`/dashboard/events/${eventId}?resend=true`)
    } catch (error) {
      console.error('Error preparing resend:', error)
      alert('Error preparing resend. Please try again.')
    } finally {
      setResending(null)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'telegram': return <Send className="h-4 w-4" />
      case 'sms': return <TrendingUp className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'text-blue-600'
      case 'telegram': return 'text-blue-500'
      case 'sms': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (!user || !mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-orange-500" />
                    Message Analytics
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    View all messages sent across all channels with detailed analytics.
                  </p>
                </div>
                <Button
                  onClick={fetchMessages}
                  disabled={loading}
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Send className="h-5 w-5 text-orange-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalMessages}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Messages</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-orange-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalRecipients}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Recipients</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-5 w-5 text-orange-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                {stats.totalTokens}
              </p>
              <p className="text-sm text-gray-600 mt-1">Tokens Used</p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                RM{stats.totalSavings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Savings</p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Breakdown */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-3 mb-6 sm:mb-8">
          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-semibold">{stats.byChannel.email.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-semibold">{stats.byChannel.email.recipients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens:</span>
                  <span className="font-semibold">{stats.byChannel.email.tokens}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                Telegram Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-semibold">{stats.byChannel.telegram.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-semibold">{stats.byChannel.telegram.recipients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens:</span>
                  <span className="font-semibold">{stats.byChannel.telegram.tokens}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                SMS Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-semibold">{stats.byChannel.sms.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-semibold">{stats.byChannel.sms.recipients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens:</span>
                  <span className="font-semibold">{stats.byChannel.sms.tokens}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages List */}
        <Card className="bg-white/50 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-500" />
              Message History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-600">Loading messages...</p>
              </div>
            ) : eventMessages.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No messages sent yet</p>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                  onClick={() => router.push('/dashboard/events/create')}
                >
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {eventMessages.map((eventMessage) => (
                  <div
                    key={eventMessage.event_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/50 rounded-lg backdrop-blur-sm hover:bg-white/70 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {eventMessage.email_recipients > 0 && (
                            <div className="text-blue-600">
                              <Mail className="h-4 w-4" />
                            </div>
                          )}
                          {eventMessage.telegram_recipients > 0 && (
                            <div className="text-blue-500">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-800 truncate">
                          {eventMessage.event_title}
                        </h3>
                        <div className="flex gap-1">
                          {eventMessage.email_recipients > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Email: {eventMessage.email_recipients}
                            </Badge>
                          )}
                          {eventMessage.telegram_recipients > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Telegram: {eventMessage.telegram_recipients}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {eventMessage.total_recipients} total recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {eventMessage.total_tokens} tokens
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(eventMessage.sent_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          RM{eventMessage.total_cost.toFixed(2)}
                        </span>
                      </div>
                      {/* Status breakdown */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {eventMessage.email_recipients > 0 && (
                          <div className="text-xs text-gray-500">
                            Email: {eventMessage.email_status.sent + eventMessage.email_status.delivered} sent, {eventMessage.email_status.failed} failed
                          </div>
                        )}
                        {eventMessage.telegram_recipients > 0 && (
                          <div className="text-xs text-gray-500">
                            Telegram: {eventMessage.telegram_status.sent + eventMessage.telegram_status.delivered} sent, {eventMessage.telegram_status.failed} failed
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        onClick={() => router.push(`/dashboard/events/${eventMessage.event_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Event
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-50"
                        onClick={() => handleResendEvent(eventMessage.event_id)}
                        disabled={resending === eventMessage.event_id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${resending === eventMessage.event_id ? 'animate-spin' : ''}`} />
                        {resending === eventMessage.event_id ? 'Preparing...' : 'Re-send'}
                      </Button>
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