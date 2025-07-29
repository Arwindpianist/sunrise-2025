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

  const runRestoreSubscription = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to restore subscription",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'c68669a3-2cd0-47d3-b933-b8a4114af80b',
          stripeSubscriptionId: 'sub_1Rq9y4PPPQtmXr4tLo1mMVFc'
        }),
      })
      const result = await response.json()
      setResults(result)
      if (result.restoredSubscription) {
        toast({
          title: "Success",
          description: `Subscription restored! Balance: ${result.restoredBalance} tokens`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to restore subscription",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore subscription",
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

          {/* Restore Subscription Section */}
          <div className="mt-8 p-4 border border-orange-200 rounded-lg bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">Restore Subscription</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value="c68669a3-2cd0-47d3-b933-b8a4114af80b"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Subscription ID
                  </label>
                  <input
                    type="text"
                    value="sub_1Rq9y4PPPQtmXr4tLo1mMVFc"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
              <Button 
                onClick={runRestoreSubscription} 
                disabled={loading}
                variant="default"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Restore Subscription
              </Button>
            </div>
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