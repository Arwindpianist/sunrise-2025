export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Terms of Service</h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 space-y-6">
          <div className="text-sm text-gray-500 mb-6">
            <strong>Effective Date:</strong> July 19, 2025
          </div>
          
          <p className="text-gray-600">
            By accessing <a href="https://sunrise-2025.com" className="text-orange-500 hover:text-orange-600">https://sunrise-2025.com</a>, you agree to be bound by these terms, operated by <strong>SUNRISE SUNSET SERVICES</strong>.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Use of the Site</h2>
            <p className="text-gray-600 mb-2">You agree to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Use this site only for lawful purposes</li>
              <li>Not attempt to disrupt, reverse engineer, or exploit the site</li>
              <li>Not reuse or reproduce content without permission</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Intellectual Property</h2>
            <p className="text-gray-600">
              All tools, content, and branding are the property of SUNRISE SUNSET SERVICES. Unauthorized use or reproduction is prohibited.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Payment (If Applicable)</h2>
            <p className="text-gray-600 mb-2">For any premium services:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>You agree to provide accurate payment information</li>
              <li>Refunds are not guaranteed unless legally required</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Limitation of Liability</h2>
            <p className="text-gray-600 mb-2">We are not responsible for:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Service downtime</li>
              <li>Loss of data</li>
              <li>Inaccurate results or damages arising from use</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Termination</h2>
            <p className="text-gray-600">
              We reserve the right to suspend access for violations of these terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Governing Law</h2>
            <p className="text-gray-600">
              These terms are governed by the laws of <strong>Malaysia</strong>.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Us</h3>
            <div className="text-gray-600 space-y-1">
              <p>Email: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
              <p><strong>SUNRISE SUNSET SERVICES</strong></p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 