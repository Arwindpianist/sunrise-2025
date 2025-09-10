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
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Download, 
  Smartphone, 
  Bell, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Chrome,
  Safari,
  Edge,
  Firefox
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PWAInstallGuideProps {
  isOpen: boolean
  onClose: () => void
  isPWAInstalled: boolean
  notificationPermission: NotificationPermission
}

export default function PWAInstallGuide({ 
  isOpen, 
  onClose, 
  isPWAInstalled, 
  notificationPermission 
}: PWAInstallGuideProps) {
  const [browser, setBrowser] = useState<string>('')
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    if (userAgent.includes('Chrome')) {
      setBrowser('Chrome')
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      setBrowser('Safari')
    } else if (userAgent.includes('Edge')) {
      setBrowser('Edge')
    } else if (userAgent.includes('Firefox')) {
      setBrowser('Firefox')
    } else {
      setBrowser('Other')
    }
  }, [])

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: "Install Sunrise on iOS",
        steps: [
          {
            icon: <Safari className="h-5 w-5" />,
            text: "Open Safari browser",
            description: "Make sure you're using Safari, not Chrome or other browsers"
          },
          {
            icon: <Download className="h-5 w-5" />,
            text: "Tap the Share button",
            description: "Look for the share icon (⎋) at the bottom of Safari"
          },
          {
            icon: <Smartphone className="h-5 w-5" />,
            text: "Select 'Add to Home Screen'",
            description: "Scroll down and tap 'Add to Home Screen'"
          },
          {
            icon: <CheckCircle className="h-5 w-5" />,
            text: "Confirm installation",
            description: "Tap 'Add' to install the app on your home screen"
          }
        ]
      }
    }

    switch (browser) {
      case 'Chrome':
        return {
          title: "Install Sunrise on Chrome",
          steps: [
            {
              icon: <Chrome className="h-5 w-5" />,
              text: "Look for the install button",
              description: "Click the install icon (⬇) in the address bar"
            },
            {
              icon: <Download className="h-5 w-5" />,
              text: "Click 'Install'",
              description: "A popup will appear asking to install the app"
            },
            {
              icon: <CheckCircle className="h-5 w-5" />,
              text: "Confirm installation",
              description: "Click 'Install' in the confirmation dialog"
            }
          ]
        }
      case 'Edge':
        return {
          title: "Install Sunrise on Edge",
          steps: [
            {
              icon: <Edge className="h-5 w-5" />,
              text: "Look for the install button",
              description: "Click the install icon (⬇) in the address bar"
            },
            {
              icon: <Download className="h-5 w-5" />,
              text: "Click 'Install'",
              description: "A popup will appear asking to install the app"
            },
            {
              icon: <CheckCircle className="h-5 w-5" />,
              text: "Confirm installation",
              description: "Click 'Install' in the confirmation dialog"
            }
          ]
        }
      case 'Firefox':
        return {
          title: "Install Sunrise on Firefox",
          steps: [
            {
              icon: <Firefox className="h-5 w-5" />,
              text: "Look for the install button",
              description: "Click the install icon (⬇) in the address bar"
            },
            {
              icon: <Download className="h-5 w-5" />,
              text: "Click 'Install'",
              description: "A popup will appear asking to install the app"
            },
            {
              icon: <CheckCircle className="h-5 w-5" />,
              text: "Confirm installation",
              description: "Click 'Install' in the confirmation dialog"
            }
          ]
        }
      default:
        return {
          title: "Install Sunrise PWA",
          steps: [
            {
              icon: <Download className="h-5 w-5" />,
              text: "Look for install options",
              description: "Check your browser's menu or address bar for install options"
            },
            {
              icon: <Smartphone className="h-5 w-5" />,
              text: "Add to home screen",
              description: "Use your browser's 'Add to Home Screen' option"
            }
          ]
        }
    }
  }

  const instructions = getInstallInstructions()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            {instructions.title}
          </DialogTitle>
          <DialogDescription>
            Install Sunrise as a Progressive Web App for the best emergency experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  PWA Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isPWAInstalled ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Installed</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">Not Installed</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {notificationPermission === 'granted' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700">Enabled</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        {notificationPermission === 'denied' ? 'Disabled' : 'Not Set'}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installation Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Installation Steps</h3>
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {step.icon}
                    <span className="font-medium">{step.text}</span>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Why Install as PWA?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Emergency Alerts</h4>
                  <p className="text-sm text-green-700">Receive critical SOS notifications even when the app is closed</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Native Experience</h4>
                  <p className="text-sm text-blue-700">Works like a native app with home screen access</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Bell className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800">Push Notifications</h4>
                  <p className="text-sm text-purple-700">Get instant alerts with sound and vibration</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Download className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Offline Access</h4>
                  <p className="text-sm text-orange-700">Basic functionality works even without internet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Troubleshooting</h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">Can't find the install button?</p>
                <p className="text-gray-600">Make sure you're using a supported browser (Chrome, Edge, Safari, Firefox) and the site is served over HTTPS.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">Installation failed?</p>
                <p className="text-gray-600">Try refreshing the page and clearing your browser cache, then attempt installation again.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">Notifications not working?</p>
                <p className="text-gray-600">Check your browser's notification settings and make sure Sunrise is allowed to send notifications.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isPWAInstalled && (
            <Button onClick={onClose}>
              Got it, I'll install now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
