import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/components/providers/supabase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sunrise - Event Management Platform",
  description: "Create and manage your events with ease. Streamline your event planning, contact management, and communication all in one powerful platform.",
  keywords: ["event management", "contact management", "event planning", "communication platform", "business tools"],
  authors: [{ name: "Sunrise Team" }],
  creator: "Sunrise",
  publisher: "Sunrise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sunrise-2025.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Sunrise - Event Management Platform",
    description: "Create and manage your events with ease. Streamline your event planning, contact management, and communication all in one powerful platform.",
    url: 'https://sunrise-2025.com',
    siteName: 'Sunrise',
    images: [
      {
        url: '/favicon.svg',
        width: 500,
        height: 500,
        alt: 'Sunrise Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sunrise - Event Management Platform",
    description: "Create and manage your events with ease. Streamline your event planning, contact management, and communication all in one powerful platform.",
    images: ['/favicon.svg'],
    creator: '@sunrise2025',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-8770781309940232" />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
}
