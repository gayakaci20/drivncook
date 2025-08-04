import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/prisma-enums'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            franchise: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        if (!user.isActive) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          franchiseId: user.franchise?.id || null,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole
        token.franchiseId = user.franchiseId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.franchiseId = token.franchiseId as string | null
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}

// Utilitaires d'autorisation
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
}

export function isFranchiseManager(role: UserRole): boolean {
  return role === UserRole.FRANCHISE_MANAGER
}

export function isFranchisee(role: UserRole): boolean {
  return role === UserRole.FRANCHISEE
}

export function canAccessFranchise(userRole: UserRole, userFranchiseId: string | null, targetFranchiseId: string): boolean {
  if (isAdmin(userRole)) return true
  if (isFranchiseManager(userRole)) return true
  return userFranchiseId === targetFranchiseId
}