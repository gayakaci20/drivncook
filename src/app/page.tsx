'use client'

import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { ArrowRightIcon, ShoppingCartIcon, TruckIcon, ShieldIcon, CircleHelpIcon } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-3xl text-center mx-auto">
              <div className="mt-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200/40 bg-red-50/40 px-3 py-1 text-xs font-medium text-red-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200">
                  Plateforme dédiée aux franchisés
                </span>
              </div>

              <h1 className="mt-6 block font-extrabold tracking-tight text-gray-900 text-4xl md:text-6xl lg:text-7xl dark:text-white">
                DRIV'N COOK
              </h1>
              <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-gray-600 dark:text-neutral-400">
                Votre espace sécurisé pour gérer votre franchise : suivi des commandes, gestion du parc de camions, approvisionnement en stock, consultation des ventes et accès à tous les services dédiés aux franchisés.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/register"
                  className="group inline-flex items-center justify-center gap-x-2 rounded-xl bg-red-500/90 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-white/60 transition duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500/60"
                >
                  Devenir franchisé
                  <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center gap-x-2 rounded-xl border border-gray-300/60 dark:border-white/30 bg-gray-100/80 dark:bg-white/5 px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-200/80 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/70 dark:focus-visible:ring-white/70"
                >
                  Nous contacter
                </a>
              </div>

              {/* Decorative divider */}
              <div className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-neutral-400">
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-neutral-700" />
                <span>Conçu pour la performance et la simplicité</span>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-neutral-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <h2 className="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white">
            Fonctionnalités principales
          </h2>
          <p className="mt-2 text-gray-600 dark:text-neutral-400">
            Découvrez tous les outils pour optimiser votre franchise
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Gestion des commandes', desc: 'Suivi en temps réel de toutes vos commandes et livraisons', icon: (
              <ShoppingCartIcon className="size-6" />
            )},
            { title: 'Flotte de véhicules', desc: 'Gérez votre parc de camions et planifiez la maintenance', icon: (
              <TruckIcon className="size-6" />
            )},
            { title: 'Gestion de stock', desc: 'Contrôlez vos approvisionnements et optimisez vos stocks', icon: (
              <ShoppingCartIcon className="size-6" />
            )},
            { title: 'Rapports de ventes', desc: 'Analysez vos performances avec des rapports détaillés', icon: (
              <ShoppingCartIcon className="size-6" />
            )},
            { title: 'Sécurité des données', desc: 'Protection maximale de vos informations sensibles', icon: (
              <ShieldIcon className="size-6" />
            )},
            { title: 'Support 24/7', desc: 'Assistance technique disponible à tout moment', icon: (
              <CircleHelpIcon className="size-6" />
            )},
          ].map((f) => (
            <div key={f.title} className="group flex flex-col h-full rounded-2xl border border-gray-200 bg-white/70 backdrop-blur shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900/60 dark:border-neutral-700">
              <div className="p-5 md:p-6">
                <span className="flex justify-center items-center size-12 rounded-xl bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
                  {f.icon}
                </span>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="mt-1.5 text-gray-600 dark:text-neutral-400">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
          <h2 className="text-2xl font-bold md:text-4xl md:leading-tight dark:text-white">
            Ce que disent nos franchisés
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { initials: 'MR', name: 'Marie Rodriguez', city: 'Franchisée à Lyon', quote: "Grâce à DRIV'N COOK, j'ai pu optimiser la gestion de ma franchise et augmenter mes revenus de 30%." },
            { initials: 'JD', name: 'Jean Dupont', city: 'Franchisé à Paris', quote: "L'interface est intuitive et le support client exceptionnel. Je recommande vivement cette plateforme." },
            { initials: 'SM', name: 'Sophie Martin', city: 'Franchisée à Marseille', quote: 'Le suivi en temps réel des commandes a révolutionné notre service client. Nos clients sont ravis !' },
          ].map((t) => (
            <div key={t.initials} className="flex h-auto">
              <div className="flex flex-col rounded-2xl border bg-white/70 backdrop-blur shadow-sm transition hover:shadow-md dark:bg-neutral-900/60 dark:border-neutral-800 w-full">
                <div className="flex-auto p-5 md:p-6">
                  <p className="text-base md:text-lg italic text-gray-800 dark:text-neutral-200">
                    “{t.quote}”
                  </p>
                </div>
                <div className="p-4 bg-gray-50/80 rounded-b-2xl md:px-6 dark:bg-neutral-800/60">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="size-9 bg-red-600 rounded-full flex items-center justify-center shadow ring-1 ring-red-600/30">
                        <span className="text-sm font-semibold text-white">{t.initials}</span>
                      </div>
                    </div>
                    <div className="grow ml-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">{t.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-red-600 to-rose-700">
        <div className="pointer-events-none absolute -inset-20 opacity-40">
          <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-[-10%] bottom-[-20%] h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27 viewBox=%270 0 160 160%27><filter id=%27n%27 x=%270%27 y=%270%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.7%27 numOctaves=%274%27 stitchTiles=%27stitch%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.35%27/></svg>')" }} />
          <svg className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[24rem] opacity-20" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g transform="translate(300,300)">
              <path d="M120,-146.8C158.2,-116.4,192.2,-79.8,205.2,-36.6C218.2,6.5,210.3,56.1,187.1,98.9C163.9,141.6,125.5,177.5,82,194.1C38.5,210.7,-10.2,208,-53.6,192.2C-97,176.4,-135.1,147.4,-162.1,111.7C-189.1,76.1,-204.9,33.8,-205.2,-9.7C-205.6,-53.3,-190.6,-96.9,-163.4,-127.6C-136.2,-158.2,-96.8,-175.8,-57.1,-197.7C-17.5,-219.6,22.4,-245.8,60.1,-238.7C97.7,-231.6,133.2,-191.2,120,-146.8Z" fill="url(#g1)" />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </g>
          </svg>
        <div className="relative mx-auto max-w-[85rem] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Rejoignez un réseau qui performe
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl md:leading-tight drop-shadow-sm">
              Prêt à rejoindre notre réseau ?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-base text-white/85 md:mt-4 md:text-lg">
              Démarrez votre franchise avec DRIV'N COOK et profitez d’outils de gestion complets,
              d’un accompagnement dédié et d’une marque forte.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className="group inline-flex items-center justify-center gap-x-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-[0_8px_30px_rgba(255,255,255,0.15)] ring-1 ring-inset ring-white/60 transition duration-200 hover:-translate-y-0.5 hover:bg-white/95 hover:shadow-[0_12px_40px_rgba(255,255,255,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
              >
                Devenir franchisé
                <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </a>

              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-x-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Nous contacter
              </a>
            </div>

            <p className="mt-4 text-xs text-white/60">
              Déjà partenaire ? <a className="underline decoration-white/40 underline-offset-4 hover:decoration-white/80" href="/login">Accédez à votre espace</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
