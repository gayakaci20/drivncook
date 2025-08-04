import Link from 'next/link'
import Image from 'next/image'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo-black.svg"
            alt="Driv'n Cook"
            width={60}
            height={60}
            className="h-15 w-auto"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Accès non autorisé
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Se reconnecter
          </Link>
          
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}