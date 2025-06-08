"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Coins, Settings, LogOut } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"

export function DashboardNav() {
  const pathname = usePathname()
  const { supabase } = useSupabase()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
      <Link href="/dashboard/settings">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/settings") && "bg-accent"
          )}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
      <Button
        variant="ghost"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </nav>
  )
} 