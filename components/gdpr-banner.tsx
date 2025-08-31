"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Settings, Shield, Cookie } from "lucide-react"
import Link from "next/link"

export default function GDPRBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    performance: false,
    functional: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const preferences = {
      essential: true,
      performance: true,
      functional: true,
      marketing: true
    }
    setCookiePreferences(preferences)
    localStorage.setItem('cookie-consent', JSON.stringify(preferences))
    setShowBanner(false)
  }

  const acceptSelected = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(cookiePreferences))
    setShowBanner(false)
  }

  const rejectAll = () => {
    const preferences = {
      essential: true, // Essential cookies cannot be rejected
      performance: false,
      functional: false,
      marketing: false
    }
    setCookiePreferences(preferences)
    localStorage.setItem('cookie-consent', JSON.stringify(preferences))
    setShowBanner(false)
  }

  const updatePreference = (type: keyof typeof cookiePreferences) => {
    if (type === 'essential') return // Essential cookies cannot be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">We value your privacy</h3>
              </div>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies.{" "}
                <Link href="/cookie-policy" className="text-orange-500 hover:text-orange-600 underline">
                  Learn more
                </Link>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                className="bg-orange-500 hover:bg-orange-600"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Cookie Preferences</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">Essential Cookies</h4>
                      <p className="text-sm text-gray-600">Required for the website to function</p>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                      Always Active
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Performance Cookies</h4>
                      <p className="text-sm text-gray-600">Help us improve website performance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.performance}
                        onChange={() => updatePreference('performance')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Functional Cookies</h4>
                      <p className="text-sm text-gray-600">Enable enhanced functionality</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.functional}
                        onChange={() => updatePreference('functional')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">Marketing Cookies</h4>
                      <p className="text-sm text-gray-600">Used for advertising and analytics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cookiePreferences.marketing}
                        onChange={() => updatePreference('marketing')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowSettings(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={acceptSelected}
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
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
