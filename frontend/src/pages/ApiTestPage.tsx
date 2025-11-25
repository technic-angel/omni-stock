import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  Wifi,
  AlertTriangle
} from 'lucide-react'
import apiClient from '@/shared/lib/api'

interface HealthCheck {
  status: string
}

export default function ApiTestPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<HealthCheck, Error>({
    queryKey: ['health-check'],
    queryFn: async () => {
      const response = await apiClient.get('/health/', {
        baseURL: 'http://localhost:8000', // Direct health endpoint
      })
      return response.data
    },
    retry: 1,
  })

  const backendUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
  const frontendUrl = window.location.origin
  const isProduction = import.meta.env.PROD

  return (
    <div className="min-h-screen bg-brand-bg p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            🔌 Backend Connection Test
          </h1>
          <p className="text-slate-600">
            Verify frontend and backend can communicate
          </p>
        </div>

        {/* Connection Status */}
        <Card className={isError ? 'border-red-300 bg-red-50' : 'border-brand-primary bg-brand-primarySoft'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading && <RefreshCw className="h-5 w-5 animate-spin text-brand-primary" />}
              {!isLoading && !isError && <CheckCircle className="h-5 w-5 text-green-600" />}
              {isError && <XCircle className="h-5 w-5 text-red-600" />}
              Connection Status
            </CardTitle>
            <CardDescription>
              {isLoading && 'Checking backend connection...'}
              {!isLoading && !isError && 'Backend is online and responding'}
              {isError && 'Cannot connect to backend'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {data?.status === 'ok' && (
                  <Badge className="bg-green-100 text-green-800">
                    ✓ Healthy
                  </Badge>
                )}
                {isError && (
                  <Badge className="bg-red-100 text-red-800">
                    ✗ Error
                  </Badge>
                )}
                {isLoading && (
                  <Badge className="bg-blue-100 text-blue-800">
                    ⏳ Checking...
                  </Badge>
                )}
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="border-brand-border"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Recheck
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="h-4 w-4 text-brand-primary" />
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">URL:</span>
                <div className="font-mono text-slate-900 break-all">{frontendUrl}</div>
              </div>
              <div>
                <span className="text-slate-500">Port:</span>
                <div className="font-mono text-slate-900">3000</div>
              </div>
              <div>
                <span className="text-slate-500">Mode:</span>
                <Badge variant={isProduction ? 'default' : 'secondary'}>
                  {isProduction ? 'Production' : 'Development'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-brand-primary" />
                Backend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">URL:</span>
                <div className="font-mono text-slate-900 break-all">{backendUrl}</div>
              </div>
              <div>
                <span className="text-slate-500">Port:</span>
                <div className="font-mono text-slate-900">8000</div>
              </div>
              <div>
                <span className="text-slate-500">Health:</span>
                <div className="font-mono text-slate-900">/health/</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Details */}
        {isError && error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-700 mt-2">
              <div className="space-y-2">
                <p className="font-medium">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
                <div className="text-xs font-mono bg-red-100 p-2 rounded">
                  {JSON.stringify(error, null, 2)}
                </div>
                <div className="mt-4">
                  <p className="font-semibold mb-2">Troubleshooting:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check if Docker containers are running: <code className="bg-red-100 px-1">docker ps</code></li>
                    <li>Verify backend is on port 8000: <code className="bg-red-100 px-1">curl http://localhost:8000/health/</code></li>
                    <li>Restart Docker: <code className="bg-red-100 px-1">docker-compose up -d</code></li>
                    <li>Check CORS settings in backend/omni_stock/settings.py</li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Response */}
        {data && !isError && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <Database className="h-4 w-4" />
                Backend Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-green-100 p-4 rounded text-sm font-mono text-green-900 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Environment Variables */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-base">Environment Configuration</CardTitle>
            <CardDescription>Vite environment variables (.env file)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">VITE_API_BASE:</span>
                <span className="text-slate-900">{import.meta.env.VITE_API_BASE || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">VITE_API_BASE_PROD:</span>
                <span className="text-slate-900">{import.meta.env.VITE_API_BASE_PROD || '(not set)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MODE:</span>
                <span className="text-slate-900">{import.meta.env.MODE}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">📚 Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold mb-2">Local Development:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Backend (Django): <code className="bg-blue-100 px-1">docker-compose up -d</code> → http://localhost:8000</li>
                <li>Frontend (Vite): <code className="bg-blue-100 px-1">npm run dev</code> → http://localhost:3000</li>
                <li>Test connection: Visit this page or check React Query DevTools</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold mb-2">Production Deployment:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Backend: Render.com (https://omni-stock-pr-39.onrender.com)</li>
                <li>Frontend: Vercel (https://omni-stock-three.vercel.app)</li>
                <li>CORS configured for both domains</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Loading Skeleton Example */}
        {isLoading && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}