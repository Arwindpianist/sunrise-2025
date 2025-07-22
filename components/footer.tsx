import Link from "next/link"
import { Sunrise, Facebook, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sunrise</h3>
            <p className="text-gray-600 mb-3">
              Making event management simple and joyful.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>SUNRISE SUNSET SERVICES</strong></p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-gray-600 hover:text-orange-500">
                  Features
              </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-orange-500">
                  Pricing
              </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-orange-500">
                  FAQ
              </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-orange-500">
                  About
              </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-orange-500">
                  Contact
              </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-orange-500">
                  Privacy Policy
              </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-orange-500">
                  Terms of Service
              </Link>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Email: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Sunrise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
