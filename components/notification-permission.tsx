"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Bell, Download, X, CheckCircle, AlertTriangle } from "lucide-react"
import { pushNotificationManager } from "@/lib/push-notifications"
import { useSupabase } from "@/components/providers/supabase-provider"

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
  const { user, supabase } = useSupabase()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [hasShownPrompt, setHasShownPrompt] = useState(false)

  useEffect(() => {
    checkSupport()
    checkPermission()
    checkInstallation()
    setupInstallListener()
    
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
        description: "Sunrise has been installed on your device.",
      })
    })
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
        // Subscribe to push notifications
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('VAPID public key not configured')
          toast({
            title: "Configuration Error",
            description: "Push notification configuration is incomplete.",
            variant: "destructive"
          })
          return
        }

        const subscriptionData = await pushNotificationManager.subscribeToPushNotifications(vapidPublicKey)
        
        if (subscriptionData && user) {
          // Save subscription to database
          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              endpoint: subscriptionData.endpoint,
              p256dh_key: subscriptionData.keys.p256dh,
              auth_key: subscriptionData.keys.auth,
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
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Push notifications not supported
              </p>
              <p className="text-xs text-orange-700">
                Your browser doesn't support push notifications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === 'granted' && isInstalled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Notifications enabled & App installed
              </p>
              <p className="text-xs text-green-700">
                You'll receive push notifications for important updates.
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
      {permission !== 'granted' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-blue-600" />
              Enable Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-800">
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
              <p className="text-xs text-blue-700">
                Please enable notifications in your browser settings to receive alerts.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Install App Banner */}
      {showInstallPrompt && showInstallBanner && !isInstalled && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-purple-600" />
              Install Sunrise App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-purple-800">
              Install Sunrise as a mobile app for the best experience and offline access.
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
