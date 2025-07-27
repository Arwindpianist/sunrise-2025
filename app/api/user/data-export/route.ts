import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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

    // Fetch all user data
    const [
      { data: userData },
      { data: contacts },
      { data: events },
      { data: emailLogs },
      { data: telegramLogs },
      { data: transactions },
      { data: userBalance },
      { data: userSubscription },
      { data: referrals },
      { data: enquiries }
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('contacts').select('*').eq('user_id', userId),
      supabase.from('events').select('*').eq('user_id', userId),
      supabase.from('email_logs').select('*').eq('user_id', userId),
      supabase.from('telegram_logs').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('user_balances').select('*').eq('user_id', userId).single(),
      supabase.from('user_subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
      supabase.from('referrals').select('*').eq('referrer_id', userId),
      supabase.from('enquiries').select('*').eq('user_id', userId)
    ])

    // Create comprehensive data export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportRequestedBy: userId,
      dataController: {
        name: 'SUNRISE SUNSET SERVICES',
        businessRegistration: '202503184225 (CT0152300-K)',
        email: 'admin@sunrise-2025.com'
      },
      user: {
        id: userData.user?.id,
        email: userData.user?.email,
        fullName: userData.user?.user_metadata?.full_name,
        createdAt: userData.user?.created_at,
        lastSignIn: userData.user?.last_sign_in_at,
        emailConfirmed: userData.user?.email_confirmed_at
      },
      data: {
        contacts: contacts || [],
        events: events || [],
        emailLogs: emailLogs || [],
        telegramLogs: telegramLogs || [],
        transactions: transactions || [],
        userBalance: userBalance || null,
        userSubscription: userSubscription?.[0] || null,
        referrals: referrals || [],
        enquiries: enquiries || []
      },
      metadata: {
        totalContacts: contacts?.length || 0,
        totalEvents: events?.length || 0,
        totalEmailsSent: emailLogs?.length || 0,
        totalTelegramSent: telegramLogs?.length || 0,
        totalTransactions: transactions?.length || 0
      },
      retentionInfo: {
        accountData: 'Retained while account is active + 2 years after deletion',
        eventData: 'Retained for 3 years after event date',
        contactData: 'Retained while account is active + 1 year after deletion',
        analyticsData: 'Retained for 26 months (Google Analytics standard)'
      },
      legalBasis: {
        consent: 'Primary basis for data processing',
        contractPerformance: 'Necessary for service provision',
        legitimateInterests: 'Security and service improvement'
      }
    }

    return new NextResponse(
      JSON.stringify(exportData),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="sunrise-data-export-${new Date().toISOString().split('T')[0]}.json"`
        },
      }
    )
  } catch (error: any) {
    console.error('Error exporting user data:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to export data' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 