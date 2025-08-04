import Image from 'next/image'
import { Poppins } from 'next/font/google'
import { Facebook, Instagram, Twitter } from 'lucide-react'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function Footer() {
  return (
    <footer className={`${poppins.className} w-full max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 mx-auto`}>
    <div className="text-center">
        <div className="flex justify-center">
        <Image src="/logo-white.svg" alt="DRIV'N COOK" width={50} height={50} />
        </div>

        <div className="mt-3">
        <p className="text-white/60">
            © 2025 DRIV'N COOK.
        </p>
        </div>

        <div className="mt-3 space-x-2">
        <a className="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-white/60 hover:bg-white/10 hover:text-white focus:outline-hidden focus:bg-white/10 focus:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors" href="#">
            <Instagram className="shrink-0 size-3.5" />
        </a>
        <a className="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-white/60 hover:bg-white/10 hover:text-white focus:outline-hidden focus:bg-white/10 focus:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors" href="#">
            <Facebook className="shrink-0 size-3.5" />
        </a>
        <a className="size-8 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-full border border-transparent text-white/60 hover:bg-white/10 hover:text-white focus:outline-hidden focus:bg-white/10 focus:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors" href="#">
            <Twitter className="shrink-0 size-3.5" />
        </a>
        </div>
    </div>
    </footer>
  )
}