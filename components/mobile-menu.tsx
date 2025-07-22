"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { LogOut, User, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { user, supabase } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle slide-in animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const menuContent = (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
                {/* Navigation Panel */}
          <div className={`fixed top-0 h-full w-[300px] sm:w-[400px] bg-white/1 backdrop-blur-sm border-l border-white/40 shadow-[0_0_30px_rgba(0,0,0,0.1)] relative overflow-hidden rounded-l-3xl`} style={{ left: 'calc(100vw - 300px)', right: 'auto' }}>
        {/* Subtle gradient overlays for liquid glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/3 via-rose-500/3 to-pink-500/3 pointer-events-none"></div>
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Navigation Menu
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/" 
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_8px_32px_rgba(251,146,60,0.3)]" 
                  : "bg-white/40 backdrop-blur-xl text-gray-800 hover:bg-white/60 hover:text-gray-900 border border-white/30 hover:border-white/50 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)]"
              }`}
              onClick={onClose}
            >
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Home</span>
            </Link>
            <Link
              href="/features"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/features" 
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_8px_32px_rgba(251,146,60,0.3)]" 
                  : "bg-white/40 backdrop-blur-xl text-gray-800 hover:bg-white/60 hover:text-gray-900 border border-white/30 hover:border-white/50 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)]"
              }`}
              onClick={onClose}
            >
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Features</span>
            </Link>
            <Link
              href="/pricing"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/pricing" 
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-[0_8px_32px_rgba(251,146,60,0.3)]" 
                  : "bg-white/40 backdrop-blur-xl text-gray-800 hover:bg-white/60 hover:text-gray-900 border border-white/30 hover:border-white/50 shadow-[0_4px_20px_rgba(0,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(0,255,255,0.25)]"
              }`}
              onClick={onClose}
            >
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Pricing</span>
            </Link>
            {user && (
              <>
                <div className="border-t border-white/20 pt-6 mt-6">
                  <div className="px-5 py-4 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 mb-4 shadow-[0_6px_24px_rgba(255,255,255,0.15)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
                    <p className="text-sm font-medium text-gray-800 relative z-10">
                      Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center px-5 py-4 rounded-2xl text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-xl transition-all duration-300 border border-white/30 hover:border-white/50 shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)] relative overflow-hidden"
                    onClick={onClose}
                  >
                    {/* Rainbow refraction effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <User className="h-4 w-4 mr-3 relative z-10" />
                    <span className="relative z-10">Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-5 py-4 rounded-2xl text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/40 hover:backdrop-blur-xl transition-all duration-300 border border-red-200/30 hover:border-red-300/50 mt-3 w-full text-left relative overflow-hidden shadow-[0_4px_20px_rgba(255,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(255,0,0,0.25)]"
                  >
                    {/* Rainbow refraction effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-orange-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <LogOut className="h-4 w-4 mr-3 relative z-10" />
                    <span className="relative z-10">Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )

  // Use portal to render at document body level
  return createPortal(menuContent, document.body)
} 