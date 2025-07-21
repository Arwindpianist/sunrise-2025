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
import { Upload, FileText, Smartphone, Users, Share2, AlertCircle } from "lucide-react"

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
  organization?: string[]
  title?: string[]
  note?: string[]
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
    
    // Contacts API requires HTTPS and mobile (allow localhost/127.0.0.1 for development)
    const contactsSupported = hasContactsAPI && (isSecure || isLocalhost || isDev) && isMobile
    
    // Web Share API requires HTTPS and mobile (allow localhost/127.0.0.1 for development)
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
      // Request more contact properties for better data
      const contacts = await navigator.contacts.select(
        ['name', 'email', 'tel', 'organization', 'title', 'note'],
        { multiple: true }
      )

      if (contacts.length === 0) {
        toast({
          title: "No Contacts Selected",
          description: "Please select at least one contact to import.",
        })
        return
      }

      // Process native contacts with enhanced data extraction
      const processedContacts = contacts.map(contact => {
        const name = contact.name?.[0] || 'Unknown'
        const nameParts = name.split(' ')
        
        // Extract first and last name more intelligently
        let firstName = nameParts[0] || 'Unknown'
        let lastName = nameParts.slice(1).join(' ') || undefined
        
        // If no last name but we have organization, use it as a hint
        if (!lastName && contact.organization?.[0]) {
          lastName = contact.organization[0]
        }
        
        // Create notes from available data
        const notes = []
        if (contact.organization?.[0]) notes.push(`Organization: ${contact.organization[0]}`)
        if (contact.title?.[0]) notes.push(`Title: ${contact.title[0]}`)
        if (contact.note?.[0]) notes.push(`Note: ${contact.note[0]}`)
        
        return {
          first_name: firstName,
          last_name: lastName,
          email: contact.email?.[0] || undefined,
          phone: contact.tel?.[0] || undefined,
          notes: notes.length > 0 ? notes.join(' | ') : undefined,
        }
      })

      // Filter out contacts without email or phone
      const validContacts = processedContacts.filter(contact => 
        contact.email || contact.phone
      )

      if (validContacts.length === 0) {
        toast({
          title: "No Valid Contacts",
          description: "Selected contacts must have at least an email or phone number.",
          variant: "destructive",
        })
        return
      }

      setPreviewData(validContacts.slice(0, 5))
      
      // Import the contacts
      await importContacts(validContacts)
      
    } catch (error: any) {
      console.error('Native contact import error:', error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to import contacts from phone"
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permission denied. Please allow access to your contacts."
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Contact picker is not supported on this device or browser."
      } else if (error.name === 'AbortError') {
        errorMessage = "Contact selection was cancelled."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      })
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
      // Open Google Contacts export page
      const googleContactsUrl = 'https://contacts.google.com/export'
      window.open(googleContactsUrl, '_blank')
      
      toast({
        title: "Google Contacts Export",
        description: "Please export your contacts as CSV and upload the file here.",
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
        description: `Successfully imported ${result.imported} contacts`,
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
        description: `Successfully imported ${result.imported} contacts`,
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
        <Button variant="outline">
          <Smartphone className="h-4 w-4 mr-2" />
          Import from Phone
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contacts from Phone</DialogTitle>
          <DialogDescription>
            Choose how you'd like to import contacts from your phone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Import Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Import Method</label>
            
            {/* Native Contact Access */}
            <div className="space-y-2">
              <Button
                variant={importMethod === 'native' ? 'default' : 'outline'}
                onClick={() => setImportMethod('native')}
                className="w-full justify-start"
                disabled={!isNativeSupported}
              >
                <Users className="h-4 w-4 mr-2" />
                Native Contact Access
                {!isNativeSupported && (
                  <AlertCircle className="h-4 w-4 ml-auto text-orange-500" />
                )}
              </Button>
              {!isNativeSupported && (
                <div className="ml-6 space-y-1">
                  <p className="text-xs text-gray-500">
                    Requires HTTPS and mobile browser
                  </p>
                  <p className="text-xs text-gray-400">
                    Try file upload or Google import instead
                  </p>
                </div>
              )}
            </div>

            {/* Web Share API */}
            <div className="space-y-2">
              <Button
                variant={importMethod === 'share' ? 'default' : 'outline'}
                onClick={() => setImportMethod('share')}
                className="w-full justify-start"
                disabled={!isShareSupported}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Contacts
                {!isShareSupported && (
                  <AlertCircle className="h-4 w-4 ml-auto text-orange-500" />
                )}
              </Button>
              {!isShareSupported && (
                <div className="ml-6 space-y-1">
                  <p className="text-xs text-gray-500">
                    Requires HTTPS and mobile browser
                  </p>
                  <p className="text-xs text-gray-400">
                    Try file upload or Google import instead
                  </p>
                </div>
              )}
            </div>

            {/* File Upload */}
            <Button
              variant={importMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setImportMethod('file')}
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File (.vcf/.csv)
            </Button>

            {/* Google Contacts Import */}
            <Button
              variant={importMethod === 'google' ? 'default' : 'outline'}
              onClick={() => setImportMethod('google')}
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Google Contacts
            </Button>
          </div>

          {/* Native Contact Import */}
          {importMethod === 'native' && isNativeSupported && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This will open your phone's contact picker to select contacts directly.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNativeContactImport}
                  disabled={isUploading}
                >
                  {isUploading ? "Importing..." : "Select Contacts"}
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
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleShareImport}
                >
                  Share Contacts
                </Button>
              </div>
            </div>
          )}

          {/* Google Contacts Import */}
          {importMethod === 'google' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Export your Google Contacts and upload the CSV file here.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGoogleImport}
                >
                  Export from Google
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Import */}
          {importMethod === 'file' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.csv,text/vcard,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports .vcf and .csv files
                  </p>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category (Optional)</label>
                <Select value={selectedCategory || "__no_category__"} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {previewData.map((contact, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {contact.first_name} {contact.last_name || ''}
                        {contact.email && ` • ${contact.email}`}
                        {contact.phone && ` • ${contact.phone}`}
                      </div>
                    ))}
                    {previewData.length === 5 && (
                      <div className="text-xs text-gray-400 mt-1">
                        ... and more contacts
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? "Importing..." : "Import Contacts"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 