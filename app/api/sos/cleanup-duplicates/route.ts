import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find duplicate SOS alerts created within 10 seconds of each other
    const { data: duplicates, error: duplicatesError } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (duplicatesError) {
      throw duplicatesError
    }

    // Group alerts by time proximity (within 10 seconds)
    const groups: string[][] = []
    const processed = new Set<string>()

    for (const alert of duplicates) {
      if (processed.has(alert.id)) continue

      const group = [alert.id]
      const alertTime = new Date(alert.created_at).getTime()

      for (const otherAlert of duplicates) {
        if (otherAlert.id === alert.id || processed.has(otherAlert.id)) continue

        const otherTime = new Date(otherAlert.created_at).getTime()
        if (Math.abs(alertTime - otherTime) < 10000) { // 10 seconds
          group.push(otherAlert.id)
          processed.add(otherAlert.id)
        }
      }

      if (group.length > 1) {
        groups.push(group)
      }
      processed.add(alert.id)
    }

    // Keep the first alert in each group, delete the rest
    let deletedCount = 0
    for (const group of groups) {
      const toDelete = group.slice(1) // Keep first, delete rest
      
      for (const alertId of toDelete) {
        // Delete related notifications first
        await supabase
          .from('sos_alert_notifications')
          .delete()
          .eq('sos_alert_id', alertId)

        // Delete the alert
        const { error: deleteError } = await supabase
          .from('sos_alerts')
          .delete()
          .eq('id', alertId)

        if (!deleteError) {
          deletedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate SOS alerts`,
      groupsFound: groups.length,
      totalDuplicates: groups.reduce((sum, group) => sum + group.length - 1, 0)
    })

  } catch (error: any) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { error: error.message || "Failed to cleanup duplicates" },
      { status: 500 }
    )
  }
}
