"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  X, 
  Smartphone, 
  Bell, 
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PWAInstallBannerProps {
  className?: string
}

export default function PWAInstallBanner({ className }: PWAInstallBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isBrave, setIsBrave] = useState(false)
  const [hasShownBanner, setHasShownBanner] = useState(false)

  useEffect(() => {
    // Check if Brave browser
    const brave = navigator.userAgent.includes('Brave') || (navigator as any).brave
    setIsBrave(brave)

    // Check if already installed
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInApp = (window.navigator as any).standalone === true
      const installed = isStandalone || isInApp
      setIsInstalled(installed)
      
      if (installed) {
        setShowBanner(false)
      }
    }

    checkInstallation()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show banner after a delay for better UX
      setTimeout(() => {
        if (!hasShownBanner) {
          setShowBanner(true)
          setHasShownBanner(true)
        }
      }, 3000) // Show after 3 seconds
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      setShowBanner(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [hasShownBanner])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      console.log('Install prompt not available, showing manual instructions')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  const handleShowGuide = () => {
    // This will be handled by the parent component
    window.dispatchEvent(new CustomEvent('show-pwa-guide'))
  }

  if (!showBanner || isInstalled) {
    return null
  }

  return (
    <Card className={cn(
      "fixed top-4 left-4 right-4 z-50 shadow-lg border-2",
      isBrave 
        ? "border-orange-200 bg-orange-50" 
        : "border-blue-200 bg-blue-50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-full",
              isBrave ? "bg-orange-100" : "bg-blue-100"
            )}>
              {isBrave ? (
                <Shield className="h-5 w-5 text-orange-600" />
              ) : (
                <Download className="h-5 w-5 text-blue-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">
                  {isBrave ? "Install for Brave Browser" : "Install Sunrise App"}
                </h3>
                {isBrave && (
                  <Badge variant="secondary" className="text-xs">
                    Brave Optimized
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-gray-600 mb-3">
                {isBrave ? (
                  <>
                    Install as PWA for better push notifications and emergency alerts in Brave browser.
                    <br />
                    <span className="text-orange-600 font-medium">
                      ⚠️ Essential for emergency features to work properly
                    </span>
                  </>
                ) : (
                  "Install Sunrise as a mobile app for the best experience and offline access."
                )}
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleInstall}
                  size="sm"
                  className={cn(
                    "text-xs",
                    isBrave 
                      ? "bg-orange-600 hover:bg-orange-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install Now
                </Button>
                
                <Button 
                  onClick={handleShowGuide}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Manual Guide
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isBrave && (
          <div className="mt-3 p-2 bg-orange-100 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">Brave Browser Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Ensure Brave Shields is set to "Standard" or "Allow all"</li>
                  <li>• Install as PWA for push notifications to work properly</li>
                  <li>• Check notification permissions in Brave settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
