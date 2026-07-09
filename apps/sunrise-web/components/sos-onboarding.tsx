"use client"

import { useState, useEffect, useMemo } from "react"
import { useBrand } from "@repo/ui/brand-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { 
  AlertTriangle, 
  Shield, 
  Bell, 
  MapPin, 
  Download,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone
} from "lucide-react"
import { cn } from "@/lib/utils"
import NotificationPermission from "@/components/notification-permission"

interface SosOnboardingProps {
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  emergencyContactsCount: number
}

export default function SosOnboarding({ 
  isOpen, 
  onComplete, 
  onSkip, 
  emergencyContactsCount 
}: SosOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [permissions, setPermissions] = useState({
    notifications: false,
    geolocation: false,
    pwaInstalled: false
  })

  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"

  const steps = useMemo(
    () => [
    {
      id: 'welcome',
      title: 'Welcome to SOS Emergency System',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The SOS Emergency System allows you to quickly alert your emergency contacts when you need immediate assistance.
          </p>
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 sm:p-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground sm:text-base">How it works:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground sm:text-sm">
              <li>• Press and hold the red SOS button for 2 seconds</li>
              <li>• Your location will be shared with emergency contacts</li>
              <li>{`• They'll receive urgent notifications on their ${appName} app`}</li>
              <li>{`• Only works with contacts who have ${appName} accounts`}</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'permissions',
      title: 'Enable Required Permissions',
      icon: <Bell className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            To ensure the SOS system works properly, we need to enable several permissions:
          </p>
          
          <div className="space-y-3">
            {/* Notifications Permission */}
            <div className="flex flex-col justify-between space-y-2 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:space-y-0">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground sm:text-base">Push Notifications</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Receive SOS alerts from emergency contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.notifications ? (
                  <Badge variant="secondary" className="border border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <XCircle className="mr-1 h-3 w-3" />
                    Required
                  </Badge>
                )}
              </div>
            </div>

            {/* Geolocation Permission */}
            <div className="flex flex-col justify-between space-y-2 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:space-y-0">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground sm:text-base">Location Access</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Share your location with emergency contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.geolocation ? (
                  <Badge variant="secondary" className="border border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <XCircle className="mr-1 h-3 w-3" />
                    Required
                  </Badge>
                )}
              </div>
            </div>

            {/* PWA Installation */}
            <div className="flex flex-col justify-between space-y-2 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:space-y-0">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground sm:text-base">Install as App</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">Better notifications and offline access</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.pwaInstalled ? (
                  <Badge variant="secondary" className="border border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Installed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="border border-amber-500/35 bg-amber-500/15 text-xs text-amber-800 dark:text-amber-200">
                    <Smartphone className="mr-1 h-3 w-3" />
                    Recommended
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/35 bg-primary/10 p-3 sm:p-4">
            <p className="text-xs text-muted-foreground sm:text-sm">
              <strong className="text-foreground">Note:</strong> These permissions are essential for the SOS system to work properly. 
              You can change them later in your browser settings.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'contacts',
      title: 'Add Emergency Contacts',
      icon: <Shield className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {`Add people you trust to receive your SOS alerts. Only contacts with ${appName} accounts will receive notifications.`}
          </p>
          
          {emergencyContactsCount === 0 ? (
            <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-foreground sm:text-base">No Emergency Contacts Added</p>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                You need to add at least one emergency contact for the SOS system to work. 
                Click "Add Contact" below to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-foreground sm:text-base">Emergency Contacts Ready</p>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                You have {emergencyContactsCount} emergency contact{emergencyContactsCount !== 1 ? 's' : ''} set up. 
                They will receive SOS alerts when you activate the emergency button.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground sm:text-base">Tips for Emergency Contacts:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground sm:text-sm">
              <li>• Choose people you trust and who can help in emergencies</li>
              <li>{`• Make sure they have ${appName} accounts to receive notifications`}</li>
              <li>• Set priority levels (1 = highest priority)</li>
              <li>• Include family members, close friends, or neighbors</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'test',
      title: 'Test the SOS Button',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Let's test the SOS button to make sure everything is working correctly. 
            This will send a test notification to your emergency contacts.
          </p>
          
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="font-medium text-foreground">How to Test:</p>
            </div>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Press and hold the red SOS button for 2 seconds</li>
              <li>Watch the progress ring fill up</li>
              <li>Release when it reaches 100% or after 2 seconds</li>
              <li>Check that your emergency contacts receive notifications</li>
            </ol>
          </div>

          <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Important:</strong> This is just a test. In a real emergency, 
              your contacts will receive urgent notifications with your location.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'SOS System Ready!',
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Your SOS Emergency System is now ready to use. You can access it anytime from the floating SOS button or the dashboard.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-4">
            <h4 className="mb-2 font-medium text-foreground">What's Next:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• The SOS button is always accessible via the floating button</li>
              <li>• Add more emergency contacts as needed</li>
              <li>• Test the system periodically to ensure it works</li>
              <li>• Share this feature with family and friends</li>
            </ul>
          </div>

          <div className="rounded-lg border border-primary/35 bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Remember:</strong> In a real emergency, press and hold the SOS button for 2 seconds. 
              Your emergency contacts will be notified immediately with your location.
            </p>
          </div>
        </div>
      )
    }
  ],
    [appName, emergencyContactsCount, permissions.geolocation, permissions.notifications, permissions.pwaInstalled]
  )

  const currentStepData = steps[currentStep]

  useEffect(() => {
    // Check current permissions
    const checkPermissions = async () => {
      // Check notification permission
      const notificationPermission = 'Notification' in window ? Notification.permission === 'granted' : false
      
      // Check geolocation permission (we'll test this)
      let geolocationPermission = false
      if (navigator.geolocation) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1000 })
          })
          geolocationPermission = true
        } catch (error) {
          geolocationPermission = false
        }
      }

      // Check if PWA is installed
      const pwaInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true

      setPermissions({
        notifications: notificationPermission,
        geolocation: geolocationPermission,
        pwaInstalled
      })
    }

    if (isOpen) {
      checkPermissions()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onSkip()
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRequestPermissions = async () => {
    try {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          setPermissions(prev => ({ ...prev, notifications: true }))
          toast({
            title: "Notifications Enabled!",
            description: "You'll now receive SOS alerts from emergency contacts.",
          })
        }
      }

      // Request geolocation permission
      if (navigator.geolocation) {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          setPermissions(prev => ({ ...prev, geolocation: true }))
          toast({
            title: "Location Access Granted!",
            description: "Your location will be shared with emergency contacts during SOS alerts.",
          })
        } catch (error) {
          toast({
            title: "Location Access Denied",
            description: "Please enable location access in your browser settings for the SOS system to work properly.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true
      case 1: // Permissions
        return permissions.notifications && permissions.geolocation
      case 2: // Contacts
        return emergencyContactsCount > 0
      case 3: // Test
        return true
      case 4: // Complete
        return true
      default:
        return true
    }
  }

  const progressValue = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[min(90dvh,880px)] w-[min(96vw,42rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0",
          "border-border/70 shadow-2xl sm:rounded-xl",
          // Leave space for the Radix close control on small screens
          "[&>button]:touch-manipulation"
        )}
      >
        <DialogHeader className="shrink-0 space-y-3 border-b bg-gradient-to-b from-muted/40 to-background px-4 pb-4 pt-6 text-left sm:px-6">
          <DialogTitle className="flex items-start gap-3 pr-11 text-left text-base font-semibold leading-snug sm:text-lg">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/60">
              {currentStepData.icon}
            </span>
            <span className="min-w-0 pt-1">{currentStepData.title}</span>
          </DialogTitle>
          <div className="space-y-2">
            <DialogDescription className="text-xs text-muted-foreground sm:text-sm">
              Step {currentStep + 1} of {steps.length}
            </DialogDescription>
            <Progress value={progressValue} max={100} className="h-2 bg-muted" />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div
            key={currentStep}
            className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
          >
            <div className="min-h-[200px] sm:min-h-[240px]">{currentStepData.content}</div>

            {currentStep === 1 && (!permissions.notifications || !permissions.geolocation) && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleRequestPermissions}
                  className="w-full max-w-md shadow-md transition-transform active:scale-[0.99] sm:w-auto"
                  size="lg"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Enable required permissions
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <>
                <Separator className="my-6" />
                <NotificationPermission forceShow={true} />
              </>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col gap-4 border-t border-border bg-card px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="w-full min-h-11 sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full min-h-11 text-muted-foreground sm:w-auto"
            >
              Skip tutorial
            </Button>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={onComplete}
                className="min-h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto dark:bg-emerald-600 dark:hover:bg-emerald-500"
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete setup
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                className={cn(
                  "min-h-11 w-full shadow-md transition-[transform,opacity] active:scale-[0.99] sm:w-auto",
                  !canProceed() && "pointer-events-none opacity-50"
                )}
              >
                {currentStep === steps.length - 2 ? "Finish" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            <div className="flex justify-center gap-2 pt-1 sm:justify-end" aria-hidden="true">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors duration-200",
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                        ? "bg-green-500"
                        : "bg-muted-foreground/35"
                  )}
                />
              ))}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
