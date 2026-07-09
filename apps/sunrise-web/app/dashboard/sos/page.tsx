"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { useSession } from "next-auth/react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useBrand } from "@repo/ui/brand-provider"
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
import { featureFlags } from "@/lib/feature-flags"

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
  if (!featureFlags.enableSos) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Emergency SOS is temporarily paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We are currently upgrading the platform. SOS features will be restored after maintenance.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user } = useSupabase()
  const { data: session } = useSession()
  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"
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

    // Listen for manual guide request from banner
    const handleShowPWAGuide = () => {
      setShowPWAInstallGuide(true)
    }
    
    window.addEventListener('show-pwa-guide', handleShowPWAGuide)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('show-pwa-guide', handleShowPWAGuide)
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
      // Test local notification with enhanced options
      const testNotification = new Notification('🚨 TEST SOS ALERT', {
        body: 'This is a test emergency notification. In a real emergency, this would alert your contacts.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        requireInteraction: true,
        tag: 'test-sos-alert',
        silent: false, // Force sound
        data: {
          type: 'test_sos_alert',
          timestamp: Date.now()
        }
      })

      // Test vibration if available (with fallback for mobile)
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([1000, 500, 1000, 500, 1000])
        } catch (vibrateError) {
          console.log('Vibration not supported or blocked:', vibrateError)
        }
      }

      // Test sound generation for mobile
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        } catch (audioError) {
          console.log('Audio generation failed:', audioError)
        }
      }

      toast({
        title: "Test Notification Sent",
        description: "Check your notification panel to see the test emergency alert.",
      })
    } catch (error) {
      console.error('Error testing notification:', error)
      
      let errorMessage = "Could not send test notification. Please check your browser settings."
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Notifications are blocked. Please check your browser settings and allow notifications."
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Local notifications are not supported in this browser or context."
        }
      }
      
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const testPushNotification = async () => {
    try {
      console.log('🧪 Starting test push notification...')
      
      const response = await fetch('/api/sos/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('📡 Test push API response status:', response.status)
      
      const result = await response.json()
      console.log('📊 Test push result:', result)

      if (response.ok) {
        console.log('✅ Test push notification sent successfully:', result)
        toast({
          title: "Push Test Sent!",
          description: "Check your device for the test push notification.",
        })
      } else {
        console.error('❌ Failed to send test push notification:', result)
        toast({
          title: "Push Test Failed",
          description: result.error || "Failed to send test push notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('💥 Error testing push notification:', error)
      toast({
        title: "Push Test Error",
        description: "Could not send test push notification",
        variant: "destructive"
      })
    }
  }

  const debugSubscription = async () => {
    try {
      console.log('🔍 Starting debug subscription check...')
      
      const response = await fetch('/api/sos/debug-subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('📡 Debug API response status:', response.status)
      
      const result = await response.json()
      console.log('📊 Debug subscription result:', result)

      if (response.ok) {
        console.log('✅ Debug subscription successful:', {
          active: result.subscriptions.active,
          total: result.subscriptions.total,
          user_id: result.user_id,
          subscriptions: result.subscriptions.subscriptions
        })
        
        toast({
          title: "Debug Info Retrieved",
          description: `Found ${result.subscriptions.active} active push subscriptions. Check console for details.`,
        })
      } else {
        console.error('❌ Debug subscription failed:', result)
        toast({
          title: "Debug Failed",
          description: result.error || "Failed to get debug information",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('💥 Error getting debug info:', error)
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

      const clearRes = await fetch("/api/push/subscriptions/deactivate", {
        method: "POST",
        credentials: "include",
      })
      if (!clearRes.ok) {
        console.error("Failed to clear database subscriptions:", await clearRes.text())
        toast({
          title: "Error",
          description: "Failed to clear some subscriptions from database.",
          variant: "destructive",
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

  const diagnosePushIssues = async () => {
    try {
      console.log('🔬 Starting comprehensive push notification diagnostics...')
      
      const diagnostics = {
        browser: navigator.userAgent,
        isBrave: navigator.userAgent.includes('Brave') || (navigator as any).brave,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasPushManager: 'PushManager' in window,
        hasNotification: 'Notification' in window,
        notificationPermission: Notification.permission,
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        isPWA: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
      }

      console.log('🌐 Browser Diagnostics:', diagnostics)

      // Brave-specific checks
      if (diagnostics.isBrave) {
        console.log('🦁 Brave Browser detected - checking for specific issues...')
        
        // Check if Brave's privacy features are blocking notifications
        if (diagnostics.notificationPermission === 'denied') {
          console.warn('⚠️ Notifications denied in Brave - check Brave Shields settings')
        }
        
        // Check if we're in PWA mode
        if (diagnostics.isPWA) {
          console.log('📱 Running as PWA in Brave')
        } else {
          console.warn('⚠️ Not running as PWA - Brave may have different behavior')
        }
        
        // Check for Brave-specific privacy settings
        console.log('🛡️ Brave privacy settings may affect push notifications')
      }

      // Check VAPID configuration
      console.log('🔑 Checking VAPID configuration...')
      const vapidCheckResponse = await fetch('/api/check-vapid')
      const vapidCheck = await vapidCheckResponse.json()
      console.log('🔑 VAPID Check Result:', vapidCheck)

      // Check existing subscriptions
      console.log('📱 Checking existing subscriptions...')
      const debugResponse = await fetch('/api/sos/debug-subscription')
      const debugData = await debugResponse.json()
      console.log('📱 Subscription Debug Result:', debugData)

      // Check service worker status
      if ('serviceWorker' in navigator) {
        console.log('⚙️ Checking service worker status...')
        const registrations = await navigator.serviceWorker.getRegistrations()
        console.log('⚙️ Service Worker Registrations:', registrations.length)
        
        for (let i = 0; i < registrations.length; i++) {
          const reg = registrations[i]
          console.log(`⚙️ SW ${i + 1}:`, {
            scope: reg.scope,
            active: !!reg.active,
            installing: !!reg.installing,
            waiting: !!reg.waiting,
            state: reg.active?.state || 'no active worker'
          })
        }
      }

      // Check push manager capabilities
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          if (registration.pushManager) {
            console.log('📡 Push Manager Capabilities:', {
              supportedContentEncodings: registration.pushManager.supportedContentEncodings || 'not available',
              hasPermission: await registration.pushManager.permissionState()
            })
          }
        } catch (swError) {
          console.error('⚙️ Service Worker Error:', swError)
        }
      }

      console.log('📊 Complete Push Notification Diagnostics:', {
        ...diagnostics,
        vapid: vapidCheck,
        subscriptions: debugData
      })

      toast({
        title: "Diagnostics Complete",
        description: "Check console for detailed push notification diagnostics. This will help identify the issue.",
      })

    } catch (error) {
      console.error('💥 Error running diagnostics:', error)
      toast({
        title: "Diagnostics Failed",
        description: "Could not run diagnostics. Check console for errors.",
        variant: "destructive"
      })
    }
  }

  const testCrossDeviceSOS = async () => {
    try {
      // Check if we have emergency contacts set up
      if (emergencyContacts.length === 0) {
        toast({
          title: "No Emergency Contacts",
          description: "Please add emergency contacts first to test cross-device SOS.",
          variant: "destructive"
        })
        return
      }

      // Check if we have push subscriptions
      const debugResponse = await fetch('/api/sos/debug-subscription')
      const debugData = await debugResponse.json()
      
      if (debugData.subscriptions.active === 0) {
        toast({
          title: "No Push Subscriptions",
          description: "Please set up push notifications first to test cross-device SOS.",
          variant: "destructive"
        })
        return
      }

      // Simulate SOS alert for testing
      const testLocation = {
        location_address: "Test Location - Cross Device Test",
        location_lat: 0,
        location_lng: 0
      }

      const createRes = await fetch("/api/sos/alerts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          location_address: testLocation.location_address,
          location_lat: testLocation.location_lat,
          location_lng: testLocation.location_lng,
          triggered_at: new Date().toISOString(),
        }),
      })
      const sosAlert = createRes.ok ? await createRes.json() : null
      if (!createRes.ok || !sosAlert?.id) {
        console.error("Error creating test SOS alert:", await createRes.text())
        toast({
          title: "Test Failed",
          description: "Could not create test SOS alert.",
          variant: "destructive",
        })
        return
      }

      await sendSosNotifications(sosAlert.id, testLocation)

      toast({
        title: "Cross-Device Test Sent",
        description: `Test SOS alert sent to ${emergencyContacts.length} emergency contacts. Check their devices for notifications.`,
      })

    } catch (error) {
      console.error('Error testing cross-device SOS:', error)
      toast({
        title: "Test Failed",
        description: "Could not send cross-device test. Please try again.",
        variant: "destructive"
      })
    }
  }

  const showBraveTroubleshooting = () => {
    const isBrave = navigator.userAgent.includes('Brave') || (navigator as any).brave
    if (!isBrave) return

    console.log('🦁 Brave Browser Troubleshooting Guide:')
    console.log('1. Ensure you have installed the app as a PWA:')
    console.log('   - Look for the install button in the address bar')
    console.log('   - Or go to Menu > More tools > Create shortcut > Open as window')
    console.log('2. Check Brave Shields settings:')
    console.log('   - Click the Brave Shields icon in the address bar')
    console.log('   - Set to "Standard" or "Allow all" for this site')
    console.log('   - Ensure "Notifications" is allowed')
    console.log('3. Check site permissions:')
    console.log('   - Go to brave://settings/content/notifications')
    console.log('   - Add this site to "Allow" list')
    console.log('4. Try in a private window:')
    console.log('   - Sometimes Brave blocks notifications in regular windows')
    console.log('5. Check if you\'re in PWA mode:')
    console.log('   - The app should open in its own window')
    console.log('   - No browser UI should be visible')

    toast({
      title: "Brave Troubleshooting Guide",
      description: "Check console for detailed Brave-specific troubleshooting steps.",
    })
  }

  const setupPushNotifications = async () => {
    try {
      console.log('🚀 Starting push notification setup...')
      
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('❌ Push notifications not supported:', {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window
        })
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in this browser.",
          variant: "destructive"
        })
        return
      }
      
      console.log('✅ Push notifications supported in this browser')
      
      // Brave-specific warnings
      const isBrave = navigator.userAgent.includes('Brave') || (navigator as any).brave
      if (isBrave) {
        console.log('🦁 Brave Browser detected - checking for potential issues...')
        
        // Check if we're in PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
        if (!isPWA) {
          console.warn('⚠️ Not running as PWA in Brave - push notifications may not work properly')
          toast({
            title: "Brave PWA Warning",
            description: "For best results, install this app as a PWA in Brave browser.",
            variant: "destructive"
          })
        }
      }

      // First check VAPID configuration
      console.log('🔑 Checking VAPID configuration...')
      const vapidCheckResponse = await fetch('/api/check-vapid')
      const vapidCheck = await vapidCheckResponse.json()
      console.log('🔑 VAPID check result:', vapidCheck)
      
      if (!vapidCheck.isConfigured) {
        console.error('❌ VAPID configuration check failed:', vapidCheck)
        toast({
          title: "Configuration Error",
          description: "Push notification configuration is incomplete. Please contact support.",
          variant: "destructive"
        })
        return
      }

      console.log('✅ VAPID configuration check passed:', vapidCheck)

      // Request notification permission
      console.log('🔔 Requesting notification permission...')
      const permission = await Notification.requestPermission()
      console.log('🔔 Notification permission result:', permission)
      
      if (permission !== 'granted') {
        console.error('❌ Notification permission denied:', permission)
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive emergency alerts.",
          variant: "destructive"
        })
        return
      }
      
      console.log('✅ Notification permission granted')

      // Check if we already have a working service worker
      console.log('⚙️ Checking service worker status...')
      let registration = await navigator.serviceWorker.getRegistration()
      console.log('⚙️ Current service worker registration:', registration ? 'found' : 'not found')
      
      if (!registration || !registration.active) {
        console.log('⚙️ No active service worker found, registering new one...')
        
        // Unregister any existing service workers first
        const existingRegistrations = await navigator.serviceWorker.getRegistrations()
        console.log('⚙️ Found existing registrations:', existingRegistrations.length)
        for (const reg of existingRegistrations) {
          console.log('⚙️ Unregistering existing service worker:', reg.scope)
          await reg.unregister()
        }

        // Wait a moment for cleanup
        console.log('⚙️ Waiting for cleanup...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Register service worker
        console.log('⚙️ Registering new service worker...')
        registration = await navigator.serviceWorker.register('/sw.js')
        console.log('⚙️ Service Worker registered:', registration)
      } else {
        console.log('✅ Using existing service worker:', registration.scope)
      }

      // Wait for service worker to be ready and active
      console.log('⚙️ Waiting for service worker to be ready...')
      await navigator.serviceWorker.ready
      console.log('✅ Service worker is ready')
      
      // Additional wait to ensure service worker is fully active
      console.log('⚙️ Waiting for service worker to be fully active...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('✅ Service worker should be fully active now')

      // Get VAPID public key
      console.log('🔑 Getting VAPID public key...')
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('❌ VAPID public key not found in environment variables')
        toast({
          title: "Configuration Error",
          description: "Push notification configuration is incomplete.",
          variant: "destructive"
        })
        return
      }

      console.log('✅ VAPID public key available, length:', vapidPublicKey.length)

      // Convert VAPID key
      console.log('🔑 Converting VAPID key to Uint8Array...')
      const vapidPublicKeyArray = urlBase64ToUint8Array(vapidPublicKey) as Uint8Array
      console.log('✅ VAPID key converted to Uint8Array, length:', vapidPublicKeyArray.length)

      // Check if we already have a subscription and unsubscribe first
      console.log('📱 Checking for existing push subscription...')
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('📱 Found existing subscription, unsubscribing...')
        await existingSubscription.unsubscribe()
        console.log('✅ Existing subscription unsubscribed')
      } else {
        console.log('📱 No existing subscription found')
      }

      // Subscribe to push notifications with retry logic
      console.log('📱 Starting push subscription creation...')
      let subscription
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          console.log(`📱 Push subscription attempt ${retryCount + 1}/${maxRetries}...`)
          
          // Check if push manager is available
          if (!registration.pushManager) {
            throw new Error('PushManager not available in this browser')
          }

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKeyArray as BufferSource
          })
          console.log('✅ Push subscription created successfully on attempt', retryCount + 1)
          break
        } catch (error) {
          retryCount++
          console.error(`❌ Push subscription attempt ${retryCount} failed:`, error)
          
          // Check for specific error types
          if (error instanceof Error) {
            if (error.name === 'NotSupportedError') {
              throw new Error('Push notifications are not supported in this browser or context')
            } else if (error.name === 'NotAllowedError') {
              if (isBrave) {
                throw new Error('Push notifications are blocked by Brave. Please check Brave Shields settings and allow notifications for this site.')
              } else {
                throw new Error('Push notifications are blocked. Please check your browser settings')
              }
            } else if (error.name === 'AbortError') {
              console.log('⚠️ Push subscription aborted, retrying...')
              if (isBrave) {
                console.log('🦁 Brave-specific: This may be due to Brave\'s privacy features or PWA mode issues')
              }
            }
          }
          
          if (retryCount >= maxRetries) {
            throw error
          }
          
          // Wait before retry with exponential backoff
          const waitTime = 2000 * Math.pow(2, retryCount - 1)
          console.log(`⏳ Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }

      if (!subscription) {
        throw new Error('Failed to create push subscription after all retries')
      }

      console.log('✅ Push subscription created successfully:', subscription)

      // Save subscription to database
      console.log('💾 Preparing subscription data for database...')
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      console.log('💾 Subscription data prepared:', {
        endpoint: subscriptionData.endpoint,
        p256dh_length: subscriptionData.keys.p256dh.length,
        auth_length: subscriptionData.keys.auth.length,
        user_id: user?.id
      })

      console.log('💾 Saving subscription to database...')
      const saveRes = await fetch("/api/push/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
        }),
      })

      if (!saveRes.ok) {
        console.error("❌ Failed to save subscription to database:", await saveRes.text())
        toast({
          title: "Error",
          description: "Failed to save notification settings.",
          variant: "destructive"
        })
        return
      }
      
      console.log('✅ Subscription saved to database successfully')

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
        if (error.name === 'AbortError' || error.message.includes('push service error')) {
          errorMessage = "Push service error detected. This can happen due to:\n• Browser compatibility issues\n• Network connectivity problems\n• VAPID key configuration issues\n\nTry: 1) Refresh the page, 2) Clear browser cache, 3) Try a different browser"
        } else if (error.message.includes('Registration failed')) {
          errorMessage = "Service worker registration failed. Please try refreshing the page."
        } else if (error.message.includes('NotSupportedError')) {
          errorMessage = "Push notifications are not supported in this browser or context."
        } else if (error.message.includes('NotAllowedError')) {
          errorMessage = "Push notifications are blocked. Please check your browser settings."
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
      const res = await fetch("/api/contacts", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load contacts")
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      list.sort((a: { first_name?: string }, b: { first_name?: string }) =>
        (a.first_name || "").localeCompare(b.first_name || "", undefined, { sensitivity: "base" }),
      )
      setContacts(list)
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
      const res = await fetch("/api/sos/emergency-contacts", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load emergency contacts")
      const raw = await res.json()
      const data = (Array.isArray(raw) ? raw : []).map((row: Record<string, unknown>) => {
        let contact = row.contact
        if (typeof contact === "string") {
          try {
            contact = JSON.parse(contact)
          } catch {
            contact = {}
          }
        }
        return { ...row, contact }
      })

      console.log("Fetched emergency contacts:", data)
      
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
      const addRes = await fetch("/api/sos/emergency-contacts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: selectedContactId,
          priority: parseInt(priority, 10),
        }),
      })
      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add")
      }

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
      const delRes = await fetch(`/api/sos/emergency-contacts/${emergencyContactId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!delRes.ok) throw new Error("Delete failed")

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
      const patchRes = await fetch(`/api/sos/emergency-contacts/${emergencyContactId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      })
      if (!patchRes.ok) throw new Error("Update failed")

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

      const createRes = await fetch("/api/sos/alerts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          location_lat: locationData.location_lat,
          location_lng: locationData.location_lng,
          location_address: locationData.location_address,
          triggered_at: new Date().toISOString(),
        }),
      })
      const createJson = await createRes.json().catch(() => ({}))
      if (!createRes.ok || !createJson?.id) {
        const msg =
          typeof createJson?.error === "string" ? createJson.error : "Failed to create SOS alert"
        throw new Error(msg)
      }

      await sendSosNotifications(createJson.id, locationData)

      toast({
        title: "SOS Alert Sent!",
        description: `Emergency contacts have been notified via ${appName} app`,
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
        
        const notifRes = await fetch("/api/sos/alert-notifications", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sos_alert_id: sosAlertId,
            emergency_contact_id: emergencyContact.id,
            notification_type: "push",
            status: "pending",
          }),
        })
        const notification = notifRes.ok ? await notifRes.json() : null
        if (!notifRes.ok || !notification?.id) {
          console.error("Error creating notification record:", await notifRes.text())
          totalFailed++
          continue
        }

        const patchNotification = async (body: Record<string, unknown>) => {
          await fetch(`/api/sos/alert-notifications/${notification.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        }

        try {
          const emergencyResponse = await fetch("/api/sos/send-emergency-notification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sos_alert_id: sosAlertId,
              recipient_user_id: contact.userId,
              user_name: session?.user?.name?.trim() || user?.email || "User",
              user_email: user?.email,
              user_phone: "Not provided",
              location: locationData.location_address || "Location not available",
              location_lat: locationData.location_lat,
              location_lng: locationData.location_lng,
              triggered_at: new Date().toISOString(),
              emergency_contact_name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
              emergency_contact_priority: emergencyContact.priority,
            }),
          })

          if (emergencyResponse.ok) {
            const result = await emergencyResponse.json()
            console.log("Emergency notification sent successfully:", result)
            totalSent++
            await patchNotification({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
          } else {
            const errorData = await emergencyResponse.json().catch(() => ({}))
            console.error("Failed to send emergency notification:", errorData)
            totalFailed++
            await patchNotification({
              status: "failed",
              error_message: String(errorData.message || errorData.error || "Unknown error"),
            })
          }
        } catch (error) {
          console.error("Error sending emergency notification:", error)
          totalFailed++
          await patchNotification({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
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
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      {/* Mobile-friendly header */}
      <div className="mb-6 sm:mb-8">
        <div className="text-center mb-4">
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">Emergency SOS</h1>
          <p className="px-2 text-sm text-muted-foreground sm:text-base">Press and hold the SOS button to alert your emergency contacts</p>
          
          {/* PWA Status Indicators */}
          <div className="flex justify-center gap-2 mt-3 mb-2">
            {/* Online/Offline Status */}
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              isOnline 
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" 
                : "bg-destructive/15 text-destructive"
            )}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            
            {/* PWA Installation Status */}
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              isPWAInstalled 
                ? "bg-sky-500/15 text-sky-800 dark:text-sky-200" 
                : "bg-primary/15 text-primary"
            )}>
              <Smartphone className="h-3 w-3" />
              {isPWAInstalled ? "PWA Installed" : "Install PWA"}
            </div>
            
            {/* Notification Permission Status */}
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              notificationPermission === 'granted'
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                : notificationPermission === 'denied'
                ? "bg-destructive/15 text-destructive"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-200"
            )}>
              <Bell className="h-3 w-3" />
              {notificationPermission === 'granted' ? "Notifications On" : 
               notificationPermission === 'denied' ? "Notifications Off" : "Enable Notifications"}
            </div>
          </div>
          
          {isTriggering && (
            <p className="mt-2 text-sm text-primary">Sending SOS alert...</p>
          )}
          {cooldownTime > 0 && !isTriggering && (
            <p className="mt-2 text-sm text-muted-foreground">
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
              className="border-primary/40 px-3 py-2 text-xs text-primary hover:bg-primary/10"
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
              className="border-emerald-500/40 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
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
              className="border-violet-500/40 px-3 py-2 text-xs text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
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
              className="border-purple-500/40 px-3 py-2 text-xs text-purple-700 hover:bg-purple-500/10 dark:text-purple-300"
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
              className="border-primary/40 px-3 py-2 text-xs text-primary hover:bg-primary/10"
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
            className="border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Debug
          </Button>

          {/* Clear Subscriptions Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearPushSubscriptions}
            className="border-destructive/40 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>

          {/* Diagnostics Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={diagnosePushIssues}
            className="border-purple-500/40 px-3 py-2 text-xs text-purple-700 hover:bg-purple-500/10 dark:text-purple-300"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Diagnose
          </Button>

          {/* Cross-Device Test Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={testCrossDeviceSOS}
            className="border-emerald-500/40 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <Phone className="h-3 w-3 mr-1" />
            Test SOS
          </Button>

          {/* Brave Troubleshooting Button */}
          {navigator.userAgent.includes('Brave') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={showBraveTroubleshooting}
              className="px-3 py-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Brave Help
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={cleanupDuplicates}
            className="px-3 py-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
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
                  ? "cursor-not-allowed border-muted-foreground/40 bg-muted"
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
            <div className="mx-auto max-w-sm rounded-lg border border-destructive/35 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                Sending SOS alert...
              </p>
            </div>
          )}

          <div className="mx-auto max-w-md space-y-1 px-4 text-xs text-muted-foreground sm:text-sm">
            <p>• Press and hold for 2 seconds to activate</p>
            <p>• Your location will be shared with emergency contacts</p>
            <p>{`• Only ${appName} users will receive notifications`}</p>
            {!isPWAInstalled && (
              <p className="font-medium text-primary">• Install as PWA for best emergency experience</p>
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
                  {`Select a contact from your contact list to add as an emergency contact. Only ${appName} users will receive notifications.`}
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
            <div className="py-8 text-center text-muted-foreground">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
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
                  className="flex flex-col justify-between space-y-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:space-y-0 sm:p-4"
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
                          <Badge variant="secondary" className="w-fit border border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-800 dark:text-emerald-200">
                            {appName} User
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit bg-muted text-xs text-muted-foreground">
                            {`No ${appName} Account`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {`This contact will not receive SOS notifications without a ${appName} account.`}
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
                            className={buttonVariants({ variant: "destructive" })}
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

      {/* Prominent PWA Install Warning for SOS Page */}
      {!isPWAInstalled && (
        <div className="mb-6 rounded-lg border border-amber-500/35 bg-gradient-to-r from-amber-500/10 to-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-foreground">
                ⚠️ Install App for Emergency Features
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {`For reliable emergency alerts and push notifications, please install ${appName} as a PWA.`} 
                This is especially important for emergency SOS features to work properly.
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handlePWAInstall}
                  size="sm"
                  className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Install App Now
                </Button>
                <Button 
                  onClick={() => setShowPWAInstallGuide(true)}
                  variant="outline"
                  size="sm"
                  className="border-amber-500/40 text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  Manual Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
