"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Bell, Download, X, CheckCircle, AlertTriangle } from "lucide-react"
import { pushNotificationManager } from "@/lib/push-notifications"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useBrand } from "@repo/ui/brand-provider"

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  showInstallPrompt?: boolean
  forceShow?: boolean
}

export default function NotificationPermission({ 
  onPermissionGranted,
  showInstallPrompt = true,
  forceShow = false
}: NotificationPermissionProps) {
  const { user } = useSupabase()
  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [hasShownPrompt, setHasShownPrompt] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('checking')

  useEffect(() => {
    checkSupport()
    checkPermission()
    checkInstallation()
    setupInstallListener()
    checkSubscriptionStatus()
    
    // Auto-request permission after a short delay if not granted
    if (forceShow && !hasShownPrompt) {
      const timer = setTimeout(() => {
        if (permission === 'default' && isSupported) {
          handlePermissionRequest()
          setHasShownPrompt(true)
        }
      }, 2000) // Wait 2 seconds before auto-requesting
      
      return () => clearTimeout(timer)
    }
  }, [forceShow, permission, isSupported, hasShownPrompt])

  const checkSupport = () => {
    const supported = pushNotificationManager.isSupported()
    setIsSupported(supported)
  }

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }

  const checkInstallation = () => {
    // Check if app is installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInstalled(isStandalone)
  }

  const setupInstallListener = () => {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    })

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      toast({
        title: "App Installed!",
        description: `${appName} has been installed on your device.`,
      })
    })
  }

  const checkSubscriptionStatus = async () => {
    if (!user) return
    
    try {
      const res = await fetch("/api/push/subscriptions", { credentials: "include" })
      if (!res.ok) {
        console.error("Error checking subscription status:", await res.text())
        setSubscriptionStatus("error")
        return
      }
      const data = await res.json()
      const list = Array.isArray(data.subscriptions) ? data.subscriptions : []

      if (list.length > 0) {
        setSubscriptionStatus("active")
      } else {
        setSubscriptionStatus("none")
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
      setSubscriptionStatus('error')
    }
  }

  const handlePermissionRequest = async () => {
    try {
      setIsSubscribing(true)
      
      // Initialize push notification manager
      const initialized = await pushNotificationManager.initialize()
      if (!initialized) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in this browser.",
          variant: "destructive"
        })
        return
      }

      // Request permission
      const newPermission = await pushNotificationManager.requestPermission()
      setPermission(newPermission)

      if (newPermission === 'granted') {
        console.log('Permission granted, subscribing to push notifications...')
        // Subscribe to push notifications
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        console.log('VAPID public key available:', !!vapidPublicKey)
        
        if (!vapidPublicKey) {
          console.error('VAPID public key not configured')
          toast({
            title: "Configuration Error",
            description: "Push notification configuration is incomplete.",
            variant: "destructive"
          })
          return
        }

        // Add a small delay to ensure service worker is ready
        console.log('Waiting for service worker to be ready...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        console.log('Subscribing to push notifications...')
        const subscriptionData = await pushNotificationManager.subscribeToPushNotifications(vapidPublicKey)
        console.log('Subscription data received:', !!subscriptionData)
        
        if (subscriptionData && user) {
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
            console.error("Failed to save subscription:", await saveRes.text())
            toast({
              title: "Error",
              description: "Failed to save notification settings.",
              variant: "destructive"
            })
            return
          }

          // Update subscription status
          setSubscriptionStatus('active')

          toast({
            title: "Notifications Enabled!",
            description: "You'll now receive push notifications for important updates.",
          })

          onPermissionGranted?.()
        }
      } else {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation Unavailable",
        description: "App installation is not available at this time.",
        variant: "destructive"
      })
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } catch (error) {
      console.error('Error installing app:', error)
      toast({
        title: "Installation Failed",
        description: "Failed to install the app. Please try again.",
        variant: "destructive"
      })
    }
  }

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
  }

  if (!isSupported) {
    return (
      <Card className="border border-amber-500/35 bg-amber-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Push notifications not supported</p>
              <p className="text-xs text-muted-foreground">Your browser doesn't support push notifications.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === 'granted') {
    return (
      <Card className="border border-emerald-500/35 bg-emerald-500/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-foreground">Notifications enabled</p>
              <p className="text-xs text-muted-foreground">
                You'll receive push notifications for important updates.
                {isInstalled && " App is also installed for better experience."}
                {subscriptionStatus === 'active' && " Push subscription is active."}
                {subscriptionStatus === 'none' && " No active push subscription found."}
                {subscriptionStatus === 'checking' && " Checking subscription status..."}
                {subscriptionStatus === 'error' && " Error checking subscription status."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Notification Permission Request */}
      {(permission === 'default' || permission === 'denied') && (
        <Card className="border border-primary/35 bg-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Bell className="h-5 w-5 text-primary" />
              Enable Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Get instant notifications for SOS alerts, event updates, and important messages.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {permission === 'denied' ? 'Permission Denied' : 'Permission Required'}
              </Badge>
            </div>
            <Button 
              onClick={handlePermissionRequest}
              disabled={isSubscribing || permission === 'denied'}
              className="w-full"
            >
              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            {permission === 'denied' && (
              <p className="text-xs text-muted-foreground">
                Please enable notifications in your browser settings to receive alerts.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Install App Banner */}
      {showInstallPrompt && showInstallBanner && !isInstalled && (
        <Card className="border border-violet-500/35 bg-violet-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Download className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              {`Install ${appName} app`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {`Install ${appName} as a mobile app for the best experience and offline access.`}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={handleInstallApp} className="flex-1">
                Install App
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={dismissInstallBanner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
