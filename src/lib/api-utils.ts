import { NextResponse } from 'next/server'
import { auth } from './auth'
import { headers } from 'next/headers'
import { ZodError } from 'zod'
import { UserRole } from '@/types/prisma-enums'


 
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

 
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

 
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

 
export function withAuth(handler: Function, requiredRoles?: UserRole[]) {
  return async (request: Request, context?: any) => {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return createErrorResponse('Non authentifié', 401)
    }

    if (requiredRoles && !requiredRoles.includes(session.user.role as UserRole)) {
      return createErrorResponse('Permissions insuffisantes', 403)
    }

    return handler(request, context, session)
  }
}

 
export function withValidation<T>(schema: any, handler: Function) {
  return async (request: Request, context?: any, session?: any) => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return handler(request, context, session, validatedData)
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
        return createErrorResponse(`Données invalides: ${errorMessages.join(', ')}`, 400)
      }
      return createErrorResponse('Erreur de validation des données', 400)
    }
  }
}

 
export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('Erreur API:', error)
      
      if (error instanceof Error) {
        return createErrorResponse(error.message, 500)
      }
      
      return createErrorResponse('Erreur serveur interne', 500)
    }
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  }
}

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}