"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useBrand } from "@repo/ui/brand-provider"
import { cn } from "@/lib/utils"
import { X, Settings, Shield, Cookie } from "lucide-react"
import Link from "next/link"

export default function GDPRBanner() {
  const brand = useBrand()
  const isSunset = brand === "sunset"
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    performance: false,
    functional: false,
    marketing: false,
  })

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const preferences = {
      essential: true,
      performance: true,
      functional: true,
      marketing: true,
    }
    setCookiePreferences(preferences)
    localStorage.setItem("cookie-consent", JSON.stringify(preferences))
    setShowBanner(false)
  }

  const acceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(cookiePreferences))
    setShowBanner(false)
  }

  const rejectAll = () => {
    const preferences = {
      essential: true,
      performance: false,
      functional: false,
      marketing: false,
    }
    setCookiePreferences(preferences)
    localStorage.setItem("cookie-consent", JSON.stringify(preferences))
    setShowBanner(false)
  }

  const updatePreference = (type: keyof typeof cookiePreferences) => {
    if (type === "essential") return
    setCookiePreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  const toggleClassName =
    "peer h-6 w-11 rounded-full bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring/40 peer-checked:bg-primary after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-background after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-background"

  if (!showBanner) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-border p-4 shadow-lg backdrop-blur-sm",
          isSunset ? "sunset-panel bg-card/90" : "bg-card/95",
        )}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Cookie className={cn("h-5 w-5", isSunset ? "text-primary" : "text-orange-500")} />
                <h3 className="font-semibold text-foreground">We value your privacy</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized content, and
                analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of
                cookies.{" "}
                <Link
                  href="/cookie-policy"
                  className={cn(
                    "underline underline-offset-2",
                    isSunset
                      ? "text-primary hover:text-primary/80"
                      : "text-orange-500 hover:text-orange-600",
                  )}
                >
                  Learn more
                </Link>
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className={isSunset ? undefined : "bg-orange-500 hover:bg-orange-600"}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={cn(
              "max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-border shadow-xl",
              isSunset ? "sunset-panel bg-popover text-popover-foreground" : "bg-popover text-popover-foreground",
            )}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Cookie Preferences</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="border-b border-border pb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Essential Cookies</h4>
                      <p className="text-sm text-muted-foreground">Required for the website to function</p>
                    </div>
                    <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      Always Active
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      ["performance", "Performance Cookies", "Help us improve website performance"],
                      ["functional", "Functional Cookies", "Enable enhanced functionality"],
                      ["marketing", "Marketing Cookies", "Used for advertising and analytics"],
                    ] as const
                  ).map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-foreground">{title}</h4>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={cookiePreferences[key]}
                          onChange={() => updatePreference(key)}
                          className="peer sr-only"
                        />
                        <div className={toggleClassName} />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={acceptSelected}
                      className={cn("flex-1", !isSunset && "bg-orange-500 hover:bg-orange-600")}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
