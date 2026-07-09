import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/contact-form/',
          '/onboarding/',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://sunrise-2025.com/sitemap.xml',
  }
} 