import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getBrandRegistry } from "@repo/config"
import { BrandProvider } from "@repo/ui/brand-provider"
import Header from "@/components/header"
import { ConditionalFooter } from "@/components/conditional-footer"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/components/providers/supabase-provider"
import { UserProfileProvider } from "@/components/providers/user-profile-provider"
import AuthProvider from "@/components/providers/auth-provider"
import FloatingHelpWrapper from "@/components/floating-help-wrapper"
import FloatingSosButton from "@/components/floating-sos-button"
import GDPRBanner from "@/components/gdpr-banner"
import ServiceWorkerRegister from "@/components/service-worker-register"
import PWAInstallBanner from "@/components/pwa-install-banner"
import UpgradeNoticeBanner from "@/components/upgrade-notice-banner"
import { featureFlags } from "@/lib/feature-flags"
import { resolveEffectiveBrandId } from "@/lib/request-brand"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const brand = await resolveEffectiveBrandId("sunrise")
  const reg = getBrandRegistry(brand)
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? reg.siteOriginDefault
  const metadataBase = new URL(siteOrigin)
  const faviconPath = brand === "sunset" ? "/favicon-sunset.svg" : "/favicon.svg"
  const ogImagePath =
    brand === "sunset" ? "/og-image-sunset.png?v=20260709" : "/og-image-sunrise-v2.png"
  const title = `${reg.displayName} - ${reg.seoTagline}`
  const keywords =
    brand === "sunset"
      ? [
          "memorial",
          "remembrance",
          "funeral communications",
          "Sunset",
        ]
      : [
          "event management",
          "contact management",
          "event planning",
          "communication platform",
          "business tools",
        ]

  return {
    title,
    description: reg.seoDescription,
    keywords,
    authors: [{ name: `${reg.displayName} Team` }],
    creator: reg.displayName,
    publisher: reg.displayName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description: reg.seoDescription,
      url: siteOrigin.replace(/\/$/, "") || siteOrigin,
      siteName: reg.displayName,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: `${title} - ${reg.displayName}`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: reg.seoDescription,
      images: [ogImagePath],
      creator: "@sunrise2025",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [{ url: faviconPath, type: "image/svg+xml" }],
      apple: faviconPath,
      shortcut: faviconPath,
    },
    manifest: "/manifest.json",
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const brand = await resolveEffectiveBrandId("sunrise")
  const reg = getBrandRegistry(brand)
  const faviconPath = brand === "sunset" ? "/favicon-sunset.svg" : "/favicon.svg"
  const ogImagePath =
    brand === "sunset" ? "/og-image-sunset.png?v=20260709" : "/og-image-sunrise-v2.png"
  const ogImageAbs = new URL(ogImagePath, reg.siteOriginDefault).href
  return (
    <html lang="en" data-brand={brand}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-8770781309940232" />
        
        {featureFlags.enableGa && (
          <>
            {/* Google Analytics */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-FNZRH1W3BS"></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-FNZRH1W3BS');
                `,
              }}
            />
          </>
        )}
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href={faviconPath} />
        <link rel="shortcut icon" type="image/svg+xml" href={faviconPath} />
        
        {/* Additional Social Media Meta Tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta
          name="twitter:image:alt"
          content={`${reg.displayName} - ${reg.seoTagline}`}
        />

        {/* WhatsApp / LinkedIn absolute image URLs */}
        <meta property="og:image:secure_url" content={ogImageAbs} />
        <meta property="og:image:url" content={ogImageAbs} />
        
        {/* Permissions Policy for PWA features */}
        <meta httpEquiv="Permissions-Policy" content="geolocation=(self), camera=(), microphone=()" />
      </head>
      <body className={inter.className}>
        <BrandProvider brand={brand}>
        <AuthProvider>
          <SupabaseProvider>
            <UserProfileProvider>
            <div className="flex flex-col min-h-screen">
              {featureFlags.showUpgradeNotice && <UpgradeNoticeBanner />}
              <Header />
              <main className="flex-1">{children}</main>
              <ConditionalFooter />
            </div>
            {featureFlags.enablePwaGlobal && <PWAInstallBanner />}
            {featureFlags.enableGlobalHelp && <FloatingHelpWrapper />}
            {featureFlags.enableGlobalFloatingSos && <FloatingSosButton />}
            <Toaster />
            <GDPRBanner />
            {featureFlags.enablePwaGlobal && <ServiceWorkerRegister />}
            </UserProfileProvider>
          </SupabaseProvider>
        </AuthProvider>
        </BrandProvider>
      </body>
    </html>
  )
}
