"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactAPIDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkAPIs = () => {
      // Basic API checks
      const hasContactsAPI = 'contacts' in navigator
      const hasShareAPI = 'share' in navigator
      
      // Detailed checks
             const contactsDetails = hasContactsAPI ? {
         exists: true,
         hasSelect: navigator.contacts && 'select' in navigator.contacts,
         isFunction: navigator.contacts?.select instanceof Function,
         properties: Object.keys(navigator.contacts || {})
       } : { exists: false }
      
      const shareDetails = hasShareAPI ? {
        exists: true,
        isFunction: navigator.share instanceof Function,
        properties: Object.keys(navigator.share || {})
      } : { exists: false }
      
      // Environment checks
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSecure = window.location.protocol === 'https:'
      const isLocalhost = window.location.hostname === 'localhost'
      const isDev = process.env.NODE_ENV === 'development'
      
      // Final support determination
      const contactsSupported = hasContactsAPI && 
                               contactsDetails.hasSelect && 
                               contactsDetails.isFunction && 
                               isSecure && 
                               isMobile
      
      const shareSupported = hasShareAPI && 
                            shareDetails.isFunction && 
                            isSecure && 
                            isMobile
      
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isMobile,
        isSecure,
        isLocalhost,
        isDev,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        contactsAPI: contactsDetails,
        shareAPI: shareDetails,
        contactsSupported,
        shareSupported,
        timestamp: new Date().toISOString()
      }
      
      setDebugInfo(info)
      console.log('Contact API Debug Info:', info)
    }
    
    checkAPIs()
  }, [])

  const testContactsAPI = async () => {
    if (!navigator.contacts) {
      setTestResults(prev => ({ ...prev, contacts: 'API not available' }))
      return
    }
    
    try {
      const contacts = await navigator.contacts.select(['name', 'email', 'tel'], { multiple: true })
      setTestResults(prev => ({ ...prev, contacts: `Success: ${contacts.length} contacts selected` }))
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, contacts: `Error: ${error.message}` }))
    }
  }

  const testShareAPI = async () => {
    if (!navigator.share) {
      setTestResults(prev => ({ ...prev, share: 'API not available' }))
      return
    }
    
    try {
      await navigator.share({
        title: 'Test Share',
        text: 'Testing Web Share API',
        url: window.location.href
      })
      setTestResults(prev => ({ ...prev, share: 'Share dialog opened successfully' }))
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setTestResults(prev => ({ ...prev, share: 'Share cancelled by user' }))
      } else {
        setTestResults(prev => ({ ...prev, share: `Error: ${error.message}` }))
      }
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Contact API Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Environment</h3>
              <div className="space-y-1 text-sm">
                <div>Mobile: {debugInfo.isMobile ? '✅ Yes' : '❌ No'}</div>
                <div>HTTPS: {debugInfo.isSecure ? '✅ Yes' : '❌ No'}</div>
                <div>Localhost: {debugInfo.isLocalhost ? '✅ Yes' : '❌ No'}</div>
                <div>Development: {debugInfo.isDev ? '✅ Yes' : '❌ No'}</div>
                <div>Protocol: {debugInfo.protocol}</div>
                <div>Hostname: {debugInfo.hostname}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">API Support</h3>
              <div className="space-y-1 text-sm">
                <div>Contacts API: {debugInfo.contactsSupported ? '✅ Supported' : '❌ Not Supported'}</div>
                <div>Share API: {debugInfo.shareSupported ? '✅ Supported' : '❌ Not Supported'}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Browser Info</h3>
            <div className="text-sm space-y-1">
              <div>User Agent: {debugInfo.userAgent}</div>
              <div>Platform: {debugInfo.platform}</div>
              <div>Vendor: {debugInfo.vendor}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">API Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Contacts API</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(debugInfo.contactsAPI, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Share API</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(debugInfo.shareAPI, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testContactsAPI} disabled={!debugInfo.contactsSupported}>
              Test Contacts API
            </Button>
            <Button onClick={testShareAPI} disabled={!debugInfo.shareSupported}>
              Test Share API
            </Button>
          </div>
          
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Test Results</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(testResults).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 