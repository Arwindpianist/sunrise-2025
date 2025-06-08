"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Plus, Upload, Link as LinkIcon, Search, Edit2, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  category: string
  notes: string
  created_at: string
}

const CATEGORIES = [
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "guest", label: "Guest" },
  { value: "other", label: "Other" },
]

export default function ContactsPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [shareableLink, setShareableLink] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    category: "other",
    notes: "",
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check for OAuth callback errors
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')
    const imported = searchParams.get('imported')

    if (error) {
      let errorMessage = 'An error occurred while importing contacts'
      switch (error) {
        case 'session_expired':
          errorMessage = 'Your session has expired. Please log in again.'
          break
        case 'missing_parameters':
          errorMessage = 'Missing required parameters for Google import.'
          break
        case 'token_exchange_failed':
          errorMessage = 'Failed to authenticate with Google.'
          break
        case 'contacts_fetch_failed':
          errorMessage = 'Failed to fetch contacts from Google.'
          break
        case 'insert_failed':
          errorMessage = 'Failed to save imported contacts.'
          break
        case 'internal_error':
          errorMessage = 'An internal error occurred.'
          break
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } else if (imported) {
      const count = parseInt(imported)
      if (count > 0) {
        toast({
          title: "Success",
          description: `Successfully imported ${count} contacts from Google.`,
        })
      } else {
        toast({
          title: "No Contacts",
          description: "No contacts were found to import from Google.",
        })
      }
    }

    fetchContacts()
    generateShareableLink()
  }, [user, router])

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (!response.ok) throw new Error("Failed to fetch contacts")
      const data = await response.json()
      setContacts(data)
      setFilteredContacts(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load contacts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateShareableLink = () => {
    if (!user) return
    const baseUrl = window.location.origin
    setShareableLink(`${baseUrl}/contact-form/${user.id}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterContacts(query, selectedCategory)
  }

  const handleFilterCategoryChange = (category: string) => {
    setSelectedCategory(category)
    filterContacts(searchQuery, category)
  }

  const filterContacts = (query: string, category: string) => {
    let filtered = contacts

    if (query) {
      const searchLower = query.toLowerCase()
      filtered = filtered.filter(
        contact =>
          contact.first_name.toLowerCase().includes(searchLower) ||
          contact.last_name.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower)
      )
    }

    if (category !== "all") {
      filtered = filtered.filter(contact => contact.category === category)
    }

    setFilteredContacts(filtered)
  }

  const handleImportGoogle = async () => {
    try {
      window.location.href = '/api/oauth/google/initiate'
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete contact")

      setContacts(contacts.filter(contact => contact.id !== contactId))
      setFilteredContacts(filteredContacts.filter(contact => contact.id !== contactId))
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      })
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add contact")
      }

      const newContact = await response.json()
      setContacts([newContact, ...contacts])
      setFilteredContacts([newContact, ...filteredContacts])
      
      // Reset form and close dialog
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "other",
        notes: "",
      })
      setIsAddDialogOpen(false)

      toast({
        title: "Success",
        description: "Contact added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Contacts</h1>
            <p className="text-gray-600">Manage your event contacts and categories</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Share Form
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Contact Form</DialogTitle>
                  <DialogDescription>
                    Share this link with your contacts to let them add their details:
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input value={shareableLink} readOnly />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareableLink)
                      toast({
                        title: "Copied!",
                        description: "Link copied to clipboard",
                      })
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleImportGoogle}>
              <Upload className="h-4 w-4 mr-2" />
              Import from Google
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Fill in the contact details below.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="first_name" className="text-sm font-medium">
                        First Name *
                      </label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last_name" className="text-sm font-medium">
                        Last Name *
                      </label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Contact"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={handleFilterCategoryChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No contacts found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>
                        {CATEGORIES.find(c => c.value === contact.category)?.label || contact.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {/* TODO: Implement edit */}}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 