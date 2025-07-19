import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get all onboarding links for the user
    const { data: links, error } = await supabase
      .from("onboarding_links")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching onboarding links:", error)
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch onboarding links" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(links),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding links GET:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { title, description, expires_at, max_uses } = await request.json()

    // Generate a unique token
    const token = randomBytes(32).toString('hex')

    // Create the onboarding link
    const { data: link, error } = await supabase
      .from("onboarding_links")
      .insert({
        user_id: session.user.id,
        token,
        title: title || "Join my contact list",
        description: description || "Click to add yourself to my contact list",
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        max_uses: max_uses || 100,
        current_uses: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating onboarding link:", error)
      return new NextResponse(
        JSON.stringify({ error: "Failed to create onboarding link" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(link),
      { 
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding links POST:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 