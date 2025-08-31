import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock, Building, Shield, Globe, Users } from "lucide-react"

export default function ContactInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact Information</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our team. We're here to help you with any questions about our event management platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Company Information */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-orange-500" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">SUNRISE SUNSET SERVICES</h3>
                <div className="text-gray-600 space-y-1">
                  <p><strong>Business Registration No:</strong> 202503184225 (CT0152300-K)</p>
                  <p><strong>Business Type:</strong> Sole Proprietorship</p>
                  <p><strong>Registration Date:</strong> March 18, 2025</p>
                  <p><strong>Country:</strong> Malaysia</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Partnership</h3>
                <div className="text-gray-600 space-y-1">
                  <p><strong>Arwindpianist Multimedia & Consulting</strong></p>
                  <p>Founder: Arwin Kumar</p>
                  <p>Website: <a href="https://arwindpianist.store" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">arwindpianist.store</a></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Contact */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Primary Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">General Inquiries</h3>
                <div className="text-gray-600 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">support@sunrise-2025.com</a></p>
                  <p><strong>Business:</strong> <a href="mailto:business@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">business@sunrise-2025.com</a></p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Protection Officer</h3>
                <div className="text-gray-600 space-y-1">
                  <p><strong>Email:</strong> <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a></p>
                  <p><strong>Role:</strong> Data Protection Officer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Hours & Response Times */}
        <Card className="mb-12 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Business Hours & Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM (MYT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 2:00 PM (MYT)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Response Times</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>General Inquiries:</span>
                    <span>Within 24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technical Support:</span>
                    <span>Within 4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Business Inquiries:</span>
                    <span>Within 48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card className="mb-12 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Event Management</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive event planning and management platform for all types of celebrations and corporate events.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Contact Management</h3>
                <p className="text-gray-600 text-sm">
                  Secure contact database with flexible categorization and multi-channel communication capabilities.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Multi-Channel Communication</h3>
                <p className="text-gray-600 text-sm">
                  Send invitations and updates via Email, WhatsApp, Telegram, and SMS with smart scheduling.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Compliance */}
        <Card className="mb-12 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Legal & Compliance Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Data Protection</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• PDPA 2010 Compliant (Malaysia)</li>
                  <li>• GDPR Compliant for EU users</li>
                  <li>• Data encryption at rest and in transit</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Business Compliance</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Registered business entity</li>
                  <li>• Valid business registration number</li>
                  <li>• Transparent pricing and terms</li>
                  <li>• Customer support and dispute resolution</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/privacy" className="block p-4 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-colors">
              <h3 className="font-semibold text-gray-800 mb-2">Privacy Policy</h3>
              <p className="text-gray-600 text-sm">Learn how we protect your data and privacy</p>
            </a>
            
            <a href="/terms" className="block p-4 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-colors">
              <h3 className="font-semibold text-gray-800 mb-2">Terms of Service</h3>
              <p className="text-gray-600 text-sm">Read our terms and conditions of service</p>
            </a>
            
            <a href="/cookie-policy" className="block p-4 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-colors">
              <h3 className="font-semibold text-gray-800 mb-2">Cookie Policy</h3>
              <p className="text-gray-600 text-sm">Understand how we use cookies and tracking</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
