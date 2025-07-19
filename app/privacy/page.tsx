export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Privacy Policy</h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 space-y-6">
          <div className="text-sm text-gray-500 mb-6">
            <strong>Effective Date:</strong> July 19, 2025
          </div>
          
          <p className="text-gray-600">
            This website is operated by <strong>SUNRISE SUNSET SERVICES</strong>. We are committed to protecting your privacy and ensuring your data is handled responsibly.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>Personal Data:</strong> Name, email, phone number (via contact forms)</li>
              <li><strong>Usage Data:</strong> IP address, browser type, pages visited, timestamps</li>
              <li><strong>Cookies:</strong> Used for analytics and advertising</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>To respond to enquiries and provide services</li>
              <li>To understand visitor behavior and improve user experience</li>
              <li>To show ads via Google AdSense</li>
              <li>For analytics and site performance monitoring</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Third-Party Services We Use</h2>
            <p className="text-gray-600 mb-2">This site integrates with third-party services such as:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Google AdSense</li>
              <li>Google Analytics</li>
              <li>Supabase (database & auth)</li>
              <li>Vercel (hosting)</li>
            </ul>
            <p className="text-gray-600 mt-2">
              These services may collect data based on your use of our site. You can opt out via browser settings or Google Ad preferences.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Retention</h2>
            <p className="text-gray-600">
              We retain contact form submissions for up to 12 months and analytics data for up to 26 months unless a longer retention period is required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Your Rights (GDPR/CCPA)</h2>
            <p className="text-gray-600 mb-2">Depending on your location, you may:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction or deletion</li>
              <li>Object to data processing</li>
            </ul>
            <p className="text-gray-600 mt-2">
              You may contact us at <strong>admin@sunrise-2025.com</strong> for any privacy-related requests.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Security</h2>
            <p className="text-gray-600">
              We use HTTPS and secure infrastructure to protect your data.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Updates</h2>
            <p className="text-gray-600">
              We may update this privacy policy periodically. The latest version will always be posted on this page.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
            <div className="text-gray-600 space-y-1">
              <p><strong>SUNRISE SUNSET SERVICES</strong></p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
              <p>Business Type: Sole Proprietorship</p>
              <p>Business Start Date: 6 July 2025</p>
              <p>Email: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 