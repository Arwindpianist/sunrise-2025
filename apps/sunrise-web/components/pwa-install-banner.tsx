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
import { useBrand } from "@repo/ui/brand-provider"

interface PWAInstallBannerProps {
  className?: string
}

export default function PWAInstallBanner({ className }: PWAInstallBannerProps) {
  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"
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
    <Card
      className={cn(
        "fixed left-4 right-4 top-4 z-50 border-2 border-border bg-card/95 shadow-lg backdrop-blur-sm",
        isBrave ? "border-amber-500/35" : "border-primary/35",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={cn(
                "rounded-full p-2",
                isBrave ? "bg-amber-500/15" : "bg-primary/15"
              )}
            >
              {isBrave ? (
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {isBrave ? "Install for Brave Browser" : `Install ${appName} app`}
                </h3>
                {isBrave && (
                  <Badge variant="secondary" className="text-xs">
                    Brave Optimized
                  </Badge>
                )}
              </div>
              
              <p className="mb-3 text-xs text-muted-foreground">
                {isBrave ? (
                  <>
                    Install as PWA for better push notifications and emergency alerts in Brave browser.
                    <br />
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      Essential for emergency features to work properly
                    </span>
                  </>
                ) : (
                  `Install ${appName} as a mobile app for the best experience and offline access.`
                )}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className={cn(
                    "text-xs",
                    isBrave
                      ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600"
                      : ""
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
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isBrave && (
          <div className="mt-3 rounded-md border border-amber-500/35 bg-amber-500/10 p-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Brave Browser Tips:</p>
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
