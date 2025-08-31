import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check - you can add database connectivity check here if needed
    return NextResponse.json(
      { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'drivncook-api'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        service: 'drivncook-api'
      },
      { status: 500 }
    )
  }
}
