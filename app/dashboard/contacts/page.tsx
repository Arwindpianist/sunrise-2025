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
import { Plus, Upload, Link as LinkIcon, Search, Edit2, Trash2, Settings } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import CategoryManager from "@/components/category-manager"
import PhoneImport from "@/components/phone-import"

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
      const { error } = await supabase
        .from('contacts')
        .insert([
          {
            user_id: user?.id,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim() || null,
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            category: formData.category === "__no_category__" ? "" : formData.category,
            notes: formData.notes.trim() || null,
          },
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Contact added successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "__no_category__",
        notes: "",
      })
      fetchContacts()
    } catch (error) {
      console.error('Error adding contact:', error)
      toast({
        title: "Error",
        description: "Failed to add contact",
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

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || null,
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          category: formData.category === "__no_category__" ? "" : formData.category,
          notes: formData.notes.trim() || null,
        })
        .eq('id', editingContact.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Contact updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingContact(null)
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "__no_category__",
        notes: "",
      })
      fetchContacts()
    } catch (error) {
      console.error('Error updating contact:', error)
      toast({
        title: "Error",
        description: "Failed to update contact",
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
      category: contact.category,
      notes: contact.notes || "",
    })
    setIsEditDialogOpen(true)
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
            
            <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Categories
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
                  // Refresh contacts to update category displays
                  fetchContacts()
                }} />
              </DialogContent>
            </Dialog>

            <PhoneImport 
              categories={categories} 
              onImportComplete={fetchContacts}
            />
            
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
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name ? contact.last_name : ''}
                      </TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone || "-"}</TableCell>
                      <TableCell>
                        {contact.category ? (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ 
                              backgroundColor: categories.find(c => c.name === contact.category)?.color || '#6B7280'
                            }}
                          >
                            {contact.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No category</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {contact.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(contact)}
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
              <div className="grid grid-cols-2 gap-4">
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