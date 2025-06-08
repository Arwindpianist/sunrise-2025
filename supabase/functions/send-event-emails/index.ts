// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import { Resend } from 'https://esm.sh/resend@2.0.0'

interface Contact {
  id: string
  email: string
  first_name: string
  last_name: string
  category: string
  user_id: string
}

interface Event {
  id: string
  user_id: string
  title: string
  description: string
  event_date: string
  location: string
  email_subject: string
  email_template: string
  scheduled_send_time: string
  category: string
  status: string
}

interface RequestEvent {
  eventId: string
  category: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialize Resend
    // @ts-ignore
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Get the request body
    const { eventId, category } = await req.json() as RequestEvent

    if (!eventId) {
      throw new Error('Event ID is required')
    }

    // Get the event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      throw eventError
    }

    // Get the contacts based on the category
    let contactsQuery = supabaseClient
      .from('contacts')
      .select('*')
      .eq('user_id', event.user_id)

    // If category is not 'all', filter by category
    if (category !== 'all') {
      contactsQuery = contactsQuery.eq('category', category)
    }

    const { data: contacts, error: contactsError } = await contactsQuery

    if (contactsError) {
      throw contactsError
    }

    // Create event_contacts entries for each contact
    const eventContacts = contacts.map((contact: Contact) => ({
      event_id: eventId,
      contact_id: contact.id,
      status: 'pending'
    }))

    const { error: insertError } = await supabaseClient
      .from('event_contacts')
      .insert(eventContacts)

    if (insertError) {
      throw insertError
    }

    // Update event status to 'sending'
    const { error: updateError } = await supabaseClient
      .from('events')
      .update({ status: 'sending' })
      .eq('id', eventId)

    if (updateError) {
      throw updateError
    }

    // Send emails to each contact using Resend
    for (const contact of contacts as Contact[]) {
      try {
        // Send email using Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Sunrise <noreply@sunrise.com>',
          to: contact.email,
          subject: event.email_subject,
          html: event.email_template,
        })

        if (emailError) {
          throw emailError
        }

        // Create email log entry
        const { error: logError } = await supabaseClient
          .from('email_logs')
          .insert({
            event_id: eventId,
            contact_id: contact.id,
            status: 'sent',
            sent_at: new Date().toISOString()
          })

        if (logError) {
          throw logError
        }

        // Update event_contacts status
        const { error: updateContactError } = await supabaseClient
          .from('event_contacts')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('contact_id', contact.id)

        if (updateContactError) {
          throw updateContactError
        }
      } catch (error: any) {
        console.error(`Error sending email to ${contact.email}:`, error)

        // Log the error
        const { error: logError } = await supabaseClient
          .from('email_logs')
          .insert({
            event_id: eventId,
            contact_id: contact.id,
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString()
          })

        if (logError) {
          console.error('Error logging email failure:', logError)
        }

        // Update event_contacts status
        const { error: updateContactError } = await supabaseClient
          .from('event_contacts')
          .update({ 
            status: 'failed',
            sent_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('contact_id', contact.id)

        if (updateContactError) {
          console.error('Error updating contact status:', updateContactError)
        }
      }
    }

    // Update event status to 'sent' if all emails were sent successfully
    const { error: finalUpdateError } = await supabaseClient
      .from('events')
      .update({ status: 'sent' })
      .eq('id', eventId)

    if (finalUpdateError) {
      throw finalUpdateError
    }

    return new Response(
      JSON.stringify({ message: 'Emails sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 