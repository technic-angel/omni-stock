import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  Plus,
  Building2,
  Heart,
  User,
  LogOut,
  Menu
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Items', href: '/inventory', icon: Package },
  { label: 'Add New Item', href: '/inventory/new', icon: Plus },
  { label: 'Vendors', href: '/vendors', icon: Building2 },
  { label: 'Grails & Wishlist', href: '/wishlist', icon: Heart },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded')
    if (saved !== null) {
      setIsExpanded(saved === 'true')
    }
  }, [])

  // Save state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('sidebar-expanded', String(newState))
  }

  const isActive = (href: string) => location.pathname === href

  return (
    <>
      {/* Mobile: Hamburger Button */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        {/* Mobile: Drawer Content */}
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebarContent
            navItems={navItems}
            isActive={isActive}
            onItemClick={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-brand-border transition-all duration-300',
          isExpanded ? 'w-60' : 'w-16'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-brand-border">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-3 w-full group"
          >
            {/* Gem Icon (Always Visible) */}
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primarySoft flex-shrink-0 transition-all group-hover:bg-brand-primary/20">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-brand-primary"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>

            {/* Wordmark (Visible when expanded) */}
            {isExpanded && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-xs font-light text-slate-500">Omni</span>
                <span className="text-sm font-bold text-brand-primary -mt-1">STOCK</span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      active
                        ? 'bg-brand-primarySoft text-brand-primary'
                        : 'text-slate-600 hover:bg-brand-surfaceAlt hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0',
                      active ? 'text-brand-primary' : 'text-slate-500'
                    )} />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Section: User Actions */}
        <div className="border-t border-brand-border p-2">
          <Link
            to="/account"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-brand-surfaceAlt hover:text-slate-900 transition-colors"
          >
            <User className="h-5 w-5 flex-shrink-0 text-slate-500" />
            {isExpanded && <span className="text-sm font-medium">Account</span>}
          </Link>

          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

// Mobile Sidebar Content (Shared with Sheet)
function MobileSidebarContent({
  navItems,
  isActive,
  onItemClick
}: {
  navItems: NavItem[]
  isActive: (href: string) => boolean
  onItemClick: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-brand-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primarySoft">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-primary" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-light text-slate-500">Omni</span>
          <span className="text-sm font-bold text-brand-primary -mt-1">STOCK</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    active
                      ? 'bg-brand-primarySoft text-brand-primary'
                      : 'text-slate-600 hover:bg-brand-surfaceAlt'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-brand-border p-4 space-y-2">
        <Link
          to="/account"
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-brand-surfaceAlt"
        >
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Account</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  )
}