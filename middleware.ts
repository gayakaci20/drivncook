import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Pages publiques (accessibles sans authentification)
    const publicPaths = ['/login', '/register', '/']
    if (publicPaths.includes(pathname)) {
      return NextResponse.next()
    }

    // Si pas de token, rediriger vers login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userRole = token.role as UserRole

    // Routes admin (réservées aux admins)
    if (pathname.startsWith('/admin')) {
      if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Routes franchise (réservées aux franchisés)
    if (pathname.startsWith('/franchise')) {
      if (userRole !== UserRole.FRANCHISEE) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Redirection de la racine selon le rôle
    if (pathname === '/') {
      if (userRole === UserRole.FRANCHISEE) {
        return NextResponse.redirect(new URL('/franchise/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Pages publiques toujours autorisées
        if (['/login', '/register', '/'].includes(pathname)) {
          return true
        }
        
        // Autres pages nécessitent une authentification
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}