import { UserRole } from '@/types/prisma-enums'

declare module 'next-auth' {
  interface User {
    role: string
    franchiseId: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      franchiseId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    franchiseId: string | null
  } 
}