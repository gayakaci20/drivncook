import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils'
import { UserRole } from '@/types/prisma-enums'

export async function GET(request: NextRequest) {
  try {
    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.ADMIN
      }
    })

    return createSuccessResponse({
      hasAdmin: adminCount > 0,
      message: adminCount > 0 ? 'Un administrateur existe déjà' : 'Aucun administrateur trouvé'
    })

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence d\'un administrateur:', error)
    return createErrorResponse('Erreur interne du serveur', 500)
  }
}