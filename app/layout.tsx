import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/components/providers/supabase-provider"
import FloatingHelpWrapper from "@/components/floating-help-wrapper"
import FloatingSosButton from "@/components/floating-sos-button"
import GDPRBanner from "@/components/gdpr-banner"
import ServiceWorkerRegister from "@/components/service-worker-register"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sunrise - Celebrate Life's Beautiful Moments",
  description: "Create joyful invitations and reminders for weddings, birthdays, and festivals. Send scheduled messages across email, WhatsApp, Telegram, and SMS.",
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
    title: "Sunrise - Celebrate Life's Beautiful Moments",
    description: "Create joyful invitations and reminders for weddings, birthdays, and festivals. Send scheduled messages across email, WhatsApp, Telegram, and SMS.",
    url: 'https://sunrise-2025.com',
    siteName: 'Sunrise',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sunrise - Celebrate Life\'s Beautiful Moments - Event Management Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sunrise - Celebrate Life's Beautiful Moments",
    description: "Create joyful invitations and reminders for weddings, birthdays, and festivals. Send scheduled messages across email, WhatsApp, Telegram, and SMS.",
    images: ['/og-image.png'],
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
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.svg" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.svg" />
        
        {/* Additional Social Media Meta Tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image:alt" content="Sunrise - Celebrate Life's Beautiful Moments - Event Management Platform" />
        
        {/* WhatsApp specific */}
        <meta property="og:image:secure_url" content="https://sunrise-2025.com/og-image.png" />
        
        {/* LinkedIn specific */}
        <meta property="og:image:url" content="https://sunrise-2025.com/og-image.png" />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <FloatingHelpWrapper />
          <FloatingSosButton />
          <Toaster />
          <GDPRBanner />
          <ServiceWorkerRegister />
        </SupabaseProvider>
      </body>
    </html>
  )
}
