import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'
import { UserRole } from './prisma-enums'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      franchiseId: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    franchiseId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: UserRole
    franchiseId: string | null
  }
}