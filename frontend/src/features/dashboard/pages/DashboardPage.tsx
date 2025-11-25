import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Building2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react'
import { useDashboardSummary, testBackendConnection } from '../api/dashboardApi'
import { DashboardSkeleton } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useDashboardSummary()
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const handleTestConnection = async () => {
    setTesting(true)
    const result = await testBackendConnection()
    setConnectionTest(result)
    setTesting(false)
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Unable to load dashboard</AlertTitle>
          <AlertDescription className="text-red-700 mt-2">
            {(error as Error).message || 'Failed to fetch dashboard data'}
          </AlertDescription>
        </Alert>
        <Button onClick={handleTestConnection} disabled={testing}>
          {testing ? 'Testing...' : 'Test Backend Connection'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Your collection, organized.
          </h1>
          <p className="text-sm text-slate-600">
            Track, manage, and grow your collectibles inventory with ease.
          </p>
        </div>
        
        {/* Debug Connection Test Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing}
            className="border-brand-border"
          >
            <Zap className="h-4 w-4 mr-2" />
            {testing ? 'Testing...' : 'Test API'}
          </Button>
        </div>
      </div>

      {/* Connection Test Result */}
      {connectionTest && (
        <Alert className={connectionTest.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {connectionTest.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className={connectionTest.success ? 'text-green-800' : 'text-red-800'}>
            {connectionTest.success ? '✅ Backend Connection: SUCCESS' : '❌ Backend Connection: FAILED'}
          </AlertTitle>
          <AlertDescription className={connectionTest.success ? 'text-green-700' : 'text-red-700'}>
            <div className="mt-2 space-y-1 text-xs font-mono">
              <div>Status: {connectionTest.status}</div>
              <div>Message: {connectionTest.message}</div>
              {connectionTest.data && (
                <div>Response: {JSON.stringify(connectionTest.data, null, 2)}</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={summary?.total_items || 0}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="From Vendors"
          value={summary?.total_vendors || 0}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Estimated Value"
          value={`$${summary?.total_value?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Added This Month"
          value={summary?.items_this_month || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Items (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent Items</CardTitle>
              <CardDescription>Your latest collectibles</CardDescription>
            </CardHeader>
            <CardContent>
              {!summary?.recent_items || summary.recent_items.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No items yet"
                  description="Add your first collectible to get started"
                  actionLabel="Add Item"
                  onAction={() => window.location.href = '/inventory/new'}
                />
              ) : (
                <div className="space-y-3">
                  {summary.recent_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-surfaceAlt transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {item.vendor}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-slate-900">
                          ${item.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Stats & Actions (1/3 width) */}
        <div className="space-y-4">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-sm">Top Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              {!summary?.top_vendors || summary.top_vendors.length === 0 ? (
                <p className="text-xs text-slate-500">No vendors yet</p>
              ) : (
                <div className="space-y-2">
                  {summary.top_vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-brand-surfaceAlt transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-brand-primary" />
                        <span className="text-sm font-medium">{vendor.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold">{vendor.item_count} items</p>
                        <p className="text-[10px] text-slate-500">
                          ${vendor.total_value.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {!summary?.low_stock_alerts || summary.low_stock_alerts.length === 0 ? (
                <p className="text-xs text-slate-500">All items stocked</p>
              ) : (
                <div className="space-y-2">
                  {summary.low_stock_alerts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200"
                    >
                      <span className="text-xs font-medium truncate">{item.name}</span>
                      <Badge variant="outline" className="text-[10px] border-amber-300">
                        {item.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* React Query Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            React Query Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1 text-blue-900 font-mono">
            <div>✅ Using React Query for data fetching</div>
            <div>✅ Automatic caching (5min stale time)</div>
            <div>✅ Background refetching enabled</div>
            <div>✅ Error handling with retry logic</div>
            <div className="pt-2 text-blue-700">
              API Endpoint: <code className="bg-blue-100 px-1 rounded">{import.meta.env.VITE_API_BASE}/v1/dashboard/summary/</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'blue' | 'green' | 'purple'
}) {
  const colorClasses = {
    primary: 'bg-brand-primarySoft text-brand-primary',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <Card className="bg-brand-surface border-brand-border hover:border-brand-primary transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
