"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Trash2, AlertTriangle, CheckCircle, Mail, Database } from "lucide-react"

export default function ForceDeleteUserPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleForceDelete = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/force-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clean up user data')
      }

      toast({
        title: "Success",
        description: result.message || "User data completely cleaned up and email address freed. You can now create a new account with this email.",
      })

      setEmail("")
    } catch (error: any) {
      console.error('Error cleaning up user data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to clean up user data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <Database className="h-5 w-5 mr-2" />
            Complete User Data Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Complete Data Removal</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This will completely remove all user data from the database and free up the email address for new account creation.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address to Clean Up
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full"
            />
          </div>

          <Button
            onClick={handleForceDelete}
            disabled={isLoading || !email}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Cleaning Up Data...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Up All User Data
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">After Cleanup</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              All user data will be completely removed from the database and the email address will be freed for new account creation.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-700">
              <strong>Data Cleanup Process:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Removes all user data from all database tables</li>
                <li>• Cleans up contacts, events, logs, transactions</li>
                <li>• Removes user balances and subscriptions</li>
                <li>• Deletes contact categories and user records</li>
                <li>• Changes email to free up original address</li>
                <li>• Maintains audit trail for compliance</li>
              </ul>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-700">
              <strong>⚠️ Warning:</strong> This action is irreversible. All user data will be permanently deleted from the database.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 