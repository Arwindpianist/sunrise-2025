"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { LogOut, User, Menu, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function Header() {
  const pathname = usePathname()
  const { user, supabase } = useSupabase()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Sunrise
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/" ? "text-orange-500" : "text-gray-600"
              }`}
            >
              Home
            </Link>
            <Link
              href="/features"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/features" ? "text-orange-500" : "text-gray-600"
              }`}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                pathname === "/pricing" ? "text-orange-500" : "text-gray-600"
              }`}
            >
              Pricing
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Hide username on mobile */}
                <span className="hidden md:inline text-sm text-gray-600">
                  Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-500">
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-orange-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-500">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/10 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden">
                {/* Background gradient overlay for color reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-orange-500/3 via-rose-500/3 to-pink-500/3 pointer-events-none"></div>
                <SheetHeader className="pb-6 relative z-10">
                  <SheetTitle className="text-xl font-semibold text-white/90 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-sm">
                    Navigation Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-3 mt-8 relative z-10">
                  <Link
                    href="/"
                    className={`px-6 py-4 rounded-full text-sm font-medium transition-all duration-500 hover:scale-105 relative overflow-hidden ${
                      pathname === "/" 
                        ? "bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                        : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white border border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">Home</span>
                  </Link>
                  <Link
                    href="/features"
                    className={`px-6 py-4 rounded-full text-sm font-medium transition-all duration-500 hover:scale-105 relative overflow-hidden ${
                      pathname === "/features" 
                        ? "bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                        : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white border border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">Features</span>
                  </Link>
                  <Link
                    href="/pricing"
                    className={`px-6 py-4 rounded-full text-sm font-medium transition-all duration-500 hover:scale-105 relative overflow-hidden ${
                      pathname === "/pricing" 
                        ? "bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                        : "bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:text-white border border-white/10 hover:border-white/20"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">Pricing</span>
                  </Link>
                  {user && (
                    <>
                      <div className="border-t border-white/10 pt-6 mt-6 relative z-10">
                        <div className="px-6 py-4 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-4 shadow-[0_0_15px_rgba(255,255,255,0.05)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
                          <p className="text-sm font-medium text-white/90 relative z-10">
                            Welcome, {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="flex items-center px-6 py-4 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/15 hover:backdrop-blur-md transition-all duration-500 hover:scale-105 border border-white/10 hover:border-white/20 relative overflow-hidden"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                          <User className="h-4 w-4 mr-3 relative z-10" />
                          <span className="relative z-10">Dashboard</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center px-6 py-4 rounded-full text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 hover:backdrop-blur-md transition-all duration-500 hover:scale-105 border border-red-500/20 hover:border-red-500/30 mt-3 w-full text-left relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-orange-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                          <LogOut className="h-4 w-4 mr-3 relative z-10" />
                          <span className="relative z-10">Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
