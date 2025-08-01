"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Download, FileText, Users, AlertTriangle, Info } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface Contact {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string | null
  telegram_chat_id: string | null
  category: string
  notes: string | null
  created_at: string
}

export default function ExportContactsPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [contactCount, setContactCount] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchContacts()
  }, [user, router])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching contacts:', error)
        toast({
          title: "Error",
          description: "Failed to fetch contacts",
          variant: "destructive",
        })
        return
      }

      setContacts(data || [])
      setContactCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = async () => {
    if (contacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "There are no contacts to export",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Use the API endpoint for export
      const response = await fetch('/api/contacts/export?format=simple')
      
      if (!response.ok) {
        throw new Error('Failed to export contacts')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'sunrise-contacts.csv'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful!",
        description: `${contactCount} contacts exported to CSV file`,
      })
    } catch (error) {
      console.error('Error exporting contacts:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export contacts to CSV",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToGoogleFormat = async () => {
    if (contacts.length === 0) {
      toast({
        title: "No Contacts",
        description: "There are no contacts to export",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Use the API endpoint for Google format export
      const response = await fetch('/api/contacts/export?format=google')
      
      if (!response.ok) {
        throw new Error('Failed to export contacts')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'google-contacts.csv'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful!",
        description: `${contactCount} contacts exported in Google Contacts format`,
      })
    } catch (error) {
      console.error('Error exporting contacts:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export contacts to CSV",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contacts...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Debugging Page</AlertTitle>
            <AlertDescription>
              This page is for debugging purposes only. It allows you to export your contacts to CSV format 
              for easy import into another account. This page is not linked from the main navigation.
            </AlertDescription>
          </Alert>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Contact Export</AlertTitle>
            <AlertDescription>
              You have <strong>{contactCount}</strong> contacts in your account. 
              Choose an export format below to download your contacts.
            </AlertDescription>
          </Alert>

          {/* Contact Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-700">Contact Summary</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Contacts:</span>
                <span className="ml-2 font-medium">{contactCount}</span>
              </div>
              <div>
                <span className="text-gray-600">With Email:</span>
                <span className="ml-2 font-medium">
                  {contacts.filter(c => c.email).length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">With Phone:</span>
                <span className="ml-2 font-medium">
                  {contacts.filter(c => c.phone).length}
                </span>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Simple CSV Export */}
              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-orange-500" />
                    <h4 className="font-medium">Simple CSV Format</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Export contacts in a simple CSV format with basic fields. 
                    Good for general use and easy to read.
                  </p>
                  <Button 
                    onClick={exportToCSV}
                    disabled={isExporting || contactCount === 0}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? 'Exporting...' : 'Export Simple CSV'}
                  </Button>
                </CardContent>
              </Card>

              {/* Google Contacts Format */}
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium">Google Contacts Format</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Export contacts in Google Contacts format. 
                    Perfect for importing into Google Contacts or other Sunrise accounts.
                  </p>
                  <Button 
                    onClick={exportToGoogleFormat}
                    disabled={isExporting || contactCount === 0}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? 'Exporting...' : 'Export Google Format'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How to Import Exported Contacts</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>For Sunrise Import:</strong> Use the "Simple CSV Format" export and import via the contacts page.</p>
              <p><strong>For Google Contacts:</strong> Use the "Google Contacts Format" export and import into Google Contacts.</p>
              <p><strong>For Other Accounts:</strong> The exported CSV files can be imported into most contact management systems.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 