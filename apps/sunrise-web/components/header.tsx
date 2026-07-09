"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBrand } from "@repo/ui/brand-provider"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useUserProfile } from "@/components/providers/user-profile-provider"
import { LogOut, User, Menu, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"
import MobileMenu from "./mobile-menu"
import { cn } from "@/lib/utils"

export default function Header() {
  const brand = useBrand()
  const pathname = usePathname()
  const { user, supabase } = useSupabase()
  const { profile } = useUserProfile()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isSunset = brand === "sunset"
  const isDashboard = pathname.startsWith("/dashboard")
  const headerShell = isSunset
    ? isDashboard
      ? "border-b border-border bg-background"
      : "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    : "border-b border-border bg-background"
  const navInactive = isSunset
    ? "text-muted-foreground hover:text-primary"
    : "text-muted-foreground hover:text-orange-500"
  const navActive = isSunset ? "text-primary" : "text-orange-500"
  const ghostAuth = isSunset ? "text-muted-foreground hover:text-primary" : "text-muted-foreground hover:text-orange-500"
  const welcomeText = "text-muted-foreground"
  const ctaClass = isSunset
    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
    : "bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
  const sosClass = isSunset
    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
    : "text-red-600 hover:text-red-700 hover:bg-red-50"

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className={headerShell}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span
              className={
                isSunset
                  ? "text-xl sm:text-2xl font-bold bg-gradient-to-r from-[oklch(0.72_0.14_303)] to-[oklch(0.72_0.18_345)] bg-clip-text text-transparent"
                  : "text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"
              }
            >
              {brand === "sunset" ? "Sunset" : "Sunrise"}
            </span>
          </Link>

          {/* Desktop Navigation - Show on tablet and up */}
          <nav
            className={cn(
              "items-center space-x-6 xl:space-x-8",
              isDashboard ? "hidden" : "hidden lg:flex"
            )}
            aria-hidden={isDashboard}
          >
            <Link href="/" className={`text-sm font-medium transition-colors ${pathname === "/" ? navActive : navInactive}`}>
              Home
            </Link>
            <Link
              href="/features"
              className={`text-sm font-medium transition-colors ${pathname === "/features" ? navActive : navInactive}`}
            >
              Features
            </Link>
            <Link
              href="/playground"
              className={`text-sm font-medium transition-colors ${pathname === "/playground" ? navActive : navInactive}`}
            >
              Playground
            </Link>
            <Link
              href="/help"
              className={`text-sm font-medium transition-colors ${
                pathname === "/help" || pathname.startsWith("/help/") ? navActive : navInactive
              }`}
            >
              Help
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors ${pathname === "/pricing" ? navActive : navInactive}`}
            >
              Pricing
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                {/* Username - Show on tablet and up, but hide on smaller tablets */}
                <span className={`hidden lg:inline text-sm ${welcomeText}`}>
                  Welcome, {profile?.full_name || user.email?.split('@')[0]}
                </span>
                {/* Compact username for medium tablets */}
                <span className={`hidden md:inline lg:hidden text-sm ${welcomeText}`}>
                  {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                
                {!isDashboard && (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm" className={ghostAuth}>
                        <User className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Dashboard</span>
                      </Button>
                    </Link>

                    <Link href="/dashboard/sos">
                      <Button variant="ghost" size="sm" className={sosClass}>
                        <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">SOS</span>
                      </Button>
                    </Link>
                  </>
                )}

                <Button variant="ghost" size="sm" onClick={handleSignOut} className={ghostAuth}>
                  <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className={ghostAuth}>
                    <span className="hidden sm:inline">Sign In</span>
                    <span className="sm:hidden">Login</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className={ctaClass}>
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile marketing menu (hidden on dashboard; sidebar handles nav) */}
            {!isDashboard && (
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden ${isSunset ? "text-muted-foreground hover:text-foreground" : ""}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!isDashboard && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </header>
  )
}
