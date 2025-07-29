"use client"

import { useState } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function TestWebhookPage() {
  const { user } = useSupabase()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTest = async (testType: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to test webhook functionality",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subscription/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          testType
        }),
      })

      const result = await response.json()
      setResults(result)

      if (result.success) {
        toast({
          title: "Test Successful!",
          description: `Successfully completed: ${result.actions.join(', ')}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Test Error",
        description: "Failed to run test",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runReset = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to reset your account",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subscription/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      })

      const result = await response.json()
      setResults(result)

      if (result.success) {
        toast({
          title: "Reset Successful!",
          description: `Successfully reset: ${result.actions.join(', ')}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Reset Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast({
        title: "Reset Error",
        description: "Failed to reset account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to test webhook functionality.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Functionality Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This page allows you to test the webhook functionality without requiring actual payments.
            All tests use the service role key to bypass RLS policies.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => runTest('credit_tokens')} 
              disabled={loading}
              variant="outline"
            >
              Test Token Crediting
            </Button>
            
            <Button 
              onClick={() => runTest('update_subscription')} 
              disabled={loading}
              variant="outline"
            >
              Test Subscription Update
            </Button>
            
            <Button 
              onClick={() => runTest('create_subscription')} 
              disabled={loading}
              variant="outline"
            >
              Test Create Subscription
            </Button>
            
            <Button 
              onClick={() => runTest('full_test')} 
              disabled={loading}
              variant="default"
            >
              Full Test (Create + Credit)
            </Button>

            <Button 
              onClick={() => runTest('test_token_purchase')} 
              disabled={loading}
              variant="outline"
            >
              Test Token Purchase
            </Button>
            
            <Button 
              onClick={() => runTest('test_token_limit')} 
              disabled={loading}
              variant="outline"
            >
              Test Token Limits
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Reset for Real Testing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reset your account to free tier with 15 tokens to test real subscription purchases.
            </p>
            <Button 
              onClick={() => runReset()} 
              disabled={loading}
              variant="destructive"
            >
              Reset to Free Tier (15 tokens)
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 