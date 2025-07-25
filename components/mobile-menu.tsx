"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { LogOut, User, X, LifeBuoy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Custom CSS for shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const { user, supabase } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

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
      setShouldRender(true)
      // Small delay to ensure component is rendered before animation starts
      setTimeout(() => {
        setIsVisible(true)
      }, 10)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      // Wait for animation to complete before unmounting
      setTimeout(() => {
        setShouldRender(false)
      }, 500)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !shouldRender) return null

  const menuContent = (
    <>
      <style>{shimmerStyle}</style>
      <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/10 transition-opacity duration-500 ease-out"
        style={{ opacity: isVisible ? '1' : '0' }}
        onClick={onClose}
      />
      
                                {/* Navigation Panel */}
          <div className={`fixed top-0 h-full w-[300px] sm:w-[400px] backdrop-blur-[4px] border-l border-white/40 shadow-[0_0_30px_rgba(0,0,0,0.1)] relative overflow-hidden rounded-l-3xl transform transition-all duration-500 ease-out`} style={{ left: 'calc(100vw - 300px)', right: 'auto', transform: isVisible ? 'translateX(0)' : 'translateX(100%)', opacity: isVisible ? '1' : '0' }}>
            {/* Top area background for better header contrast */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
            {/* Dynamic color refraction overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-pink-500/1 pointer-events-none transition-all duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/4 via-rose-500/2 to-pink-500/0 pointer-events-none transition-all duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-green-500/3 via-teal-500/2 to-cyan-500/0 pointer-events-none transition-all duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-yellow-500/2 via-orange-500/1 to-red-500/0 pointer-events-none transition-all duration-700"></div>
            {/* Animated color shifts */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent pointer-events-none animate-pulse"></div>
            {/* Dynamic color refraction based on content */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/2 via-orange-500/1 via-yellow-500/1 via-green-500/1 via-blue-500/1 via-purple-500/1 to-pink-500/0 pointer-events-none"></div>
            {/* Moving light reflection */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent pointer-events-none" style={{ 
              animation: 'shimmer 3s ease-in-out infinite',
              backgroundPosition: '200% 0'
            }}></div>
        
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
              Sunrise
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
                  ? "bg-transparent text-gray-800 shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-gray-800 hover:bg-white/70 hover:text-gray-900 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
              }`}
              onClick={onClose}
            >
              {/* Active state border */}
              {pathname === "/" && (
                <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
              )}
              {/* Dynamic color border based on content */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-orange-500/30 via-rose-500/30 to-pink-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Home</span>
            </Link>
            <Link
              href="/features"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/features" 
                  ? "bg-transparent text-gray-800 shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-gray-800 hover:bg-white/70 hover:text-gray-900 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
              }`}
              onClick={onClose}
            >
              {/* Active state border */}
              {pathname === "/features" && (
                <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
              )}
              {/* Dynamic color border based on content - Features theme */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Features</span>
            </Link>
            <Link
              href="/pricing"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/pricing" 
                  ? "bg-transparent text-gray-800 shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-gray-800 hover:bg-white/70 hover:text-gray-900 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
              }`}
              onClick={onClose}
            >
              {/* Active state border */}
              {pathname === "/pricing" && (
                <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
              )}
              {/* Dynamic color border based on content - Pricing theme */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-green-500/30 via-teal-500/30 to-cyan-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              {/* Rainbow refraction effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Pricing</span>
            </Link>
            {user && (
              <>
                <div className="border-t border-white/20 pt-6 mt-6">
                  <p className="text-sm font-medium text-gray-900 mb-4 px-2 drop-shadow-sm">
                    Welcome, {userProfile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Link
                    href="/dashboard"
                    className={`flex items-center px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      pathname === "/dashboard" 
                        ? "bg-transparent text-gray-800 shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/50 backdrop-blur-md text-gray-800 hover:text-gray-900 hover:bg-white/70 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
                    }`}
                    onClick={onClose}
                  >
                    {/* Active state border */}
                    {pathname === "/dashboard" && (
                      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
                    )}
                    {/* Dynamic color border based on content - Dashboard theme */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-rose-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Rainbow refraction effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <User className="h-4 w-4 mr-3 relative z-10" />
                    <span className="relative z-10">Dashboard</span>
                  </Link>
                  <Link
                    href="/help"
                    className={`flex items-center px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden mt-3 ${
                      pathname === "/help" 
                        ? "bg-transparent text-gray-800 shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/50 backdrop-blur-md text-gray-800 hover:text-gray-900 hover:bg-white/70 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
                    }`}
                    onClick={onClose}
                  >
                    {/* Active state border */}
                    {pathname === "/help" && (
                      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
                    )}
                    {/* Dynamic color border based on content - Help theme */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-teal-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Rainbow refraction effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <LifeBuoy className="h-4 w-4 mr-3 relative z-10" />
                    <span className="relative z-10">Help</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-5 py-4 rounded-2xl text-sm font-medium bg-white/50 backdrop-blur-md text-red-600 hover:text-red-700 hover:bg-red-50/50 transition-all duration-300 mt-4 w-full text-left relative overflow-hidden shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,0,0,0.3)]"
                  >
                    {/* Dynamic color border based on content - Sign Out theme */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
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
    </>
  )

  // Use portal to render at document body level
  return createPortal(menuContent, document.body)
} 