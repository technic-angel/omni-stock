import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Breadcrumbs or Page Title (Mobile shows logo on small screens) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primarySoft">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-primary" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>

          {/* Desktop: Page Context */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-brand-border text-slate-700 hover:bg-brand-surfaceAlt"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>

            <Link to="/inventory/new">
              <Button
                size="sm"
                className="rounded-full bg-brand-primary hover:bg-brand-primaryDark text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>

            <Avatar className="h-8 w-8">
              <AvatarImage src="/api/placeholder/32/32" />
              <AvatarFallback className="bg-brand-primarySoft text-brand-primary text-xs">
                MB
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}