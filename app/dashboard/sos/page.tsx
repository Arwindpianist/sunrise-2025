"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
import NotificationPermission from "@/components/notification-permission"
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  User, 
  Shield, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import haptics from "@/lib/haptics"

interface Contact {
  id: string
  first_name: string
  last_name?: string
  email: string
  phone: string
  telegram_chat_id?: string
  category: string
  created_at: string
  isSunriseUser?: boolean
  userId?: string // Sunrise user ID if they have an account
}

interface EmergencyContact {
  id: string
  contact_id: string
  is_active: boolean
  priority: number
  created_at: string
  contact: Contact
}

interface SosAlert {
  id: string
  status: string
  location_lat: number | null
  location_lng: number | null
  location_address: string | null
  triggered_at: string
  resolved_at: string | null
  notes: string | null
  created_at: string
}

export default function SosPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState("")
  const [priority, setPriority] = useState("1")
  
  // SOS Button states
  const [isPressed, setIsPressed] = useState(false)
  const [pressStartTime, setPressStartTime] = useState(0)
  const [pressProgress, setPressProgress] = useState(0)
  const [isTriggering, setIsTriggering] = useState(false)
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user) {
      fetchContacts()
      fetchEmergencyContacts()
      fetchSosAlerts()
    }
  }, [user])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('first_name', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      })
    }
  }

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) throw error
      
      console.log('Fetched emergency contacts:', data)
      
      // Check which contacts are Sunrise users
      const contactsWithUserStatus = await Promise.all(
        (data || []).map(async (emergencyContact) => {
          try {
            console.log(`Checking Sunrise user for: ${emergencyContact.contact.email}`)
            
            const response = await fetch('/api/contacts/check-sunrise-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: emergencyContact.contact.email
              }),
            })
            
            if (response.ok) {
              const result = await response.json()
              console.log(`Result for ${emergencyContact.contact.email}:`, result)
              
              return {
                ...emergencyContact,
                contact: {
                  ...emergencyContact.contact,
                  isSunriseUser: result.isSunriseUser,
                  userId: result.userId
                }
              }
            } else {
              console.error(`Failed to check user for ${emergencyContact.contact.email}:`, response.status, response.statusText)
            }
          } catch (error) {
            console.error('Error checking user status for', emergencyContact.contact.email, ':', error)
          }
          
          return {
            ...emergencyContact,
            contact: {
              ...emergencyContact.contact,
              isSunriseUser: false,
              userId: null
            }
          }
        })
      )
      
      console.log('Final emergency contacts with user status:', contactsWithUserStatus)
      setEmergencyContacts(contactsWithUserStatus)
    } catch (error) {
      console.error('Error fetching emergency contacts:', error)
      toast({
        title: "Error",
        description: "Failed to load emergency contacts",
        variant: "destructive",
      })
    }
  }

  const fetchSosAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('user_id', user?.id)
        .order('triggered_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSosAlerts(data || [])
    } catch (error) {
      console.error('Error fetching SOS alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEmergencyContact = async () => {
    if (!selectedContactId) {
      toast({
        title: "Error",
        description: "Please select a contact",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user?.id,
          contact_id: selectedContactId,
          priority: parseInt(priority),
          is_active: true
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Emergency contact added successfully",
      })

      setIsAddDialogOpen(false)
      setSelectedContactId("")
      setPriority("1")
      fetchEmergencyContacts()
    } catch (error: any) {
      console.error('Error adding emergency contact:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to add emergency contact",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveEmergencyContact = async (emergencyContactId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', emergencyContactId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Emergency contact removed successfully",
      })

      fetchEmergencyContacts()
    } catch (error: any) {
      console.error('Error removing emergency contact:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove emergency contact",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePriority = async (emergencyContactId: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ priority: newPriority })
        .eq('id', emergencyContactId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Priority updated successfully",
      })

      fetchEmergencyContacts()
    } catch (error: any) {
      console.error('Error updating priority:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update priority",
        variant: "destructive",
      })
    }
  }

  // SOS Button handlers
  const handlePressStart = () => {
    setIsPressed(true)
    setPressStartTime(Date.now())
    setPressProgress(0)

    // Trigger haptic feedback
    haptics.startContinuous()

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setPressProgress(prev => {
        const newProgress = prev + 2 // 2% every 40ms = 2 seconds total
        if (newProgress >= 100) {
          triggerSOS()
          return 100
        }
        return newProgress
      })
    }, 40)

    // Set timeout for 2 seconds
    pressTimeoutRef.current = setTimeout(() => {
      triggerSOS()
    }, 2000)
  }

  const handlePressEnd = () => {
    setIsPressed(false)
    setPressProgress(0)
    
    // Stop haptic feedback
    haptics.stopContinuous()
    
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const triggerSOS = async () => {
    if (isTriggering) return
    
    setIsTriggering(true)
    
    // Trigger SOS haptic pattern
    haptics.triggerSOS()
    
    try {
      // Get current location
      let locationData = {
        location_lat: null as number | null,
        location_lng: null as number | null,
        location_address: null as string | null
      }

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            })
          })

          locationData.location_lat = position.coords.latitude
          locationData.location_lng = position.coords.longitude

          // Try to get address from coordinates
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            )
            const data = await response.json()
            if (data.results && data.results[0]) {
              locationData.location_address = data.results[0].formatted_address
            }
          } catch (error) {
            console.error('Error getting address:', error)
          }
        } catch (error) {
          console.error('Error getting location:', error)
        }
      }

      // Create SOS alert
      const { data: sosAlert, error: sosError } = await supabase
        .from('sos_alerts')
        .insert({
          user_id: user?.id,
          status: 'active',
          ...locationData
        })
        .select()
        .single()

      if (sosError) throw sosError

      // Send notifications to emergency contacts
      await sendSosNotifications(sosAlert.id, locationData)

      toast({
        title: "SOS Alert Sent!",
        description: "Emergency contacts have been notified via Sunrise app",
      })

      fetchSosAlerts()
    } catch (error: any) {
      console.error('Error triggering SOS:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send SOS alert",
        variant: "destructive",
      })
    } finally {
      setIsTriggering(false)
      setIsPressed(false)
      setPressProgress(0)
    }
  }

  const sendSosNotifications = async (sosAlertId: string, locationData: any) => {
    try {
      for (const emergencyContact of emergencyContacts) {
        const contact = emergencyContact.contact
        
        // Only send notifications to Sunrise users
        if (!contact.isSunriseUser) {
          console.log(`Skipping notification for ${contact.email} - not a Sunrise user`)
          continue
        }
        
        // Create notification record for in-app notification
        const { data: notification, error: notificationError } = await supabase
          .from('sos_alert_notifications')
          .insert({
            sos_alert_id: sosAlertId,
            emergency_contact_id: emergencyContact.id,
            notification_type: 'in_app',
            status: 'pending'
          })
          .select()
          .single()

        if (notificationError) {
          console.error('Error creating notification record:', notificationError)
          continue
        }

        // Create in-app notification for the Sunrise user
        try {
          const notificationResponse = await fetch('/api/notifications/create-sos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipient_user_id: contact.userId, // This should be the Sunrise user's ID
              sos_alert_id: sosAlertId,
              notification_id: notification.id,
              user_name: user?.user_metadata?.full_name || user?.email,
              location: locationData.location_address || 'Location not available',
              triggered_at: new Date().toISOString()
            }),
          })

          if (!notificationResponse.ok) {
            throw new Error('Failed to create in-app notification')
          }

          // Update notification status to sent
          await supabase
            .from('sos_alert_notifications')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id)

        } catch (error) {
          console.error('Error creating in-app notification:', error)
          await supabase
            .from('sos_alert_notifications')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', notification.id)
        }
      }
    } catch (error) {
      console.error('Error sending SOS notifications:', error)
    }
  }

  const resolveSosAlert = async (sosAlertId: string) => {
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', sosAlertId)

      if (error) throw error

      toast({
        title: "Success",
        description: "SOS alert resolved",
      })

      fetchSosAlerts()
    } catch (error: any) {
      console.error('Error resolving SOS alert:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to resolve SOS alert",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500'
      case 'resolved':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="h-4 w-4" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SOS Emergency System</h1>
        <p className="text-gray-600">Manage your emergency contacts and send SOS alerts when needed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SOS Button Section */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Emergency SOS Button
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Press and hold for 2 seconds to send an SOS alert to all your emergency contacts via Sunrise app
              </p>
              
              <div className="relative inline-block">
                <button
                  className={cn(
                    "relative w-32 h-32 rounded-full border-4 transition-all duration-200 ease-out",
                    "focus:outline-none focus:ring-4 focus:ring-red-300",
                    isPressed 
                      ? "bg-red-600 border-red-700 scale-95 shadow-lg" 
                      : "bg-red-500 border-red-600 hover:bg-red-600 hover:border-red-700 hover:scale-105 shadow-md"
                  )}
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  disabled={isTriggering}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertTriangle className="h-12 w-12 text-white" />
                  </div>
                  
                  {/* Progress ring */}
                  {isPressed && (
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - pressProgress / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-100 ease-out"
                      />
                    </svg>
                  )}
                </button>
                
                {isPressed && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <p className="text-sm font-medium text-red-700">
                      {Math.round(pressProgress)}% - Keep holding...
                    </p>
                  </div>
                )}
              </div>

              {isTriggering && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    Sending SOS alert...
                  </p>
                </div>
              )}

              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <p>• Your location will be shared with emergency contacts</p>
                <p>• Only Sunrise users will receive in-app notifications</p>
                <p>• Notifications sent directly to the Sunrise app</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Setup */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPermission 
              forceShow={true}
              onPermissionGranted={() => {
                toast({
                  title: "Notifications Enabled!",
                  description: "You'll now receive SOS alerts and other important notifications.",
                })
              }}
            />
            
            {/* Test Buttons */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">Test the notification system:</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ test_type: 'in_app' })
                      })
                      const result = await response.json()
                      if (response.ok) {
                        toast({
                          title: "Test Success!",
                          description: "In-app notification created. Check your notifications page.",
                        })
                      } else {
                        toast({
                          title: "Test Failed",
                          description: result.error || "Failed to create test notification",
                          variant: "destructive"
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Test Error",
                        description: "Failed to send test notification",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  Test In-App
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ test_type: 'push' })
                      })
                      const result = await response.json()
                      if (response.ok) {
                        toast({
                          title: "Test Success!",
                          description: "Push notification sent. Check your device notifications.",
                        })
                      } else {
                        toast({
                          title: "Test Failed",
                          description: result.error || "Failed to send push notification",
                          variant: "destructive"
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Test Error",
                        description: "Failed to send test notification",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  Test Push
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/check-vapid')
                      const result = await response.json()
                      if (response.ok) {
                        toast({
                          title: "VAPID Check",
                          description: result.message,
                        })
                      } else {
                        toast({
                          title: "VAPID Check Failed",
                          description: result.error || "Failed to check VAPID configuration",
                          variant: "destructive"
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "VAPID Check Error",
                        description: "Failed to check VAPID configuration",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  Check VAPID
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                  <DialogDescription>
                    Select a contact from your contact list to add as an emergency contact. Only Sunrise users will receive notifications.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact">Contact</Label>
                    <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts
                          .filter(contact => !emergencyContacts.some(ec => ec.contact_id === contact.id))
                          .map(contact => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.first_name} {contact.last_name} ({contact.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Highest Priority</SelectItem>
                        <SelectItem value="2">2 - High Priority</SelectItem>
                        <SelectItem value="3">3 - Medium Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEmergencyContact} disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Contact"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No emergency contacts added yet</p>
                <p className="text-sm">Add contacts to receive SOS notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyContacts.map((emergencyContact) => (
                  <div
                    key={emergencyContact.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          Priority {emergencyContact.priority}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {emergencyContact.contact.first_name} {emergencyContact.contact.last_name}
                          </p>
                          {emergencyContact.contact.isSunriseUser ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Sunrise User
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              No Sunrise Account
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {emergencyContact.contact.email}
                          </span>
                          {emergencyContact.contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {emergencyContact.contact.phone}
                            </span>
                          )}
                        </div>
                        {!emergencyContact.contact.isSunriseUser && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ This contact won't receive SOS notifications
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={emergencyContact.priority.toString()}
                        onValueChange={(value) => handleUpdatePriority(emergencyContact.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Emergency Contact</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {emergencyContact.contact.first_name} from your emergency contacts?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveEmergencyContact(emergencyContact.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent SOS Alerts */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent SOS Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sosAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No SOS alerts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sosAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", getStatusColor(alert.status))}>
                      {getStatusIcon(alert.status)}
                    </div>
                    <div>
                      <p className="font-medium">
                        SOS Alert - {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.triggered_at).toLocaleString()}
                        </span>
                        {alert.location_address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {alert.location_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveSosAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
