import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Open Graph Image - Sunrise',
  description: 'Testing Open Graph image functionality',
  openGraph: {
    title: 'Test Open Graph Image - Sunrise',
    description: 'Testing Open Graph image functionality',
    images: ['/og-image.png'],
  },
}

export default function TestOGPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Open Graph Image Test</h1>
      <p className="mb-4">This page is for testing Open Graph image functionality.</p>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Expected Open Graph Image:</h2>
        <img 
          src="/og-image.png" 
          alt="Open Graph Test Image" 
          className="max-w-full h-auto border rounded"
          style={{ maxHeight: '300px' }}
        />
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Test Your Link Preview:</h2>
        <p className="text-sm text-gray-600 mb-2">
          Copy this URL and paste it in:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Facebook post</li>
          <li>• Twitter/X post</li>
          <li>• LinkedIn post</li>
          <li>• WhatsApp message</li>
          <li>• Telegram message</li>
          <li>• Discord message</li>
        </ul>
      </div>
    </div>
  )
} 