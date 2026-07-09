"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import FloatingHelpButton from "./floating-help-button"

export default function FloatingHelpWrapper() {
  const { user } = useSupabase()

  // Only show floating help button for logged-in users
  if (!user) {
    return null
  }

  return <FloatingHelpButton />
} 