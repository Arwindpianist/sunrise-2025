import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    
    const hasPublicKey = !!vapidPublicKey
    const hasPrivateKey = !!vapidPrivateKey
    const isConfigured = hasPublicKey && hasPrivateKey
    
    return new NextResponse(JSON.stringify({
      isConfigured,
      hasPublicKey,
      hasPrivateKey,
      publicKeyLength: vapidPublicKey?.length || 0,
      privateKeyLength: vapidPrivateKey?.length || 0,
      message: isConfigured 
        ? "VAPID keys are properly configured" 
        : "VAPID keys are missing or incomplete"
    }), { status: 200 })
    
  } catch (error: any) {
    console.error('Error checking VAPID configuration:', error)
    return new NextResponse(JSON.stringify({ 
      error: "Failed to check VAPID configuration",
      details: error.message 
    }), { status: 500 })
  }
}
