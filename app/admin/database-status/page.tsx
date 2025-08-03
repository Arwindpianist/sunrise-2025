"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Database, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface TableStatus {
  exists: boolean
  error?: string
}

interface DatabaseStatus {
  tables: {
    security_events: TableStatus
    subscription_audit_log: TableStatus
    user_subscriptions: TableStatus
    users: TableStatus
  }
}

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/admin/check-database')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check database status')
      }

      setStatus(result)
    } catch (error: any) {
      console.error('Error checking database status:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to check database status",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const performAction = async (action: 'disable_triggers' | 'enable_triggers') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/check-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action}`)
      }

      toast({
        title: "Success",
        description: result.message || `${action} completed successfully`,
      })

      // Refresh status after action
      await checkDatabaseStatus()
    } catch (error: any) {
      console.error(`Error performing ${action}:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-700">
            <Database className="h-5 w-5 mr-2" />
            Database Status & Trigger Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Check Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Database Tables Status</h3>
              <p className="text-sm text-gray-600">Check the status of all database tables and triggers</p>
            </div>
            <Button
              onClick={checkDatabaseStatus}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </>
              )}
            </Button>
          </div>

          {/* Database Status */}
          {status && (
            <div className="space-y-3">
              {Object.entries(status.tables).map(([tableName, tableStatus]) => (
                <div key={tableName} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center">
                    {tableStatus.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <span className="font-medium text-gray-900">{tableName}</span>
                      {tableStatus.error && (
                        <p className="text-sm text-red-600">{tableStatus.error}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tableStatus.exists 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {tableStatus.exists ? 'OK' : 'ERROR'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Trigger Management */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trigger Management</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center text-yellow-800">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Important</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                If new user registration is failing, temporarily disable triggers to allow registration, then re-enable them.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => performAction('disable_triggers')}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Disabling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Disable Triggers
                  </>
                )}
              </Button>

              <Button
                onClick={() => performAction('enable_triggers')}
                disabled={isLoading}
                variant="default"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enabling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enable Triggers
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to Fix Registration Issues:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Check the database status above</li>
              <li>If tables show errors, the triggers may be causing issues</li>
              <li>Click "Disable Triggers" to temporarily allow new registrations</li>
              <li>Try registering a new user</li>
              <li>Click "Enable Triggers" to restore security</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 