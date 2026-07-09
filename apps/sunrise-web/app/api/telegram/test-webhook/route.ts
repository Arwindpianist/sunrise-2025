import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return new NextResponse(
    JSON.stringify({ 
      message: "Webhook endpoint is accessible",
      timestamp: new Date().toISOString(),
      method: "GET"
    }),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    return new NextResponse(
      JSON.stringify({ 
        message: "Webhook endpoint received POST request",
        timestamp: new Date().toISOString(),
        method: "POST",
        receivedData: body
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ 
        message: "Webhook endpoint received POST request but failed to parse body",
        timestamp: new Date().toISOString(),
        method: "POST",
        error: error.message
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
} 