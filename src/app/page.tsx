'use client'

import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { ArrowRightIcon, Building2Icon, SmileIcon, ShoppingCartIcon, TruckIcon, ShieldIcon, CircleHelpIcon } from 'lucide-react'

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

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  className="inline-flex items-center justify-center gap-x-2 rounded-lg bg-red-500/90 px-5 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-red-600/20 transition hover:bg-red-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                  href="/register"
                >
                  Commencer avec nous
                  <ArrowRightIcon className="size-4" />
                </a>
                <a
                  className="inline-flex items-center justify-center gap-x-2 rounded-lg border border-gray-200/70 bg-white/60 backdrop-blur px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  href="/login"
                >
                  Se connecter
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

      {/* Section Statistiques */}
      <section className="max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Franchises actives', value: '150+', icon: (
              <Building2Icon className="size-5" />
            )},
            { label: 'Camions gérés', value: '500+', icon: (
              <TruckIcon className="size-5" />
            )},
            { label: 'Commandes traitées', value: '10k+/mois', icon: (
              <ShoppingCartIcon className="size-5" />
            )},
            { label: 'Satisfaction client', value: '98%', icon: (
              <SmileIcon className="size-5" />
            )},
          ].map((stat) => (
            <div key={stat.label} className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-neutral-900 dark:border-neutral-800">
              <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-red-500/0 via-red-500/0 to-red-500/0 opacity-0 transition group-hover:opacity-10" />
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400">
                  <span className="inline-flex items-center justify-center rounded-md bg-red-50 text-red-700 dark:bg-neutral-800 dark:text-red-300 size-8 border border-red-100/60 dark:border-neutral-700">
                    {stat.icon}
                  </span>
                  <p className="text-xs uppercase tracking-wide">{stat.label}</p>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-neutral-100">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
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
      <section className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent" />
        <div className="relative max-w-[85rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 mx-auto">
          <div className="max-w-2xl text-center mx-auto">
            <h2 className="text-2xl font-bold md:text-4xl md:leading-tight text-white">
              Prêt à rejoindre notre réseau ?
            </h2>
            <p className="mt-2 md:text-lg text-white/85">
              Démarrez votre franchise avec DRIV'N COOK et bénéficiez de tous nos outils de gestion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a className="inline-flex items-center justify-center gap-x-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-white/40 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" href="/register">
                Devenir franchisé
              </a>
              <a className="inline-flex items-center justify-center gap-x-2 rounded-lg border border-white/40 text-white px-5 py-3 text-sm font-medium transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" href="/contact">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
