import Footer from '../../components/footer'
import { Poppins } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
})

export default function Register() {
  return (
    <>
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="flex absolute -top-96 start-1/2 transform -translate-x-1/2">
          <div className="bg-linear-to-r from-red-300/50 to-red-100 blur-3xl w-100 h-175 rotate-[-60deg] transform -translate-x-40 dark:from-red-900/50 dark:to-red-900"></div>
          <div className="bg-linear-to-tl from-red-50 via-red-100 to-red-50 blur-3xl w-[1440px] h-200 rounded-fulls origin-top-left -rotate-12 -translate-x-60 dark:from-red-900/70 dark:via-red-900/70 dark:to-red-900/70"></div>
        </div>

        <div className="relative z-10">
          <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md">
              <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                <Image
                  src="/logo-white.svg"
                  alt="Driv'n Cook"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-white">DRIV&apos;N COOK</h1>
              </Link>
              
              <div className={`${poppins.className} mt-7 bg-white border border-gray-200 rounded-xl shadow-2xs dark:bg-neutral-900 dark:border-neutral-700`}>
                <div className="p-4 sm:p-7">
                  <div className="text-center">
                    <h1 className="block text-2xl font-bold text-gray-800 dark:text-white">Sign up</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">
                      Already have an account?
                      <Link href="/login" className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500 ml-1">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  <div className="mt-5"></div>
                    {/* Form */}
                    <form>
                      <div className="grid gap-y-4">
                        {/* Form Group */}
                        <div>
                          <label htmlFor="email" className="block text-sm mb-2 dark:text-white">Email address</label>
                          <div className="relative border-1 border-neutral-200 rounded-lg">
                            <input type="email" id="email" name="email" className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="email-error" />
                            <div className="hidden absolute inset-y-0 end-0 pointer-events-none pe-3">
                              <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                              </svg>
                            </div>
                          </div>
                          <p className="hidden text-xs text-red-600 mt-2" id="email-error">Please include a valid email address so we can get back to you</p>
                        </div>
                        {/* End Form Group */}

                        {/* Form Group */}
                        <div>
                          <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Password</label>
                          <div className="relative border-1 border-neutral-200 rounded-lg">
                            <input type="password" id="password" name="password" className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="password-error" />
                            <div className="hidden absolute inset-y-0 end-0 pointer-events-none pe-3">
                              <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                              </svg>
                            </div>
                          </div>
                          <p className="hidden text-xs text-red-600 mt-2" id="password-error">8+ characters required</p>
                        </div>
                        {/* End Form Group */}

                        {/* Form Group */}
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm mb-2 dark:text-white">Confirm Password</label>
                          <div className="relative border-1 border-neutral-200 rounded-lg">
                            <input type="password" id="confirm-password" name="confirm-password" className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-red-500 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="confirm-password-error" />
                            <div className="hidden absolute inset-y-0 end-0 pointer-events-none pe-3">
                              <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                              </svg>
                            </div>
                          </div>
                          <p className="hidden text-xs text-red-600 mt-2" id="confirm-password-error">Password does not match the password</p>
                        </div>
                        {/* End Form Group */}

                        {/* Checkbox */}
                        <div className="flex items-center">
                          <div className="flex">
                            <input id="remember-me" name="remember-me" type="checkbox" className="shrink-0 mt-0.5 border-gray-200 rounded-sm text-red-600 focus:ring-red-500 dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-red-500 dark:checked:border-red-500 dark:focus:ring-offset-gray-800" />
                          </div>
                          <div className="ms-3">
                            <label htmlFor="remember-me" className="text-sm dark:text-white">I accept the <a className="text-red-600 decoration-2 hover:underline focus:outline-hidden focus:underline font-medium dark:text-red-500" href="#">Terms and Conditions</a></label>
                          </div>
                        </div>
                        {/* End Checkbox */}

                        <button type="submit" className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white hover:bg-red-700 focus:outline-hidden focus:bg-red-700 disabled:opacity-50 disabled:pointer-events-none">Sign up</button>
                      </div>
                    </form>
                    {/* End Form */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <Footer />
    </>
  )
}