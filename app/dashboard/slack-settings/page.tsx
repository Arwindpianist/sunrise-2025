"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useSubscription } from '@/lib/use-subscription'
import SlackSetup from '@/components/slack-setup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Settings, Lock } from 'lucide-react'

export default function SlackSettingsPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const { subscription, loading: subscriptionLoading } = useSubscription()
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
    }
  }, [user, router, subscription, subscriptionLoading])

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
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Slack Integration</h1>
          <p className="text-gray-600 mb-4">
            Slack integration is available for Pro and Enterprise users only.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Slack Settings
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Configure your Slack integration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Slack Setup */}
          <div className="lg:col-span-2">
            <SlackSetup />
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  About Slack Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <p>
                    Connect your Slack workspace to send event invitations and notifications 
                    directly to your Slack channels.
                  </p>
                  <p>
                    <strong>Benefits:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Send one message to reach all team members</li>
                    <li>Rich formatting with Slack Block Kit</li>
                    <li>Real-time notifications</li>
                    <li>Cost-effective for large events</li>
                    <li>Perfect for business communications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p>Create a Slack app in your workspace</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p>Enable Incoming Webhooks</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p>Create webhook and copy URL</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p>Paste URL above and test</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <p>Start sending Slack messages!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Cost Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs sm:text-sm space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-red-900">Telegram/Email</div>
                    <div className="text-red-700">100 contacts = 100 tokens</div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-900">Slack</div>
                    <div className="text-green-700">100 contacts = 1 token</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 