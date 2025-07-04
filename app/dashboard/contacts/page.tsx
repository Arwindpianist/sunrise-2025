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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Plus, Upload, Link as LinkIcon, Search, Edit2, Trash2, Settings, Phone, Mail, User, FileText, MoreVertical } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import CategoryManager from "@/components/category-manager"
import PhoneImport from "@/components/phone-import"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email: string
  phone: string
  category: string
  notes: string
  created_at: string
}

interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

export default function ContactsPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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
    category: "__no_category__",
    notes: "",
  })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)

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
    fetchCategories()
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/contacts/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(data)
    } catch (error: any) {
      console.error('Error fetching categories:', error)
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
          contact.last_name?.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower)
      )
    }

    if (category === "__no_category__") {
      filtered = filtered.filter(contact => !contact.category || contact.category === "")
    } else if (category !== "all") {
      filtered = filtered.filter(contact => contact.category === category)
    }

    setFilteredContacts(filtered)
  }

  const handleImportGoogle = async () => {
    try {
      const response = await fetch("/api/oauth/google/initiate")
      if (!response.ok) throw new Error("Failed to initiate Google import")
      const data = await response.json()
      window.location.href = data.authUrl
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import from Google",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete contact")
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      })
      fetchContacts()
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
      const contactData = {
        ...formData,
        category: formData.category === "__no_category__" ? "" : formData.category,
      }

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) throw new Error("Failed to add contact")

      toast({
        title: "Success",
        description: "Contact added successfully",
      })

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "__no_category__",
        notes: "",
      })
      setIsAddDialogOpen(false)
      fetchContacts()
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
  }

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return
    setIsSubmitting(true)

    try {
      const contactData = {
        ...formData,
        category: formData.category === "__no_category__" ? "" : formData.category,
      }

      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) throw new Error("Failed to update contact")

      toast({
        title: "Success",
        description: "Contact updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingContact(null)
      fetchContacts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name || "",
      email: contact.email,
      phone: contact.phone || "",
      category: contact.category || "__no_category__",
      notes: contact.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Contacts</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your event contacts and categories</p>
        </div>

        {/* Action Buttons - Mobile Responsive */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-12 md:h-10">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Share</span>
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
            
            <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-12 md:h-10">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Categories</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Contact Categories</DialogTitle>
                  <DialogDescription>
                    Create and manage custom categories to organize your contacts.
                  </DialogDescription>
                </DialogHeader>
                <CategoryManager onCategoryChange={(newCategories) => {
                  setCategories(newCategories)
                  fetchContacts()
                }} />
              </DialogContent>
            </Dialog>

            <PhoneImport 
              categories={categories} 
              onImportComplete={fetchContacts}
            />
            
            <Button 
              onClick={handleImportGoogle} 
              size="sm" 
              className="h-12 md:h-10"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Google</span>
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-12 md:h-10 col-span-2 md:col-span-1">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Add Contact</span>
                  <span className="md:hidden">Add</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Last Name
                      </label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleFormChange}
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
                      value={formData.category || "__no_category__"}
                      onValueChange={handleCategoryChange}
                    >
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

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={selectedCategory}
                onValueChange={handleFilterCategoryChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="__no_category__">No Category</SelectItem>
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
          </CardContent>
        </Card>

        {/* Contacts Grid - Mobile Card Layout */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first contact"
                }
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Contact
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {contact.first_name} {contact.last_name}
                      </h3>
                      {contact.category && (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mt-1"
                          style={{ 
                            backgroundColor: categories.find(c => c.name === contact.category)?.color || '#6B7280'
                          }}
                        >
                          {contact.category}
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    {contact.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{contact.phone}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="flex items-start text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{contact.notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Contact Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update the contact details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit_first_name" className="text-sm font-medium">
                    First Name *
                  </label>
                  <Input
                    id="edit_first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit_last_name" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="edit_last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit_email" className="text-sm font-medium">
                  Email *
                </label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit_phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="edit_phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+60 12-345 6789"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit_category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formData.category || "__no_category__"}
                  onValueChange={handleCategoryChange}
                >
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

              <div className="space-y-2">
                <label htmlFor="edit_notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="edit_notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={4}
                  placeholder="Add any additional notes about this contact..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingContact(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 