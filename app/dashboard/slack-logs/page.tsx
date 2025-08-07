"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useSubscription } from '@/lib/use-subscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock, Lock } from 'lucide-react'

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
  const { supabase, user } = useSupabase()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [logs, setLogs] = useState<SlackLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/login')
      return
    }
    
    // Check if user has access to Slack features
    if (!subscriptionLoading && subscription && subscription.tier !== 'pro' && subscription.tier !== 'enterprise') {
      router.push('/pricing')
      return
    }
    
    if (user) {
      fetchSlackLogs()
    }
  }, [user, router, subscription, subscriptionLoading])

  const fetchSlackLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('slack_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching Slack logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    if (status === 'sent') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>
    } else {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
    }
  }

  const truncateWebhook = (webhook: string) => {
    const url = new URL(webhook)
    return `${url.hostname}${url.pathname.substring(0, 20)}...`
  }

  if (!mounted || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has access to Slack features
  if (!subscription || (subscription.tier !== 'pro' && subscription.tier !== 'enterprise')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Slack Logs</h1>
          <p className="text-gray-600 mb-4">
            Slack logs are available for Pro and Enterprise users only.
          </p>
          <Button onClick={() => router.push('/pricing')} className="bg-orange-500 hover:bg-orange-600">
            View Plans
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 lg:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Slack Logs
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">View your Slack message history</p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading Slack logs...</p>
              </div>
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Slack messages yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't sent any Slack messages yet. Start by creating an event and selecting Slack as a communication method.
                </p>
                <Button onClick={() => router.push('/dashboard/events/create')}>
                  Create Your First Event
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      {getStatusBadge(log.status)}
                      <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono self-start sm:self-auto">
                      {truncateWebhook(log.webhook_url)}
                      {log.channel && (
                        <span className="ml-2 text-blue-600">#{log.channel}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {log.message_content}
                    </pre>
                  </div>
                  
                  {log.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs sm:text-sm text-red-800">
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
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing the last 50 Slack messages. Older messages are automatically archived.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 