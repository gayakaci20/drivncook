import { createAuthClient } from 'better-auth/react'

function getBaseURL() {
  // En production, utiliser l'URL du domaine
  if (typeof window !== 'undefined') {
    // Côté client, utiliser l'origine actuelle si c'est HTTPS
    if (window.location.protocol === 'https:') {
      return window.location.origin
    }
  }
  
  // Utiliser les variables d'environnement
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.BETTER_AUTH_URL || 
         'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})

export const { signIn, signOut, signUp, useSession } = authClient