"use client"

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ExternalLink, CheckCircle, XCircle, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export default function SlackSetup() {
  const { supabase, user } = useSupabase()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [channel, setChannel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (user) {
      fetchSlackSettings()
    }
  }, [user])

  const fetchSlackSettings = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('slack_webhook_url, slack_channel')
        .eq('id', user?.id)
        .single()

      if (!error && userData?.slack_webhook_url) {
        setWebhookUrl(userData.slack_webhook_url)
        setChannel(userData.slack_channel || '')
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error fetching Slack settings:', error)
    }
  }

  const saveWebhookUrl = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          slack_webhook_url: webhookUrl,
          slack_channel: channel,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setIsConnected(true)
      toast({
        title: "Slack Connected!",
        description: "Your Slack webhook has been saved successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error saving Slack webhook:', error)
      toast({
        title: "Error",
        description: "Failed to save Slack webhook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testWebhook = async () => {
    if (!webhookUrl) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/slack/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          channel
        })
      })

      if (response.ok) {
        setTestResult('success')
        toast({
          title: "Test Successful!",
          description: "Your Slack webhook is working correctly.",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        setTestResult('error')
        toast({
          title: "Test Failed",
          description: errorData.error || "Failed to send test message to Slack.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setTestResult('error')
      toast({
        title: "Test Failed",
        description: "Failed to send test message to Slack.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const removeWebhook = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          slack_webhook_url: null,
          slack_channel: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setWebhookUrl('')
      setChannel('')
      setIsConnected(false)
      setTestResult(null)
      toast({
        title: "Slack Disconnected",
        description: "Your Slack webhook has been removed.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error removing Slack webhook:', error)
      toast({
        title: "Error",
        description: "Failed to remove Slack webhook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageSquare className="h-5 w-5" />
          Slack Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Slack is connected and ready to send messages!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="webhook-url">Slack Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="font-mono text-xs sm:text-sm"
          />
          <p className="text-xs sm:text-sm text-gray-600">
            This webhook URL will be used to send all your Slack messages.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Slack Channel (Optional)</Label>
          <Input
            id="channel"
            type="text"
            placeholder="#general or @username"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="text-xs sm:text-sm"
          />
          <p className="text-xs sm:text-sm text-gray-600">
            Leave empty to use the default channel from the webhook, or specify a channel/username.
          </p>
        </div>

        <div className="space-y-2">
          <Label>How to get your Slack Webhook URL:</Label>
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <p>1. Go to your Slack workspace</p>
            <p>2. Create a new Slack app at api.slack.com/apps</p>
            <p>3. Enable "Incoming Webhooks" in Features</p>
            <p>4. Create a new webhook for your desired channel</p>
            <p>5. Copy the webhook URL and paste it above</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://api.slack.com/messaging/webhooks', '_blank')}
            className="mt-2 w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Learn More About Slack Webhooks</span>
            <span className="sm:hidden">Learn More</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!isConnected ? (
            <Button 
              onClick={saveWebhookUrl} 
              disabled={!webhookUrl || isLoading}
              className="w-full sm:flex-1"
            >
              {isLoading ? "Saving..." : "Connect Slack"}
            </Button>
          ) : (
            <>
              <Button 
                onClick={testWebhook} 
                disabled={isTesting}
                variant="outline"
                className="w-full sm:flex-1"
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={removeWebhook} 
                disabled={isLoading}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>

        {testResult && (
          <Alert className={testResult === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult === 'success' ? 'text-green-800' : 'text-red-800'}>
              {testResult === 'success' 
                ? "Test message sent successfully! Check your Slack channel."
                : "Test failed. Please check your webhook URL and try again."
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">💡 Slack Integration Benefits:</h4>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Send one message to reach all your team members</li>
            <li>• Rich formatting with Slack Block Kit</li>
            <li>• Real-time notifications in Slack</li>
            <li>• Cost-effective for large events (1 token per message)</li>
            <li>• Perfect for business and team communications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 