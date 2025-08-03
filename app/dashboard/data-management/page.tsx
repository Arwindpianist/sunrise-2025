"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { 
  Download, 
  Trash2, 
  Eye, 
  Edit, 
  Shield, 
  FileText, 
  Users, 
  Calendar, 
  Mail, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Settings,
  RefreshCw
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DataSummary {
  account: {
    email: string
    fullName: string
    createdAt: string
    lastLogin: string
  }
  contacts: {
    total: number
    categories: Record<string, number>
  }
  events: {
    total: number
    upcoming: number
    past: number
  }
  communications: {
    emailsSent: number
    telegramSent: number
    lastActivity: string
  }
  financial: {
    balance: number
    transactions: number
    subscription: string
  }
}

interface ConsentSettings {
  marketing: boolean
  analytics: boolean
  thirdParty: boolean
  dataProcessing: boolean
  lastUpdated: string
}

export default function DataManagementPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null)
  const [consentSettings, setConsentSettings] = useState<ConsentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConsentDialog, setShowConsentDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchDataSummary()
      fetchConsentSettings()
    }
  }, [user, router])

  const fetchDataSummary = async () => {
    try {
      setIsLoading(true)
      
      // Fetch account data
      const { data: accountData } = await supabase.auth.getUser()
      
      // Fetch contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch contacts by category
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('category')
        .eq('user_id', user?.id)

      const categories = contactsData?.reduce((acc: Record<string, number>, contact) => {
        const category = contact.category || 'uncategorized'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {}) || {}

      // Fetch events data
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      const { count: upcomingEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('event_date', new Date().toISOString())

      // Fetch communication data
      const { count: emailsSent } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      const { count: telegramSent } = await supabase
        .from('telegram_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Fetch financial data
      const { data: balanceData } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setDataSummary({
        account: {
          email: accountData.user?.email || '',
          fullName: accountData.user?.user_metadata?.full_name || '',
          createdAt: accountData.user?.created_at || '',
          lastLogin: accountData.user?.last_sign_in_at || '',
        },
        contacts: {
          total: contactsCount || 0,
          categories,
        },
        events: {
          total: eventsCount || 0,
          upcoming: upcomingEvents || 0,
          past: (eventsCount || 0) - (upcomingEvents || 0),
        },
        communications: {
          emailsSent: emailsSent || 0,
          telegramSent: telegramSent || 0,
          lastActivity: new Date().toISOString(), // This should be calculated from actual data
        },
        financial: {
          balance: balanceData?.balance || 0,
          transactions: transactionsCount || 0,
          subscription: subscriptionData?.tier || 'free',
        },
      })
    } catch (error) {
      console.error('Error fetching data summary:', error)
      toast({
        title: "Error",
        description: "Failed to load your data summary",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConsentSettings = async () => {
    try {
      // In a real implementation, this would come from a consent table
      // For now, we'll use default values
      setConsentSettings({
        marketing: true,
        analytics: true,
        thirdParty: false,
        dataProcessing: true,
        lastUpdated: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching consent settings:', error)
    }
  }

  const handleDataExport = async () => {
    try {
      setIsExporting(true)
      
      // Create a comprehensive data export
      const exportData = {
        exportDate: new Date().toISOString(),
        user: dataSummary?.account,
        dataSummary,
        consentSettings,
        // In a real implementation, you would fetch all the actual data here
        contacts: [],
        events: [],
        communications: [],
        transactions: [],
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sunrise-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Your data has been exported successfully",
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDataDeletion = async () => {
    try {
      setIsDeleting(true)
      
      // Use the proper API endpoint for data deletion
      const response = await fetch('/api/user/data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_DATA'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted",
      })

      // Sign out the user and redirect
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      console.error('Error deleting data:', error)
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete your account. Please contact support.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const updateConsent = async (type: keyof ConsentSettings, value: boolean) => {
    try {
      // In a real implementation, this would update a consent table
      setConsentSettings(prev => prev ? {
        ...prev,
        [type]: value,
        lastUpdated: new Date().toISOString(),
      } : null)

      toast({
        title: "Consent Updated",
        description: `Your ${type} consent has been updated`,
      })
    } catch (error) {
      console.error('Error updating consent:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update consent settings",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
        <div className="container mx-auto py-16 px-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-600">Loading your data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-orange-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-800">Data Management</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Manage your personal data and privacy settings in compliance with PDPA
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Button
              onClick={handleDataExport}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export My Data"}
            </Button>
            
            <Button
              onClick={() => setShowConsentDialog(true)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Consent
            </Button>
            
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>

          {/* Data Summary */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="data">Your Data</TabsTrigger>
              <TabsTrigger value="consent">Consent</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dataSummary?.contacts.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {Object.keys(dataSummary?.contacts.categories || {}).length} categories
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events Created</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dataSummary?.events.total || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dataSummary?.events.upcoming || 0} upcoming, {dataSummary?.events.past || 0} past
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(dataSummary?.communications.emailsSent || 0) + (dataSummary?.communications.telegramSent || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dataSummary?.communications.emailsSent || 0} emails, {dataSummary?.communications.telegramSent || 0} Telegram
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dataSummary?.financial.balance || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {dataSummary?.financial.subscription || 'free'} plan
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Data Retention Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Account Data</h4>
                      <p className="text-sm text-gray-600">Retained while account is active + 2 years after deletion</p>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Event Data</h4>
                      <p className="text-sm text-gray-600">Retained for 3 years after event date</p>
                      <Badge variant="outline">3 Years</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Contact Data</h4>
                      <p className="text-sm text-gray-600">Retained while account is active + 1 year after deletion</p>
                      <Badge variant="outline">1 Year</Badge>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Analytics Data</h4>
                      <p className="text-sm text-gray-600">Retained for 26 months (Google Analytics standard)</p>
                      <Badge variant="outline">26 Months</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <p className="text-gray-900">{dataSummary?.account.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <p className="text-gray-900">{dataSummary?.account.fullName || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Account Created</label>
                        <p className="text-gray-900">
                          {dataSummary?.account.createdAt ? 
                            new Date(dataSummary.account.createdAt).toLocaleDateString() : 
                            'Unknown'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Last Login</label>
                        <p className="text-gray-900">
                          {dataSummary?.account.lastLogin ? 
                            new Date(dataSummary.account.lastLogin).toLocaleDateString() : 
                            'Unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Contact Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dataSummary?.contacts.categories || {}).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="capitalize">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                      {Object.keys(dataSummary?.contacts.categories || {}).length === 0 && (
                        <p className="text-gray-500 text-sm">No contacts found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Event Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Total Events</span>
                        <Badge variant="secondary">{dataSummary?.events.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Upcoming Events</span>
                        <Badge variant="outline" className="text-green-600">{dataSummary?.events.upcoming}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Past Events</span>
                        <Badge variant="outline" className="text-gray-600">{dataSummary?.events.past}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="consent" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Consent Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Marketing Communications</h4>
                        <p className="text-sm text-gray-600">Receive promotional emails and updates about new features</p>
                      </div>
                      <Button
                        variant={consentSettings?.marketing ? "default" : "outline"}
                        onClick={() => updateConsent('marketing', !consentSettings?.marketing)}
                        size="sm"
                      >
                        {consentSettings?.marketing ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Analytics & Performance</h4>
                        <p className="text-sm text-gray-600">Help us improve our services through usage analytics</p>
                      </div>
                      <Button
                        variant={consentSettings?.analytics ? "default" : "outline"}
                        onClick={() => updateConsent('analytics', !consentSettings?.analytics)}
                        size="sm"
                      >
                        {consentSettings?.analytics ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Third-Party Services</h4>
                        <p className="text-sm text-gray-600">Allow data sharing with third-party service providers</p>
                      </div>
                      <Button
                        variant={consentSettings?.thirdParty ? "default" : "outline"}
                        onClick={() => updateConsent('thirdParty', !consentSettings?.thirdParty)}
                        size="sm"
                      >
                        {consentSettings?.thirdParty ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Data Processing</h4>
                        <p className="text-sm text-gray-600">Essential for providing our services (cannot be disabled)</p>
                      </div>
                      <Badge variant="secondary">Required</Badge>
                    </div>

                    <div className="text-sm text-gray-500 mt-4">
                      Last updated: {consentSettings?.lastUpdated ? 
                        new Date(consentSettings.lastUpdated).toLocaleString() : 
                        'Unknown'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <FileText className="h-5 w-5 mr-2" />
                  Your Rights Under PDPA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Access your personal data</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Correct inaccurate information</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Request data deletion</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <span>Withdraw consent</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-orange-700">
                  <strong>Response Time:</strong> We respond to data requests within 21 days as required by PDPA.
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Contact:</strong> For privacy concerns, email admin@sunrise-2025.com
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Complaints:</strong> You can file complaints with the Personal Data Protection Department.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data including:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Trash2 className="h-4 w-4 text-red-500 mr-2" />
              <span>All your contacts and event data</span>
            </div>
            <div className="flex items-center text-sm">
              <Trash2 className="h-4 w-4 text-red-500 mr-2" />
              <span>Communication history and logs</span>
            </div>
            <div className="flex items-center text-sm">
              <Trash2 className="h-4 w-4 text-red-500 mr-2" />
              <span>Account settings and preferences</span>
            </div>
            <div className="flex items-center text-sm">
              <Trash2 className="h-4 w-4 text-red-500 mr-2" />
              <span>Financial data and transaction history</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="delete-confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE_MY_DATA" to confirm
              </label>
              <input
                id="delete-confirmation"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => {
                  setDeleteConfirmation(e.target.value)
                  setIsDeleteConfirmed(e.target.value === 'DELETE_MY_DATA')
                }}
                placeholder="DELETE_MY_DATA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            {deleteConfirmation && !isDeleteConfirmed && (
              <p className="text-sm text-red-600">
                Please type exactly "DELETE_MY_DATA" to confirm deletion
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation('')
                setIsDeleteConfirmed(false)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDataDeletion}
              disabled={isDeleting || !isDeleteConfirmed}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consent Management Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Manage Consent Settings
            </DialogTitle>
            <DialogDescription>
              Control how we process your personal data. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Marketing Communications</h4>
                <p className="text-sm text-gray-600">Receive promotional emails and updates about new features</p>
              </div>
              <Button
                variant={consentSettings?.marketing ? "default" : "outline"}
                onClick={() => updateConsent('marketing', !consentSettings?.marketing)}
                size="sm"
              >
                {consentSettings?.marketing ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Analytics & Performance</h4>
                <p className="text-sm text-gray-600">Help us improve our services through usage analytics</p>
              </div>
              <Button
                variant={consentSettings?.analytics ? "default" : "outline"}
                onClick={() => updateConsent('analytics', !consentSettings?.analytics)}
                size="sm"
              >
                {consentSettings?.analytics ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold">Third-Party Services</h4>
                <p className="text-sm text-gray-600">Allow data sharing with third-party service providers</p>
              </div>
              <Button
                variant={consentSettings?.thirdParty ? "default" : "outline"}
                onClick={() => updateConsent('thirdParty', !consentSettings?.thirdParty)}
                size="sm"
              >
                {consentSettings?.thirdParty ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConsentDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 