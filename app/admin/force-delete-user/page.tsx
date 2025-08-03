"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"

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
      // First, we need to get the user ID from the email
      const response = await fetch('/api/admin/force-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to force delete user')
      }

      toast({
        title: "Success",
        description: result.message || "User force deleted successfully. You can now create a new account with this email.",
      })

      setEmail("")
    } catch (error: any) {
      console.error('Error force deleting user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to force delete user",
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
            <Trash2 className="h-5 w-5 mr-2" />
            Force Delete User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This will completely remove a disabled user from the authentication system, allowing you to create a new account with the same email.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
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
                Force Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Force Delete User
              </>
            )}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center text-blue-800">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">After Deletion</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              You will be able to create a new account with the same email address.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 