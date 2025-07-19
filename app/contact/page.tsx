export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Contact Us</h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
          <p className="text-gray-600 mb-4">
            Have questions or need assistance? We're here to help!
          </p>
          <div className="space-y-3">
            <p className="text-gray-600">
              Email us at: <a href="mailto:admin@sunrise-2025.com" className="text-orange-500 hover:text-orange-600">admin@sunrise-2025.com</a>
            </p>
            <div className="text-sm text-gray-500 mt-6 pt-6 border-t border-gray-200">
              <p><strong>SUNRISE SUNSET SERVICES</strong></p>
              <p>Business Registration No: 202503184225 (CT0152300-K)</p>
              <p>Business Type: Sole Proprietorship</p>
              <p>Business Start Date: 6 July 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 