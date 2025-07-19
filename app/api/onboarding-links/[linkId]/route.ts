import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PUT(
  request: Request,
  { params }: { params: { linkId: string } }
) {
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

    // Check if the link exists and belongs to the user
    const { data: existingLink, error: fetchError } = await supabase
      .from("onboarding_links")
      .select("*")
      .eq("id", params.linkId)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError || !existingLink) {
      return new NextResponse(
        JSON.stringify({ error: "Onboarding link not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Update the onboarding link
    const { data: updatedLink, error: updateError } = await supabase
      .from("onboarding_links")
      .update({
        title: title || existingLink.title,
        description: description || existingLink.description,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        max_uses: max_uses || existingLink.max_uses,
      })
      .eq("id", params.linkId)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating onboarding link:", updateError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to update onboarding link" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(updatedLink),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding links PUT:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { linkId: string } }
) {
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

    // Check if the link exists and belongs to the user
    const { data: existingLink, error: fetchError } = await supabase
      .from("onboarding_links")
      .select("*")
      .eq("id", params.linkId)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError || !existingLink) {
      return new NextResponse(
        JSON.stringify({ error: "Onboarding link not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Delete the onboarding link
    const { error: deleteError } = await supabase
      .from("onboarding_links")
      .delete()
      .eq("id", params.linkId)
      .eq("user_id", session.user.id)

    if (deleteError) {
      console.error("Error deleting onboarding link:", deleteError)
      return new NextResponse(
        JSON.stringify({ error: "Failed to delete onboarding link" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify({ message: "Onboarding link deleted successfully" }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding links DELETE:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 