import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: Request,
  { params }: { params: { enquiryId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single()

    if (userError || userProfile?.subscription_plan !== 'admin') {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const { enquiryId } = params
    const body = await request.json()
    const { subject, message } = body

    // Get the enquiry details
    const { data: enquiry, error: enquiryError } = await supabase
      .from('user_enquiries')
      .select('id, user_id, subject, message, status')
      .eq('id', enquiryId)
      .single()

    if (enquiryError || !enquiry) {
      return new NextResponse(
        JSON.stringify({ error: 'Enquiry not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user details
    const { data: user, error: userDetailsError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', enquiry.user_id)
      .single()

    if (userDetailsError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = user.email
    const userName = user.full_name

    if (!userEmail) {
      return new NextResponse(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send email using Resend
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Sunrise Support Response</h2>
        <p>Dear ${userName || 'Valued Customer'},</p>
        
        <p>Thank you for contacting Sunrise support. Here is our response to your enquiry:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Original Enquiry:</h3>
          <p><strong>Subject:</strong> ${enquiry.subject}</p>
          <p><strong>Message:</strong> ${enquiry.message}</p>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h3 style="margin-top: 0;">Our Response:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to reach out to us.</p>
        
        <p>Best regards,<br>
        The Sunrise Support Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This email was sent in response to your support enquiry (ID: ${enquiryId})
        </p>
      </div>
    `

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Sunrise Support <support@sunrise.com>',
      to: [userEmail],
      subject: subject || `Re: ${enquiry.subject}`,
      html: emailContent,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to send email', details: emailError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update enquiry status to 'in_progress' if it was 'open'
    if (enquiry.status === 'open') {
      await supabase
        .from('user_enquiries')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', enquiryId)
    }

    return new NextResponse(JSON.stringify({
      message: 'Email sent successfully',
      emailId: emailData?.id
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 