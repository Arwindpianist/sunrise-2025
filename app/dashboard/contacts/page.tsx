"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Plus, Upload, Link as LinkIcon, Search, Edit2, Trash2, Settings, Phone, Mail, User, FileText, MoreVertical, Copy, AlertTriangle, MessageCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { canCreateContact, getLimitInfo, getLimitUpgradeRecommendation } from "@/lib/subscription-limits"
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
  telegram_chat_id?: string
  category: string
  notes: string
  created_at: string
}

interface OnboardingLink {
  id: string
  token: string
  title: string
  description: string
  expires_at: string | null
  max_uses: number
  current_uses: number
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
    telegram_chat_id: "",
    category: "__no_category__",
    notes: "",
  })
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false)
  const [onboardingLinks, setOnboardingLinks] = useState<OnboardingLink[]>([])
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false)
  const [onboardingFormData, setOnboardingFormData] = useState({
    title: "",
    description: "",
    expires_at: "",
    max_uses: 100,
  })
  const [editingLink, setEditingLink] = useState<OnboardingLink | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [isBatchEditDialogOpen, setIsBatchEditDialogOpen] = useState(false)
  const [batchEditCategory, setBatchEditCategory] = useState<string>("__no_category__")
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false)
  const [isDeletingLink, setIsDeletingLink] = useState(false)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [contactLimitCheck, setContactLimitCheck] = useState<{ 
    allowed: boolean; 
    currentCount: number; 
    maxAllowed: number; 
    tier: string;
  } | null>(null)

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
    fetchOnboardingLinks()
    generateShareableLink()
    checkContactLimit()
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

  const fetchOnboardingLinks = async () => {
    try {
      const response = await fetch("/api/onboarding-links")
      if (!response.ok) throw new Error("Failed to fetch onboarding links")
      const data = await response.json()
      setOnboardingLinks(data)
    } catch (error: any) {
      console.error('Error fetching onboarding links:', error)
    }
  }

  const checkContactLimit = async () => {
    try {
      if (!user) return
      const limitCheck = await canCreateContact()
      setContactLimitCheck(limitCheck)
    } catch (error) {
      console.error('Error checking contact limit:', error)
    }
  }

  const handleEditLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    try {
      const response = await fetch(`/api/onboarding-links/manage/${editingLink.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update onboarding link")
      }

      toast({
        title: "Success",
        description: "Onboarding link updated successfully",
      })

      setIsEditLinkDialogOpen(false)
      setEditingLink(null)
      setOnboardingFormData({
        title: "",
        description: "",
        expires_at: "",
        max_uses: 100,
      })
      fetchOnboardingLinks()
    } catch (error: any) {
      console.error("Error updating onboarding link:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update onboarding link",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this onboarding link? This action cannot be undone.")) {
      return
    }

    setIsDeletingLink(true)
    try {
      const response = await fetch(`/api/onboarding-links/manage/${linkId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete onboarding link")
      }

      toast({
        title: "Success",
        description: "Onboarding link deleted successfully",
      })

      fetchOnboardingLinks()
    } catch (error: any) {
      console.error("Error deleting onboarding link:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete onboarding link",
        variant: "destructive",
      })
    } finally {
      setIsDeletingLink(false)
    }
  }

  const openEditLinkDialog = (link: OnboardingLink) => {
    setEditingLink(link)
    setOnboardingFormData({
      title: link.title,
      description: link.description,
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : "",
      max_uses: link.max_uses,
    })
    setIsEditLinkDialogOpen(true)
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

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.limitReached) {
          const upgradeRec = getLimitUpgradeRecommendation(errorData.tier, 'contacts')
          throw new Error(`${errorData.error} ${upgradeRec ? upgradeRec.reason : ''}`)
        }
        throw new Error(errorData.error || "Failed to add contact")
      }

      toast({
        title: "Success",
        description: "Contact added successfully",
      })

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        telegram_chat_id: "",
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

      console.log("Updating contact with data:", contactData)
      console.log("Contact ID:", editingContact.id)

      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      })

      console.log("Update response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Update error data:", errorData)
        throw new Error(errorData.message || "Failed to update contact")
      }

      const updatedContact = await response.json()
      console.log("Updated contact:", updatedContact)

      toast({
        title: "Success",
        description: "Contact updated successfully",
      })

      setIsEditDialogOpen(false)
      setEditingContact(null)
      fetchContacts()
    } catch (error: any) {
      console.error("Error updating contact:", error)
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
      telegram_chat_id: contact.telegram_chat_id || "",
      category: contact.category || "__no_category__",
      notes: contact.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const handleBatchEditCategory = async () => {
    if (selectedContacts.size === 0) return

    setIsSubmitting(true)
    try {
      const categoryValue = batchEditCategory === "__no_category__" ? null : batchEditCategory
      
      const { error } = await supabase
        .from('contacts')
        .update({ category: categoryValue })
        .in('id', Array.from(selectedContacts))

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: `Updated category for ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}`,
      })

      setSelectedContacts(new Set())
      setIsBatchEditDialogOpen(false)
      fetchContacts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contacts",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedContacts.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }

    setIsBatchDeleting(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts))

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: `Deleted ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}`,
      })

      setSelectedContacts(new Set())
      fetchContacts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contacts",
        variant: "destructive",
      })
    } finally {
      setIsBatchDeleting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Contacts</h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base">Manage your event contacts and categories</p>
            </div>
            {contactLimitCheck && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-gray-600">
                  {contactLimitCheck.currentCount}/{contactLimitCheck.maxAllowed === -1 ? '∞' : contactLimitCheck.maxAllowed} contacts
                </span>
                {contactLimitCheck.maxAllowed !== -1 && (
                  <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (contactLimitCheck.currentCount / contactLimitCheck.maxAllowed) > 0.8 ? 'bg-red-500' :
                        (contactLimitCheck.currentCount / contactLimitCheck.maxAllowed) > 0.6 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (contactLimitCheck.currentCount / contactLimitCheck.maxAllowed) * 100)}%` }}
                    />
                  </div>
                )}
                {!contactLimitCheck.allowed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50 text-xs sm:text-sm"
                    onClick={() => window.open('/pricing', '_blank')}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Mobile Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-12 sm:h-10 text-xs sm:text-sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Invite Contacts</span>
                  <span className="md:hidden">Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm mx-auto">
                <DialogHeader className="px-4 sm:px-0">
                  <DialogTitle className="text-lg sm:text-xl">📋 Invite Contacts</DialogTitle>
                                      <DialogDescription className="text-sm">
                      Share this form to invite people to join your contact list. Perfect for collecting contact information from events, social media, or your website.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 px-4 sm:px-0">
                  {/* Quick Overview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Quick Overview</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      A simple form that lets people add themselves to your contact list. Perfect for collecting contacts from events, social media, or your website.
                    </p>
                    <div className="text-xs text-blue-700">
                      <p>✅ No account needed • Secure • Optional Telegram integration</p>
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-green-900 mb-2">🔗 Share Your Form</h3>
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <Input value={shareableLink} readOnly className="text-xs" />
                      <Button
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareableLink)
                          toast({
                            title: "Copied!",
                            description: "Link copied to clipboard",
                          })
                        }}
                        className="text-xs sm:text-sm"
                      >
                        Copy Link
                      </Button>
                    </div>
                    
                    {/* Pre-formatted Message */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-green-900 mb-2">📝 Pre-formatted Message</h4>
                      <div className="bg-white border border-green-300 rounded p-3 text-xs">
                        <p className="text-gray-700 mb-2">Copy this message to share with your contacts:</p>
                        <div className="bg-gray-50 p-2 rounded border text-gray-800 font-mono text-xs leading-relaxed">
                          Hi, I'm {user?.user_metadata?.full_name || 'updating my contact list'}. I'm updating my contact list and would appreciate it if you could fill in this short form with your details (email, phone number, and telegram id).<br/><br/>
                          {shareableLink}<br/><br/>
                          Your info will stay private and only be used if I need to contact you. Thank You {user?.user_metadata?.full_name || ''}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const message = `Hi, I'm ${user?.user_metadata?.full_name || 'updating my contact list'}. I'm updating my contact list and would appreciate it if you could fill in this short form with your details (email, phone number, and telegram id).

${shareableLink}

Your info will stay private and only be used if I need to contact you. Thank You ${user?.user_metadata?.full_name || ''}`
                            navigator.clipboard.writeText(message)
                            toast({
                              title: "Copied!",
                              description: "Message copied to clipboard",
                            })
                          }}
                          className="mt-2 text-xs"
                        >
                          Copy Message
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-green-700">
                      <p className="font-medium mb-1">Share this link on:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <span>📱 Social Media</span>
                        <span>💬 Messaging Apps</span>
                        <span>📧 Email</span>
                        <span>🌐 Your Website</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-orange-900 mb-2">💡 Quick Tips</h3>
                    <div className="text-xs text-orange-800 space-y-1">
                      <p>• Tell people what they'll receive (updates, invites)</p>
                      <p>• Set expectations for contact frequency</p>
                      <p>• Mention that their info is secure and private</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-12 sm:h-10 text-xs sm:text-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Categories</span>
                  <span className="md:hidden">Categories</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm mx-auto">
                <DialogHeader className="px-4 sm:px-0">
                  <DialogTitle className="text-lg sm:text-xl">Manage Contact Categories</DialogTitle>
                  <DialogDescription className="text-sm">
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

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-12 sm:h-10 text-xs sm:text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Import Contact</span>
                  <span className="md:hidden">Import</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm mx-auto">
                <DialogHeader className="px-4 sm:px-0">
                  <DialogTitle className="text-lg sm:text-xl">Add New Contact</DialogTitle>
                  <DialogDescription className="text-sm">
                    Fill in the contact details below.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4 px-4 sm:px-0">
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
                    <label htmlFor="telegram_chat_id" className="text-sm font-medium">
                      Telegram Chat ID
                    </label>
                    <Input
                      id="telegram_chat_id"
                      name="telegram_chat_id"
                      value={formData.telegram_chat_id}
                      onChange={handleFormChange}
                      placeholder="e.g., 123456789"
                    />
                    <p className="text-xs text-gray-500">
                      Optional: Allows sending Telegram messages to this contact
                    </p>
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

                  <Button type="submit" className="w-full h-12 text-sm sm:text-base" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Import Contact"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>



            <Dialog open={isOnboardingDialogOpen} onOpenChange={setIsOnboardingDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-12 sm:h-10 text-xs sm:text-sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Telegram Setup</span>
                  <span className="md:hidden">Telegram</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-sm mx-auto p-4 sm:p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg sm:text-xl">📱 Telegram Setup Links</DialogTitle>
                  <DialogDescription className="text-sm">
                    Create links for contacts to add themselves with Telegram Chat ID.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Onboarding Links List */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-3">Your Telegram Setup Links</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {onboardingLinks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No onboarding links created yet.</p>
                      ) : (
                        onboardingLinks.map((link) => (
                          <div key={link.id} className="p-3 border rounded-lg bg-gray-50">
                            <div className="space-y-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-base">{link.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {link.current_uses} of {link.max_uses} uses • 
                                  Created {new Date(link.created_at).toLocaleDateString()}
                                  {link.expires_at && (
                                    <span> • Expires {new Date(link.expires_at).toLocaleDateString()}</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = `${window.location.origin}/onboarding/${link.token}`
                                    const message = `Hi, I'm ${user?.user_metadata?.full_name || 'updating my contact list'}. I'm updating my contact list and would appreciate it if you could fill in this short form with your details (email, phone number, and telegram id).

${url}

Your info will stay private and only be used if I need to contact you. Thank You ${user?.user_metadata?.full_name || ''}`
                                    navigator.clipboard.writeText(message)
                                    toast({
                                      title: "Copied!",
                                      description: "Message copied to clipboard",
                                    })
                                  }}
                                  className="flex-1 sm:flex-none"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Copy Message
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditLinkDialog(link)}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteLink(link.id)}
                                  disabled={isDeletingLink}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {isDeletingLink ? "..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Create New Link Form */}
                  <div className="border-t pt-4">
                    {onboardingLinks.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
                        className="flex items-center justify-between w-full text-left mb-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        <h3 className="text-lg font-semibold">Create New Telegram Setup Link</h3>
                        {isCreateFormOpen ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    ) : (
                      <h3 className="text-lg font-semibold mb-4">Create New Telegram Setup Link</h3>
                    )}
                    
                    {(onboardingLinks.length === 0 || isCreateFormOpen) && (
                      <form onSubmit={async (e) => {
                        e.preventDefault()
                        try {
                          const response = await fetch("/api/onboarding-links", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(onboardingFormData),
                          })
                          
                          if (!response.ok) throw new Error("Failed to create link")
                          
                          toast({
                            title: "Success!",
                            description: "Onboarding link created successfully",
                          })
                          
                          setOnboardingFormData({
                            title: "",
                            description: "",
                            expires_at: "",
                            max_uses: 100,
                          })
                          
                          setIsCreateFormOpen(false)
                          fetchOnboardingLinks()
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to create link",
                            variant: "destructive",
                          })
                        }
                      }} className="space-y-3">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={onboardingFormData.title}
                              onChange={(e) => setOnboardingFormData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Join My Events"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="max_uses">Max Uses</Label>
                            <Input
                              id="max_uses"
                              type="number"
                              value={onboardingFormData.max_uses}
                              onChange={(e) => setOnboardingFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 100 }))}
                              min="1"
                              max="1000"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={onboardingFormData.description}
                            onChange={(e) => setOnboardingFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="e.g., Join my contact list to receive event invitations and updates"
                            rows={3}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="expires_at">Expires At (Optional)</Label>
                          <Input
                            id="expires_at"
                            type="datetime-local"
                            value={onboardingFormData.expires_at}
                            onChange={(e) => setOnboardingFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                          />
                        </div>
                        
                        <Button type="submit" className="w-full h-11">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Create Onboarding Link
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Onboarding Link Dialog */}
            <Dialog open={isEditLinkDialogOpen} onOpenChange={setIsEditLinkDialogOpen}>
              <DialogContent className="w-[95vw] max-w-2xl bg-white/95 backdrop-blur-sm mx-auto p-4 sm:p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-lg sm:text-xl">Edit Onboarding Link</DialogTitle>
                  <DialogDescription className="text-sm">
                    Update the onboarding link details below.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleEditLink} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_title">Title</Label>
                      <Input
                        id="edit_title"
                        value={onboardingFormData.title}
                        onChange={(e) => setOnboardingFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Join My Events"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_max_uses">Max Uses</Label>
                      <Input
                        id="edit_max_uses"
                        type="number"
                        value={onboardingFormData.max_uses}
                        onChange={(e) => setOnboardingFormData(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 100 }))}
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_description">Description</Label>
                    <Textarea
                      id="edit_description"
                      value={onboardingFormData.description}
                      onChange={(e) => setOnboardingFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Join my contact list to receive event invitations and updates"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_expires_at">Expires At (Optional)</Label>
                    <Input
                      id="edit_expires_at"
                      type="datetime-local"
                      value={onboardingFormData.expires_at}
                      onChange={(e) => setOnboardingFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 text-sm sm:text-base"
                      onClick={() => {
                        setIsEditLinkDialogOpen(false)
                        setEditingLink(null)
                        setOnboardingFormData({
                          title: "",
                          description: "",
                          expires_at: "",
                          max_uses: 100,
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 h-12 text-sm sm:text-base">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Update Link
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
            
            {/* Select All Checkbox */}
            {filteredContacts.length > 0 && (
              <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                />
                <label htmlFor="select-all" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                  Select all ({filteredContacts.length} contacts)
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Batch Operations */}
        {selectedContacts.size > 0 && (
          <Card className="mb-4 sm:mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-orange-800">
                    {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBatchEditDialogOpen(true)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs sm:text-sm"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Category
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    disabled={isBatchDeleting}
                    className="text-xs sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isBatchDeleting ? "Deleting..." : "Delete Selected"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className={`hover:shadow-md transition-shadow ${selectedContacts.has(contact.id) ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 mt-1 flex-shrink-0"
                      />
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
                        {!contact.telegram_chat_id && (
                          <DropdownMenuItem onClick={() => {
                            setIsOnboardingDialogOpen(true)
                            toast({
                              title: "Get Telegram Chat ID",
                              description: "Create an onboarding link to help this contact get their Telegram Chat ID",
                            })
                          }}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Get Telegram ID
                          </DropdownMenuItem>
                        )}
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
                    {contact.telegram_chat_id ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Telegram: {contact.telegram_chat_id}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>No Telegram ID</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            openEditDialog(contact)
                            toast({
                              title: "Add Telegram Chat ID",
                              description: "You can now add the Telegram Chat ID for this contact",
                            })
                          }}
                        >
                          Add ID
                        </Button>
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
          <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm mx-auto">
            <DialogHeader className="px-4 sm:px-0">
              <DialogTitle className="text-lg sm:text-xl">Edit Contact</DialogTitle>
              <DialogDescription className="text-sm">
                Update the contact details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditContact} className="space-y-4 px-4 sm:px-0">
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
                <label htmlFor="edit_telegram_chat_id" className="text-sm font-medium">
                  Telegram Chat ID
                </label>
                <Input
                  id="edit_telegram_chat_id"
                  name="telegram_chat_id"
                  value={formData.telegram_chat_id}
                  onChange={handleFormChange}
                  placeholder="e.g., 123456789"
                />
                <p className="text-xs text-gray-500">
                  Optional: Allows sending Telegram messages to this contact. 
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      // Open onboarding link dialog to help user get chat ID
                      setIsOnboardingDialogOpen(true)
                    }}
                  >
                    Need help getting Chat ID?
                  </Button>
                </p>
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
                  className="flex-1 h-12 text-sm sm:text-base"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingContact(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-12 text-sm sm:text-base" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Batch Edit Category Dialog */}
        <Dialog open={isBatchEditDialogOpen} onOpenChange={setIsBatchEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm mx-auto">
            <DialogHeader className="px-4 sm:px-0">
              <DialogTitle className="text-lg sm:text-xl">Edit Category for {selectedContacts.size} Contact{selectedContacts.size > 1 ? 's' : ''}</DialogTitle>
              <DialogDescription className="text-sm">
                Select a new category for the selected contacts.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 px-4 sm:px-0">
              <div className="space-y-2">
                <Label htmlFor="batch_category">Category</Label>
                <Select
                  value={batchEditCategory}
                  onValueChange={setBatchEditCategory}
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
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 text-sm sm:text-base"
                  onClick={() => setIsBatchEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBatchEditCategory} 
                  className="flex-1 h-12 text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 