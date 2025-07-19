import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { token } = params

    // Get the onboarding link
    const { data: link, error } = await supabase
      .from("onboarding_links")
      .select("*")
      .eq("token", token)
      .single()

    if (error || !link) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or expired link" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if link is expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new NextResponse(
        JSON.stringify({ error: "This link has expired" }),
        { 
          status: 410,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if link has reached max uses
    if (link.current_uses >= link.max_uses) {
      return new NextResponse(
        JSON.stringify({ error: "This link has reached its maximum uses" }),
        { 
          status: 410,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    return new NextResponse(
      JSON.stringify(link),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding link GET:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { token } = params

    // Get the onboarding link
    const { data: link, error: linkError } = await supabase
      .from("onboarding_links")
      .select("*")
      .eq("token", token)
      .single()

    if (linkError || !link) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or expired link" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if link is expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new NextResponse(
        JSON.stringify({ error: "This link has expired" }),
        { 
          status: 410,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if link has reached max uses
    if (link.current_uses >= link.max_uses) {
      return new NextResponse(
        JSON.stringify({ error: "This link has reached its maximum uses" }),
        { 
          status: 410,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { first_name, last_name, email, phone, telegram_chat_id, notes } = await request.json()

    // Validate required fields
    if (!first_name || !email) {
      return new NextResponse(
        JSON.stringify({ error: "First name and email are required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Check if contact already exists
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", link.user_id)
      .eq("email", email)
      .single()

    if (existingContact) {
      // Update existing contact with new information
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          first_name,
          last_name: last_name || "",
          phone: phone || null,
          telegram_chat_id: telegram_chat_id || null,
          notes: notes || null,
        })
        .eq("id", existingContact.id)

      if (updateError) {
        console.error("Error updating contact:", updateError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to update contact" }),
          { 
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      }
    } else {
      // Create new contact
      const { error: insertError } = await supabase
        .from("contacts")
        .insert({
          user_id: link.user_id,
          first_name,
          last_name: last_name || "",
          email,
          phone: phone || null,
          telegram_chat_id: telegram_chat_id || null,
          notes: notes || null,
          category: "general",
        })

      if (insertError) {
        console.error("Error creating contact:", insertError)
        return new NextResponse(
          JSON.stringify({ error: "Failed to create contact" }),
          { 
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        )
      }
    }

    // Increment the usage count
    const { error: updateLinkError } = await supabase
      .from("onboarding_links")
      .update({ current_uses: link.current_uses + 1 })
      .eq("id", link.id)

    if (updateLinkError) {
      console.error("Error updating link usage:", updateLinkError)
    }

    return new NextResponse(
      JSON.stringify({ 
        message: "Contact added successfully",
        action: existingContact ? "updated" : "created"
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )

  } catch (error: any) {
    console.error("Error in onboarding link POST:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 