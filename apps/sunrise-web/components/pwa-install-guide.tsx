"use client"

import { useState, useEffect, useMemo } from "react"
import { useBrand } from "@repo/ui/brand-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Monitor,
} from "lucide-react"

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
  const brand = useBrand()
  const appName = brand === "sunset" ? "Sunset" : "Sunrise"

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

  const instructions = useMemo(() => {
    if (isIOS) {
      return {
        title: `Install ${appName} on iOS`,
        steps: [
          {
            icon: <Smartphone className="h-5 w-5" />,
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
          title: `Install ${appName} on Chrome`,
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
          title: `Install ${appName} on Edge`,
          steps: [
            {
              icon: <Monitor className="h-5 w-5" />,
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
          title: `Install ${appName} on Firefox`,
          steps: [
            {
              icon: <Monitor className="h-5 w-5" />,
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
          title: `Install ${appName} PWA`,
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
  }, [appName, browser, isIOS])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[min(90dvh,900px)] max-w-2xl overflow-y-auto border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Smartphone className="h-6 w-6" />
            {instructions.title}
          </DialogTitle>
          <DialogDescription>
            {`Install ${appName} as a Progressive Web App for the best emergency experience`}
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
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-foreground">Installed</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-foreground">Not Installed</span>
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
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-foreground">Enabled</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium text-foreground">
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
            <h3 className="text-lg font-semibold text-foreground">Installation Steps</h3>
            {instructions.steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <span className="text-sm font-semibold text-primary">{index + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-foreground [&_svg]:shrink-0">
                    {step.icon}
                    <span className="font-medium">{step.text}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Why Install as PWA?</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground">Emergency Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive critical SOS notifications even when the app is closed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground">Native Experience</h4>
                  <p className="text-sm text-muted-foreground">Works like a native app with home screen access</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3">
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Get instant alerts with sound and vibration</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground">Offline Access</h4>
                  <p className="text-sm text-muted-foreground">Basic functionality works even without internet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Troubleshooting</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-card/70 p-3">
                <p className="mb-1 font-medium text-foreground">Can't find the install button?</p>
                <p className="text-muted-foreground">
                  Make sure you're using a supported browser (Chrome, Edge, Safari, Firefox) and the site is served over HTTPS.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card/70 p-3">
                <p className="mb-1 font-medium text-foreground">Installation failed?</p>
                <p className="text-muted-foreground">
                  Try refreshing the page and clearing your browser cache, then attempt installation again.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card/70 p-3">
                <p className="mb-1 font-medium text-foreground">Notifications not working?</p>
                <p className="text-muted-foreground">
                  {`Check your browser's notification settings and make sure ${appName} is allowed to send notifications.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
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
