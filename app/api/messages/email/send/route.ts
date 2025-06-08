import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, body, eventId, contactIds, scheduleAt } = await request.json()

    // Check token balance
    const { data: tokens } = await supabase
      .from('tokens')
      .select('balance')
      .eq('user_id', session.user.id)
      .single()

    if (!tokens || tokens.balance < contactIds.length) {
      return NextResponse.json(
        { error: 'Insufficient tokens' },
        { status: 400 }
      )
    }

    // Get contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds)

    if (!contacts) {
      return NextResponse.json(
        { error: 'Contacts not found' },
        { status: 404 }
      )
    }

    // Create message record
    const { data: message } = await supabase
      .from('messages')
      .insert({
        user_id: session.user.id,
        subject,
        body,
        type: 'email',
        scheduled_at: scheduleAt,
        status: scheduleAt ? 'scheduled' : 'pending',
        event_id: eventId
      })
      .select()
      .single()

    // If immediate send
    if (!scheduleAt) {
      // Send emails
      const emailPromises = contacts.map(contact => {
        const personalizedBody = body
          .replace('{{name}}', contact.name)
          .replace('{{event_date}}', new Date().toLocaleDateString())

        return resend.emails.send({
          from: 'Sunrise-2025 <noreply@sunrise-2025.com>',
          to: contact.email,
          subject,
          html: personalizedBody
        })
      })

      await Promise.all(emailPromises)

      // Deduct tokens
      await supabase
        .from('tokens')
        .update({ balance: tokens.balance - contactIds.length })
        .eq('user_id', session.user.id)

      // Update message status
      await supabase
        .from('messages')
        .update({ status: 'sent' })
        .eq('id', message.id)
    }

    return NextResponse.json({
      message: scheduleAt ? 'Message scheduled' : 'Message sent',
      messageId: message.id
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 