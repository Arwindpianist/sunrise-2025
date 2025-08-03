"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Mail, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react"

export default function ChangeEmailPage() {
  const [email, setEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailChange = async () => {
    if (!email || !newEmail) {
      toast({
        title: "Error",
        description: "Please enter both email addresses",
        variant: "destructive",
      })
      return
    }

    if (email === newEmail) {
      toast({
        title: "Error",
        description: "New email must be different from current email",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/change-user-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newEmail }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change email')
      }

      toast({
        title: "Success",
        description: result.message || "Email address changed successfully",
      })

      setEmail("")
      setNewEmail("")
    } catch (error: any) {
      console.error('Error changing email:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to change email address",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-600">
            <Mail className="h-5 w-5 mr-2" />
            Change User Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Email Change Tool</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Change a user's email address to free up the original email for new account creation.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Current Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="current@example.com"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>

          <div className="space-y-2">
            <label htmlFor="newEmail" className="text-sm font-medium text-gray-700">
              New Email Address
            </label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              className="w-full"
            />
          </div>

          <Button
            onClick={handleEmailChange}
            disabled={isLoading || !email || !newEmail}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Changing Email...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Change Email Address
              </>
            )}
          </Button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Important</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This will change the user's email address. The original email will be freed for new account creation.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              <strong>How to use:</strong>
              <ol className="mt-1 space-y-1 list-decimal list-inside">
                <li>Enter the current email address</li>
                <li>Enter a new email address (e.g., deleted_timestamp_original@domain.com)</li>
                <li>Click "Change Email Address"</li>
                <li>The original email will be freed for new registration</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 