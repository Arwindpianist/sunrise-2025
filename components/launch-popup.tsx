"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Gift, ArrowRight, X } from "lucide-react"

export default function LaunchPopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem("launch-popup-seen")
    
    if (!hasSeenPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 2000) // 2 seconds delay

      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Mark as seen so it doesn't show again
    localStorage.setItem("launch-popup-seen", "true")
  }

  const handleSignup = () => {
    // Mark as seen and redirect to signup
    localStorage.setItem("launch-popup-seen", "true")
    setIsOpen(false)
    window.location.href = "/register"
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 border-orange-200">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Sunrise Launches August 1st, 2025
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Celebrate life's beautiful moments with joyful event management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <h3 className="font-semibold text-gray-800 mb-2">What We Do:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Create beautiful invitations for weddings and celebrations</li>
              <li>• Manage contact lists with smart categorization</li>
              <li>• Send scheduled messages across email, WhatsApp, Telegram, and SMS</li>
              <li>• Provide stunning templates for every occasion</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 mr-2" />
              <span className="font-semibold">Special Launch Offer</span>
            </div>
            <p className="text-center text-sm">
              Get <span className="font-bold text-lg">10 additional free tokens</span> when you sign up today
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={handleSignup}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white flex-1"
          >
            Sign Up Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-orange-200 text-gray-600 hover:bg-orange-50"
          >
            Maybe Later
          </Button>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </DialogContent>
    </Dialog>
  )
} 