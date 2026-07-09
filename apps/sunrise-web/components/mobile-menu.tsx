"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBrand } from "@repo/ui/brand-provider"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useUserProfile } from "@/components/providers/user-profile-provider"
import { LogOut, User, X, AlertTriangle } from "lucide-react"
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
  const brand = useBrand()
  const pathname = usePathname()
  const { user, supabase } = useSupabase()
  const { profile } = useUserProfile()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

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

  if (brand === "sunset") {
    const sunsetLinks: { href: string; label: string; help?: boolean }[] = [
      { href: "/", label: "Home" },
      { href: "/features", label: "Features" },
      { href: "/playground", label: "Playground" },
      { href: "/help", label: "Help", help: true },
      { href: "/pricing", label: "Pricing" },
    ]

    const linkActive = (href: string, help?: boolean) => {
      if (help) return pathname === "/help" || pathname.startsWith("/help/")
      return pathname === href
    }

    const sunsetMenu = (
      <div className="fixed inset-0 z-[9999] md:hidden">
        <div
          className="absolute inset-0 bg-black/60 transition-opacity duration-300"
          style={{ opacity: isVisible ? "1" : "0" }}
          onClick={onClose}
          aria-hidden
        />
        <div
          className="fixed top-0 right-0 flex h-full w-[300px] flex-col border-l border-border bg-background shadow-xl transition-all duration-300 ease-out sm:w-[360px]"
          style={{
            transform: isVisible ? "translateX(0)" : "translateX(100%)",
            opacity: isVisible ? 1 : 0,
          }}
        >
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="bg-gradient-to-r from-[oklch(0.72_0.14_303)] to-[oklch(0.72_0.18_345)] bg-clip-text text-xl font-semibold text-transparent">
                Sunset
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-1">
              {sunsetLinks.map(({ href, label, help }) => {
                const active = linkActive(href, help)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? "border border-primary/40 bg-primary/15 text-primary"
                        : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            {user ? (
              <div className="mt-auto border-t border-border pt-6">
                <p className="mb-4 px-1 text-sm font-medium text-foreground">
                  Welcome, {profile?.full_name || user.email?.split("@")[0]}
                </p>
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" onClick={onClose}>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard/sos" onClick={onClose}>
                    <Button variant="outline" className="w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Emergency SOS
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
                <Link href="/login" onClick={onClose}>
                  <Button variant="outline" className="w-full border-border">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" onClick={onClose}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )

    return createPortal(sunsetMenu, document.body)
  }

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
            <h2
              className={
                brand === "sunset"
                  ? "text-xl font-semibold bg-gradient-to-r from-slate-500 to-slate-800 bg-clip-text text-transparent drop-shadow-sm"
                  : "text-xl font-semibold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm"
              }
            >
              {brand === "sunset" ? "Sunset" : "Sunrise"}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex flex-col space-y-3">
            <Link
              href="/"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/" 
                  ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-foreground hover:bg-white/70 hover:text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
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
                  ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-foreground hover:bg-white/70 hover:text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
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
              href="/playground"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/playground"
                  ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                  : "bg-white/50 backdrop-blur-md text-foreground hover:bg-white/70 hover:text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
              }`}
              onClick={onClose}
            >
              {pathname === "/playground" && (
                <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: "1px" }}></div>
              )}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-rose-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Playground</span>
            </Link>
            <Link
              href="/help"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/help" || pathname.startsWith("/help/")
                  ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
                  : "bg-white/50 backdrop-blur-md text-foreground hover:bg-white/70 hover:text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
              }`}
              onClick={onClose}
            >
              {pathname === "/help" || pathname.startsWith("/help/") ? (
                <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-border pointer-events-none" style={{ borderWidth: "1px" }}></div>
              ) : null}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-teal-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Help</span>
            </Link>
            <Link
              href="/pricing"
              className={`px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                pathname === "/pricing" 
                  ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/50 backdrop-blur-md text-foreground hover:bg-white/70 hover:text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
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
                  <p className="text-sm font-medium text-foreground mb-4 px-2 drop-shadow-sm">
                    Welcome, {profile?.full_name || user.email?.split('@')[0]}
                  </p>
                  <Link
                    href="/dashboard"
                    className={`flex items-center px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      pathname === "/dashboard" 
                        ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/50 backdrop-blur-md text-foreground hover:text-foreground hover:bg-white/70 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.3)]"
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
                    href="/dashboard/sos"
                    className={`flex items-center px-5 py-4 rounded-2xl text-sm font-medium transition-all duration-300 relative overflow-hidden mt-3 ${
                      pathname === "/dashboard/sos" 
                        ? "bg-transparent text-foreground shadow-[0_4px_20px_rgba(255,255,255,0.2)]" 
                        : "bg-red-50/50 backdrop-blur-md text-red-600 hover:text-red-700 hover:bg-red-100/50 shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_40px_rgba(255,0,0,0.3)]"
                    }`}
                    onClick={onClose}
                  >
                    {/* Active state border */}
                    {pathname === "/dashboard/sos" && (
                      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-red-500 to-red-600 bg-clip-border pointer-events-none" style={{ borderWidth: '1px' }}></div>
                    )}
                    {/* Dynamic color border based on content - SOS theme */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-red-500/30 via-orange-500/30 to-yellow-500/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Rainbow refraction effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-orange-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <AlertTriangle className="h-4 w-4 mr-3 relative z-10" />
                    <span className="relative z-10">Emergency SOS</span>
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