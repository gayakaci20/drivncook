'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { Poppins } from 'next/font/google'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function Navbar() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      localStorage.getItem('theme') === 'dark' ||
                      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)
    
    if (isDarkMode) {   
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) {
    return (
      <header className={`${poppins.className} absolute top-0 w-full flex flex-wrap lg:justify-start lg:flex-nowrap z-50 py-7`}>
        <nav className="relative max-w-7xl w-full flex flex-wrap lg:grid lg:grid-cols-12 basis-full items-center px-4 md:px-6 lg:px-8 mx-auto">
          <div className="lg:col-span-3 flex items-center">
            <a className="flex-none rounded-xl text-xl inline-block font-semibold focus:outline-hidden focus:opacity-80" href="/" aria-label="Preline">
              <Image src="/logo-white.svg" alt="DRIV'N COOK" width={50} height={50} />
            </a>
      
            <div className="ms-1 sm:ms-2">
      
            </div>
          </div>
      
          <div className="flex items-center gap-x-1 lg:gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3">
            <Link href="/login" className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-red-500/90 backdrop-blur-md text-white hover:bg-red-600/90 focus:outline-hidden focus:bg-red-600/90 transition disabled:opacity-50 disabled:pointer-events-none">
              <User className="shrink-0 size-4" />
              Sign in
            </Link>
          </div>

          <div id="hs-pro-hcail" className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow lg:block lg:w-auto lg:basis-auto lg:order-2 lg:col-span-6" aria-labelledby="hs-pro-hcail-collapse">
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className={`${poppins.className} absolute top-0 w-full flex flex-wrap lg:justify-start lg:flex-nowrap z-50 py-7`}>
      <nav className="relative max-w-7xl w-full flex flex-wrap lg:grid lg:grid-cols-12 basis-full items-center px-4 md:px-6 lg:px-8 mx-auto">
        <div className="lg:col-span-3 flex items-center">
          <a className="flex-none rounded-xl text-xl inline-block font-semibold focus:outline-hidden focus:opacity-80" href="/" aria-label="Preline">
            <Image src="/logo-white.svg" alt="DRIV'N COOK" width={50} height={50} />
          </a>
    
          <div className="ms-1 sm:ms-2">
    
          </div>
        </div>
    
        <div className="flex items-center gap-x-1 lg:gap-x-2 ms-auto py-1 lg:ps-6 lg:order-3 lg:col-span-3">
          <Link href="/login" className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-red-500/90 backdrop-blur-md text-white hover:bg-red-600/90 focus:outline-hidden focus:bg-red-600/90 transition disabled:opacity-50 disabled:pointer-events-none">
            <User className="shrink-0 size-4" />
            Sign in
          </Link>
        </div>

        <div id="hs-pro-hcail" className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow lg:block lg:w-auto lg:basis-auto lg:order-2 lg:col-span-6" aria-labelledby="hs-pro-hcail-collapse">

        </div>
      </nav>
    </header>
  )
}
