export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50">
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Contact Us</h1>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8">
          <p className="text-gray-600 mb-4">
            Have questions or need assistance? We're here to help!
          </p>
          <p className="text-gray-600">
            Email us at: <a href="mailto:support@sunrise.com" className="text-orange-500 hover:text-orange-600">support@sunrise.com</a>
          </p>
        </div>
      </div>
    </div>
  )
} 