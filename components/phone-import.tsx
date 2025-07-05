"use client"

import { useState, useRef } from "react"
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
import { Upload, FileText, Smartphone } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
}

interface PhoneImportProps {
  categories: Category[]
  onImportComplete: () => void
}

export default function PhoneImport({ categories, onImportComplete }: PhoneImportProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("__no_category__")
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            Upload a vCard (.vcf) or CSV file from your phone to import contacts.
          </DialogDescription>
        </DialogHeader>

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

          {categories.length > 0 && (
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
          )}

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
      </DialogContent>
    </Dialog>
  )
} 