import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@/types/prisma-enums'
import { ZodError } from 'zod'

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Fonction pour créer une réponse d'erreur standardisée
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

// Fonction pour créer une réponse de succès standardisée
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

// Middleware d'authentification pour les routes API
export async function withAuth(handler: Function, requiredRoles?: UserRole[]) {
  return async (request: Request, context?: any) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return createErrorResponse('Non authentifié', 401)
    }

    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      return createErrorResponse('Permissions insuffisantes', 403)
    }

    return handler(request, context, session)
  }
}

// Middleware de validation des données avec Zod
export function withValidation<T>(schema: any, handler: Function) {
  return async (request: Request, context?: any, session?: any) => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return handler(request, context, session, validatedData)
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        return createErrorResponse(`Données invalides: ${errorMessages.join(', ')}`, 400)
      }
      return createErrorResponse('Erreur de validation des données', 400)
    }
  }
}

// Middleware de gestion des erreurs
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

// Fonction pour paginer les résultats
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