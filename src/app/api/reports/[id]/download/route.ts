import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExtendedUser } from '@/types/auth'
import { UserRole } from '@/types/prisma-enums'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 })
    }

    if ((session.user as ExtendedUser).role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('fileUrl')
    const reportId = params.id

    if (!reportId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de rapport requis' 
      }, { status: 400 })
    }

    if (!fileUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL du fichier requis' 
      }, { status: 400 })
    }

    return NextResponse.redirect(fileUrl)

  } catch (error) {
    console.error('Erreur téléchargement rapport:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 })
  }
}
