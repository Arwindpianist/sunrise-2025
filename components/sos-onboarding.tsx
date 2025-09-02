"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Smartphone,
  Globe
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

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to SOS Emergency System',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The SOS Emergency System allows you to quickly alert your emergency contacts when you need immediate assistance.
          </p>
          <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2 text-sm sm:text-base">How it works:</h4>
            <ul className="text-xs sm:text-sm text-red-700 space-y-1">
              <li>• Press and hold the red SOS button for 2 seconds</li>
              <li>• Your location will be shared with emergency contacts</li>
              <li>• They'll receive urgent notifications on their Sunrise app</li>
              <li>• Only works with contacts who have Sunrise accounts</li>
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
          <p className="text-gray-600">
            To ensure the SOS system works properly, we need to enable several permissions:
          </p>
          
          <div className="space-y-3">
            {/* Notifications Permission */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Push Notifications</p>
                  <p className="text-xs sm:text-sm text-gray-500">Receive SOS alerts from emergency contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.notifications ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                )}
              </div>
            </div>

            {/* Geolocation Permission */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Location Access</p>
                  <p className="text-xs sm:text-sm text-gray-500">Share your location with emergency contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.geolocation ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                )}
              </div>
            </div>

            {/* PWA Installation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Install as App</p>
                  <p className="text-xs sm:text-sm text-gray-500">Better notifications and offline access</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {permissions.pwaInstalled ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Installed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Note:</strong> These permissions are essential for the SOS system to work properly. 
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
          <p className="text-gray-600">
            Add people you trust to receive your SOS alerts. Only contacts with Sunrise accounts will receive notifications.
          </p>
          
          {emergencyContactsCount === 0 ? (
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <p className="font-medium text-orange-800 text-sm sm:text-base">No Emergency Contacts Added</p>
              </div>
              <p className="text-xs sm:text-sm text-orange-700">
                You need to add at least one emergency contact for the SOS system to work. 
                Click "Add Contact" below to get started.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p className="font-medium text-green-800 text-sm sm:text-base">Emergency Contacts Ready</p>
              </div>
              <p className="text-xs sm:text-sm text-green-700">
                You have {emergencyContactsCount} emergency contact{emergencyContactsCount !== 1 ? 's' : ''} set up. 
                They will receive SOS alerts when you activate the emergency button.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm sm:text-base">Tips for Emergency Contacts:</h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Choose people you trust and who can help in emergencies</li>
              <li>• Make sure they have Sunrise accounts to receive notifications</li>
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
          <p className="text-gray-600">
            Let's test the SOS button to make sure everything is working correctly. 
            This will send a test notification to your emergency contacts.
          </p>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="font-medium text-red-800">How to Test:</p>
            </div>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Press and hold the red SOS button for 2 seconds</li>
              <li>Watch the progress ring fill up</li>
              <li>Release when it reaches 100% or after 2 seconds</li>
              <li>Check that your emergency contacts receive notifications</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Important:</strong> This is just a test. In a real emergency, 
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Complete!</h3>
            <p className="text-gray-600">
              Your SOS Emergency System is now ready to use. You can access it anytime from the floating SOS button or the dashboard.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">What's Next:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• The SOS button is always accessible via the floating button</li>
              <li>• Add more emergency contacts as needed</li>
              <li>• Test the system periodically to ensure it works</li>
              <li>• Share this feature with family and friends</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Remember:</strong> In a real emergency, press and hold the SOS button for 2 seconds. 
              Your emergency contacts will be notified immediately with your location.
            </p>
          </div>
        </div>
      )
    }
  ]

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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-lg sm:text-xl">
            <div className="flex-shrink-0">{currentStepData.icon}</div>
            <span className="text-base sm:text-lg">{currentStepData.title}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Step {currentStep + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="min-h-[250px] sm:min-h-[300px]">
            {currentStepData.content}
          </div>

          {/* Permission Request Button for step 1 */}
          {currentStep === 1 && (!permissions.notifications || !permissions.geolocation) && (
            <div className="flex justify-center">
              <Button onClick={handleRequestPermissions} className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Enable Required Permissions
              </Button>
            </div>
          )}

          {/* Notification Permission Component for step 1 */}
          {currentStep === 1 && (
            <div className="border-t pt-4">
              <NotificationPermission forceShow={true} />
            </div>
          )}

          {/* Action Buttons - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 border-t space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button variant="ghost" onClick={onSkip} className="w-full sm:w-auto">
                Skip Tutorial
              </Button>
            </div>

            <div className="flex gap-2">
              {currentStep === steps.length - 1 ? (
                <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  disabled={!canProceed()}
                  className={cn(
                    "w-full sm:w-auto",
                    !canProceed() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {currentStep === steps.length - 2 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep ? "bg-blue-600" : 
                  index < currentStep ? "bg-green-500" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
