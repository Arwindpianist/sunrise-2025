"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Bell,
  Download,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import haptics from "@/lib/haptics"
import SosOnboarding from "@/components/sos-onboarding"
import PWAInstallGuide from "@/components/pwa-install-guide"
import { useBrand } from "@repo/ui/brand-provider"

const HOLD_MS = 2000

export default function PlaygroundSosPwaSection() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [isPressed, setIsPressed] = useState(false)
  const [pressProgress, setPressProgress] = useState(0)
  const [isTriggering, setIsTriggering] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPwaGuide, setShowPwaGuide] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default")

  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    const sync = () => {
      setIsOnline(navigator.onLine)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsPWAInstalled(standalone)
      setNotificationPermission(
        typeof Notification !== "undefined" ? Notification.permission : "default",
      )
    }
    sync()
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    }
  }, [])

  const finishDemoTrigger = () => {
    if (completedRef.current) return
    completedRef.current = true
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    try {
      haptics.stopContinuous()
    } catch {
      /* ignore */
    }
    setIsPressed(false)
    setPressProgress(0)
    setIsTriggering(true)
    toast({
      title: "Demo complete",
      description: "No alert was sent. After you sign in, SOS uses your real emergency contacts.",
    })
    setTimeout(() => {
      setIsTriggering(false)
      completedRef.current = false
    }, 1200)
    setCooldownTime(4000)
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownTime((prev) => {
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
  }

  const handlePressStart = () => {
    if (cooldownTime > 0 || isTriggering) return
    completedRef.current = false
    setIsPressed(true)
    setPressProgress(0)
    try {
      haptics.startContinuous()
    } catch {
      /* ignore */
    }
    progressIntervalRef.current = setInterval(() => {
      setPressProgress((prev) => {
        const next = prev + 2
        if (next >= 100) {
          finishDemoTrigger()
          return 100
        }
        return next
      })
    }, 40)
    pressTimeoutRef.current = setTimeout(() => finishDemoTrigger(), HOLD_MS)
  }

  const handlePressEnd = () => {
    if (!isPressed) return
    try {
      haptics.stopContinuous()
    } catch {
      /* ignore */
    }
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current)
      pressTimeoutRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setIsPressed(false)
    setPressProgress(0)
  }

  return (
    <>
      <Card className={isSunset ? "sunset-panel overflow-hidden border-border bg-card/85 shadow-md" : "overflow-hidden border-red-100 bg-gradient-to-br from-white to-red-50/30 shadow-md"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className={isSunset ? "h-6 w-6 text-primary" : "h-6 w-6 text-red-500"} />
            Emergency SOS & install tools
          </CardTitle>
          <CardDescription>
            Same hold-to-activate pattern as your dashboard. Tutorial and install guide match what signed-in users see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap justify-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
              )}
            >
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                isPWAInstalled
                  ? isSunset
                    ? "bg-primary/15 text-primary"
                    : "bg-blue-100 text-blue-800"
                  : isSunset
                    ? "bg-muted text-muted-foreground"
                    : "bg-orange-100 text-orange-800",
              )}
            >
              <Smartphone className="h-3 w-3" />
              {isPWAInstalled ? "App-style window" : "Add to home screen"}
            </div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                notificationPermission === "granted"
                  ? "bg-green-100 text-green-800"
                  : notificationPermission === "denied"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-900",
              )}
            >
              <Bell className="h-3 w-3" />
              {notificationPermission === "granted"
                ? "Notifications allowed"
                : notificationPermission === "denied"
                  ? "Notifications blocked"
                  : "Notifications not set"}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowOnboarding(true)}>
              <AlertTriangle className="mr-1 h-3 w-3" />
              Tutorial
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className={isSunset ? "border-primary/35 text-primary hover:bg-primary/10" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
              onClick={() => setShowPwaGuide(true)}
            >
              <Download className="mr-1 h-3 w-3" />
              Install app help
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative mb-10 inline-block">
              <button
                type="button"
                className={cn(
                  "relative h-32 w-32 rounded-full border-4 transition-all duration-200 ease-out sm:h-40 sm:w-40",
                  "focus:outline-none focus:ring-4 focus:ring-red-300",
                  isPressed
                    ? "scale-95 border-red-700 bg-red-600 shadow-lg"
                    : isTriggering || cooldownTime > 0
                      ? "cursor-not-allowed border-gray-500 bg-gray-400"
                      : "border-red-600 bg-red-500 shadow-md hover:scale-105 hover:border-red-700 hover:bg-red-600",
                )}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                disabled={isTriggering || cooldownTime > 0}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-white sm:h-16 sm:w-16" />
                </div>
                {isPressed ? (
                  <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="4" />
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
                ) : null}
              </button>
              {isPressed ? (
                <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-red-700">
                  {Math.round(pressProgress)}%, keep holding…
                </p>
              ) : null}
            </div>

            {cooldownTime > 0 ? (
              <p className="text-sm text-muted-foreground">
                Short pause before another demo ({Math.ceil(cooldownTime / 1000)}s)
              </p>
            ) : null}

            <ul className="mt-2 max-w-md space-y-1 px-4 text-center text-xs text-muted-foreground sm:text-sm">
              <li>Press and hold for two seconds to complete the gesture</li>
              <li>After sign-in, SOS follows your emergency contact list</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <SosOnboarding
        isOpen={showOnboarding}
        emergencyContactsCount={2}
        onComplete={() => {
          setShowOnboarding(false)
          toast({ title: "Tutorial closed", description: "You can reopen it any time from here." })
        }}
        onSkip={() => setShowOnboarding(false)}
      />

      <PWAInstallGuide
        isOpen={showPwaGuide}
        onClose={() => setShowPwaGuide(false)}
        isPWAInstalled={isPWAInstalled}
        notificationPermission={notificationPermission}
      />
    </>
  )
}
