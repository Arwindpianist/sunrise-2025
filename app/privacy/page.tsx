export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Privacy Policy</h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 space-y-6">
          <div className="text-sm text-gray-500 mb-6">
            <strong>Effective Date:</strong> July 19, 2025
            <br />
            <strong>Last Updated:</strong> January 2025
          </div>
          
          <p className="text-gray-600">
            This website is operated by <strong>SUNRISE SUNSET SERVICES</strong>. We are committed to protecting your privacy and ensuring your data is handled responsibly in compliance with the Personal Data Protection Act 2010 (PDPA) of Malaysia.
          </p>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Data Controller Information</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Data Controller:</strong> SUNRISE SUNSET SERVICES</p>
              <p><strong>Business Registration No:</strong> 202503184225 (CT0152300-K)</p>
              <p><strong>Business Type:</strong> Sole Proprietorship</p>
              <p><strong>Email:</strong> <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
              <p><strong>Data Protection Officer:</strong> admin@sunrise-2025.com</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Personal Data (Direct Collection)</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Account Information:</strong> Full name, email address, password (hashed)</li>
                  <li><strong>Contact Information:</strong> Phone numbers, Telegram chat IDs, contact categories</li>
                  <li><strong>Event Data:</strong> Event titles, descriptions, dates, locations, guest lists</li>
                  <li><strong>Communication Data:</strong> Email content, message history, delivery status</li>
                  <li><strong>Financial Data:</strong> Token balances, transaction history, subscription plans</li>
                  <li><strong>Support Data:</strong> Enquiry messages, support tickets, feedback</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Automatically Collected Data</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent, interactions</li>
                  <li><strong>Session Data:</strong> Authentication tokens, login history</li>
                  <li><strong>Analytics Data:</strong> User behavior patterns, feature usage</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Legal Basis for Processing (PDPA Compliance)</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Consent (Primary Basis)</h3>
                <p className="text-blue-700 text-sm">
                  We process your personal data based on your explicit consent, which you provide when:
                </p>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1 ml-4 mt-2">
                  <li>Creating an account and accepting our terms</li>
                  <li>Submitting contact forms</li>
                  <li>Opting into marketing communications</li>
                  <li>Allowing third-party integrations</li>
            </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Contract Performance</h3>
                <p className="text-green-700 text-sm">
                  Processing necessary to provide our services and fulfill contractual obligations.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Legitimate Interests</h3>
                <p className="text-yellow-700 text-sm">
                  Processing for security, fraud prevention, and service improvement (balanced against your rights).
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>Service Provision:</strong> To provide event management and communication services</li>
              <li><strong>Account Management:</strong> To manage your account, subscriptions, and billing</li>
              <li><strong>Communication:</strong> To send event notifications, reminders, and support messages</li>
              <li><strong>Security:</strong> To protect against fraud, abuse, and unauthorized access</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve our services</li>
              <li><strong>Compliance:</strong> To meet legal obligations and regulatory requirements</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Sharing and Third-Party Services</h2>
            <div className="space-y-3">
              <p className="text-gray-600">We share data only with your consent or as required by law:</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Essential Service Providers</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Vercel:</strong> Website hosting and CDN services</li>
                  <li><strong>Resend:</strong> Email delivery services</li>
                  <li><strong>Stripe:</strong> Payment processing (no card data stored)</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Analytics and Marketing</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li><strong>Google Analytics:</strong> Website usage analytics (anonymized)</li>
                  <li><strong>Google AdSense:</strong> Advertising services (with consent)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Data Retention Policy</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">Account Data</h3>
                  <p className="text-orange-700 text-sm">Retained while account is active + 2 years after deletion</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Event Data</h3>
                  <p className="text-blue-700 text-sm">Retained for 3 years after event date</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Contact Data</h3>
                  <p className="text-green-700 text-sm">Retained while account is active + 1 year after deletion</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">Analytics Data</h3>
                  <p className="text-purple-700 text-sm">Retained for 26 months (Google Analytics standard)</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Your Data Subject Rights (PDPA)</h2>
            <div className="space-y-3">
              <p className="text-gray-600">Under the Personal Data Protection Act 2010, you have the following rights:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Access Right</h3>
                  <p className="text-green-700 text-sm">Request a copy of your personal data</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Correction Right</h3>
                  <p className="text-blue-700 text-sm">Request correction of inaccurate data</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Deletion Right</h3>
                  <p className="text-red-700 text-sm">Request deletion of your personal data</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Withdrawal Right</h3>
                  <p className="text-yellow-700 text-sm">Withdraw consent for data processing</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">How to Exercise Your Rights</h3>
                <p className="text-gray-600 text-sm mb-2">You can exercise these rights by:</p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-4">
                  <li>Using our <a href="/dashboard/data-management" className="text-orange-500 hover:text-orange-600">Data Management Dashboard</a></li>
                  <li>Emailing us at <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></li>
                  <li>Contacting our Data Protection Officer</li>
            </ul>
                <p className="text-gray-600 text-sm mt-2">
                  <strong>Response Time:</strong> We will respond to your request within 21 days as required by PDPA.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Data Security Measures</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Technical Security</h3>
                  <ul className="list-disc list-inside text-green-700 text-sm space-y-1 ml-4">
                    <li>HTTPS encryption for all data transmission</li>
                    <li>Password hashing using bcrypt</li>
                    <li>Database encryption at rest</li>
                    <li>Regular security updates</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Access Controls</h3>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1 ml-4">
                    <li>Role-based access control</li>
                    <li>Multi-factor authentication</li>
                    <li>Session management</li>
                    <li>Audit logging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. International Data Transfers</h2>
            <p className="text-gray-600">
              Your data may be processed in countries outside Malaysia. We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Standard Contractual Clauses (SCCs) with service providers</li>
              <li>Adequacy decisions for EU/US data transfers</li>
              <li>Regular security assessments of third-party providers</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Cookies and Tracking</h2>
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Essential Cookies</h3>
                <p className="text-yellow-700 text-sm">Required for website functionality (session management, security)</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Analytics Cookies</h3>
                <p className="text-blue-700 text-sm">Help us understand website usage (Google Analytics)</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Marketing Cookies</h3>
                <p className="text-green-700 text-sm">Used for advertising (Google AdSense) - requires consent</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Children's Privacy</h2>
            <p className="text-gray-600">
              Our services are not intended for children under 13. We do not knowingly collect personal data from children under 13. 
              If you believe we have collected data from a child under 13, please contact us immediately.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Data Breach Notification</h2>
            <p className="text-gray-600">
              In the event of a data breach that poses a risk to your rights and freedoms, we will:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Notify the Personal Data Protection Department within 72 hours</li>
              <li>Notify affected individuals without undue delay</li>
              <li>Document all breaches and remedial actions taken</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">13. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this privacy policy periodically. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Posting the updated policy on this page</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying prominent notices on our website</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">14. Complaints and Contact</h2>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Filing a Complaint</h3>
                <p className="text-red-700 text-sm mb-2">If you have concerns about our data processing, you can:</p>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1 ml-4">
                  <li>Contact us first at <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></li>
                  <li>File a complaint with the Personal Data Protection Department</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Personal Data Protection Department</h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p><strong>Address:</strong> Level 6, Setia Perkasa 2, Setia Perkasa Complex, Federal Government Administrative Centre, 62502 Putrajaya</p>
                  <p><strong>Phone:</strong> +603-8000 8000</p>
                  <p><strong>Email:</strong> <a href="mailto:aduan@pdp.gov.my" className="text-orange-500 hover:text-orange-600">aduan@pdp.gov.my</a></p>
                  <p><strong>Website:</strong> <a href="https://www.pdp.gov.my" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">https://www.pdp.gov.my</a></p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
            <div className="text-gray-600 space-y-1">
              <p><strong>SUNRISE SUNSET SERVICES</strong></p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
              <p>Business Type: Sole Proprietorship</p>
              <p>Business Start Date: 6 July 2025</p>
              <p>Email: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
              <p>Data Protection Officer: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 