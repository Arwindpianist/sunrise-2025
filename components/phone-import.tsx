"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Upload, FileText, Smartphone, Users, Share2, AlertCircle, ExternalLink } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface PhoneImportProps {
  categories: Category[]
  onImportComplete: () => void
}

// Type definitions for native contacts API
interface ContactInfo {
  name?: string[]
  email?: string[]
  tel?: string[]
  address?: string[]
  icon?: string[]
  url?: string[]
}

interface ContactSelectOptions {
  multiple?: boolean
  properties?: string[]
}

interface ContactsManager {
  select(properties: string[], options?: ContactSelectOptions): Promise<ContactInfo[]>
}

declare global {
  interface Navigator {
    contacts?: ContactsManager
  }
}

export default function PhoneImport({ categories, onImportComplete }: PhoneImportProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("__no_category__")
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importMethod, setImportMethod] = useState<'native' | 'file' | 'share' | 'google'>('native')
  const [isNativeSupported, setIsNativeSupported] = useState(false)
  const [isShareSupported, setIsShareSupported] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for native APIs support
  useEffect(() => {
    // Check for Contacts API support
    const hasContactsAPI = 'contacts' in navigator && 
                          navigator.contacts &&
                          'select' in navigator.contacts &&
                          navigator.contacts.select instanceof Function
    
    // Check for Web Share API support
    const hasShareAPI = 'share' in navigator && 
                       navigator.share instanceof Function
    
    // Additional checks for mobile browsers
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSecure = window.location.protocol === 'https:'
    const isLocalhost = window.location.hostname === 'localhost'
    const isDev = window.location.hostname === '127.0.0.1'
    
    // Check for specific browser support
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)
    const isEdge = /Edge/.test(navigator.userAgent)
    
    // Contacts API support varies by browser
    let contactsSupported = false
    if (hasContactsAPI && (isSecure || isLocalhost || isDev) && isMobile) {
      // Chrome on Android has good support
      if (isChrome && /Android/.test(navigator.userAgent)) {
        contactsSupported = true
      }
      // Safari on iOS has limited support
      else if (isSafari && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        contactsSupported = true
      }
      // Firefox and Edge have limited support
      else if (isFirefox || isEdge) {
        contactsSupported = true
      }
    }
    
    // Web Share API support
    const shareSupported = hasShareAPI && (isSecure || isLocalhost || isDev) && isMobile
    
    setIsNativeSupported(!!contactsSupported)
    setIsShareSupported(!!shareSupported)
    
    console.log('API Support Check:', {
      contactsAPI: hasContactsAPI,
      shareAPI: hasShareAPI,
      isMobile,
      isSecure,
      isLocalhost,
      isDev,
      isChrome,
      isSafari,
      isFirefox,
      isEdge,
      contactsSupported,
      shareSupported,
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    })
  }, [])

  const handleNativeContactImport = async () => {
    if (!navigator.contacts) {
      toast({
        title: "Not Supported",
        description: "Native contact access is not supported in this browser. Try uploading a file instead.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Attempting to open contact selector...')
      console.log('Navigator contacts:', navigator.contacts)
      console.log('Available methods:', Object.getOwnPropertyNames(navigator.contacts))
      
      // Request contact properties (only use supported ones)
      const contacts = await navigator.contacts.select(
        ['name', 'email', 'tel'],
        { multiple: true }
      )

      if (contacts.length === 0) {
        toast({
          title: "No Contacts Selected",
          description: "Please select at least one contact to import.",
        })
        return
      }

      // Process native contacts with basic data extraction
      const processedContacts = contacts.map(contact => {
        const name = contact.name?.[0] || 'Unknown'
        const nameParts = name.split(' ')
        
        // Extract first and last name
        let firstName = nameParts[0] || 'Unknown'
        let lastName = nameParts.slice(1).join(' ') || undefined
        
        return {
          first_name: firstName,
          last_name: lastName,
          email: contact.email?.[0] || undefined,
          phone: contact.tel?.[0] || undefined,
        }
      })

      // Filter out contacts without email (required by database)
      const validContacts = processedContacts.filter(contact => 
        contact.email
      )

      if (validContacts.length === 0) {
        toast({
          title: "No Valid Contacts",
          description: "Selected contacts must have an email address. Phone-only contacts cannot be imported.",
          variant: "destructive",
        })
        return
      }

      // Show warning if some contacts were filtered out
      const invalidContacts = processedContacts.filter(contact => !contact.email)
      if (invalidContacts.length > 0) {
        toast({
          title: "Some Contacts Skipped",
          description: `${invalidContacts.length} contacts without email addresses were skipped. Only contacts with email addresses can be imported.`,
          variant: "default",
        })
      }

      setPreviewData(validContacts.slice(0, 5))
      
      // Import the contacts
      await importContacts(validContacts)
      
    } catch (error: any) {
      console.error('Native contact import error:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      // Provide more specific error messages
      let errorMessage = "Failed to import contacts from phone"
      let showFallback = false
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permission denied. Please allow access to your contacts."
        showFallback = true
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Contact picker is not supported on this device or browser."
        showFallback = true
      } else if (error.name === 'AbortError') {
        errorMessage = "Contact selection was cancelled."
      } else if (error.message && error.message.includes('unable to open contact selector')) {
        errorMessage = "Unable to open contact selector. This may be due to browser restrictions or device limitations."
        showFallback = true
      } else if (error.message) {
        errorMessage = error.message
        showFallback = true
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      })

      // Show fallback options if appropriate
      if (showFallback) {
        setTimeout(() => {
          toast({
            title: "Try Alternative Methods",
            description: "You can try Google Contacts export or file upload instead.",
            variant: "default",
          })
        }, 2000)
      }
    }
  }

  const handleShareImport = async () => {
    if (!navigator.share) {
      toast({
        title: "Not Supported",
        description: "Web Share API is not supported in this browser.",
        variant: "destructive",
      })
      return
    }

    try {
      const shareData = {
        title: 'Import Contacts',
        text: 'Please share your contacts with this app',
        url: window.location.href
      }

      await navigator.share(shareData)
      
      toast({
        title: "Share Requested",
        description: "Please select your contacts app to share contacts.",
      })
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Share Failed",
          description: "Failed to open share dialog",
          variant: "destructive",
        })
      }
    }
  }

  const handleGoogleImport = async () => {
    try {
      // Open Google Contacts main page
      const googleContactsUrl = 'https://contacts.google.com'
      window.open(googleContactsUrl, '_blank')
      
      toast({
        title: "Google Contacts Opened",
        description: "Please sign in, then click 'Export' in the left sidebar to download your contacts as CSV.",
      })
      
      // Switch to file upload method
      setImportMethod('file')
    } catch (error: any) {
      toast({
        title: "Google Import Failed",
        description: "Failed to open Google Contacts",
        variant: "destructive",
      })
    }
  }

  const openGoogleContactsGuide = () => {
    // Create a comprehensive guide modal or open detailed instructions
    const guideSteps = [
      "1. Go to https://contacts.google.com",
      "2. Sign in with your Google account", 
      "3. Look for 'Export' in the left sidebar (or hamburger menu on mobile)",
      "4. Click 'Export' to open export options",
      "5. Select 'Google CSV' format",
      "6. Choose which contacts to export (All contacts recommended)",
      "7. Click 'Export' to download the CSV file",
      "8. Upload the CSV file here"
    ]
    
    const guideText = guideSteps.join('\n\n')
    
    // Show detailed instructions
    toast({
      title: "Google Contacts Export Guide",
      description: "Check the console for detailed steps",
      variant: "default",
    })
    
    console.log('📱 Google Contacts Export Guide:')
    console.log('================================')
    console.log(guideText)
    console.log('================================')
    
    // Also show in an alert for easy copying
    alert(`📱 Google Contacts Export Guide:\n\n${guideText}`)
  }

  const openDetailedGuide = () => {
    // Open the detailed guide in a new tab
    const guideUrl = '/GOOGLE_CONTACTS_GUIDE.md'
    window.open(guideUrl, '_blank')
    
    toast({
      title: "Detailed Guide Opened",
      description: "Check the new tab for comprehensive instructions",
      variant: "default",
    })
  }

  const testContactsAPI = async () => {
    console.log('Testing Contacts API...')
    console.log('navigator.contacts:', navigator.contacts)
    
    if (!navigator.contacts) {
      console.log('Contacts API not available')
      return
    }
    
    try {
      console.log('Testing with minimal properties...')
      const testContacts = await navigator.contacts.select(['name'], { multiple: false })
      console.log('Test successful:', testContacts)
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['.vcf', '.csv', 'text/vcard', 'text/csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidType = validTypes.includes(file.type) || validTypes.includes(fileExtension)

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .vcf or .csv file",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    await previewFile(file)
  }

  const previewFile = async (file: File) => {
    try {
      const text = await file.text()
      let contacts: any[] = []

      if (file.name.toLowerCase().endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
        contacts = parseVCardPreview(text)
      } else if (file.name.toLowerCase().endsWith('.csv') || text.includes(',')) {
        contacts = parseCSVPreview(text)
      }

      setPreviewData(contacts.slice(0, 5)) // Show first 5 contacts as preview
    } catch (error) {
      console.error('Error previewing file:', error)
      toast({
        title: "Error",
        description: "Failed to preview file",
        variant: "destructive",
      })
    }
  }

  const parseVCardPreview = (content: string): any[] => {
    const contacts: any[] = []
    const vcards = content.split('BEGIN:VCARD')
    
    for (const vcard of vcards.slice(0, 5)) {
      if (!vcard.trim()) continue
      
      const lines = vcard.split('\n')
      let contact: any = { first_name: 'Unknown' }
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        if (trimmedLine.startsWith('FN:')) {
          const fullName = trimmedLine.substring(3).replace(/\\/g, '')
          const nameParts = fullName.split(' ')
          contact.first_name = nameParts[0] || 'Unknown'
          contact.last_name = nameParts.slice(1).join(' ') || undefined
        }
        
        if (trimmedLine.startsWith('EMAIL:')) {
          contact.email = trimmedLine.substring(6).replace(/\\/g, '')
        }
        
        if (trimmedLine.startsWith('TEL:')) {
          contact.phone = trimmedLine.substring(4).replace(/\\/g, '')
        }
      }
      
      if (contact.first_name !== 'Unknown' || contact.email || contact.phone) {
        contacts.push(contact)
      }
    }
    
    return contacts
  }

  const parseCSVPreview = (content: string): any[] => {
    const contacts: any[] = []
    const lines = content.split('\n')
    const dataLines = lines.slice(1, 6) // First 5 data rows
    
    for (const line of dataLines) {
      if (!line.trim()) continue
      
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
      
      if (columns.length >= 2) {
        contacts.push({
          first_name: columns[0] || 'Unknown',
          last_name: columns[1] || undefined,
          email: columns[2] || undefined,
          phone: columns[3] || undefined,
        })
      }
    }
    
    return contacts
  }

  const importContacts = async (contacts: any[]) => {
    setIsUploading(true)

    try {
      const response = await fetch('/api/contacts/import/native', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts,
          category: selectedCategory === '__no_category__' ? '' : selectedCategory,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import contacts')
      }

      toast({
        title: "Success",
        description: result.message || `Successfully imported ${result.imported} contacts`,
      })

      setIsDialogOpen(false)
      resetForm()
      onImportComplete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', selectedCategory === '__no_category__' ? '' : selectedCategory)

      const response = await fetch('/api/contacts/import/phone', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import contacts')
      }

      toast({
        title: "Success",
        description: result.message || `Successfully imported ${result.imported} contacts`,
      })

      setIsDialogOpen(false)
      resetForm()
      onImportComplete()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setSelectedCategory("__no_category__")
    setPreviewData([])
    setImportMethod('native')
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Smartphone className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Import from Phone</span>
          <span className="sm:hidden">Import Contacts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Import Contacts from Phone</DialogTitle>
          <DialogDescription className="text-sm">
            Choose how you'd like to import contacts from your phone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">📱 Import Method</label>
            
            {/* Google Contacts Import - Most Recommended */}
            <div className="space-y-2">
              <Button
                variant={importMethod === 'google' ? 'default' : 'outline'}
                onClick={() => setImportMethod('google')}
                className="w-full justify-start h-12 text-left"
              >
                <FileText className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Google Contacts Export</span>
                  <span className="text-xs text-gray-500">Most reliable method</span>
                </div>
                <div className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Recommended
                </div>
              </Button>
              {importMethod === 'google' && (
                <div className="space-y-2 pl-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openGoogleContactsGuide}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 h-8"
                  >
                    📖 Quick Setup Guide
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openDetailedGuide}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 h-8"
                  >
                    📋 Detailed Instructions
                  </Button>
                </div>
              )}
            </div>

            {/* File Upload */}
            <Button
              variant={importMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setImportMethod('file')}
              className="w-full justify-start h-12 text-left"
            >
              <Upload className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Upload Contact File</span>
                <span className="text-xs text-gray-500">VCF or CSV files</span>
              </div>
            </Button>

            {/* Native Contact Access */}
            <div className="space-y-2">
              <Button
                variant={importMethod === 'native' ? 'default' : 'outline'}
                onClick={() => setImportMethod('native')}
                className="w-full justify-start h-12 text-left"
                disabled={!isNativeSupported}
              >
                <Users className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Direct Contact Picker</span>
                  <span className="text-xs text-gray-500">Select from phone contacts</span>
                </div>
                {!isNativeSupported && (
                  <AlertCircle className="h-4 w-4 ml-auto text-orange-500 flex-shrink-0" />
                )}
              </Button>
              {!isNativeSupported && (
                <div className="ml-4 space-y-1 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700 font-medium">
                    ⚠️ Not available on this device
                  </p>
                  <p className="text-xs text-orange-600">
                    Requires HTTPS and mobile browser. Try Google export or file upload instead.
                  </p>
                </div>
              )}
            </div>

            {/* Web Share API */}
            <div className="space-y-2">
              <Button
                variant={importMethod === 'share' ? 'default' : 'outline'}
                onClick={() => setImportMethod('share')}
                className="w-full justify-start h-12 text-left"
                disabled={!isShareSupported}
              >
                <Share2 className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Share from Contacts App</span>
                  <span className="text-xs text-gray-500">Use phone's share menu</span>
                </div>
                {!isShareSupported && (
                  <AlertCircle className="h-4 w-4 ml-auto text-orange-500 flex-shrink-0" />
                )}
              </Button>
              {!isShareSupported && (
                <div className="ml-4 space-y-1 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700 font-medium">
                    ⚠️ Not available on this device
                  </p>
                  <p className="text-xs text-orange-600">
                    Requires HTTPS and mobile browser. Try Google export or file upload instead.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Native Contact Import */}
          {importMethod === 'native' && isNativeSupported && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This will open your phone's contact picker to select contacts directly.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Note:</strong> Only contacts with email addresses can be imported.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testContactsAPI}
                  className="mt-2 text-xs"
                >
                  Test Contacts API
                </Button>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">🏷️ Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a category for organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full" />
                        <span>No category</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  onClick={handleNativeContactImport}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Select Contacts
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Web Share Import */}
          {importMethod === 'share' && isShareSupported && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  This will open your phone's share menu to share contacts from your contacts app.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  onClick={handleShareImport}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Contacts
                </Button>
              </div>
            </div>
          )}

          {/* Google Contacts Import */}
          {importMethod === 'google' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-2">Google Contacts Export</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Export your contacts from Google Contacts and upload the CSV file here.
                    </p>
                    
                    <Button onClick={handleGoogleImport} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Google Contacts
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 bg-white border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600 font-medium text-sm">📋 Quick Steps:</span>
                  </div>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Click "Open Google Contacts" above</li>
                    <li>Sign in to your Google account</li>
                    <li>Look for "Export" in the left sidebar</li>
                    <li>Click "Export" to open export options</li>
                    <li>Select "Google CSV" format</li>
                    <li>Choose "All contacts" (recommended)</li>
                    <li>Click "Export" to download</li>
                    <li>Upload the CSV file below</li>
                  </ol>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">🏷️ Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a category for organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full" />
                        <span>No category</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  onClick={handleGoogleImport}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Contacts
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Import */}
          {importMethod === 'file' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">📁 Select Contact File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.csv,text/vcard,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-12"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Choose Contact File
                    </Button>
                    <div className="text-center space-y-1">
                      <p className="text-sm text-gray-600 font-medium">
                        Supported formats: .vcf, .csv
                      </p>
                      <p className="text-xs text-orange-600">
                        ⚠️ Only contacts with email addresses can be imported
                      </p>
                    </div>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-green-600">Ready to import</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">🏷️ Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Choose a category for organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full" />
                        <span>No category</span>
                      </div>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">👥 Contact Preview</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto border">
                    <div className="space-y-2">
                      {previewData.map((contact, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {contact.first_name?.[0] || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {contact.first_name} {contact.last_name || ''}
                            </div>
                            {contact.email && (
                              <div className="text-xs text-gray-600 truncate">
                                📧 {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="text-xs text-gray-600 truncate">
                                📞 {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {previewData.length === 5 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            ... and more contacts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Contacts
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 