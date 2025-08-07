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

export default function DiscordSetup() {
  const { supabase, user } = useSupabase()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (user) {
      fetchDiscordSettings()
    }
  }, [user])

  const fetchDiscordSettings = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('discord_webhook_url')
        .eq('id', user?.id)
        .single()

      if (!error && userData?.discord_webhook_url) {
        setWebhookUrl(userData.discord_webhook_url)
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error fetching Discord settings:', error)
    }
  }

  const saveWebhookUrl = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          discord_webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setIsConnected(true)
      toast({
        title: "Discord Connected!",
        description: "Your Discord webhook has been saved successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error saving Discord webhook:', error)
      toast({
        title: "Error",
        description: "Failed to save Discord webhook. Please try again.",
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
      const response = await fetch('/api/discord/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          customMessage: "🎉 **Test Message from Sunrise!**\n\nThis is a test message to verify your Discord webhook is working correctly.\n\nIf you can see this message, your Discord integration is ready to go!"
        })
      })

      if (response.ok) {
        setTestResult('success')
        toast({
          title: "Test Successful!",
          description: "Your Discord webhook is working correctly.",
          variant: "default",
        })
      } else {
        const errorData = await response.json()
        setTestResult('error')
        toast({
          title: "Test Failed",
          description: errorData.error || "Failed to send test message to Discord.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setTestResult('error')
      toast({
        title: "Test Failed",
        description: "Failed to send test message to Discord.",
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
          discord_webhook_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setWebhookUrl('')
      setIsConnected(false)
      setTestResult(null)
      toast({
        title: "Discord Disconnected",
        description: "Your Discord webhook has been removed.",
        variant: "default",
      })
    } catch (error) {
      console.error('Error removing Discord webhook:', error)
      toast({
        title: "Error",
        description: "Failed to remove Discord webhook. Please try again.",
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
          Discord Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {isConnected && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Discord is connected and ready to send messages!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="webhook-url">Discord Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="font-mono text-xs sm:text-sm"
          />
          <p className="text-xs sm:text-sm text-gray-600">
            This webhook URL will be used to send all your Discord messages. Supports both main Discord and PTB (Public Test Build) domains.
          </p>
        </div>

        <div className="space-y-2">
          <Label>How to get your Discord Webhook URL:</Label>
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <p>1. Go to your Discord server</p>
            <p>2. Right-click on the channel you want to send messages to</p>
            <p>3. Select "Edit Channel" → "Integrations" → "Webhooks"</p>
            <p>4. Click "New Webhook" and give it a name</p>
            <p>5. Copy the webhook URL and paste it above</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks', '_blank')}
            className="mt-2 w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Learn More About Discord Webhooks</span>
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
              {isLoading ? "Saving..." : "Connect Discord"}
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
                ? "Test message sent successfully! Check your Discord channel."
                : "Test failed. Please check your webhook URL and try again."
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">💡 Discord Integration Benefits:</h4>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Send one message to reach all your contacts</li>
            <li>• Rich formatting with embeds and colors</li>
            <li>• Real-time notifications in Discord</li>
            <li>• Cost-effective for large events (1 token per message)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 