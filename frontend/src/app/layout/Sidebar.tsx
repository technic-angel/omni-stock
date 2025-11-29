'use client'

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Package, 
  Plus, 
  Building2, 
  Heart, 
  User,
  LogOut,
  Menu,
  Gem
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'All Items',
    href: '/inventory',
    icon: Package
  },
  {
    name: 'Add New Item',
    href: '/inventory/add',
    icon: Plus
  },
  {
    name: 'Vendors',
    href: '/vendors',
    icon: Building2
  },
  {
    name: 'Wishlist',
    href: '/wishlist',
    icon: Heart
  }
]

const userNavigation = [
  {
    name: 'Account',
    href: '/account',
    icon: User
  },
  {
    name: 'Logout',
    href: '/logout',
    icon: LogOut
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isExpanded, setIsExpanded] = useLocalStorage('sidebar-expanded', true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActivePath = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/') return true
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const NavigationContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div 
        className={`flex h-16 items-center px-4 border-b cursor-pointer transition-all duration-200 ${
          isExpanded ? 'justify-start' : 'justify-center'
        }`}
        onClick={() => !isMobile && setIsExpanded(!isExpanded)}
      >
        <Gem className="h-8 w-8 text-brand-primary" />
        {(isExpanded || isMobile) && (
          <span className="ml-3 text-xl font-semibold text-gray-900">
            Omni-Stock
          </span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(item.href)
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onLinkClick}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? 'bg-brand-primary-soft text-brand-primary-dark border-r-2 border-brand-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${!isExpanded && !isMobile ? 'justify-center' : ''}`}
            >
              <Icon className={`flex-shrink-0 h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(isExpanded || isMobile) && (
                <span className="ml-3">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User Navigation */}
      <nav className="space-y-1 px-3 py-4">
        {userNavigation.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(item.href)
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onLinkClick}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? 'bg-brand-primary-soft text-brand-primary-dark border-r-2 border-brand-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${!isExpanded && !isMobile ? 'justify-center' : ''}`}
            >
              <Icon className={`flex-shrink-0 h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-500'}`} />
              {(isExpanded || isMobile) && (
                <span className="ml-3">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavigationContent onLinkClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div 
      className={`bg-white border-r border-gray-200 ${
        isExpanded ? 'w-64' : 'w-16'
      } transition-all duration-300 ease-in-out ${className}`}
    >
      <NavigationContent />
    </div>
  )
}

export function MobileSidebarTrigger() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  if (!isMobile) return null
  
  return <Sidebar />
}