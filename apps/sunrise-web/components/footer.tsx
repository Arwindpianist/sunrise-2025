"use client"

import Link from "next/link"
import { useBrand } from "@repo/ui/brand-provider"

const SUNSET_URL = process.env.NEXT_PUBLIC_SUNSET_URL ?? "https://sunset-2025.com"
const SUNRISE_URL = process.env.NEXT_PUBLIC_SUNRISE_URL ?? "https://sunrise-2025.com"

export default function Footer() {
  const brand = useBrand()
  const isSunset = brand === "sunset"

  const footerShell = "border-t border-border bg-background"
  const heading = "mb-4 text-lg font-semibold text-foreground"
  const subheading = "mb-4 text-sm font-semibold text-foreground"
  const body = "text-muted-foreground"
  const linkClass = isSunset
    ? "text-muted-foreground hover:text-primary"
    : "text-muted-foreground hover:text-orange-500"
  const companionLink = isSunset ? "text-muted-foreground hover:text-primary" : "text-muted-foreground hover:text-violet-700"
  const finePrint = "space-y-1 text-xs text-muted-foreground"
  const divider = "mt-8 border-t border-border pt-8 text-center text-muted-foreground"
  const mailClass = isSunset ? "text-primary hover:text-primary/90" : "text-orange-500 hover:text-orange-600"

  return (
    <footer className={footerShell}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className={heading}>{isSunset ? "Sunset" : "Sunrise"}</h3>
            <p className={`${body} mb-3`}>
              {isSunset
                ? "Dignified memorial communications under Sunrise Sunset Services."
                : "Making event management simple and joyful."}
            </p>
            <div className={finePrint}>
              <p>
                <strong>SUNRISE SUNSET SERVICES</strong>
              </p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
            </div>
          </div>
          <div>
            <h4 className={subheading}>Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className={linkClass}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li className="pt-2">
                {isSunset ? (
                  <>
                    <a href={SUNRISE_URL} target="_blank" rel="noopener noreferrer" className={companionLink}>
                      Sunrise
                    </a>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      Companion product for celebrations and joyful outreach. Same account as Sunset.
                    </p>
                  </>
                ) : (
                  <>
                    <a href={SUNSET_URL} target="_blank" rel="noopener noreferrer" className={companionLink}>
                      Sunset
                    </a>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      Companion product for memorials and sensitive outreach. Same account as Sunrise.
                    </p>
                  </>
                )}
              </li>
            </ul>
          </div>
          <div>
            <h4 className={subheading}>Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact-info" className={linkClass}>
                  Contact Info
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={subheading}>Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className={linkClass}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/pdpa-compliance" className={linkClass}>
                  PDPA Compliance
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Email:{" "}
                <a href="mailto:admin@sunrise-2025.com" className={mailClass}>
                  admin@sunrise-2025.com
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className={divider}>
          <p>
            &copy; {new Date().getFullYear()} {isSunset ? "Sunset" : "Sunrise"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
