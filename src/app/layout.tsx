import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DRIV'N COOK",
  description: "DRIV'N COOK",
  keywords: ["DRIV'N COOK", "drivncook"],
  authors: [{ name: "Gaya KACI", url: "https://github.com/gayakaci20" }],
  creator: "Gaya KACI",
  publisher: "Gaya KACI",
  robots: "index, follow",
  metadataBase: new URL('https://drivncook.vercel.app'),   
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://drivncook.vercel.app', 
    title: 'DRIV\'N COOK',
    description: 'DRIV\'N COOK',
    siteName: 'DRIV\'N COOK',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'DRIV\'N COOK Preview Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DRIV\'N COOK',
    description: 'DRIV\'N COOK',
    images: ['/banner.png'],
    creator: '@gayakaci20',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://drivncook.vercel.app', 
  },
  other: {
    'github-repo': 'https://github.com/gayakaci20/drivncook', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="drivncook-theme"
        >
          <AuthProvider>
            <main>
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}