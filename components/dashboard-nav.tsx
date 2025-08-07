"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Coins, Settings, LogOut, Shield, Mail, Send, Crown, Zap, User, Database, MessageSquare } from "lucide-react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useEffect, useState } from "react"
import { useSubscription } from "@/lib/use-subscription"

export function DashboardNav() {
  const pathname = usePathname()
  const { supabase, user } = useSupabase()
  const { subscription, loading: subscriptionLoading } = useSubscription()
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

  if (isLoading || subscriptionLoading) {
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
      <Link href="/dashboard/email-logs">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/email-logs") && "bg-accent"
          )}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Logs
        </Button>
      </Link>
      <Link href="/dashboard/telegram-logs">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/telegram-logs") && "bg-accent"
          )}
        >
          <Send className="mr-2 h-4 w-4" />
          Telegram Logs
        </Button>
      </Link>
      {(subscription?.tier === 'pro' || subscription?.tier === 'enterprise') && (
        <Link href="/dashboard/discord-logs">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname.startsWith("/dashboard/discord-logs") && "bg-accent"
            )}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Discord Logs
          </Button>
        </Link>
      )}
      <Link href="/dashboard/data-management">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname.startsWith("/dashboard/data-management") && "bg-accent"
          )}
        >
          <Database className="mr-2 h-4 w-4" />
          Data Management
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
      
      {/* Subscription Status Indicator */}
      {subscription && !subscriptionLoading && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            {subscription.tier === 'free' && <User className="h-4 w-4 text-gray-500" />}
            {subscription.tier === 'basic' && <Coins className="h-4 w-4 text-blue-500" />}
            {subscription.tier === 'pro' && <Zap className="h-4 w-4 text-orange-500" />}
            {subscription.tier === 'enterprise' && <Crown className="h-4 w-4 text-purple-500" />}
            <span className="font-medium capitalize">{subscription.tier}</span>
            {subscription.status === 'trial' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Trial
              </span>
            )}
          </div>
          {subscription.tier === 'basic' && subscription.totalTokensPurchased > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {subscription.totalTokensPurchased}/100 tokens used
            </div>
          )}
        </div>
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