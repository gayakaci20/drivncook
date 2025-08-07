import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from './prisma'


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'sqlite'
  }),
  plugins: [
    nextCookies()
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'FRANCHISEE'
      },
      firstName: {
        type: 'string',
        required: true
      },
      lastName: {
        type: 'string',
        required: true
      },
      phone: {
        type: 'string',
        required: false
      },
      isActive: {
        type: 'boolean',
        defaultValue: true
      }
    }
  },
  async onAfterSignIn(user: any) {
     
    const dbUser = await prisma.user.findUnique({
      where: { id: user.user.id },
      include: { franchise: true }
    })
    
    if (!dbUser?.isActive) {
      throw new Error('Compte désactivé')
    }

     
    if (!dbUser.firstName && !dbUser.lastName) {
      await prisma.user.update({
        where: { id: user.user.id },
        data: { firstName: user.user.firstName, lastName: user.user.lastName }
      })
    }
    
    return user
  }
})

 
export function isAdmin(role: 'ADMIN' | 'FRANCHISEE'): boolean {
  return role === 'ADMIN'
}

export function isFranchisee(role: 'ADMIN' | 'FRANCHISEE'): boolean {
  return role === 'FRANCHISEE'
}

export function canAccessFranchise(userRole: 'ADMIN' | 'FRANCHISEE', userFranchiseId: string | null, targetFranchiseId: string): boolean {
  if (isAdmin(userRole)) return true
  if (isFranchisee(userRole)) return userFranchiseId === targetFranchiseId
  return false
}

 
export async function getServerSession(headers: Headers) {
  try {
    const cookie = headers.get('cookie') || ''
    
    const response = await fetch(
      new URL('/api/auth/session', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'), 
      {
        headers: { cookie },
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const sessionData = await response.json()
    return sessionData.user ? { user: sessionData.user } : null
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}