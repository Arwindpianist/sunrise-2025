"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import SosOnboarding from "@/components/sos-onboarding"
import NotificationPermission from "@/components/notification-permission"
import PWAInstallGuide from "@/components/pwa-install-guide"
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  Shield,
  Download,
  Bell,
  Smartphone,
  Wifi,
  WifiOff,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import haptics from "@/lib/haptics"
import { urlBase64ToUint8Array, arrayBufferToBase64 } from "@/lib/push-subscription-utils"

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



export default function SosPage() {
  const { user, supabase } = useSupabase()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState("")
  const [priority, setPriority] = useState("1")
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  // SOS Button states
  const [isPressed, setIsPressed] = useState(false)
  const [pressStartTime, setPressStartTime] = useState(0)
  const [pressProgress, setPressProgress] = useState(0)
  const [isTriggering, setIsTriggering] = useState(false)
  const [lastSosTrigger, setLastSosTrigger] = useState(0)
  const [cooldownTime, setCooldownTime] = useState(0)
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // PWA state
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = useState(false)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [showPWAInstallGuide, setShowPWAInstallGuide] = useState(false)

  useEffect(() => {
    if (user) {
      fetchContacts()
      fetchEmergencyContacts()
      checkOnboardingStatus()
      checkPWAStatus()
      checkNotificationPermission()
      checkPushSubscriptionStatus()
    }
  }, [user])

  // PWA and notification setup
  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check PWA installation status
    const checkPWAInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInApp = (window.navigator as any).standalone === true
      setIsPWAInstalled(isStandalone || isInApp)
    }
    
    checkPWAInstallation()
    
    // Listen for PWA installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setShowPWAInstallPrompt(true)
    })
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkPWAStatus = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInApp = (window.navigator as any).standalone === true
    setIsPWAInstalled(isStandalone || isInApp)
  }

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const checkPushSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          console.log('Local push subscription found:', subscription.endpoint)
        } else {
          console.log('No local push subscription found')
        }
      }
    } catch (error) {
      console.error('Error checking push subscription status:', error)
    }
  }

  const handlePWAInstall = async () => {
    try {
      // Show the PWA install guide
      setShowPWAInstallGuide(true)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleNotificationPermissionRequest = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        setShowNotificationPrompt(false)
        toast({
          title: "Notifications Enabled!",
          description: "You'll now receive emergency SOS alerts even when the app is closed.",
        })
      } else {
        toast({
          title: "Notifications Disabled",
          description: "Emergency alerts may not work properly without notification permission.",
          variant: "destructive"
        })
      }
    }
  }

  const testEmergencyNotification = async () => {
    if (notificationPermission !== 'granted') {
      toast({
        title: "Notifications Required",
        description: "Please enable notifications first to test emergency alerts.",
        variant: "destructive"
      })
      return
    }

    try {
      // Test local notification
      const testNotification = new Notification('🚨 TEST SOS ALERT', {
        body: 'This is a test emergency notification. In a real emergency, this would alert your contacts.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        requireInteraction: true,
        tag: 'test-sos-alert'
      })

      // Test vibration if available
      if ('vibrate' in navigator) {
        navigator.vibrate([1000, 500, 1000, 500, 1000])
      }

      toast({
        title: "Test Notification Sent",
        description: "Check your notification panel to see the test emergency alert.",
      })
    } catch (error) {
      console.error('Error testing notification:', error)
      toast({
        title: "Test Failed",
        description: "Could not send test notification. Please check your browser settings.",
        variant: "destructive"
      })
    }
  }

  const testPushNotification = async () => {
    try {
      const response = await fetch('/api/sos/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Push Test Sent!",
          description: "Check your device for the test push notification.",
        })
      } else {
        toast({
          title: "Push Test Failed",
          description: result.error || "Failed to send test push notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error testing push notification:', error)
      toast({
        title: "Push Test Error",
        description: "Could not send test push notification",
        variant: "destructive"
      })
    }
  }

  const debugSubscription = async () => {
    try {
      const response = await fetch('/api/sos/debug-subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (response.ok) {
        console.log('Debug subscription result:', result)
        toast({
          title: "Debug Info Retrieved",
          description: `Found ${result.subscriptions.active} active push subscriptions. Check console for details.`,
        })
      } else {
        toast({
          title: "Debug Failed",
          description: result.error || "Failed to get debug information",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error getting debug info:', error)
      toast({
        title: "Debug Error",
        description: "Could not get debug information",
        variant: "destructive"
      })
    }
  }

  const clearPushSubscriptions = async () => {
    try {
      // Clear local service worker subscriptions
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            console.log('Unsubscribing from local push subscription')
            await subscription.unsubscribe()
          }
        }
      }

      // Clear database subscriptions
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user?.id)

      if (error) {
        console.error('Failed to clear database subscriptions:', error)
        toast({
          title: "Error",
          description: "Failed to clear some subscriptions from database.",
          variant: "destructive"
        })
        return
      }

      // Update local state
      checkNotificationPermission()

      toast({
        title: "Subscriptions Cleared",
        description: "All push subscriptions have been cleared. You can now set up fresh subscriptions.",
      })

    } catch (error) {
      console.error('Error clearing subscriptions:', error)
      toast({
        title: "Clear Failed",
        description: "Failed to clear subscriptions. Please try again.",
        variant: "destructive"
      })
    }
  }

  const setupPushNotifications = async () => {
    try {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in this browser.",
          variant: "destructive"
        })
        return
      }

      // First check VAPID configuration
      const vapidCheckResponse = await fetch('/api/check-vapid')
      const vapidCheck = await vapidCheckResponse.json()
      
      if (!vapidCheck.isConfigured) {
        toast({
          title: "Configuration Error",
          description: "Push notification configuration is incomplete. Please contact support.",
          variant: "destructive"
        })
        console.error('VAPID configuration check failed:', vapidCheck)
        return
      }

      console.log('VAPID configuration check passed:', vapidCheck)

      // Request notification permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive emergency alerts.",
          variant: "destructive"
        })
        return
      }

      // Unregister any existing service workers first
      const existingRegistrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of existingRegistrations) {
        console.log('Unregistering existing service worker:', registration.scope)
        await registration.unregister()
      }

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)

      // Wait for service worker to be ready and active
      await navigator.serviceWorker.ready
      
      // Additional wait to ensure service worker is fully active
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        toast({
          title: "Configuration Error",
          description: "Push notification configuration is incomplete.",
          variant: "destructive"
        })
        return
      }

      console.log('VAPID public key available, length:', vapidPublicKey.length)

      // Convert VAPID key
      const vapidPublicKeyArray = urlBase64ToUint8Array(vapidPublicKey) as Uint8Array
      console.log('VAPID key converted to Uint8Array, length:', vapidPublicKeyArray.length)

      // Check if we already have a subscription and unsubscribe first
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('Unsubscribing from existing subscription')
        await existingSubscription.unsubscribe()
      }

      // Subscribe to push notifications with retry logic
      let subscription
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKeyArray as BufferSource
          })
          console.log('Push subscription created successfully on attempt', retryCount + 1)
          break
        } catch (error) {
          retryCount++
          console.error(`Push subscription attempt ${retryCount} failed:`, error)
          
          if (retryCount >= maxRetries) {
            throw error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
        }
      }

      if (!subscription) {
        throw new Error('Failed to create push subscription after all retries')
      }

      console.log('Push subscription created:', subscription)

      // Save subscription to database
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      console.log('Saving subscription to database:', {
        endpoint: subscriptionData.endpoint,
        p256dh_length: subscriptionData.keys.p256dh.length,
        auth_length: subscriptionData.keys.auth.length
      })

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user?.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          is_active: true,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save subscription:', error)
        toast({
          title: "Error",
          description: "Failed to save notification settings.",
          variant: "destructive"
        })
        return
      }

      // Update local state
      setNotificationPermission('granted')
      checkNotificationPermission()

      toast({
        title: "Push Notifications Enabled!",
        description: "You'll now receive emergency SOS alerts on your device.",
      })

    } catch (error) {
      console.error('Error setting up push notifications:', error)
      
      let errorMessage = "Failed to set up push notifications. Please try again."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Push service error. Please try refreshing the page and setting up again."
        } else if (error.message.includes('push service error')) {
          errorMessage = "Push service unavailable. Please check your internet connection and try again."
        } else if (error.message.includes('Registration failed')) {
          errorMessage = "Service worker registration failed. Please try refreshing the page."
        }
      }
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
    }
  }, [])

  const checkOnboardingStatus = () => {
    // Check if user has completed SOS onboarding
    const hasCompletedOnboarding = localStorage.getItem('sos-onboarding-completed')
    const hasEmergencyContacts = emergencyContacts.length > 0
    
    // Show onboarding if:
    // 1. User hasn't completed it before
    // 2. User has no emergency contacts (first time setup)
    // 3. User explicitly wants to see it again
    if (!hasCompletedOnboarding || (!hasEmergencyContacts && emergencyContacts.length === 0)) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('sos-onboarding-completed', 'true')
    setShowOnboarding(false)
    toast({
      title: "SOS Setup Complete!",
      description: "Your emergency system is ready to use. Press and hold the SOS button when needed.",
    })
  }

  const handleOnboardingSkip = () => {
    setShowOnboarding(false)
    toast({
      title: "Tutorial Skipped",
      description: "You can access the SOS tutorial anytime from the help menu.",
    })
  }

  // Utility function to reset onboarding (for testing)
  const resetOnboarding = () => {
    localStorage.removeItem('sos-onboarding-completed')
    setShowOnboarding(true)
  }

  // Cleanup duplicate SOS alerts
  const cleanupDuplicates = async () => {
    try {
      const response = await fetch('/api/sos/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: "Cleanup Complete!",
          description: result.message,
        })
        // Refresh emergency contacts to show updated data
        fetchEmergencyContacts()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error cleaning up duplicates:', error)
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup duplicate records",
        variant: "destructive",
      })
    }
  }

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

    // Trigger haptic feedback only after user interaction
    try {
      haptics.startContinuous()
    } catch (error) {
      console.log('Haptic feedback not available:', error)
    }

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
    try {
      haptics.stopContinuous()
    } catch (error) {
      console.log('Haptic feedback stop failed:', error)
    }
    
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
    
    // Prevent multiple SOS triggers within 5 seconds
    const now = Date.now()
    if (cooldownTime > 0) {
      console.log('SOS trigger blocked - system is in cooldown')
      return
    }
    
    // Clear all timers and intervals to prevent multiple triggers
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    
    setIsTriggering(true)
    setLastSosTrigger(now)
    
    // Start cooldown timer
    setCooldownTime(5000)
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1000) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current)
            cooldownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1000
      })
    }, 1000)
    
    // Trigger SOS haptic pattern
    try {
      haptics.triggerSOS()
    } catch (error) {
      console.log('SOS haptic feedback not available:', error)
    }
    
    try {
      // Get current location
      let locationData = {
        location_lat: null as number | null,
        location_lng: null as number | null,
        location_address: null as string | null
      }

      // Try to get location with proper error handling
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false, // Reduced accuracy to avoid permissions issues
              timeout: 5000, // Shorter timeout
              maximumAge: 300000 // 5 minutes cache
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
            console.log('Could not get address from coordinates:', error)
          }
        } catch (error: any) {
          console.log('Location access denied or unavailable:', error.message)
          // Don't retry - just continue without location
        }
      } else {
        console.log('Geolocation not supported')
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
      let totalSent = 0
      let totalFailed = 0
      const results = []

      // Send notifications to each emergency contact individually
      for (const emergencyContact of emergencyContacts) {
        const contact = emergencyContact.contact
        
        // Only send notifications to Sunrise users
        if (!contact.isSunriseUser) {
          console.log(`Skipping notification for ${contact.email} - not a Sunrise user`)
          continue
        }
        
        // Create notification record for emergency notification
        const { data: notification, error: notificationError } = await supabase
          .from('sos_alert_notifications')
          .insert({
            sos_alert_id: sosAlertId,
            emergency_contact_id: emergencyContact.id,
            notification_type: 'push',
            status: 'pending'
          })
          .select()
          .single()

        if (notificationError) {
          console.error('Error creating notification record:', notificationError)
          totalFailed++
          continue
        }

        // Send emergency push notification using the working single-channel API
        try {
          const emergencyResponse = await fetch('/api/sos/send-emergency-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sos_alert_id: sosAlertId,
              recipient_user_id: contact.userId,
              user_name: user?.user_metadata?.full_name || user?.email,
              user_email: user?.email,
              user_phone: user?.user_metadata?.phone || 'Not provided',
              location: locationData.location_address || 'Location not available',
              location_lat: locationData.location_lat,
              location_lng: locationData.location_lng,
              triggered_at: new Date().toISOString(),
              emergency_contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
              emergency_contact_priority: emergencyContact.priority
            }),
          })

          if (emergencyResponse.ok) {
            const result = await emergencyResponse.json()
            console.log('Emergency notification sent successfully:', result)
            totalSent++
            
            // Update notification status to sent
            await supabase
              .from('sos_alert_notifications')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', notification.id)
          } else {
            const errorData = await emergencyResponse.json()
            console.error('Failed to send emergency notification:', errorData)
            totalFailed++
            
            // Update notification status to failed
            await supabase
              .from('sos_alert_notifications')
              .update({ 
                status: 'failed',
                error_message: errorData.message || 'Unknown error'
              })
              .eq('id', notification.id)
          }

        } catch (error) {
          console.error('Error sending emergency notification:', error)
          totalFailed++
          
          // Update notification status to failed
          await supabase
            .from('sos_alert_notifications')
            .update({ 
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', notification.id)
        }
      }

      // Show success message with notification summary
      if (totalSent > 0) {
        toast({
          title: "Emergency Alert Sent!",
          description: `Notified ${totalSent} emergency contacts${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`,
        })
      } else {
        toast({
          title: "Emergency Alert Failed",
          description: "No emergency contacts could be notified. Please check your contact settings.",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('Error sending SOS notifications:', error)
      toast({
        title: "Emergency Alert Error",
        description: error instanceof Error ? error.message : "Failed to send emergency notifications",
        variant: "destructive"
      })
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      {/* Mobile-friendly header */}
      <div className="mb-6 sm:mb-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Emergency SOS</h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">Press and hold the SOS button to alert your emergency contacts</p>
          
          {/* PWA Status Indicators */}
          <div className="flex justify-center gap-2 mt-3 mb-2">
            {/* Online/Offline Status */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              isOnline 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            )}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            
            {/* PWA Installation Status */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              isPWAInstalled 
                ? "bg-blue-100 text-blue-700" 
                : "bg-orange-100 text-orange-700"
            )}>
              <Smartphone className="h-3 w-3" />
              {isPWAInstalled ? "PWA Installed" : "Install PWA"}
            </div>
            
            {/* Notification Permission Status */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              notificationPermission === 'granted'
                ? "bg-green-100 text-green-700"
                : notificationPermission === 'denied'
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            )}>
              <Bell className="h-3 w-3" />
              {notificationPermission === 'granted' ? "Notifications On" : 
               notificationPermission === 'denied' ? "Notifications Off" : "Enable Notifications"}
            </div>
          </div>
          
          {isTriggering && (
            <p className="text-sm text-orange-600 mt-2">Sending SOS alert...</p>
          )}
          {cooldownTime > 0 && !isTriggering && (
            <p className="text-sm text-gray-500 mt-2">
              SOS system cooling down... ({Math.ceil(cooldownTime / 1000)}s)
            </p>
          )}
        </div>
        
        {/* Mobile-friendly action buttons */}
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="text-xs px-3 py-2"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Tutorial
          </Button>
          
          {/* PWA Install Button */}
          {!isPWAInstalled && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePWAInstall}
              className="text-xs px-3 py-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Download className="h-3 w-3 mr-1" />
              Install App
            </Button>
          )}
          
          {/* Notification Permission Button */}
          {notificationPermission !== 'granted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNotificationPermissionRequest}
              className="text-xs px-3 py-2 text-green-600 border-green-200 hover:bg-green-50"
            >
              <Bell className="h-3 w-3 mr-1" />
              Enable Notifications
            </Button>
          )}

          {/* Setup Push Notifications Button */}
          {notificationPermission === 'granted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={setupPushNotifications}
              className="text-xs px-3 py-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Bell className="h-3 w-3 mr-1" />
              Setup Push
            </Button>
          )}
          
          {/* Test Notification Button */}
          {notificationPermission === 'granted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={testEmergencyNotification}
              className="text-xs px-3 py-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Bell className="h-3 w-3 mr-1" />
              Test Alert
            </Button>
          )}

          {/* Test Push Notification Button */}
          {notificationPermission === 'granted' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={testPushNotification}
              className="text-xs px-3 py-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Bell className="h-3 w-3 mr-1" />
              Test Push
            </Button>
          )}

          {/* Debug Subscription Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={debugSubscription}
            className="text-xs px-3 py-2 text-gray-600 border-gray-200 hover:bg-gray-50"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Debug
          </Button>

          {/* Clear Subscriptions Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearPushSubscriptions}
            className="text-xs px-3 py-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={cleanupDuplicates}
            className="text-xs px-3 py-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Main SOS Button - Mobile Responsive */}
      <div className="flex justify-center mb-8 sm:mb-12">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <button
              className={cn(
                "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-4 focus:ring-red-300",
                isPressed 
                  ? "bg-red-600 border-red-700 scale-95 shadow-lg" 
                  : isTriggering || cooldownTime > 0
                  ? "bg-gray-400 border-gray-500 cursor-not-allowed"
                  : "bg-red-500 border-red-600 hover:bg-red-600 hover:border-red-700 hover:scale-105 shadow-md"
              )}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              disabled={isTriggering || cooldownTime > 0}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
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
            <div className="p-3 bg-red-100 rounded-lg max-w-sm mx-auto">
              <p className="text-sm text-red-700 font-medium">
                Sending SOS alert...
              </p>
            </div>
          )}

          <div className="text-xs sm:text-sm text-gray-500 space-y-1 max-w-md mx-auto px-4">
            <p>• Press and hold for 2 seconds to activate</p>
            <p>• Your location will be shared with emergency contacts</p>
            <p>• Only Sunrise users will receive notifications</p>
            {!isPWAInstalled && (
              <p className="text-orange-600 font-medium">• Install as PWA for best emergency experience</p>
            )}
            {notificationPermission !== 'granted' && (
              <p className="text-red-600 font-medium">• Enable notifications for emergency alerts</p>
            )}
            {!isOnline && (
              <p className="text-red-600 font-medium">• Offline mode - alerts may be delayed</p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts Section - Mobile Responsive */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">Add Emergency Contact</DialogTitle>
                <DialogDescription className="text-sm">
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
              <p className="text-sm mb-4">Add contacts to receive SOS notifications</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowOnboarding(true)}
                className="text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Start Setup Tutorial
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((emergencyContact) => (
                <div
                  key={emergencyContact.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        Priority {emergencyContact.priority}
                      </Badge>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="font-medium text-sm sm:text-base">
                          {emergencyContact.contact.first_name} {emergencyContact.contact.last_name}
                        </p>
                        {emergencyContact.contact.isSunriseUser ? (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 w-fit">
                            Sunrise User
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 w-fit">
                            No Sunrise Account
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{emergencyContact.contact.email}</span>
                        </span>
                        {emergencyContact.contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
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
                  <div className="flex items-center gap-2 sm:gap-2">
                    <Select
                      value={emergencyContact.priority.toString()}
                      onValueChange={(value) => handleUpdatePriority(emergencyContact.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-16 sm:w-20">
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
                        <Button variant="ghost" size="sm" className="p-2">
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

      {/* SOS Onboarding Tutorial */}
      <SosOnboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        emergencyContactsCount={emergencyContacts.length}
      />

      {/* PWA Install Guide */}
      <PWAInstallGuide
        isOpen={showPWAInstallGuide}
        onClose={() => setShowPWAInstallGuide(false)}
        isPWAInstalled={isPWAInstalled}
        notificationPermission={notificationPermission}
      />
    </div>
  )
}
