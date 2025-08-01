import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Wrench } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full">
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Under Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Scheduled Maintenance</span>
            </div>
            
            <div className="space-y-3 text-gray-600">
              <p>
                We're currently performing scheduled maintenance to improve your experience.
              </p>
              <p className="text-sm">
                We'll be back shortly. Thank you for your patience!
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-orange-800">
                    What's happening?
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    We're updating our systems to bring you better features and improved performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Expected completion: <span className="font-medium">Within 30 minutes</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 