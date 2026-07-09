"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useSupabase } from "@/components/providers/supabase-provider"

const STORAGE_PREFIX = "sunrise:userProfile:v1:"
const CLIENT_CACHE_MS = 5 * 60 * 1000

type ProfileState = {
  full_name: string | null
}

type UserProfileContextValue = {
  profile: ProfileState | null
  loading: boolean
  /** Clears session cache and refetches from `/api/user/profile`. Call after updating name in Settings. */
  refreshProfile: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabase()
  const [profile, setProfile] = useState<ProfileState | null>(null)
  const [loading, setLoading] = useState(false)

  const storageKey = user?.id ? `${STORAGE_PREFIX}${user.id}` : null

  const fetchFromApi = useCallback(async () => {
    const res = await fetch("/api/user/profile", { credentials: "include" })
    if (!res.ok) {
      return null
    }
    const data = (await res.json()) as { full_name: string | null }
    const next: ProfileState = { full_name: data.full_name ?? null }
    if (typeof window !== "undefined" && storageKey) {
      try {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({ full_name: next.full_name, storedAt: Date.now() }),
        )
      } catch {
        // ignore quota / private mode
      }
    }
    return next
  }, [storageKey])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      return
    }
    if (typeof window !== "undefined" && storageKey) {
      try {
        window.sessionStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }
    setLoading(true)
    try {
      const next = await fetchFromApi()
      setProfile(next)
    } finally {
      setLoading(false)
    }
  }, [user?.id, storageKey, fetchFromApi])

  useEffect(() => {
    if (!user?.id || !storageKey) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false

    try {
      const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as { full_name: string | null; storedAt: number }
        if (typeof parsed.storedAt === "number" && Date.now() - parsed.storedAt < CLIENT_CACHE_MS) {
          setProfile({ full_name: parsed.full_name ?? null })
          setLoading(false)
          return
        }
      }
    } catch {
      // ignore invalid JSON
    }

    setLoading(true)
    ;(async () => {
      const next = await fetchFromApi()
      if (!cancelled) {
        setProfile(next)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, storageKey, fetchFromApi])

  const value = useMemo<UserProfileContextValue>(
    () => ({
      profile,
      loading,
      refreshProfile,
    }),
    [profile, loading, refreshProfile],
  )

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
}

export function useUserProfile(): UserProfileContextValue {
  const ctx = useContext(UserProfileContext)
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider")
  }
  return ctx
}
