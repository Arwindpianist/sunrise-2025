import ContactAPIDebug from "@/components/contact-api-debug"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Contact API Debug</h1>
        <ContactAPIDebug />
      </div>
    </div>
  )
} 