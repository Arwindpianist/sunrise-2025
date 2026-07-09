import Link from "next/link"
import { Database } from "lucide-react"

export default function PDPACompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">PDPA Compliance Checklist</h1>
            <p className="text-xl text-gray-600">
              Complete overview of our Personal Data Protection Act 2010 compliance measures
            </p>
          </div>

          <div className="space-y-8">
            {/* Data Collection Overview */}
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Collection Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Personal Data Collected</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Account Data:</strong> Full name, email, password (hashed)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Contact Data:</strong> Phone numbers, Telegram chat IDs, categories</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Event Data:</strong> Event details, guest lists, communication history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Financial Data:</strong> Token balances, transaction history, subscriptions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Support Data:</strong> Enquiries, feedback, support tickets</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Technical Data Collected</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Session Data:</strong> Authentication tokens, login history</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Usage Data:</strong> Page visits, interactions, feature usage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Security Data:</strong> IP addresses, browser information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Analytics Data:</strong> User behavior patterns (with consent)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PDPA Principles Compliance */}
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">PDPA Principles Compliance</h2>
              
              <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">1. General Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> Explicit consent collection during registration, clear purpose disclosure
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">2. Disclosure Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> Comprehensive privacy policy, data controller information, third-party disclosures
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">3. Security Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> HTTPS encryption, password hashing, database security, access controls
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">4. Retention Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> Defined retention periods, automatic deletion policies, data lifecycle management
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">5. Data Integrity Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> Data validation, correction mechanisms, accuracy monitoring
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-green-800">6. Access Principle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Status:</strong> ✅ Compliant<br/>
                    <strong>Implementation:</strong> Data management dashboard, export functionality, deletion requests
                  </p>
                </div>
              </div>
            </div>

            {/* User Rights Implementation */}
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">User Rights Implementation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Data Access Rights</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Data Export:</strong> Complete data export in JSON format</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Data Dashboard:</strong> Visual overview of all collected data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Account Information:</strong> View and update personal details</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Data Control Rights</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Consent Management:</strong> Granular consent controls</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Data Correction:</strong> Update inaccurate information</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span><strong>Account Deletion:</strong> Complete data deletion with confirmation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Management Access */}
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Exercise Your Data Rights</h2>
              <p className="text-gray-600 mb-6">
                Access your personal data, manage consent settings, export your information, or request account deletion through our comprehensive Data Management Dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/dashboard/data-management"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Database className="h-5 w-5 mr-2" />
                  Access Data Management Dashboard
                </Link>
                <Link 
                  href="/privacy"
                  className="inline-flex items-center justify-center px-6 py-3 border border-orange-500 text-orange-500 hover:bg-orange-50 font-medium rounded-lg transition-all duration-200"
                >
                  View Privacy Policy
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information & Complaints</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Data Controller</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>SUNRISE SUNSET SERVICES</strong></p>
                    <p>Business Registration: 202503184225 (CT0152300-K)</p>
                    <p>Email: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
                    <p>Data Protection Officer: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">PDPA Authority</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Personal Data Protection Department</strong></p>
                    <p>Address: Level 6, Setia Perkasa 2, Setia Perkasa Complex, Federal Government Administrative Centre, 62502 Putrajaya</p>
                    <p>Phone: +603-8000 8000</p>
                    <p>Email: <a href="mailto:aduan@pdp.gov.my" className="text-orange-500 hover:text-orange-600">aduan@pdp.gov.my</a></p>
                    <p>Website: <a href="https://www.pdp.gov.my" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">https://www.pdp.gov.my</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 