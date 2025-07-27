import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = session.user.id

    // Get user's consent settings from metadata
    const consentSettings = session.user.user_metadata?.consent_settings || {
      marketing: false,
      analytics: false,
      thirdParty: false,
      dataProcessing: true,
      consentDate: null,
      lastUpdated: null
    }

    return new NextResponse(
      JSON.stringify(consentSettings),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching consent settings:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch consent settings' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = session.user.id
    const { consentType, value } = await request.json()

    if (!consentType || typeof value !== 'boolean') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid consent parameters' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get current consent settings
    const currentConsent = session.user.user_metadata?.consent_settings || {
      marketing: false,
      analytics: false,
      thirdParty: false,
      dataProcessing: true,
      consentDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    // Update the specific consent setting
    const updatedConsent = {
      ...currentConsent,
      [consentType]: value,
      lastUpdated: new Date().toISOString()
    }

    // Ensure dataProcessing consent is always true (required for service)
    if (consentType === 'dataProcessing' && !value) {
      return new NextResponse(
        JSON.stringify({ error: 'Data processing consent is required for service provision' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Update user metadata with new consent settings
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        consent_settings: updatedConsent
      }
    })

    if (updateError) {
      console.error('Error updating consent settings:', updateError)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update consent settings' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Log consent change for audit purposes
    console.log(`Consent updated for user ${userId}: ${consentType} = ${value} at ${new Date().toISOString()}`)

    return new NextResponse(
      JSON.stringify({ 
        message: 'Consent settings updated successfully',
        consent: updatedConsent
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error updating consent settings:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update consent settings' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 