import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const { POST, GET } = toNextJsHandler(auth)

// Gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  })
}