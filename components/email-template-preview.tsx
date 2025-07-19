"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Code, Mail } from "lucide-react"

interface EmailTemplatePreviewProps {
  htmlContent: string
  subject?: string
  title?: string
}

export default function EmailTemplatePreview({ 
  htmlContent, 
  subject = "Email Preview", 
  title = "Email Template" 
}: EmailTemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('code')}
            >
              <Code className="h-4 w-4 mr-2" />
              Code
            </Button>
          </div>
        </CardTitle>
        {subject && (
          <p className="text-sm text-muted-foreground">
            Subject: {subject}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {viewMode === 'preview' ? (
          <div className="border rounded-lg p-4 bg-white">
            <div 
              className="email-preview"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                maxWidth: '100%',
                overflow: 'auto'
              }}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
              {htmlContent}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 