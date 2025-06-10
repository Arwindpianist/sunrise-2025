"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Coins, Settings, LogOut, Shield } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useEffect, useState } from "react"

export function DashboardNav() {
  const pathname = usePathname()
  const { supabase, user } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        // Get the user's email from the session
        const { data: { session } } = await supabase.auth.getSession()
        const userEmail = session?.user?.email

        // Check if the user is an admin
        setIsAdmin(userEmail === "arwindpianist@gmail.com")
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return null // or a loading spinner
  }

  return (
    <nav className="grid items-start gap-2">
      <Link href="/dashboard">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname === "/dashboard" && "bg-accent"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard/contacts">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/contacts") && "bg-accent"
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          Contacts
        </Button>
      </Link>
      <Link href="/dashboard/events">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/events") && "bg-accent"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Events
        </Button>
      </Link>
      <Link href="/dashboard/balance">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/balance") && "bg-accent"
          )}
        >
          <Coins className="mr-2 h-4 w-4" />
          Balance
        </Button>
      </Link>
      {isAdmin && (
        <Link href="/dashboard/admin">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname.startsWith("/dashboard/admin") && "bg-accent"
            )}
          >
            <Shield className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </Link>
      )}
      <Button
        variant="ghost"
        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </nav>
  )
} 