import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Link } from 'react-router-dom'

interface RestrictedAccessViewProps {
  title?: string
  description?: string
  showBackButton?: boolean
  backTo?: string
  backLabel?: string
}

export function RestrictedAccessView({
  title = "Access Restricted",
  description = "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
  showBackButton = true,
  backTo = "/dashboard",
  backLabel = "Go to Dashboard"
}: RestrictedAccessViewProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert className="border-amber-200 bg-amber-50">
          <ShieldX className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">{title}</AlertTitle>
          <AlertDescription className="text-amber-700 mt-2">
            {description}
          </AlertDescription>
        </Alert>

        {showBackButton && (
          <div className="mt-4">
            <Link to={backTo}>
              <Button className="bg-brand-primary hover:bg-brand-primaryDark">
                {backLabel}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}