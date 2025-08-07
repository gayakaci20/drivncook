import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default function NotFound() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero decorative background */}
      <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
        <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
        <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="max-w-xl w-full text-center">
          <div className="mt-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-200/40 bg-red-50/40 px-3 py-1 text-xs font-medium text-red-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
              Oups ! Page introuvable
            </span>
          </div>

          <h1 className="mt-6 block font-extrabold tracking-tight text-gray-900 text-7xl md:text-8xl lg:text-9xl dark:text-white drop-shadow-sm dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">404</h1>
          
          <h2 className="mt-4 md:mt-6 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Page non trouvée</h2>
          <p className="mt-4 md:mt-6 text-base md:text-lg text-gray-600 dark:text-neutral-400">
            La page que vous recherchez n'existe pas, a été déplacée, ou l'URL est incorrecte.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-x-2 rounded-xl bg-red-500/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-white/60 transition duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] dark:ring-red-400/40"
            >
              <ArrowLeftIcon className="ml-0.5 size-4 transition-transform group-hover:-translate-x-0.5" />
              Retour à l'accueil
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-x-2 rounded-xl border border-gray-300/60 dark:border-white/30 bg-gray-100/80 dark:bg-white/5 px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-200/80 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/70 dark:focus-visible:ring-white/70 shadow-sm dark:shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)]"
            >
              Se connecter
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-neutral-400">
            Besoin d'aide ? <Link href="/contact" className="underline decoration-gray-400 underline-offset-4 hover:decoration-gray-600 dark:decoration-neutral-500 dark:hover:decoration-neutral-300">Contactez-nous</Link>
          </p>
        </div>
      </div>
    </section>
  )
}