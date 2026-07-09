import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import bundleAnalyzer from "@next/bundle-analyzer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, "..", "..")

// Preload monorepo root .env* then app .env* (app wins on duplicate keys).
dotenv.config({ path: path.join(monorepoRoot, ".env") })
dotenv.config({ path: path.join(monorepoRoot, ".env.local"), override: true })
dotenv.config({ path: path.join(__dirname, ".env"), override: true })
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true })

const repoPackages = [
  "@repo/ui",
  "@repo/config",
  "@repo/shared-types",
  "@repo/db",
  "@repo/auth",
  "@repo/billing",
  "@repo/email",
  "@repo/notifications",
  "@repo/core",
  "@repo/marketing",
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["arwin-xeon"],
  transpilePackages: [...repoPackages],
  // Next.js 16 defaults to Turbopack for `next build`; webpack config remains for bundle analyzer.
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    }
    return config
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ]
  },
}

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

export default withBundleAnalyzer(nextConfig)
