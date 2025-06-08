"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    contacts: 0,
    events: 0,
    balance: 0,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      fetchStats()
    }
  }, [user, router])

  const fetchStats = async () => {
    try {
      // Get contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)

      if (contactsError) throw contactsError

      // Get events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)

      if (eventsError) throw eventsError

      // Get user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user?.id)
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError

      setStats({
        contacts: contactsCount || 0,
        events: eventsCount || 0,
        balance: balanceData?.balance || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (!user || !mounted) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">{stats.contacts}</p>
              <Link href="/dashboard/contacts">
                <Button variant="link" className="mt-2">
                  View Contacts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">{stats.events}</p>
              <Link href="/dashboard/events">
                <Button variant="link" className="mt-2">
                  View Events
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">${(stats.balance * 0.01).toFixed(2)}</p>
              <p className="text-muted-foreground">{stats.balance} credits</p>
              <Link href="/dashboard/balance">
                <Button variant="link" className="mt-2">
                  Manage Balance
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/dashboard/contacts/create">
                <Button className="w-full">Add New Contact</Button>
              </Link>
              <Link href="/dashboard/events/create">
                <Button className="w-full">Create New Event</Button>
              </Link>
              <Link href="/dashboard/balance">
                <Button className="w-full">Purchase Credits</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
