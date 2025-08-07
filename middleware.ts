import { NextRequest, NextResponse } from 'next/server'
import { ExtendedUser } from '@/types/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/register', '/contact']
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

    const cookies = request.headers.get('cookie')
    console.log('Making session request with cookies:', cookies ? 'Yes' : 'No')
    console.log('Cookie content:', cookies)
    
    const sessionResponse = await fetch(
      new URL('/api/auth/get-session', request.nextUrl.origin),
      {
        headers: {
          cookie: cookies || '',
        },
      }
    )

    console.log('Session response status:', sessionResponse.status)
    
    if (!sessionResponse.ok) {
      console.log('Session response not ok, status:', sessionResponse.status)
      const errorText = await sessionResponse.text()
      console.log('Session error response:', errorText)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    let sessionData: { user: ExtendedUser | null, session?: any }
    try {
      sessionData = await sessionResponse.json()
      console.log('Session data parsed successfully:', JSON.stringify(sessionData, null, 2))
    } catch (error) {
      console.log('Error parsing session JSON:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (!sessionData?.user) {
      console.log('No user in session, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

  const user: ExtendedUser = sessionData.user
  console.log('User role:', user.role)
  console.log('User franchiseId:', user.franchiseId)
  console.log('User isActive:', user.isActive)

  if (pathname.startsWith('/admin')) {
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  if (pathname.startsWith('/franchise')) {
    if (user.role !== 'FRANCHISEE') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // Vérifier que le franchisé est actif
    if (!user.isActive) {
      console.log('User is not active, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  if (pathname === '/') {
    console.log('Root path detected, redirecting based on role:', user.role)
    if (user.role === 'FRANCHISEE') {
      console.log('Redirecting to franchise dashboard')
      return NextResponse.redirect(new URL('/franchise/dashboard', request.url))
    } else if (user.role === 'ADMIN') {
      console.log('Redirecting to admin dashboard')
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else {
      console.log('Unknown role, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

    return NextResponse.next()
  }

  export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ]
  }