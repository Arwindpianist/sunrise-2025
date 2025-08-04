"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Crown, 
  Coins, 
  Settings, 
  User, 
  Mail, 
  Calendar,
  CreditCard,
  Gift,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  user_metadata?: any
}

interface UserSubscription {
  id: string
  user_id: string
  tier: string
  status: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

interface UserBalance {
  user_id: string
  balance: number
  updated_at: string
}

export default function ManageUsersPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [bulkTokens, setBulkTokens] = useState("")
  const [bulkMessage, setBulkMessage] = useState("")
  const [isSendingBulk, setIsSendingBulk] = useState(false)

  // Form states for subscription update
  const [newTier, setNewTier] = useState("")
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState("")
  const [newTokenBalance, setNewTokenBalance] = useState("")

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Get the user's email from the session
        const { data: { session } } = await supabase.auth.getSession()
        const userEmail = session?.user?.email

        // Check if the user is an admin
        const isUserAdmin = userEmail === "arwindpianist@gmail.com"
        setIsAdmin(isUserAdmin)
        
        if (!isUserAdmin) {
          router.push('/dashboard')
          return
        }

        await fetchUsers()
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, router, supabase])

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        })
        return
      }

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/get-user-details?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user details')
      }

      setSelectedUser(data.user)
      setUserSubscription(data.subscription)
      setUserBalance(data.balance)
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch user details",
        variant: "destructive",
      })
    }
  }

  const handleUserSelect = async (userId: string) => {
    setSelectedUserId(userId)
    
    if (userId) {
      await fetchUserDetails(userId)
    } else {
      setSelectedUser(null)
      setUserSubscription(null)
      setUserBalance(null)
    }
  }

  const updateSubscription = async () => {
    if (!selectedUserId || !newTier || !stripeSubscriptionId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          tier: newTier,
          stripeSubscriptionId: stripeSubscriptionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      })

      // Refresh user details
      await fetchUserDetails(selectedUserId)
      
      // Reset form
      setNewTier("")
      setStripeSubscriptionId("")
    } catch (error: any) {
      console.error('Error updating subscription:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateTokenBalance = async () => {
    if (!selectedUserId || !newTokenBalance) {
      toast({
        title: "Error",
        description: "Please enter a token balance",
        variant: "destructive",
      })
      return
    }

    const balance = parseInt(newTokenBalance)
    if (isNaN(balance) || balance < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch('/api/admin/update-token-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          balance: balance,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update token balance')
      }

      toast({
        title: "Success",
        description: "Token balance updated successfully",
      })

      // Refresh user details
      await fetchUserDetails(selectedUserId)
      
      // Reset form
      setNewTokenBalance("")
    } catch (error: any) {
      console.error('Error updating token balance:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update token balance",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const sendBulkTokens = async () => {
    if (!bulkTokens || !bulkMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const tokens = parseInt(bulkTokens)
    if (isNaN(tokens) || tokens <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid positive number of tokens",
        variant: "destructive",
      })
      return
    }

    setIsSendingBulk(true)

    try {
      const response = await fetch('/api/admin/send-bulk-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: tokens,
          message: bulkMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send bulk tokens')
      }

      toast({
        title: "Success",
        description: `Sent ${tokens} tokens to ${data.updatedCount} users`,
      })

      // Reset form
      setBulkTokens("")
      setBulkMessage("")
    } catch (error: any) {
      console.error('Error sending bulk tokens:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk tokens",
        variant: "destructive",
      })
    } finally {
      setIsSendingBulk(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold">Manage Users</h1>
      </div>

      <Tabs defaultValue="user-management" className="space-y-6">
        <TabsList>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          <TabsTrigger value="bulk-operations">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="user-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Select User</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-select">Choose a user to manage</Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <span>{user.email}</span>
                            {user.full_name && (
                              <Badge variant="secondary">{user.full_name}</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-600">User Info</h3>
                      <p className="text-sm"><strong>Email:</strong> {selectedUser.email}</p>
                      <p className="text-sm"><strong>Name:</strong> {selectedUser.full_name || 'Not provided'}</p>
                      <p className="text-sm"><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-600">Current Status</h3>
                      <p className="text-sm">
                        <strong>Plan:</strong> 
                        <Badge variant={userSubscription?.tier === 'pro' ? 'default' : 'secondary'} className="ml-2">
                          {userSubscription?.tier || 'free'}
                        </Badge>
                      </p>
                      <p className="text-sm">
                        <strong>Tokens:</strong> 
                        <Badge variant="outline" className="ml-2">
                          {userBalance?.balance || 0}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Update Subscription</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tier">New Tier</Label>
                    <Select value={newTier} onValueChange={setNewTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="stripe-id">Stripe Subscription ID *</Label>
                    <Input
                      id="stripe-id"
                      placeholder="sub_..."
                      value={stripeSubscriptionId}
                      onChange={(e) => setStripeSubscriptionId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required for subscription updates. Must be a valid Stripe subscription ID.
                    </p>
                  </div>

                  <Button 
                    onClick={updateSubscription} 
                    disabled={isUpdating || !newTier || !stripeSubscriptionId}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update Subscription
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Token Balance Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="h-5 w-5" />
                    <span>Update Token Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="token-balance">New Token Balance</Label>
                    <Input
                      id="token-balance"
                      type="number"
                      placeholder="1000"
                      value={newTokenBalance}
                      onChange={(e) => setNewTokenBalance(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current balance: {userBalance?.balance || 0} tokens
                    </p>
                  </div>

                  <Button 
                    onClick={updateTokenBalance} 
                    disabled={isUpdating || !newTokenBalance}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4 mr-2" />
                        Update Balance
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk-operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5" />
                <span>Send Complimentary Tokens</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  This will send complimentary tokens to all active users. Use this feature sparingly for special occasions or promotions.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="bulk-tokens">Number of Tokens</Label>
                <Input
                  id="bulk-tokens"
                  type="number"
                  placeholder="100"
                  value={bulkTokens}
                  onChange={(e) => setBulkTokens(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bulk-message">Message (Optional)</Label>
                <Textarea
                  id="bulk-message"
                  placeholder="Happy holidays! Here are some complimentary tokens..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the transaction description.
                </p>
              </div>

              <Button 
                onClick={sendBulkTokens} 
                disabled={isSendingBulk || !bulkTokens}
                className="w-full"
                variant="outline"
              >
                {isSendingBulk ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Send to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 